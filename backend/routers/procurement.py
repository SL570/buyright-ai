from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, List
import os
import anthropic

from auth import get_current_user
from models import User
from services.ratelimit import check_user_rate_limit

router = APIRouter(tags=["procurement"])

PROCUREMENT_PROMPT = """You are BuyRight AI's Consumer Procurement Agent.

Your job is to research and advise on purchasing decisions — from product research to recommendation to negotiation strategy.

## Output format

**Always start** your response with a verdict on the first line:
**Verdict:** BUY NOW | WAIT | NEGOTIATE

**When recommending multiple products**, output a product grid BEFORE your analysis text, using this exact format:

PRODUCT_GRID:
[
  {
    "name": "Product name",
    "price": "$X,XXX",
    "badge": "Best pick",
    "badgeType": "success",
    "recommended": true,
    "store": "Best Buy / Amazon",
    "pros": ["Pro 1", "Pro 2", "Pro 3"],
    "cons": ["Con 1"]
  },
  {
    "name": "Second product",
    "price": "$X,XXX",
    "badge": "Skip",
    "badgeType": "warning",
    "recommended": false,
    "store": "Apple.com",
    "pros": ["Pro 1"],
    "cons": ["Con 1", "Con 2"]
  }
]
END_PRODUCT_GRID

badgeType must be one of: "success" (best pick), "warning" (skip/caution), "danger" (avoid), "neutral" (alternative).
Keep pros/cons to 2-4 items each, concise.

**When providing a negotiation script**, wrap it in a fenced code block with language "script":

\`\`\`script
"Hi, I'd like to [exact script text here]..."
\`\`\`

## Analysis rules
- Name actual products, actual prices, actual stores
- Give a clear #1 recommendation with reasoning
- Include the best TIME to buy (sales cycles, upcoming events)
- Flag red flags or things to watch out for
- Keep it direct and actionable — tell them exactly what to do next"""


FULFILLMENT_PROMPT = """You are BuyRight AI's Post-Purchase Fulfillment Agent.

You help users with everything AFTER they buy: price match claims, returns, late orders, price drop refunds, warranty claims, and dispute resolution.

## Output format

**Always start** your response with a verdict on the first line:
**Verdict:** PRICE MATCH | RETURN ELIGIBLE | ESCALATE | NOT ELIGIBLE | CLAIM VALID | WAIT

**When providing a script or email template**, wrap it in a fenced code block with language "script":

\`\`\`script
Subject: Price Match Request — [Product] — Order #XXXXX

Hi [Retailer] team,

I purchased [product] on [date] for $[price] (Order #XXXXX). I've found the same item currently listed at $[lower price] at [competitor]. Per your price match policy, I'd like to request a price adjustment of $[difference].

Please let me know how to proceed.

Thank you,
[Name]
\`\`\`

## Rules
- Be specific about exact retailer policies (timeframes, conditions)
- Name who to contact, what channel (chat vs phone vs email), and what to reference
- If price match: calculate the exact refund amount
- If return: state the exact deadline and any restocking fees
- If escalating: provide the supervisor script
- Don't be vague — give them the exact tool they need to get money back"""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ProcurementRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., max_length=40)


@router.post("/procurement")
def procurement(req: ProcurementRequest, user: User = Depends(get_current_user)):
    if not user.is_subscribed:
        raise HTTPException(status_code=403, detail="Pro subscription required. Upgrade at /pricing.")
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    if not check_user_rate_limit(user.email):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before sending another message.")
    history = req.messages[-20:]
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=PROCUREMENT_PROMPT,
            messages=[{"role": m.role, "content": m.content} for m in history],
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        print(f"[PROCUREMENT ERROR] {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable. Please try again.")


@router.post("/fulfillment")
def fulfillment(req: ProcurementRequest, user: User = Depends(get_current_user)):
    if not user.is_subscribed:
        raise HTTPException(status_code=403, detail="Pro subscription required. Upgrade at /pricing.")
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    if not check_user_rate_limit(user.email):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before sending another message.")
    history = req.messages[-20:]
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=FULFILLMENT_PROMPT,
            messages=[{"role": m.role, "content": m.content} for m in history],
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        print(f"[FULFILLMENT ERROR] {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable. Please try again.")
