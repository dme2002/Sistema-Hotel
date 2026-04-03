"""
Router de autenticación.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

from models.user import UserLogin, UserRegister, Token, PasswordChange
from utils.auth import (
    authenticate_user, create_tokens, verify_token,
    refresh_access_token, revoke_token, get_current_user,
    register_user, change_password
)
from utils.security import get_client_ip, get_user_agent

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=dict)
async def login(request: Request, credentials: UserLogin):
    """
    Inicia sesión y retorna tokens JWT.
    """
    # Autenticar usuario
    user = await authenticate_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado"
        )
    
    # Crear tokens
    tokens = await create_tokens(
        user_id=user.id,
        username=user.username,
        rol=user.rol.nombre if user.rol else "cliente",
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    logger.info(f"Usuario {user.username} ha iniciado sesión")
    
    return {
        "status": "success",
        "message": "Login exitoso",
        "data": tokens
    }


@router.post("/register", response_model=dict)
async def register(user_data: UserRegister):
    """
    Registra un nuevo usuario (cliente).
    """
    # Validar que las contraseñas coincidan
    if user_data.password != user_data.confirmar_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden"
        )
    
    # Registrar usuario
    user = await register_user(user_data)
    
    logger.info(f"Nuevo usuario registrado: {user.username}")
    
    return {
        "status": "success",
        "message": "Usuario registrado exitosamente",
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "nombres": user.nombres,
            "apellidos": user.apellidos
        }
    }


@router.post("/refresh", response_model=dict)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Refresca el access token usando el refresh token.
    """
    refresh_token = credentials.credentials
    
    # Verificar y refrescar token
    tokens = await refresh_access_token(refresh_token)
    
    return {
        "status": "success",
        "message": "Token refrescado",
        "data": tokens
    }


@router.post("/logout", response_model=dict)
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Cierra la sesión del usuario revocando el token.
    """
    token = credentials.credentials
    
    # Revocar token
    await revoke_token(token)
    
    logger.info("Usuario ha cerrado sesión")
    
    return {
        "status": "success",
        "message": "Sesión cerrada exitosamente"
    }


@router.get("/me", response_model=dict)
async def get_me(current_user = Depends(get_current_user)):
    """
    Obtiene información del usuario autenticado.
    """
    return {
        "status": "success",
        "data": current_user
    }


@router.post("/change-password", response_model=dict)
async def password_change(
    password_data: PasswordChange,
    current_user = Depends(get_current_user)
):
    """
    Cambia la contraseña del usuario autenticado.
    """
    # Validar que las contraseñas coincidan
    if password_data.nuevo_password != password_data.confirmar_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden"
        )
    
    # Cambiar contraseña
    success = await change_password(
        current_user.id,
        password_data.password_actual,
        password_data.nuevo_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    return {
        "status": "success",
        "message": "Contraseña actualizada exitosamente"
    }


@router.get("/verify", response_model=dict)
async def verify(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifica si un token es válido.
    """
    token = credentials.credentials
    payload = await verify_token(token)
    
    return {
        "status": "success",
        "data": {
            "valid": True,
            "user_id": payload.sub,
            "username": payload.username,
            "rol": payload.rol
        }
    }
