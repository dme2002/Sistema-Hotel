"""
Configuración de base de datos.
"""
import aiomysql
import logging
from typing import Optional
from contextlib import asynccontextmanager

from config import settings

logger = logging.getLogger(__name__)

# Pool de conexiones
_pool: Optional[aiomysql.Pool] = None


async def init_db():
    """Inicializa el pool de conexiones a la base de datos."""
    global _pool
    try:
        _pool = await aiomysql.create_pool(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            db=settings.DB_NAME,
            charset='utf8mb4',
            autocommit=True,
            minsize=5,
            maxsize=20
        )
        logger.info("Pool de conexiones a base de datos inicializado")
    except Exception as e:
        logger.error(f"Error inicializando pool de conexiones: {e}")
        raise


async def close_db():
    """Cierra el pool de conexiones."""
    global _pool
    if _pool:
        _pool.close()
        await _pool.wait_closed()
        logger.info("Pool de conexiones cerrado")


async def get_db():
    """Obtiene una conexión del pool."""
    global _pool
    if not _pool:
        await init_db()
    async with _pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            yield cur


@asynccontextmanager
async def get_db_connection():
    """Context manager para obtener conexión a la base de datos."""
    global _pool
    if not _pool:
        await init_db()
    
    conn = None
    try:
        conn = await _pool.acquire()
        yield conn
    finally:
        if conn:
            await _pool.release(conn)


async def execute_query(query: str, params: tuple = None):
    """Ejecuta una consulta SQL."""
    async with get_db_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, params)
            return await cur.fetchall()


async def execute_one(query: str, params: tuple = None):
    """Ejecuta una consulta SQL y retorna un solo resultado."""
    async with get_db_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, params)
            return await cur.fetchone()


async def execute_procedure(proc_name: str, params: tuple = None):
    """Ejecuta un stored procedure."""
    async with get_db_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.callproc(proc_name, params)
            return await cur.fetchall()


async def execute_insert(query: str, params: tuple = None) -> int:
    """Ejecuta un INSERT y retorna el ID generado."""
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            await conn.commit()
            return cur.lastrowid


async def execute_update(query: str, params: tuple = None) -> int:
    """Ejecuta un UPDATE/DELETE y retorna filas afectadas."""
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            await conn.commit()
            return cur.rowcount
