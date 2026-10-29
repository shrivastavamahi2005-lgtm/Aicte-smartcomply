import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AICTE SmartComply AI")
        VERSION: str = os.getenv("VERSION", "1.0.0")
        API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartcomply.db")
        SECRET_KEY: str = os.getenv("SECRET_KEY", "aicte_smartcomply_360_sih_hackathon_super_secret_jwt_key")
        ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock")
        AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", None)
        AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "gemini-1.5-pro")
        UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
        SMTP_ENABLED: bool = os.getenv("SMTP_ENABLED", "false").lower() == "true"
        BACKEND_CORS_ORIGINS: str = os.getenv("BACKEND_CORS_ORIGINS", "*")
except ImportError:
    class Settings:
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AICTE SmartComply AI")
        VERSION: str = os.getenv("VERSION", "1.0.0")
        API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartcomply.db")
        SECRET_KEY: str = os.getenv("SECRET_KEY", "aicte_smartcomply_360_sih_hackathon_super_secret_jwt_key")
        ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock")
        AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", None)
        AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "gemini-1.5-pro")
        UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
        SMTP_ENABLED: bool = os.getenv("SMTP_ENABLED", "false").lower() == "true"
        BACKEND_CORS_ORIGINS: str = os.getenv("BACKEND_CORS_ORIGINS", "*")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
