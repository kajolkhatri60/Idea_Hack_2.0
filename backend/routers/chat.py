"""
Chat between complaint owner and currently assigned agent.
- Complaint owner: can send + delete own messages.
- Assigned agent: matched by ID OR by channel (both can send).
- Admin: read-only across all complaints.
- Timestamps stored in IST (Asia/Kolkata).
"""
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth_utils import get_current_user
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter()

IST = timezone(timedelta(hours=5, minutes=30))

def ist_now_iso() -> str:
    return datetime.now(IST).isoformat()

def _is_assigned_agent(doc, uid: str, agent_channel: str = None) -> bool:
    """True if this agent is assigned by ID or by channel match."""
    stored_id = doc.get("assigned_agent_id")
    # Direct ID match (both must be non-empty strings)
    if stored_id and uid and stored_id == uid:
        return True
    # Channel match — complaint's channel equals this agent's channel
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
        "at": ist_now_iso(),
    }
    await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$push": {"messages": message}}
    )
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
