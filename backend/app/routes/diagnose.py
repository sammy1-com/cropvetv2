import base64, json
import httpx
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from app.config import settings
from PIL import Image
import io

router = APIRouter()
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


class DiagnosisResult(BaseModel):
    disease: str
    confidence: str
    description: str
    treatment: str
    prevention: str
    severity: str  # healthy | low | medium | high | info


@router.post("/", response_model=DiagnosisResult)
async def diagnose(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image.")

    contents = await image.read()

    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(400, "Invalid or corrupted image file.")

    if settings.crop_health_api_key:
        try:
            return await _crop_health(contents, image.content_type)
        except Exception:
            pass  # fall through to Groq

    if settings.groq_api_key:
        return await _groq_vision(contents, image.content_type)

    return DiagnosisResult(
        disease="Demo Mode — No API key",
        confidence="N/A",
        description="Add GROQ_API_KEY to your .env file to enable AI diagnosis.",
        treatment="See .env.example for setup instructions.",
        prevention="",
        severity="info",
    )


async def _crop_health(contents: bytes, content_type: str) -> DiagnosisResult:
    encoded = base64.b64encode(contents).decode()
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            "https://crop.health/api/v1/identify",
            headers={"Api-Key": settings.crop_health_api_key},
            json={"images": [f"data:{content_type};base64,{encoded}"]},
        )
        r.raise_for_status()
        s = r.json().get("result", {}).get("disease", {}).get("suggestions", [{}])[0]
        return DiagnosisResult(
            disease=s.get("name", "Unknown"),
            confidence=f"{round(s.get('probability', 0) * 100)}%",
            description=s.get("details", {}).get("description", ""),
            treatment=s.get("details", {}).get("treatment", {}).get("chemical", ""),
            prevention=s.get("details", {}).get("treatment", {}).get("prevention", ""),
            severity="high" if s.get("probability", 0) > 0.7 else "medium",
        )


async def _groq_vision(contents: bytes, content_type: str) -> DiagnosisResult:
    data_url = f"data:{content_type};base64,{base64.b64encode(contents).decode()}"
    prompt = """You are an expert agronomist analyzing a crop photo for a Kenyan smallholder farmer.
Respond ONLY with valid JSON — no extra text, no markdown fences, no explanation:
{"disease":"name or 'Healthy'","confidence":"e.g. 85%","description":"plain English description of condition","treatment":"affordable practical treatment steps","prevention":"how to prevent this recurring","severity":"healthy|low|medium|high"}"""

    async with httpx.AsyncClient(timeout=45) as c:
        try:
            r = await c.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": VISION_MODEL,
                    "max_tokens": 512,
                    "temperature": 0.2,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }],
                },
            )
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Groq API error {e.response.status_code}: check your GROQ_API_KEY and that the vision model is available on your plan."
            )

        text = r.json()["choices"][0]["message"]["content"].strip()
        # Strip any accidental markdown fences
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="Groq returned an unexpected response format. Try again.")

        return DiagnosisResult(**data)
