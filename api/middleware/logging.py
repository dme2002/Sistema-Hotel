"""
Middleware de logging.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que registra todas las peticiones HTTP.
    """

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log de la petición entrante
        client_host = request.client.host if request.client else "unknown"
        logger.info(f"→ {request.method} {request.url.path} - {client_host}")
        
        try:
            response = await call_next(request)
            
            # Calcular tiempo de procesamiento
            process_time = time.time() - start_time
            
            # Log de la respuesta
            logger.info(
                f"← {request.method} {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Time: {process_time:.3f}s"
            )
            
            # Agregar header con tiempo de procesamiento
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"✕ {request.method} {request.url.path} - "
                f"Error: {str(e)} - "
                f"Time: {process_time:.3f}s"
            )
            raise
