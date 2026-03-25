"""
Duplicate detection using two strategies:
1. Fast: exact + near-exact title matching via MongoDB regex
2. Semantic: Groq LLM comparison against recent open complaints (same user)
Falls back gracefully if AI call fails.
"""
from database import get_db
from datetime import datetime, timedelta
import os, json

def _normalize(text: str) -> str:
    import re
    return re.sub(r'\s+', ' ', text.lower().strip())

def embed(text: str) -> list:
    """No-op — kept for API compatibility with complaints router."""
    return []

async def find_duplicates(db, text: str, threshold: float = 0.85, exclude_id=None) -> list:
    """Returns list of duplicate complaint IDs using fast text matching."""
    return []  # used only for embedding-based check — replaced by check_duplicate_for_user

async def check_duplicate_for_user(db, user_id: str, title: str, description: str) -> dict:
    """
    Check if this user already has an open/in-progress complaint that is
    semantically the same as the new one.
    Returns: { is_duplicate: bool, existing_id: str|None, existing_title: str|None, similarity: str }
    """
    # Only check complaints from the same user that are not resolved
    cutoff = datetime.utcnow() - timedelta(days=30)
    cursor = db.complaints.find({
        "user_id": user_id,
        "status": {"$in": ["open", "in-progress"]},
        "created_at": {"$gte": cutoff}
    }).sort("created_at", -1).limit(10)

    existing = []
    async for doc in cursor:
        existing.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", ""),
            "description": doc.get("description", "")[:200],
            "status": doc.get("status", "open"),
        })

    if not existing:
        return {"is_duplicate": False, "existing_id": None, "existing_title": None}

    # Fast check: exact or near-exact title match
    norm_new = _normalize(title + " " + description[:100])
    for e in existing:
        norm_existing = _normalize(e["title"] + " " + e["description"][:100])
        # simple word overlap ratio
        new_words = set(norm_new.split())
        ex_words = set(norm_existing.split())
        if len(new_words) > 0:
            overlap = len(new_words & ex_words) / len(new_words)
            if overlap > 0.7:
                return {
                    "is_duplicate": True,
                    "existing_id": e["id"],
                    "existing_title": e["title"],
                    "existing_status": e["status"],
                }

    # Semantic check via Groq LLM
    try:
        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        existing_list = "\n".join([
            f'{i+1}. Title: "{e["title"]}" | Description: "{e["description"]}"'
            for i, e in enumerate(existing)
        ])

        prompt = f"""You are a duplicate complaint detector. 
New complaint:
Title: "{title}"
Description: "{description[:300]}"

Existing open complaints from same user:
{existing_list}

Is the new complaint essentially the same issue as any existing complaint? 
Return ONLY valid JSON: {{"is_duplicate": true/false, "matching_index": null_or_number_1_based, "reason": "brief reason"}}
JSON:"""

        resp = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=100,
        )
        raw = resp.choices[0].message.content.strip()
        start, end = raw.find('{'), raw.rfind('}') + 1
        result = json.loads(raw[start:end])

        if result.get("is_duplicate") and result.get("matching_index"):
            idx = int(result["matching_index"]) - 1
            if 0 <= idx < len(existing):
                matched = existing[idx]
                return {
                    "is_duplicate": True,
                    "existing_id": matched["id"],
                    "existing_title": matched["title"],
                    "existing_status": matched["status"],
                }
    except Exception as e:
        print(f"[DUPLICATE] Semantic check failed: {e}")

    return {"is_duplicate": False, "existing_id": None, "existing_title": None}
