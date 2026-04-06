"""
Modelos de usuario para Pydantic.
"""
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RolEnum(str, Enum):
    """Enum para roles de usuario."""
    ADMIN = "admin"
    RECEPCIONISTA = "recepcionista"
    CLIENTE = "cliente"


import json
from pydantic import BaseModel, EmailStr, Field, field_validator

class RolBase(BaseModel):
    """Modelo base para roles."""
    nombre: str
    descripcion: Optional[str] = None
    permisos: List[str] = []

    @field_validator('permisos', mode='before')
    @classmethod
    def parse_permisos(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v


class Rol(RolBase):
    """Modelo completo de rol."""
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Modelo base para usuarios."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    nombres: str = Field(..., min_length=1, max_length=100)
    apellidos: str = Field(..., min_length=1, max_length=100)
    telefono: Optional[str] = None


class UserCreate(UserBase):
    """Modelo para crear usuario."""
    password: str = Field(..., min_length=8)
    rol_id: int = 3  # Cliente por defecto


class UserUpdate(BaseModel):
    """Modelo para actualizar usuario."""
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    rol_id: Optional[int] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """Modelo completo de usuario."""
    id: int
    rol: Optional[Rol] = None
    rol_id: int
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserInDB(User):
    """Modelo de usuario con password hash."""
    password: str


class UserLogin(BaseModel):
    """Modelo para login de usuario."""
    username: str
    password: str


class UserRegister(BaseModel):
    """Modelo para registro de usuario."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    nombres: str = Field(..., min_length=1, max_length=100)
    apellidos: str = Field(..., min_length=1, max_length=100)
    telefono: Optional[str] = None
    password: str = Field(..., min_length=8)
    confirmar_password: str = Field(..., min_length=8)


class PasswordChange(BaseModel):
    """Modelo para cambio de contraseña."""
    password_actual: str
    nuevo_password: str = Field(..., min_length=8)
    confirmar_password: str = Field(..., min_length=8)


class Token(BaseModel):
    """Modelo para tokens JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """Modelo para payload del token."""
    sub: Optional[int] = None
    username: Optional[str] = None
    rol: Optional[str] = None
    jti: Optional[str] = None
    exp: Optional[datetime] = None
    type: Optional[str] = None


class Sesion(BaseModel):
    """Modelo para sesiones."""
    id: int
    username: str
    ip_address: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    activa: bool = True

    class Config:
        from_attributes = True
