import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "BuyRight AI <onboarding@resend.dev>")


def send_welcome_email(to: str):
    if not resend.api_key:
        return
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to],
            "subject": "Welcome to BuyRight AI",
            "html": """
            <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:40px 24px;background:#0B0F19;color:#F1F5F9;border-radius:16px">
              <h1 style="font-size:28px;font-weight:800;margin:0 0 8px">Welcome to <span style="color:#00F5D4">BuyRight AI</span></h1>
              <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 24px">
                You're in. BuyRight AI helps you stop overpaying — with AI-powered procurement, collective bargaining, and fulfillment support.
              </p>
              <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 32px">
                Start by asking the AI Advisor anything about a purchase you're considering.
              </p>
              <a href="https://buyright-ai-ten.vercel.app/chat" style="background:#00F5D4;color:#0B0F19;text-decoration:none;border-radius:10px;padding:14px 28px;font-weight:800;font-size:15px;display:inline-block">
                Get started →
              </a>
            </div>
            """,
        })
    except Exception:
        pass


def send_subscription_email(to: str):
    if not resend.api_key:
        return
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to],
            "subject": "You're now on BuyRight AI Pro",
            "html": """
            <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:40px 24px;background:#0B0F19;color:#F1F5F9;border-radius:16px">
              <h1 style="font-size:28px;font-weight:800;margin:0 0 8px">You're on <span style="color:#00F5D4">Pro</span> ✅</h1>
              <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 16px">
                Your BuyRight AI Pro subscription is active. You now have full access to:
              </p>
              <ul style="color:#E2E8F0;font-size:15px;line-height:2;padding-left:20px;margin:0 0 32px">
                <li>Consumer Procurement — AI handles your entire purchase</li>
                <li>Fulfillment & Returns — AI fights for refunds and price matches</li>
                <li>Collective Bargaining — negotiate better prices as a group</li>
              </ul>
              <a href="https://buyright-ai-ten.vercel.app/procurement" style="background:#00F5D4;color:#0B0F19;text-decoration:none;border-radius:10px;padding:14px 28px;font-weight:800;font-size:15px;display:inline-block">
                Start procuring →
              </a>
            </div>
            """,
        })
    except Exception:
        pass
