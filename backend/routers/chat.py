"""
Chat between complaint owner and currently assigned agent.
- Complaint owner: can send + delete own messages.
- Assigned agent: matched by ID OR by channel (both can send).
- Admin: read-only across all complaints.
- Timestamps stored in IST (Asia/Kolkata).
- Supports: typing indicators, read receipts, system messages.
"""
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth_utils import get_current_user
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional

router = APIRouter()

IST = timezone(timedelta(hours=5, minutes=30))

def ist_now_iso() -> str:
    return datetime.now(IST).isoformat()

def _is_assigned_agent(doc, uid: str, agent_channel: str = None) -> bool:
    stored_id = doc.get("assigned_agent_id")
    if stored_id and uid and stored_id == uid:
        return True
    if agent_channel and doc.get("channel") == agent_channel:
        return True
    return False

def _can_access(doc, uid: str, role: str, agent_channel: str = None) -> bool:
    if role == "admin":
        return True
    if uid == doc.get("user_id"):
        return True
    if role == "agent" and _is_assigned_agent(doc, uid, agent_channel):
        return True
    return False

class ChatMessage(BaseModel):
    text: str
    msg_type: Optional[str] = "text"  # "text" | "system"

class TypingBody(BaseModel):
    is_typing: bool

@router.get("/{complaint_id}/messages")
async def get_messages(complaint_id: str, user=Depends(get_current_user)):
    db = get_db()
    doc = await db.complaints.find_one(
        {"_id": ObjectId(complaint_id)},
        {"messages": 1, "user_id": 1, "assigned_agent_id": 1,
         "escalation_history": 1, "channel": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    uid = str(user["_id"])
    role = user.get("role", "user")
    agent_channel = user.get("agent_channel")

    if not _can_access(doc, uid, role, agent_channel):
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark messages as read by this user
    await db.complaints.update_many(
        {"_id": ObjectId(complaint_id), "messages.sender_id": {"$ne": uid}},
        {"$set": {"messages.$[msg].read": True}},
        array_filters=[{"msg.sender_id": {"$ne": uid}, "msg.read": {"$ne": True}}]
    )

    past_sessions = []
    for entry in doc.get("escalation_history", []):
        snapshot = entry.get("chat_snapshot")
        if snapshot is not None:
            past_sessions.append({
                "session_label": f"Session with {entry['from']} agent → escalated to {entry['to']}",
                "escalated_at": entry.get("at"),
                "chat_summary": entry.get("chat_summary", ""),
                "messages": snapshot,
            })

    return {
        "current": doc.get("messages", []),
        "past_sessions": past_sessions,
    }

@router.post("/{complaint_id}/messages")
async def send_message(complaint_id: str, body: ChatMessage, user=Depends(get_current_user)):
    db = get_db()
    doc = await db.complaints.find_one(
        {"_id": ObjectId(complaint_id)},
        {"user_id": 1, "assigned_agent_id": 1, "status": 1, "channel": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    uid = str(user["_id"])
    role = user.get("role", "user")
    agent_channel = user.get("agent_channel")

    if not _can_access(doc, uid, role, agent_channel):
        raise HTTPException(status_code=403, detail="Access denied — you are not assigned to this complaint")
    if doc.get("status") == "resolved":
        raise HTTPException(status_code=400, detail="Complaint is already resolved")

    message = {
        "id": str(ObjectId()),
        "sender_id": uid,
        "sender_name": user.get("name", ""),
        "sender_role": role,
        "text": body.text,
        "msg_type": body.msg_type or "text",
        "at": ist_now_iso(),
        "read": False,
    }
    await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$push": {"messages": message},
         "$set": {"updated_at": datetime.utcnow()}}
    )
    # Clear typing indicator for this sender
    await db.typing_indicators.delete_one({"complaint_id": complaint_id, "user_id": uid})
    return message

@router.delete("/{complaint_id}/messages/{message_id}")
async def delete_message(complaint_id: str, message_id: str, user=Depends(get_current_user)):
    db = get_db()
    doc = await db.complaints.find_one(
        {"_id": ObjectId(complaint_id)},
        {"messages": 1, "user_id": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    uid = str(user["_id"])
    role = user.get("role", "user")

    msg = next((m for m in doc.get("messages", []) if m["id"] == message_id), None)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if role != "admin" and msg.get("sender_id") != uid:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$pull": {"messages": {"id": message_id}}}
    )
    return {"deleted": message_id}

# ── Typing indicator ──────────────────────────────────────────────────────────
@router.post("/{complaint_id}/typing")
async def set_typing(complaint_id: str, body: TypingBody, user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    if body.is_typing:
        await db.typing_indicators.update_one(
            {"complaint_id": complaint_id, "user_id": uid},
            {"$set": {
                "complaint_id": complaint_id,
                "user_id": uid,
                "name": user.get("name", ""),
                "role": user.get("role", "user"),
                "at": datetime.utcnow(),
            }},
            upsert=True
        )
    else:
        await db.typing_indicators.delete_one({"complaint_id": complaint_id, "user_id": uid})
    return {"ok": True}

@router.get("/{complaint_id}/typing")
async def get_typing(complaint_id: str, user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    # Only show typing from others, expire after 8 seconds
    cutoff = datetime.utcnow() - timedelta(seconds=8)
    cursor = db.typing_indicators.find({
        "complaint_id": complaint_id,
        "user_id": {"$ne": uid},
        "at": {"$gte": cutoff}
    })
    typers = [{"name": t["name"], "role": t["role"]} async for t in cursor]
    return {"typers": typers}

# ── AI quick reply suggestions for user ──────────────────────────────────────
@router.get("/{complaint_id}/quick-replies")
async def get_quick_replies(complaint_id: str, user=Depends(get_current_user)):
    db = get_db()
    doc = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    messages = doc.get("messages", [])
    last_agent_msg = next(
        (m["text"] for m in reversed(messages) if m.get("sender_role") == "agent"), None
    )
    if not last_agent_msg:
        return {"suggestions": []}

    # Build recent conversation context (last 6 messages)
    recent = messages[-6:] if len(messages) >= 6 else messages
    convo = "\n".join([f"{m['sender_role'].capitalize()}: {m['text']}" for m in recent])

    try:
        from ai_service import _chat
        import json
        prompt = f"""You are helping a customer reply to a support agent in a complaint chat.

Complaint: "{doc.get('title', '')}"
Category: {doc.get('category', '')}
Recent conversation:
{convo}

Agent's last message: "{last_agent_msg}"

Generate exactly 3 short, natural, contextually relevant customer reply options (max 10 words each).
These should be direct responses to what the agent just said, specific to this complaint.
Return ONLY a JSON array of 3 strings.
JSON:"""
        raw = _chat(prompt)
        start, end = raw.find('['), raw.rfind(']') + 1
        suggestions = json.loads(raw[start:end])
        return {"suggestions": suggestions[:3]}
    except Exception as e:
        print(f"[QUICK REPLIES] failed: {e}")
        return {"suggestions": []}
