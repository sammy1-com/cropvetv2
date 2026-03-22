import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import diagnose, chat, cropmind, timeline, marketplace

app = FastAPI(title="CropVet API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose.router,     prefix="/api/diagnose",     tags=["Diagnose"])
app.include_router(chat.router,         prefix="/api/chat",         tags=["Assistant"])
app.include_router(cropmind.router,     prefix="/api/cropmind",     tags=["CropMind"])
app.include_router(timeline.router,     prefix="/api/timeline",     tags=["Timeline"])
app.include_router(marketplace.router,  prefix="/api/marketplace",  tags=["Marketplace"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "CropVet API v2.0 — visit /docs"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
