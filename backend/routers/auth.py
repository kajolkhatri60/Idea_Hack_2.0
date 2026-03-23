from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models import UserRegister, UserLogin
from auth_utils import hash_password, verify_password, create_token, get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

VALID_ROLES = {"user", "agent", "admin"}
VALID_CHANNELS = {"whatsapp", "email", "phone", "chat", "web"}

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    bio: Optional[str] = None

def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user["email"],
        "role": user.get("role", "user"),
        "agent_channel": user.get("agent_channel"),
        "phone": user.get("phone", ""),
        "whatsapp": user.get("whatsapp", ""),
        "bio": user.get("bio", ""),
    }

@router.post("/register")
async def register(body: UserRegister):
    db = get_db()
    role = body.role or "user"
    if role not in VALID_ROLES:
        role = "user"
    agent_channel = None
    if role == "agent":
        agent_channel = getattr(body, "agent_channel", "web") or "web"
        if agent_channel not in VALID_CHANNELS:
            agent_channel = "web"
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    result = await db.users.insert_one({
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "role": role,
        "agent_channel": agent_channel,
        "phone": "",
        "whatsapp": "",
        "bio": "",
    })
    user = await db.users.find_one({"_id": result.inserted_id})
    return {"access_token": create_token(str(user["_id"])), "user": serialize_user(user)}

@router.post("/login")
async def login(body: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Enforce role match — user must log in via the correct role portal
    if body.role and body.role in VALID_ROLES:
        actual_role = user.get("role", "user")
        if actual_role != body.role:
            raise HTTPException(
                status_code=403,
                detail=f"This account is registered as '{actual_role}'. Please select the correct role."
            )

    return {"access_token": create_token(str(user["_id"])), "user": serialize_user(user)}

@router.patch("/profile")
async def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        from datetime import datetime
        update["updated_at"] = datetime.utcnow()
        await db.users.update_one({"_id": user["_id"]}, {"$set": update})
    updated = await db.users.find_one({"_id": user["_id"]})
    return serialize_user(updated)
