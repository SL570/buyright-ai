import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth import get_current_user
from services.email import send_subscription_email
from services.sms import send_subscription_sms

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
PRICE_ID       = os.getenv("STRIPE_PRICE_ID", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL   = "https://buyright-ai-ten.vercel.app"


@router.get("/status")
def billing_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.is_subscribed and user.stripe_customer_id and stripe.api_key:
        try:
            subs = stripe.Subscription.list(customer=user.stripe_customer_id, status="active", limit=1)
            if subs.data:
                user.is_subscribed = True
                db.commit()
        except Exception:
            pass
    return {"subscribed": user.is_subscribed, "email": user.email}


@router.post("/create-checkout-session")
def create_checkout_session(
    user: User    = Depends(get_current_user),
    db:   Session = Depends(get_db),
):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    if not PRICE_ID:
        raise HTTPException(status_code=500, detail="Stripe price not configured")
    if user.is_subscribed:
        raise HTTPException(status_code=400, detail="Already subscribed")

    try:
        # Reuse or create Stripe customer
        customer_id = user.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(email=user.email)
            customer_id = customer.id
            user.stripe_customer_id = customer_id
            db.commit()

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": PRICE_ID, "quantity": 1}],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/pricing",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig     = request.headers.get("stripe-signature", "")

    if not WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")
    try:
        event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    etype = event["type"]

    if etype == "checkout.session.completed":
        session    = event["data"]["object"]
        customer_id = session.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            user.is_subscribed = True
            db.commit()

    elif etype in ("customer.subscription.deleted", "customer.subscription.paused"):
        sub         = event["data"]["object"]
        customer_id = sub.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            user.is_subscribed = False
            db.commit()

    return {"received": True}


@router.post("/activate")
def activate_subscription(
    session_id: str,
    user: User    = Depends(get_current_user),
    db:   Session = Depends(get_db),
):
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Billing not configured")
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        # Verify session belongs to this user's email to prevent session swapping
        if session.customer_email and session.customer_email.lower() != user.email.lower():
            raise HTTPException(status_code=403, detail="Session does not belong to this account")
        if session.payment_status == "paid" and session.customer:
            user.stripe_customer_id = session.customer
            user.is_subscribed = True
            db.commit()
            send_subscription_email(user.email)
            if user.phone:
                send_subscription_sms(user.phone)
            return {"activated": True}
        raise HTTPException(status_code=400, detail="Payment not confirmed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Activation failed")


@router.post("/cancel-subscription")
def cancel_subscription(
    user: User    = Depends(get_current_user),
    db:   Session = Depends(get_db),
):
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No subscription found")
    try:
        subs = stripe.Subscription.list(customer=user.stripe_customer_id, status="active")
        for sub in subs.auto_paging_iter():
            stripe.Subscription.cancel(sub.id)
        user.is_subscribed = False
        db.commit()
        return {"cancelled": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
