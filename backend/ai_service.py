from groq import Groq
from dotenv import load_dotenv
import os, json

load_dotenv()

MODEL = "llama-3.3-70b-versatile"

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
    prompt = f"""You are an expert complaint analysis AI. Analyze this customer complaint and return ONLY a raw JSON object. No explanation, no markdown, no code blocks. Just the JSON.

Required keys:
- "sentiment": "positive" or "neutral" or "negative"
- "priority": "high" or "medium" or "low"
- "category": one of Billing, Technical, Delivery, Product, Service, Account, Refund, Other
- "product": specific product/service name inferred from complaint (max 3 words, e.g. "Payment Gateway", "Broadband Service", "Mobile App")
- "summary": one sentence max 25 words
- "title": a short, sharp complaint title (max 8 words, no punctuation at end) that captures the core issue
- "key_issues": array of 2-4 short strings of specific issues found (e.g. ["Payment deducted twice", "Order not confirmed"])
- "urgency_signals": array of 0-3 strings for urgency indicators (e.g. ["Financial loss mentioned", "Repeat complaint", "Threatening escalation"])
- "suggested_actions": array of exactly 3 short agent action strings (e.g. ["Check transaction logs", "Issue refund within 24h", "Send apology"])
- "severity_score": a number from 1 to 10. Use this scale strictly:
  1-3 = minor inconvenience, no financial impact, first time
  4-6 = moderate issue, some frustration, possible financial impact
  7-8 = significant issue, financial loss, repeated attempts, work/life impact
  9-10 = critical, legal threats, major financial loss, complete service failure

Complaint text: {text}

JSON only:"""
    try:
        raw = _chat(prompt)
        print(f"[AI RAW] {raw[:300]}")  # debug — visible in uvicorn logs
        # strip markdown code blocks if model wraps in ```
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON found in response")
        result = json.loads(raw[start:end])
        # force correct types
        result["severity_score"] = int(result.get("severity_score", 5))
        result.setdefault("key_issues", [])
        result.setdefault("urgency_signals", [])
        result.setdefault("suggested_actions", [])
        result.setdefault("product", "General")
        return result
    except Exception as e:
        print(f"[AI ERROR] analyze_complaint failed: {e}")
        return {
            "sentiment": "neutral", "priority": "medium", "category": "Other",
            "product": "General", "summary": text[:100],
            "key_issues": [], "urgency_signals": [], "suggested_actions": [],
            "severity_score": 5
        }

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
