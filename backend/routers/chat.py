from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import os
import anthropic

from auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """You are BuyRight AI — a sharp, friendly shopping advisor powered by AI.
Your job is to help users make smarter purchasing decisions.

You can help with:
- Whether a specific price is good or bad for a product
- When the best time to buy a product is (seasonal sales, price cycles)
- How to negotiate discounts with retailers
- Comparing products and deciding what's worth the money
- Amazon, Walmart, Best Buy, Target deals and strategies
- Credit card rewards, cashback, and coupon strategies

Keep answers concise (2-4 paragraphs max), practical, and direct.
Use bullet points when listing multiple options.
Be honest — if you don't know exact current prices, say so and give general advice instead.
Never make up specific discount percentages you can't verify."""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


@router.post("")
def chat(req: ChatRequest, user=Depends(get_current_user)):
    if len(req.messages) == 0:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Keep last 20 messages to avoid token limits
    history = req.messages[-20:]

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": m.role, "content": m.content} for m in history],
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI service unavailable. Try again.")
