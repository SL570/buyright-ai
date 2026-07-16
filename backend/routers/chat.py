from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, List
import os
import anthropic

from auth import get_current_user
from services.vector import search_knowledge
from services.ratelimit import check_user_rate_limit

router = APIRouter(prefix="/chat", tags=["chat"])

BASE_SYSTEM_PROMPT = """You are BuyRight AI — a sharp, friendly shopping advisor powered by AI.
Your job is to help users make smarter purchasing decisions.

You can help with:
- Whether a specific price is good or bad for a product
- When the best time to buy a product is (seasonal sales, price cycles)
- How to negotiate discounts with retailers
- Comparing products and deciding what's worth the money
- Return policies and price match strategies at Amazon, Walmart, Best Buy, Target, Costco
- Credit card rewards, cashback portals, and coupon strategies
- Collective bargaining and group purchase negotiations

Keep answers concise (2-4 paragraphs max), practical, and direct.
Use bullet points when listing multiple options.
When you have specific retailer policy information from context, cite it confidently.
If you don't know exact current prices, say so and give strategic advice instead.
Never make up specific discount percentages you cannot verify."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., max_length=40)


@router.post("")
def chat(req: ChatRequest, user=Depends(get_current_user)):
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    if not check_user_rate_limit(user.email):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before sending another message.")

    history = req.messages[-20:]
    latest_query = req.messages[-1].content if req.messages else ""

    system = BASE_SYSTEM_PROMPT
    knowledge_chunks = search_knowledge(latest_query, top_k=4)
    if knowledge_chunks:
        context_block = "\n\n".join(f"- {chunk}" for chunk in knowledge_chunks)
        system = (
            f"{BASE_SYSTEM_PROMPT}\n\n"
            f"RELEVANT KNOWLEDGE BASE CONTEXT (use this to give accurate, specific answers):\n"
            f"{context_block}"
        )

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=system,
            messages=[{"role": m.role, "content": m.content} for m in history],
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        print(f"[CHAT ERROR] {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable. Please try again.")
