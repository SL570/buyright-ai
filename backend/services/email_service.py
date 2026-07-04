import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()


def send_price_drop_alert(
    to_email: str,
    product_name: str,
    product_url: str,
    old_price: float,
    new_price: float,
    target_price: float,
) -> bool:
    """Send an email alert when a tracked item drops below the target price."""
    api_key    = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@buyrightai.com")

    if not api_key or api_key == "your-sendgrid-api-key-here":
        print(f"[EMAIL SKIPPED] No SendGrid key. Would alert {to_email}: {product_name} dropped to ${new_price:.2f}")
        return False

    savings = old_price - new_price
    html_content = f"""
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0B0F19;color:#F1F5F9;border-radius:12px">
      <h2 style="color:#00F5D4;margin:0 0 8px">Price drop alert</h2>
      <p style="color:#94A3B8;margin:0 0 24px;font-size:14px">BuyRight AI is watching your wishlist</p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px;margin-bottom:20px">
        <p style="font-weight:600;font-size:16px;margin:0 0 12px">{product_name}</p>
        <p style="margin:4px 0;font-size:14px">Was: <span style="text-decoration:line-through;color:#94A3B8">${old_price:.2f}</span></p>
        <p style="margin:4px 0;font-size:18px;font-weight:700;color:#10B981">Now: ${new_price:.2f}</p>
        <p style="margin:4px 0;font-size:13px;color:#94A3B8">Your target: ${target_price:.2f} &nbsp;·&nbsp; You save ${savings:.2f}</p>
      </div>
      <a href="{product_url}" style="display:inline-block;background:#00F5D4;color:#0B0F19;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">Buy now →</a>
      <p style="margin-top:24px;font-size:11px;color:rgba(255,255,255,0.3)">BuyRight AI · Unsubscribe from alerts in your dashboard</p>
    </div>
    """

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=f"Price drop: {product_name} is now ${new_price:.2f}",
        html_content=html_content,
    )

    try:
        sg = SendGridAPIClient(api_key)
        sg.send(message)
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def send_group_deal_ready(
    to_email: str,
    product_name: str,
    product_url: str,
    target_price: float,
    member_count: int,
) -> bool:
    """Notify a user that their group deal has reached the target size."""
    api_key    = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@buyrightai.com")

    if not api_key or api_key == "your-sendgrid-api-key-here":
        print(f"[EMAIL SKIPPED] No SendGrid key. Would notify {to_email}: group deal ready for {product_name}")
        return False

    html_content = f"""
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0B0F19;color:#F1F5F9;border-radius:12px">
      <h2 style="color:#818CF8;margin:0 0 8px">Group deal is ready</h2>
      <p style="color:#94A3B8;margin:0 0 24px;font-size:14px">{member_count} buyers have joined your group</p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px;margin-bottom:20px">
        <p style="font-weight:600;font-size:16px;margin:0 0 8px">{product_name}</p>
        <p style="font-size:14px;color:#818CF8;font-weight:700;margin:0">Target: ${target_price:.2f} per unit</p>
      </div>
      <p style="font-size:14px;color:#94A3B8">Log in to BuyRight AI to view your negotiation script and coordinate with your group.</p>
      <p style="margin-top:24px;font-size:11px;color:rgba(255,255,255,0.3)">BuyRight AI · Group deals</p>
    </div>
    """

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=f"Your group deal for {product_name} is ready — {member_count} buyers joined",
        html_content=html_content,
    )

    try:
        sg = SendGridAPIClient(api_key)
        sg.send(message)
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False
