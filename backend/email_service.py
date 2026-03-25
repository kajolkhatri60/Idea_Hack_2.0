import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

SMTP_HOST    = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT    = int(os.getenv("SMTP_PORT", 587))
SMTP_USER    = os.getenv("SMTP_USER", "")
SMTP_PASS    = os.getenv("SMTP_PASS", "")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "")

_BASE = """
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;background:#0f172a;
            color:#e2e8f0;padding:0;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 32px">
    <h1 style="margin:0;font-size:20px;color:#fff;font-weight:700">SmartResolve AI</h1>
    <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7)">Unified Complaint Management</p>
  </div>
  <div style="padding:32px">
    {body}
  </div>
  <div style="padding:16px 32px;background:#0a0f1e;text-align:center">
    <p style="margin:0;font-size:11px;color:#475569">SmartResolve AI · IdeaHack 2.0 · This is an automated message</p>
  </div>
</div>
"""

def _wrap(body: str) -> str:
    return _BASE.format(body=body)


async def send_email(to: str, subject: str, html: str):
    """Send an HTML email. Silently logs on failure so the app never crashes."""
    if not SMTP_USER or not SMTP_PASS or SMTP_PASS == "your-gmail-app-password-here":
        print(f"[email] SMTP not configured — skipping: {subject} → {to}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"SmartResolve AI <{SMTP_USER}>"
        msg["To"]      = to
        msg.attach(MIMEText(html, "html"))
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            start_tls=True,
            validate_certs=False,
        )
        print(f"[email] ✓ '{subject}' → {to}")
    except Exception as e:
        print(f"[email] ✗ Failed to send '{subject}' → {to}: {e}")


# ── Complaint confirmation ────────────────────────────────────────────────────
async def send_complaint_confirmation(
    user_email: str, user_name: str,
    complaint_id: str, title: str, category: str,
    priority: str, sla_deadline, assigned_agent: str
):
    ref = f"SR-{complaint_id[-6:].upper()}"
    sla_str = sla_deadline.strftime("%d %b %Y, %I:%M %p") if sla_deadline else "N/A"
    agent_str = assigned_agent if assigned_agent else "Being assigned"
    body = f"""
    <p style="color:#94a3b8;margin-top:0">Hi {user_name},</p>
    <p>Your complaint has been received and is being processed. Here are your details:</p>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#64748b;width:140px;font-size:13px">Reference ID</td>
            <td style="padding:8px 0;font-weight:700;color:#a78bfa;font-size:15px">{ref}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Complaint</td>
            <td style="padding:8px 0;font-size:13px">{title}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Category</td>
            <td style="padding:8px 0;font-size:13px">{category}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Priority</td>
            <td style="padding:8px 0;font-size:13px;text-transform:capitalize">{priority}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Assigned Agent</td>
            <td style="padding:8px 0;font-size:13px">{agent_str}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">SLA Deadline</td>
            <td style="padding:8px 0;font-size:13px;color:#f59e0b">{sla_str}</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#94a3b8">
      You will receive email updates as your complaint progresses.
      Reply to this email or log in to the portal to track your complaint.
    </p>
    """
    await send_email(user_email, f"[{ref}] Complaint Received — {title}", _wrap(body))


# ── Status update ─────────────────────────────────────────────────────────────
async def send_status_update(
    user_email: str, user_name: str,
    complaint_id: str, title: str, new_status: str, agent_name: str = ""
):
    ref = f"SR-{complaint_id[-6:].upper()}"
    status_colors = {
        "in-progress": "#f59e0b",
        "resolved":    "#10b981",
        "open":        "#3b82f6",
    }
    status_msgs = {
        "in-progress": f"An agent{' (' + agent_name + ')' if agent_name else ''} is now actively working on your complaint.",
        "resolved":    "Your complaint has been resolved. We hope your issue has been addressed satisfactorily.",
        "open":        "Your complaint has been reopened and will be reviewed shortly.",
    }
    color = status_colors.get(new_status, "#a78bfa")
    msg   = status_msgs.get(new_status, "Your complaint status has been updated.")
    label = new_status.replace("-", " ").title()

    body = f"""
    <p style="color:#94a3b8;margin-top:0">Hi {user_name},</p>
    <p>Your complaint status has been updated.</p>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 12px;font-size:13px;color:#64748b">Reference: <strong style="color:#a78bfa">{ref}</strong></p>
      <p style="margin:0 0 12px;font-size:13px">{title}</p>
      <div style="display:inline-block;background:{color}22;border:1px solid {color}44;
                  color:{color};padding:6px 16px;border-radius:99px;font-size:13px;font-weight:600">
        {label}
      </div>
    </div>
    <p style="font-size:13px;color:#94a3b8">{msg}</p>
    """
    subject = f"[{ref}] Status Update: {label} — {title}"
    await send_email(user_email, subject, _wrap(body))


