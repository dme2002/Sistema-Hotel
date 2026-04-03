"""
Configuración de la aplicación.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Configuración de la aplicación."""
    
    # App
    APP_NAME: str = "Hotel Management API"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Seguridad
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Base de datos
    DB_HOST: str = os.getenv("DB_HOST", "db")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "hotel_management")
    DB_USER: str = os.getenv("DB_USER", "hotel_user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
    
    # Django Backend
    DJANGO_INTERNAL_URL: str = os.getenv("DJANGO_INTERNAL_URL", "http://backend:8000")
    
    # CORS
    CORS_ALLOWED_ORIGINS: List[str] = os.getenv(
        "CORS_ALLOWED_ORIGINS", 
        "http://localhost,http://127.0.0.1"
    ).split(",")
    
    @property
    def database_url(self) -> str:
        """URL de conexión a la base de datos."""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def async_database_url(self) -> str:
        """URL de conexión asíncrona a la base de datos."""
        return f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()
