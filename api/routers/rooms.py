"""
Router de habitaciones.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date
import logging

from models.room import (
    Habitacion, HabitacionCreate, HabitacionUpdate,
    TipoHabitacion, DisponibilidadRequest, DisponibilidadResponse
)
from utils.auth import get_current_user, require_admin, require_admin_or_recepcionista
from database import execute_query, execute_one, execute_procedure, execute_update

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tipos", response_model=dict)
async def list_tipos(current_user = Depends(get_current_user)):
    """
    Lista todos los tipos de habitación.
    """
    tipos = await execute_query("SELECT * FROM tipos_habitacion ORDER BY precio_base")
    
    return {
        "status": "success",
        "data": tipos
    }


@router.get("/tipos/{tipo_id}", response_model=dict)
async def get_tipo(
    tipo_id: int,
    current_user = Depends(get_current_user)
):
    """
    Obtiene detalles de un tipo de habitación.
    """
    tipo = await execute_one(
        "SELECT * FROM tipos_habitacion WHERE id = %s",
        (tipo_id,)
    )
    
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de habitación no encontrado"
        )
    
    return {
        "status": "success",
        "data": tipo
    }


@router.get("", response_model=dict)
async def list_habitaciones(
    estado: Optional[str] = None,
    piso: Optional[int] = None,
    tipo: Optional[int] = None,
    activa: Optional[bool] = None,
    capacidad: Optional[int] = None,
    current_user = Depends(get_current_user)
):
    """
    Lista todas las habitaciones con filtros.
    """
    query = """
        SELECT h.*, th.nombre as tipo_nombre, th.capacidad_maxima, th.amenities
        FROM habitaciones h
        LEFT JOIN tipos_habitacion th ON h.tipo_id = th.id
        WHERE 1=1
    """
    params = []
    
    if estado:
        query += " AND h.estado = %s"
        params.append(estado)
    
    if piso:
        query += " AND h.piso = %s"
        params.append(piso)
    
    if tipo:
        query += " AND h.tipo_id = %s"
        params.append(tipo)
    
    if activa is not None:
        query += " AND h.activa = %s"
        params.append(activa)
    
    if capacidad:
        query += " AND th.capacidad_maxima >= %s"
        params.append(capacidad)
    
    query += " ORDER BY h.piso, h.numero"
    
    habitaciones = await execute_query(query, tuple(params))
    
    return {
        "status": "success",
        "data": habitaciones
    }


@router.get("/{habitacion_id}", response_model=dict)
async def get_habitacion(
    habitacion_id: int,
    current_user = Depends(get_current_user)
):
    """
    Obtiene detalles de una habitación específica.
    """
    habitacion = await execute_one("""
        SELECT h.*, th.nombre as tipo_nombre, th.descripcion as tipo_descripcion,
               th.capacidad_maxima, th.precio_base, th.amenities
        FROM habitaciones h
        LEFT JOIN tipos_habitacion th ON h.tipo_id = th.id
        WHERE h.id = %s
    """, (habitacion_id,))
    
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )
    
    return {
        "status": "success",
        "data": habitacion
    }


@router.post("", response_model=dict)
async def create_habitacion(
    habitacion_data: HabitacionCreate,
    current_user = Depends(require_admin)
):
    """
    Crea una nueva habitación.
    """
    # Verificar que el número no exista
    existing = await execute_one(
        "SELECT id FROM habitaciones WHERE numero = %s",
        (habitacion_data.numero,)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una habitación con este número"
        )
    
    # Insertar habitación
    import json
    from database import execute_insert
    
    # Asegurar que caracteristicas sea un JSON válido
    caracteristicas_json = json.dumps(habitacion_data.caracteristicas or {})
    
    logger.info(f"Intentando crear habitación {habitacion_data.numero} con datos: {habitacion_data.dict()}")
    
    query = """
        INSERT INTO habitaciones (numero, tipo_id, piso, precio_actual, descripcion, caracteristicas, estado, activa, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, 'disponible', TRUE, NOW(), NOW())
    """
    
    try:
        habitacion_id = await execute_insert(query, (
            habitacion_data.numero,
            habitacion_data.tipo_id,
            habitacion_data.piso,
            habitacion_data.precio_actual,
            habitacion_data.descripcion,
            caracteristicas_json
        ))
        logger.info(f"Habitación creada exitosamente con ID: {habitacion_id}")
    except Exception as e:
        logger.error(f"Error al insertar habitación: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en base de datos: {str(e)}"
        )
    
    return {
        "status": "success",
        "message": "Habitación creada exitosamente",
        "data": {"id": habitacion_id}
    }


@router.patch("/{habitacion_id}", response_model=dict)
async def update_habitacion(
    habitacion_id: int,
    habitacion_data: HabitacionUpdate,
    current_user = Depends(require_admin)
):
    """
    Actualiza una habitación existente.
    """
    # Verificar que la habitación existe
    habitacion = await execute_one(
        "SELECT id FROM habitaciones WHERE id = %s",
        (habitacion_id,)
    )
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )
    
    # Construir query de actualización
    update_fields = []
    params = []
    
    if habitacion_data.tipo_id is not None:
        update_fields.append("tipo_id = %s")
        params.append(habitacion_data.tipo_id)
    if habitacion_data.piso is not None:
        update_fields.append("piso = %s")
        params.append(habitacion_data.piso)
    if habitacion_data.estado is not None:
        update_fields.append("estado = %s")
        params.append(habitacion_data.estado)
    if habitacion_data.precio_actual is not None:
        update_fields.append("precio_actual = %s")
        params.append(habitacion_data.precio_actual)
    if habitacion_data.descripcion is not None:
        update_fields.append("descripcion = %s")
        params.append(habitacion_data.descripcion)
    if habitacion_data.caracteristicas is not None:
        update_fields.append("caracteristicas = %s")
        params.append(str(habitacion_data.caracteristicas).replace("'", '"'))
    if habitacion_data.activa is not None:
        update_fields.append("activa = %s")
        params.append(habitacion_data.activa)
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay campos para actualizar"
        )
    
    query = f"UPDATE habitaciones SET {', '.join(update_fields)} WHERE id = %s"
    params.append(habitacion_id)
    
    await execute_update(query, tuple(params))
    
    logger.info(f"Habitación actualizada: {habitacion_id} por {current_user.username}")
    
    return {
        "status": "success",
        "message": "Habitación actualizada exitosamente"
    }


@router.delete("/{habitacion_id}", response_model=dict)
async def delete_habitacion(
    habitacion_id: int,
    current_user = Depends(require_admin)
):
    """
    Desactiva una habitación (eliminación lógica).
    """
    # Verificar que la habitación existe
    habitacion = await execute_one(
        "SELECT id FROM habitaciones WHERE id = %s",
        (habitacion_id,)
    )
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )
    
    # Desactivar habitación
    await execute_update(
        "UPDATE habitaciones SET activa = FALSE WHERE id = %s",
        (habitacion_id,)
    )
    
    logger.info(f"Habitación desactivada: {habitacion_id} por {current_user.username}")
    
    return {
        "status": "success",
        "message": "Habitación desactivada exitosamente"
    }


@router.post("/disponibles", response_model=dict)
async def habitaciones_disponibles(
    request: DisponibilidadRequest,
    current_user = Depends(get_current_user)
):
    """
    Obtiene habitaciones disponibles para un rango de fechas.
    """
    # Validar fechas
    if request.fecha_entrada >= request.fecha_salida:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de salida debe ser posterior a la fecha de entrada"
        )
    
    # Reemplazar sp_habitaciones_disponibles con SQL directo
    query = """
        SELECT h.*, th.nombre as tipo_nombre, th.capacidad_maxima, th.precio_base
        FROM habitaciones h
        LEFT JOIN tipos_habitacion th ON h.tipo_id = th.id
        WHERE h.activa = TRUE 
        AND h.id NOT IN (
            SELECT habitacion_id FROM reservas 
            WHERE estado NOT IN ('cancelada', 'check_out')
            AND fecha_entrada < %s 
            AND fecha_salida > %s
        )
    """
    params = [request.fecha_salida, request.fecha_entrada]
    
    if request.capacidad:
        query += " AND th.capacidad_maxima >= %s"
        params.append(request.capacidad)
    
    habitaciones = await execute_query(query, tuple(params))
    
    return {
        "status": "success",
        "data": {
            "fecha_entrada": request.fecha_entrada,
            "fecha_salida": request.fecha_salida,
            "habitaciones": habitaciones
        }
    }


@router.get("/{habitacion_id}/disponibilidad", response_model=dict)
async def verificar_disponibilidad(
    habitacion_id: int,
    fecha_entrada: date,
    fecha_salida: date,
    current_user = Depends(get_current_user)
):
    """
    Verifica si una habitación específica está disponible.
    """
    # Validar fechas
    if fecha_entrada >= fecha_salida:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de salida debe ser posterior a la fecha de entrada"
        )
    
    # Verificar que la habitación existe
    habitacion = await execute_one(
        "SELECT numero FROM habitaciones WHERE id = %s",
        (habitacion_id,)
    )
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )
    
    # Reemplazar sp_verificar_disponibilidad con SQL directo
    conflicto = await execute_one("""
        SELECT id FROM reservas 
        WHERE habitacion_id = %s 
        AND estado NOT IN ('cancelada', 'check_out')
        AND fecha_entrada < %s 
        AND fecha_salida > %s
    """, (habitacion_id, fecha_salida, fecha_entrada))
    
    disponible = not conflicto
    
    return {
        "status": "success",
        "data": {
            "habitacion_id": habitacion_id,
            "numero": habitacion["numero"],
            "disponible": bool(disponible),
            "fecha_entrada": fecha_entrada,
            "fecha_salida": fecha_salida
        }
    }
