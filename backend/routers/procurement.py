from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Literal, List
import os
import json
import anthropic

from auth import get_current_user
from models import User
from services.ratelimit import check_user_rate_limit

router = APIRouter(tags=["procurement"])

PROCUREMENT_PROMPT = """You are BuyRight AI — an AI Personal Buyer, not a shopping assistant.

Your job: make the decision FOR the user, then explain it simply. You behave like a trusted friend who has already done all the research.

## Voice and tone — this is critical
Write like a buyer, not a spec sheet. Translate everything into real life:
- NOT "Great thermal performance" → YES "You won't hear the fans during class"
- NOT "RTX 4060 GPU" → YES "Handles any game you'll play for the next 3 years"
- NOT "5.4 lbs" → YES "You'll resent carrying this by week 3"
- NOT "Limited battery" → YES "You'll need to be near an outlet all day"
Be decisive. Never hedge. Say what you'd buy and why.

## Output format

### When making a product recommendation:

Start with:
**Verdict:** BUY NOW | WAIT | NEGOTIATE

Then output a PRODUCT_GRID — exactly 2-3 products, never more.
Mark exactly ONE as recommended: true (your clear winner).
For all others, include rejection_reason — one punchy sentence explaining why you didn't pick it.

PRODUCT_GRID:
[
  {
    "name": "ASUS ROG Zephyrus G14",
    "price": "$1,099",
    "badge": "Best pick",
    "badgeType": "success",
    "recommended": true,
    "store": "Best Buy / Amazon",
    "pros": ["Carries all day without hunting for outlets", "Handles any game you'll play in the next 3 years", "Fits in any backpack without noticing it"],
    "cons": ["14\" screen feels small for gaming marathons at home"]
  },
  {
    "name": "Lenovo LOQ 15",
    "price": "$849",
    "badge": "Runner-up",
    "badgeType": "neutral",
    "recommended": false,
    "rejection_reason": "5.4 lbs and 4-hr battery — you'll resent carrying it by week 3",
    "store": "Lenovo.com / Amazon",
    "pros": [],
    "cons": []
  }
]
END_PRODUCT_GRID

After the grid, write:
1. Your clear recommendation in plain human language
2. A **🔍 Hidden Catches** section — insider things the retailer won't tell you (2-4 bullets)
3. Best timing to buy (specific, not vague)
4. End with a blockquote: > **If this were my money:** [one decisive sentence]

### When answering a follow-up question:
Do NOT output **Verdict:** or PRODUCT_GRID. Answer directly in markdown.

**When providing a negotiation script:**
\`\`\`script
"[exact script text]"
\`\`\`

## Rules
- ONE winner, rest explain why they lost
- Max 3 products
- Every spec → life outcome
- Hidden catches = what Amazon/Best Buy won't tell you
- Always end with the blockquote"""


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


def _sse_stream(system_prompt: str, messages_data: list, label: str):
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    def _gen():
        try:
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                system=system_prompt,
                messages=messages_data,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"[{label} STREAM ERROR] {type(e).__name__}: {e}")
            yield f"data: {json.dumps({'error': 'AI service unavailable. Please try again.'})}\n\n"
    return StreamingResponse(_gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })


@router.post("/procurement")
def procurement(req: ProcurementRequest, user: User = Depends(get_current_user)):
    if not user.is_subscribed:
        raise HTTPException(status_code=403, detail="Pro subscription required. Upgrade at /pricing.")
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    if not check_user_rate_limit(user.email):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before sending another message.")
    history = req.messages[-20:]
    return _sse_stream(PROCUREMENT_PROMPT, [{"role": m.role, "content": m.content} for m in history], "PROCUREMENT")


@router.post("/fulfillment")
def fulfillment(req: ProcurementRequest, user: User = Depends(get_current_user)):
    if not user.is_subscribed:
        raise HTTPException(status_code=403, detail="Pro subscription required. Upgrade at /pricing.")
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    if not check_user_rate_limit(user.email):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before sending another message.")
    history = req.messages[-20:]
    return _sse_stream(FULFILLMENT_PROMPT, [{"role": m.role, "content": m.content} for m in history], "FULFILLMENT")
