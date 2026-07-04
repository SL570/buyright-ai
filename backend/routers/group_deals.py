from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, GroupDeal, GroupDealMember
from schemas import GroupDealCreate, GroupDealOut
from auth import get_current_user
from services.ai_service import generate_negotiation_script
from services.email_service import send_group_deal_ready

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
    deal = GroupDeal(
        product_name=payload.product_name,
        product_url=str(payload.product_url),
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
