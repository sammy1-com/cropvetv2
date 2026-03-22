import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.config import settings

router = APIRouter()
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

SYSTEM = """You are the CropVet Farm Assistant — an expert agricultural advisor for Kenyan smallholder farmers.

Help with: crop diseases, planting schedules, soil health, fertilizers, pest management, agro-inputs, weather decisions.

Rules:
- Respond in English by default.
- If the user writes in Swahili, respond in Swahili for that message only, then return to English.
- Be concise, friendly, practical, and affordable in advice.
- Always include dosage and safety precautions when mentioning chemicals.
- If unsure of a price, say "confirm with your local agro-dealer"."""


class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    reply: str


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not settings.groq_api_key:
        return ChatResponse(reply="Set GROQ_API_KEY in .env to enable the Farm Assistant.")

    messages = [{"role": "system", "content": SYSTEM}]
    for m in req.messages:
        messages.append({"role": m.role if m.role in ("user", "assistant") else "user", "content": m.content})

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(GROQ_URL,
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            json={"model": MODEL, "messages": messages, "max_tokens": 1024, "temperature": 0.7})
        r.raise_for_status()
        return ChatResponse(reply=r.json()["choices"][0]["message"]["content"])
