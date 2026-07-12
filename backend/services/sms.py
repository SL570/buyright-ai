import os
from twilio.rest import Client

ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID", "")
AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN", "")
FROM_NUMBER  = os.getenv("TWILIO_PHONE_NUMBER", "")


def send_sms(to: str, body: str):
    if not all([ACCOUNT_SID, AUTH_TOKEN, FROM_NUMBER]):
        return
    try:
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        client.messages.create(to=to, from_=FROM_NUMBER, body=body)
    except Exception:
        pass


def send_subscription_sms(to: str):
    send_sms(to, "✅ You're now on BuyRight AI Pro! Full access to Procurement, Fulfillment & Collective Bargaining. https://buyright-ai-ten.vercel.app/procurement")


def send_welcome_sms(to: str):
    send_sms(to, "👋 Welcome to BuyRight AI! Ask our AI anything about a purchase you're considering. https://buyright-ai-ten.vercel.app/chat")
