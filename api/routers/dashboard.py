"""
Router de dashboard.
"""
from fastapi import APIRouter, Depends
import logging

from models.reservation import DashboardStats
from utils.auth import require_admin_or_recepcionista
from database import execute_procedure

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats", response_model=dict)
async def get_stats(current_user = Depends(require_admin_or_recepcionista)):
    """
    Obtiene estadísticas para el dashboard.
    """
    from database import execute_one, execute_query

    try:
        stats = await execute_one("""
            SELECT
                (SELECT COUNT(*) FROM habitaciones WHERE activa = TRUE) as total_habitaciones,
                (SELECT COUNT(*) FROM habitaciones WHERE activa = TRUE AND estado = 'disponible') as habitaciones_disponibles,
                (SELECT COUNT(*) FROM habitaciones WHERE activa = TRUE AND estado = 'ocupada') as habitaciones_ocupadas,
                (SELECT COUNT(*) FROM habitaciones WHERE activa = TRUE AND estado = 'mantenimiento') as habitaciones_mantenimiento,
                (SELECT COUNT(*) FROM reservas WHERE estado IN ('confirmada', 'check_in')) as reservas_activas,
                (SELECT COUNT(*) FROM reservas WHERE estado = 'pendiente') as reservas_pendientes,
                (SELECT COALESCE(SUM(precio_total), 0) FROM reservas WHERE estado IN ('confirmada', 'check_in', 'check_out') AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as ingresos_mes,
                (SELECT COUNT(*) FROM usuarios WHERE activo = TRUE) as total_usuarios
        """)

        return {
            "status": "success",
            "data": {
                "total_habitaciones": stats["total_habitaciones"] if stats else 0,
                "habitaciones_disponibles": stats["habitaciones_disponibles"] if stats else 0,
                "habitaciones_ocupadas": stats["habitaciones_ocupadas"] if stats else 0,
                "habitaciones_mantenimiento": stats["habitaciones_mantenimiento"] if stats else 0,
                "reservas_activas": stats["reservas_activas"] if stats else 0,
                "reservas_pendientes": stats["reservas_pendientes"] if stats else 0,
                "ingresos_mes": float(stats["ingresos_mes"]) if stats else 0.0,
                "total_usuarios": stats["total_usuarios"] if stats else 0
            }
        }
    except Exception as e:
        logger.error(f"Error obteniendo stats del dashboard: {e}")
        return {
            "status": "success",
            "data": {
                "total_habitaciones": 0,
                "habitaciones_disponibles": 0,
                "habitaciones_ocupadas": 0,
                "habitaciones_mantenimiento": 0,
                "reservas_activas": 0,
                "reservas_pendientes": 0,
                "ingresos_mes": 0.0,
                "total_usuarios": 0
            }
        }


@router.get("/ocupacion", response_model=dict)
async def get_ocupacion(current_user = Depends(require_admin_or_recepcionista)):
    """
    Obtiene datos de ocupación por piso.
    """
    from database import execute_query
    
    ocupacion = await execute_query("""
        SELECT 
            piso,
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
            SUM(CASE WHEN estado = 'ocupada' THEN 1 ELSE 0 END) as ocupadas,
            SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as mantenimiento,
            SUM(CASE WHEN estado = 'limpieza' THEN 1 ELSE 0 END) as limpieza
        FROM habitaciones
        WHERE activa = TRUE
        GROUP BY piso
        ORDER BY piso
    """)
    
    return {
        "status": "success",
        "data": ocupacion
    }


@router.get("/reservas-recientes", response_model=dict)
async def get_reservas_recientes(current_user = Depends(require_admin_or_recepcionista)):
    """
    Obtiene las reservas más recientes.
    """
    from database import execute_query
    
    reservas = await execute_query("""
        SELECT r.*, 
               u.nombres as cliente_nombres, u.apellidos as cliente_apellidos,
               h.numero as habitacion_numero
        FROM reservas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        LEFT JOIN habitaciones h ON r.habitacion_id = h.id
        ORDER BY r.created_at DESC
        LIMIT 10
    """)
    
    formatted_reservas = []
    for r in reservas:
        formatted_reservas.append({
            "id": r["id"],
            "codigo_reserva": r["codigo_reserva"],
            "cliente_nombre": f"{r['cliente_nombres']} {r['cliente_apellidos']}",
            "habitacion_numero": r["habitacion_numero"],
            "fecha_entrada": r["fecha_entrada"],
            "fecha_salida": r["fecha_salida"],
            "precio_total": r["precio_total"],
            "estado": r["estado"],
            "created_at": r["created_at"]
        })
    
    return {
        "status": "success",
        "data": formatted_reservas
    }


@router.get("/ingresos-mensuales", response_model=dict)
async def get_ingresos_mensuales(current_user = Depends(require_admin_or_recepcionista)):
    """
    Obtiene ingresos de los últimos 6 meses.
    """
    from database import execute_query
    
    ingresos = await execute_query("""
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as mes,
            DATE_FORMAT(created_at, '%M %Y') as mes_nombre,
            COUNT(*) as num_reservas,
            SUM(precio_total) as total_ingresos
        FROM reservas
        WHERE estado IN ('confirmada', 'check_in', 'check_out')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mes
    """)
    
    return {
        "status": "success",
        "data": [
            {
                "mes": i["mes"],
                "mes_nombre": i["mes_nombre"],
                "num_reservas": i["num_reservas"],
                "total_ingresos": float(i["total_ingresos"] or 0)
            }
            for i in ingresos
        ]
    }
