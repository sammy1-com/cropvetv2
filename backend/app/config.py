from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Groq (image analysis + farm assistant chatbot)
    groq_api_key: str = ""

    # Crop.health (optional — used first for diagnosis if key is set)
    crop_health_api_key: str = ""

    # Supabase (auth)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Mapbox (optional)
    mapbox_access_token: str = ""

    # App
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    port: int = 8000

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
