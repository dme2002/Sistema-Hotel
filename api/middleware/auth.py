"""
Middleware de autenticación.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from utils.auth import verify_token

logger = logging.getLogger(__name__)

# Rutas públicas que no requieren autenticación
PUBLIC_PATHS = [
    "/",
    "/health",
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/docs",
    "/redoc",
    "/openapi.json",
]


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware que verifica la autenticación en las rutas protegidas.
    """

    async def dispatch(self, request: Request, call_next):
        # Verificar si la ruta es pública
        path = request.url.path
        
        # Permitir rutas públicas
        for public_path in PUBLIC_PATHS:
            if path.startswith(public_path):
                return await call_next(request)
        
        # Verificar token en rutas protegidas
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se proporcionó token de autenticación",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Esquema de autenticación inválido",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verificar token
            payload = await verify_token(token)
            
            # Agregar información del usuario a la request
            request.state.user_id = payload.sub
            request.state.username = payload.username
            request.state.rol = payload.rol
            
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Formato de token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verificando token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return await call_next(request)
