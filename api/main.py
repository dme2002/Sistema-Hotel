"""
API Gateway - FastAPI
Sistema de Gestión Hotelera
"""
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import logging

from config import settings
from database import init_db, close_db
from routers import auth, users, rooms, reservations, dashboard
from middleware.auth import AuthMiddleware
from middleware.logging import LoggingMiddleware

# Configurar logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación."""
    # Startup
    logger.info("Iniciando API Gateway...")
    await init_db()
    yield
    # Shutdown
    logger.info("Cerrando API Gateway...")
    await close_db()


# Crear aplicación FastAPI
app = FastAPI(
    title="Hotel Management API Gateway",
    description="API Gateway para el Sistema de Gestión Hotelera",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
    root_path="/api"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

# Middleware de logging
app.add_middleware(LoggingMiddleware)

# Middleware de autenticación
app.add_middleware(AuthMiddleware)

# Incluir routers
app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/users", tags=["Usuarios"])
app.include_router(rooms.router, prefix="/rooms", tags=["Habitaciones"])
app.include_router(reservations.router, prefix="/reservations", tags=["Reservas"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de health check."""
    return {
        "status": "healthy",
        "service": "api-gateway",
        "version": "1.0.0"
    }


@app.get("/", tags=["Root"])
async def root():
    """Endpoint raíz."""
    return {
        "message": "Hotel Management API Gateway",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None
    }


# Manejadores de excepciones globales
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Manejador de excepciones HTTP."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.detail,
            "data": None
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Manejador de excepciones generales."""
    logger.error(f"Error no manejado: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "Error interno del servidor" if not settings.DEBUG else str(exc),
            "data": None
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4
    )
