from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from email_service import send_contact_email

router = APIRouter()

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

@router.post("")
async def contact(body: ContactForm):
    await send_contact_email(body.name, body.email, body.subject, body.message)
    return {"status": "sent"}