# ── Agent email reply ─────────────────────────────────────────────────────────
async def send_agent_reply(
    user_email: str, user_name: str,
    complaint_id: str, title: str,
    agent_name: str, reply_text: str
):
    ref = f"SR-{complaint_id[-6:].upper()}"
    body = f"""
    <p style="color:#94a3b8;margin-top:0">Hi {user_name},</p>
    <p>You have a new reply from your support agent regarding your complaint.</p>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 8px;font-size:12px;color:#64748b">
        Reference: <strong style="color:#a78bfa">{ref}</strong> · {title}
      </p>
      <hr style="border:none;border-top:1px solid #334155;margin:12px 0"/>
      <p style="margin:0;font-size:13px;color:#94a3b8;font-style:italic">From: {agent_name} (Support Agent)</p>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.7;white-space:pre-wrap">{reply_text}</p>
    </div>
    <p style="font-size:13px;color:#94a3b8">
      To reply, log in to the portal or simply reply to this email.
    </p>
    """
    subject = f"[{ref}] Agent Reply — {title}"
    await send_email(user_email, subject, _wrap(body))


# ── SLA warning ───────────────────────────────────────────────────────────────
async def send_sla_warning(
    user_email: str, user_name: str,
    complaint_id: str, title: str, hours_left: float
):
    ref = f"SR-{complaint_id[-6:].upper()}"
    body = f"""
    <p style="color:#94a3b8;margin-top:0">Hi {user_name},</p>
    <div style="background:#7c2d1222;border:1px solid #f9731644;border-radius:12px;padding:20px;margin:16px 0">
      <p style="margin:0;font-size:14px;color:#fb923c;font-weight:600">⚠ SLA Deadline Approaching</p>
      <p style="margin:8px 0 0;font-size:13px;color:#94a3b8">
        Your complaint <strong style="color:#e2e8f0">"{title}"</strong> ({ref}) 
        must be resolved within <strong style="color:#fb923c">{hours_left:.0f} hour{'s' if hours_left != 1 else ''}</strong>.
      </p>
    </div>
    <p style="font-size:13px;color:#94a3b8">
      If you haven't heard from an agent yet, please log in to the portal to check the status or escalate your complaint.
    </p>
    """
    await send_email(user_email, f"[{ref}] SLA Warning — Action Required", _wrap(body))


# ── Contact form ──────────────────────────────────────────────────────────────
async def send_contact_email(name: str, email: str, subject: str, message: str):
    body = f"""
    <h2 style="color:#a78bfa;margin-top:0">New Contact Message</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#64748b;width:80px">From</td>
          <td style="padding:8px 0">{name} &lt;{email}&gt;</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Subject</td>
          <td style="padding:8px 0">{subject}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0"/>
    <p style="line-height:1.7;color:#cbd5e1">{message.replace(chr(10), '<br>')}</p>
    """
    await send_email(CONTACT_EMAIL, f"[Contact] {subject}", _wrap(body))


# ── Escalation ────────────────────────────────────────────────────────────────
async def send_escalation_email(
    user_email: str, user_name: str,
    complaint_title: str, from_channel: str, to_channel: str, reason: str
):
    body = f"""
    <h2 style="color:#f97316;margin-top:0">Your complaint has been escalated</h2>
    <p style="color:#94a3b8">Hi {user_name},</p>
    <p>Your complaint <strong>"{complaint_title}"</strong> has been escalated to a {to_channel} agent.</p>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#64748b;width:140px;font-size:13px">From channel</td>
            <td style="padding:8px 0;font-size:13px;text-transform:capitalize">{from_channel}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">To channel</td>
            <td style="padding:8px 0;font-size:13px;text-transform:capitalize;color:#a78bfa">{to_channel}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Reason</td>
            <td style="padding:8px 0;font-size:13px">{reason}</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#94a3b8">
      A {to_channel} agent will be in touch shortly with the full context of your complaint.
    </p>
    """
    await send_email(user_email, f"Complaint escalated to {to_channel} agent", _wrap(body))
