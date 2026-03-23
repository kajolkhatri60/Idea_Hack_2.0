import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "")


async def send_email(to: str, subject: str, html: str):
    """Send an HTML email. Silently logs on failure so the app never crashes."""
    if not SMTP_USER or not SMTP_PASS or SMTP_PASS == "your-gmail-app-password-here":
        print(f"[email] SMTP not configured — skipping send to {to}: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            start_tls=True,
        )
        print(f"[email] Sent '{subject}' → {to}")
    except Exception as e:
        print(f"[email] Failed to send to {to}: {e}")


async def send_contact_email(name: str, email: str, subject: str, message: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
      <h2 style="color:#a78bfa;margin-top:0">New Contact Message — SmartResolve AI</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#94a3b8;width:100px">From</td><td style="padding:8px 0">{name} &lt;{email}&gt;</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">Subject</td><td style="padding:8px 0">{subject}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0"/>
      <p style="line-height:1.7;color:#cbd5e1">{message.replace(chr(10), '<br>')}</p>
      <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0"/>
      <p style="font-size:12px;color:#475569">SmartResolve AI · IdeaHack 2.0</p>
    </div>
    """
    await send_email(CONTACT_EMAIL, f"[Contact] {subject}", html)


async def send_escalation_email(
    user_email: str, user_name: str,
    complaint_title: str, from_channel: str, to_channel: str, reason: str
):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
      <h2 style="color:#f97316;margin-top:0">Your complaint has been escalated</h2>
      <p style="color:#94a3b8">Hi {user_name},</p>
      <p>Your complaint <strong style="color:#e2e8f0">"{complaint_title}"</strong> has been escalated.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#94a3b8;width:140px">From channel</td><td style="padding:8px 0;text-transform:capitalize">{from_channel}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">To channel</td><td style="padding:8px 0;text-transform:capitalize;color:#a78bfa">{to_channel}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">Reason</td><td style="padding:8px 0">{reason}</td></tr>
      </table>
      <p style="color:#94a3b8;font-size:13px">A {to_channel} agent will be in touch shortly with the full context of your complaint.</p>
      <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0"/>
      <p style="font-size:12px;color:#475569">SmartResolve AI · IdeaHack 2.0</p>
    </div>
    """
    await send_email(user_email, f"Complaint escalated to {to_channel} agent", html)
