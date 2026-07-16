from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, List
import os
import anthropic

from auth import get_current_user
from models import User

router = APIRouter(tags=["procurement"])

PROCUREMENT_PROMPT = """You are BuyRight AI's Consumer Procurement Agent.

Your job is to research and advise on purchasing decisions — from product research to recommendation to negotiation strategy.

When a user tells you what they need to buy, you:
1. Research the best options for their budget and requirements
2. Compare 2-3 specific products with pros/cons
3. Identify where to buy (Amazon, Walmart, Best Buy, Target, Costco, etc.)
4. Give a clear #1 recommendation with reasoning
5. Provide negotiation tactics to get a lower price
6. Tell them the best TIME to buy (sales cycles, upcoming events)
7. Flag any red flags or things to watch out for

Be specific — name actual products, actual prices, actual stores.
Be direct — give a recommendation, don't just list options.
Be actionable — tell them exactly what to do next.

Format your response clearly with sections. Keep it practical, not fluffy."""


FULFILLMENT_PROMPT = """You are BuyRight AI's Post-Purchase Fulfillment Agent.

You help users with everything AFTER they buy:

1. **Price Match Claims** — identify if the item qualifies for a price match at their retailer, and generate the exact script/email to claim it
2. **Returns** — guide them through return policies, deadlines, and how to handle difficult returns
3. **Late Orders** — help them track, escalate, or get compensation for late deliveries
4. **Price Drop Refunds** — many retailers (Amazon, Best Buy, Target, Costco) give partial refunds if the price drops within a window — find and claim these
5. **Warranty Claims** — help users understand and exercise their warranty rights
6. **Dispute Resolution** — help escalate to customer service, file chargebacks if needed

Be specific about:
- Exact retailer policies (timeframes, conditions)
- Word-for-word scripts they can use
- What to say, who to contact, what to reference

Don't be vague. Give them the actual tool they need to get their money back or resolve the issue."""


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
