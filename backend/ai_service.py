from groq import Groq
from dotenv import load_dotenv
import os, json

load_dotenv()

MODEL = "llama3-8b-8192"

def _get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

def _chat(prompt: str) -> str:
    client = _get_client()
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=512,
    )
    return resp.choices[0].message.content.strip()

def analyze_complaint(text: str) -> dict:
    prompt = f"""Analyze this customer complaint and return ONLY valid JSON with these keys:
- sentiment: "positive" | "neutral" | "negative"
- priority: "high" | "medium" | "low"
- category: one of [Billing, Technical, Delivery, Product, Service, Other]
- summary: one sentence summary (max 30 words)

Complaint: {text}

JSON:"""
    try:
        raw = _chat(prompt)
        start = raw.find('{')
        end = raw.rfind('}') + 1
        return json.loads(raw[start:end])
    except Exception:
        return {"sentiment": "neutral", "priority": "medium", "category": "Other", "summary": text[:100]}

def suggest_reply(complaint_title: str, description: str, category: str) -> str:
    prompt = f"""You are a customer support agent. Write a professional, empathetic reply to this complaint.
Keep it under 80 words. Do not include subject line.

Category: {category}
Title: {complaint_title}
Description: {description}

Reply:"""
    return _chat(prompt)

def summarize_text(text: str) -> str:
    """Summarize a chat transcript into 1-2 sentences for escalation context."""
    prompt = f"""Summarize this customer support chat transcript in 1-2 sentences. 
Focus on the key issue discussed and outcome. Be concise.

Transcript:
{text[:2000]}

Summary:"""
    try:
        return _chat(prompt)
    except Exception:
        return "Chat session ended before resolution."
