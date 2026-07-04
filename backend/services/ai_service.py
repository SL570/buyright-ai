import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are a price intelligence advisor. When given a product name, URL, and current price,
analyze whether the user should buy now, wait for a better price, or negotiate.

Respond in JSON format only:
{
  "verdict": "buy" | "wait" | "negotiate",
  "reasoning": "2-3 sentence plain English explanation",
  "confidence": "high" | "medium" | "low"
}

Base your analysis on:
- Typical pricing patterns for this type of product
- Seasonal sale cycles (Prime Day, Black Friday, back-to-school, etc.)
- Whether the current price seems fair for the product category
- General retail negotiation opportunities

Never fabricate specific price data. Be honest about uncertainty."""


def analyze_product(name: str, url: str, price: float) -> dict:
    """Call Claude to get buy/wait/negotiate verdict for a product."""
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Product: {name}\nURL: {url}\nCurrent price: ${price:.2f}\n\nShould I buy this now?"
            }]
        )
        import json
        text = message.content[0].text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        return {
            "verdict":    "research",
            "reasoning":  "Unable to analyze at this time. Check back shortly.",
            "confidence": "low",
        }


def generate_negotiation_script(
    product_name: str,
    product_url: str,
    current_price: float,
    target_price: float,
    member_count: int,
) -> str:
    """Generate a bulk purchase negotiation script for a group deal."""
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": f"""Write a professional bulk purchase negotiation email/message for a retailer.

Product: {product_name}
Product URL: {product_url}
Current retail price: ${current_price:.2f}
Group target price: ${target_price:.2f}
Number of buyers in our group: {member_count}

Write a concise, professional message a group can send to the retailer requesting a group discount.
Reference the number of committed buyers, the current price, and the target price.
Keep it under 150 words. No subject line needed. Just the message body."""
            }]
        )
        return message.content[0].text.strip()
    except Exception:
        return (
            f"Dear Retailer,\n\nWe are a group of {member_count} committed buyers "
            f"interested in purchasing {product_name} (currently listed at ${current_price:.2f}). "
            f"We would like to request a group discount bringing the price to ${target_price:.2f} per unit. "
            f"Please let us know if this is possible.\n\nThank you."
        )
