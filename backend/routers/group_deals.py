from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Literal, List
from urllib.parse import quote_plus
import os
import json
import httpx
import anthropic
from pydantic import BaseModel, Field

from database import get_db
from models import User, GroupDeal, GroupDealMember
from schemas import GroupDealCreate, GroupDealOut
from auth import get_current_user
from services.ai_service import generate_negotiation_script
from services.email_service import send_group_deal_ready
from services.ratelimit import check_user_rate_limit

router = APIRouter(prefix="/group-deals", tags=["group-deals"])


def _build_out(deal: GroupDeal, user_id: int) -> GroupDealOut:
    member_count = len(deal.members)
    is_member    = any(m.user_id == user_id for m in deal.members)
    return GroupDealOut(
        id=deal.id,
        product_name=deal.product_name,
        product_url=deal.product_url,
        current_price=deal.current_price,
        target_price=deal.target_price,
        target_members=deal.target_members,
        status=deal.status,
        negotiation_script=deal.negotiation_script,
        created_by=deal.created_by,
        created_at=deal.created_at,
        member_count=member_count,
        is_member=is_member,
    )


def _activate_deal(deal_id: int):
    """Background task — generate negotiation script and notify members."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        deal = db.query(GroupDeal).filter(GroupDeal.id == deal_id).first()
        if not deal:
            return

        member_count = len(deal.members)
        script = generate_negotiation_script(
            product_name=deal.product_name,
            product_url=deal.product_url,
            current_price=deal.current_price,
            target_price=deal.target_price,
            member_count=member_count,
        )
        deal.negotiation_script = script
        deal.status             = "active"
        db.commit()

        # Notify all members by email
        for membership in deal.members:
            user = membership.user
            send_group_deal_ready(
                to_email=user.email,
                product_name=deal.product_name,
                product_url=deal.product_url,
                target_price=deal.target_price,
                member_count=member_count,
            )
    except Exception as e:
        print(f"[GROUP DEAL] Error activating deal {deal_id}: {e}")
    finally:
        db.close()


@router.post("", response_model=GroupDealOut, status_code=201)
def create_deal(
    payload:          GroupDealCreate,
    background_tasks: BackgroundTasks,
    db:               Session = Depends(get_db),
    user:             User    = Depends(get_current_user),
):
    product_url = payload.product_url or (
        f"https://www.google.com/search?q={quote_plus(payload.product_name)}+buy"
    )
    deal = GroupDeal(
        product_name=payload.product_name,
        product_url=product_url,
        current_price=payload.current_price,
        target_price=payload.target_price,
        target_members=payload.target_members,
        created_by=user.id,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)

    # Creator auto-joins
    membership = GroupDealMember(group_deal_id=deal.id, user_id=user.id)
    db.add(membership)
    db.commit()
    db.refresh(deal)

    return _build_out(deal, user.id)


@router.get("", response_model=List[GroupDealOut])
def list_deals(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    deals = db.query(GroupDeal).filter(GroupDeal.status != "expired").all()
    return [_build_out(d, user.id) for d in deals]


@router.get("/mine", response_model=List[GroupDealOut])
def my_deals(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    memberships = db.query(GroupDealMember).filter(GroupDealMember.user_id == user.id).all()
    deal_ids    = [m.group_deal_id for m in memberships]
    deals       = db.query(GroupDeal).filter(GroupDeal.id.in_(deal_ids)).all()
    return [_build_out(d, user.id) for d in deals]


@router.post("/{deal_id}/join", response_model=GroupDealOut)
def join_deal(
    deal_id:          int,
    background_tasks: BackgroundTasks,
    db:               Session = Depends(get_db),
    user:             User    = Depends(get_current_user),
):
    deal = db.query(GroupDeal).filter(GroupDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal.status == "expired":
        raise HTTPException(status_code=400, detail="This deal has expired")

    already = db.query(GroupDealMember).filter(
        GroupDealMember.group_deal_id == deal_id,
        GroupDealMember.user_id == user.id,
    ).first()
    if already:
        raise HTTPException(status_code=400, detail="Already a member of this deal")

    membership = GroupDealMember(group_deal_id=deal_id, user_id=user.id)
    db.add(membership)
    db.commit()
    db.refresh(deal)

    # Check if target reached
    if len(deal.members) >= deal.target_members and deal.status == "forming":
        background_tasks.add_task(_activate_deal, deal.id)

    return _build_out(deal, user.id)


@router.post("/{deal_id}/leave", status_code=204)
def leave_deal(
    deal_id: int,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    membership = db.query(GroupDealMember).filter(
        GroupDealMember.group_deal_id == deal_id,
        GroupDealMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this deal")
    db.delete(membership)
    db.commit()


@router.get("/search")
def search_products(
    q: str = Query(..., min_length=2, max_length=200),
    user: User = Depends(get_current_user),
):
    """Search Google Shopping for real product prices to seed a group deal."""
    serper_key = os.getenv("SERPER_API_KEY", "")
    if not serper_key:
        return []
    try:
        resp = httpx.post(
            "https://google.serper.dev/shopping",
            headers={"X-API-KEY": serper_key, "Content-Type": "application/json"},
            json={"q": q.strip(), "num": 8, "gl": "us"},
            timeout=5.0,
        )
        if resp.status_code != 200:
            return []
        results = []
        for item in resp.json().get("shopping", [])[:6]:
            title     = item.get("title", "")
            price_str = item.get("price", "")
            source    = item.get("source", "")
            image_url = item.get("imageUrl", "")
            rating    = item.get("rating")
            try:
                price_num = float(price_str.replace("$", "").replace(",", ""))
            except (ValueError, AttributeError):
                continue
            if title and price_num > 0:
                results.append({
                    "title":  title[:80],
                    "price":  price_num,
                    "store":  source[:40],
                    "image":  image_url or "",
                    "rating": rating,
                })
        return results
    except Exception as e:
        print(f"[GROUP DEALS SEARCH] {type(e).__name__}: {e}")
        return []


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)

class GroupChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., max_length=40)
    context: str = Field("", max_length=2000)

GROUP_DEAL_PROMPT = """You are BuyRight AI's Collective Bargaining Agent.

You help users organize group buying deals to get bulk discounts from retailers.

Your role:
1. Help users understand how collective bargaining works
2. Guide them on what product to group buy and at what price target
3. Explain how many people are typically needed for a bulk discount (usually 5-20+)
4. Generate professional bulk discount request scripts they can send to retailers
5. Advise on which retailers are most open to bulk negotiations (Costco, B2B portals, smaller retailers)
6. Explain negotiation tactics for group deals

Key facts to share:
- Most retailers will offer 10-30% off for bulk orders of 5+ units
- Best Buy, Costco, and Sam's Club have formal bulk buying programs
- Email is better than calling for bulk requests
- Group deal requests should emphasize committed buyers, not "interested" people

Be conversational, practical, and generate actual negotiation scripts when asked.
When a user describes their group deal, help them structure it and give them the exact script to use."""


@router.post("/chat")
def group_chat(req: GroupChatRequest, user: User = Depends(get_current_user)):
    if not user.is_subscribed:
        raise HTTPException(status_code=403, detail="Pro subscription required. Upgrade at /pricing.")
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    if not check_user_rate_limit(user.email):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before sending another message.")
    history = req.messages[-20:]
    system = GROUP_DEAL_PROMPT
    if req.context:
        system = f"{GROUP_DEAL_PROMPT}\n\nLive deal board context (use this to give specific advice about real deals):\n{req.context}"
    messages_data = [{"role": m.role, "content": m.content} for m in history]

    def _gen():
        try:
            client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=800,
                system=system,
                messages=messages_data,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"[GROUP CHAT ERROR] {type(e).__name__}: {e}")
            yield f"data: {json.dumps({'error': 'AI service unavailable. Please try again.'})}\n\n"

    return StreamingResponse(_gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })
