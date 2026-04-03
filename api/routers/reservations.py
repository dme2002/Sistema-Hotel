"""
Router de reservas.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date
import logging
import uuid

from models.reservation import (
    Reserva, ReservaCreate, ReservaUpdate, ReservaEstado,
    EstadoReserva, HistorialReserva
)
from utils.auth import get_current_user, require_admin, require_admin_or_recepcionista
from database import execute_query, execute_one, execute_procedure, execute_update

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=dict)
async def list_reservas(
    estado: Optional[str] = None,
    usuario: Optional[int] = None,
    habitacion: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(require_admin_or_recepcionista)
):
    """
    Lista todas las reservas con filtros.
    """
    query = """
        SELECT r.*, 
               u.nombres as cliente_nombres, u.apellidos as cliente_apellidos,
               h.numero as habitacion_numero, th.nombre as tipo_habitacion
        FROM reservas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        LEFT JOIN habitaciones h ON r.habitacion_id = h.id
        LEFT JOIN tipos_habitacion th ON h.tipo_id = th.id
        WHERE 1=1
    """
    params = []
    
    if estado:
        query += " AND r.estado = %s"
        params.append(estado)
    
    if usuario:
        query += " AND r.usuario_id = %s"
        params.append(usuario)
    
    if habitacion:
        query += " AND r.habitacion_id = %s"
        params.append(habitacion)
    
    if fecha_desde:
        query += " AND r.fecha_entrada >= %s"
        params.append(fecha_desde)
    
    if fecha_hasta:
        query += " AND r.fecha_salida <= %s"
        params.append(fecha_hasta)
    
    query += " ORDER BY r.created_at DESC"
    
    # Paginación
    offset = (page - 1) * page_size
    query += " LIMIT %s OFFSET %s"
    params.extend([page_size, offset])
    
    reservas = await execute_query(query, tuple(params))
    
    # Formatear respuesta
    formatted_reservas = []
    for r in reservas:
        formatted_reservas.append({
            "id": r["id"],
            "codigo_reserva": r["codigo_reserva"],
            "cliente_nombre": f"{r['cliente_nombres']} {r['cliente_apellidos']}",
            "habitacion_numero": r["habitacion_numero"],
            "tipo_habitacion": r["tipo_habitacion"],
            "fecha_entrada": r["fecha_entrada"],
            "fecha_salida": r["fecha_salida"],
            "num_huespedes": r["num_huespedes"],
            "precio_total": r["precio_total"],
            "estado": r["estado"],
            "created_at": r["created_at"]
        })
    
    return {
        "status": "success",
        "data": formatted_reservas,
        "pagination": {
            "page": page,
            "page_size": page_size
        }
    }


@router.get("/{reserva_id}", response_model=dict)
async def get_reserva(
    reserva_id: int,
    current_user = Depends(get_current_user)
):
    """
    Obtiene detalles de una reserva específica.
    """
    reserva = await execute_one("""
        SELECT r.*, 
               u.id as cliente_id, u.nombres as cliente_nombres, u.apellidos as cliente_apellidos,
               u.email as cliente_email, u.telefono as cliente_telefono,
               h.id as hab_id, h.numero, th.nombre as tipo, h.piso, h.precio_actual,
               cb.nombres as creador_nombres, cb.apellidos as creador_apellidos
        FROM reservas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        LEFT JOIN habitaciones h ON r.habitacion_id = h.id
        LEFT JOIN tipos_habitacion th ON h.tipo_id = th.id
        LEFT JOIN usuarios cb ON r.created_by = cb.id
        WHERE r.id = %s
    """, (reserva_id,))
    
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )
    
    # Clientes solo pueden ver sus propias reservas
    if current_user.rol.nombre == 'cliente' and reserva["usuario_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para ver esta reserva"
        )
    
    num_noches = (reserva["fecha_salida"] - reserva["fecha_entrada"]).days
    
    return {
        "status": "success",
        "data": {
            "id": reserva["id"],
            "codigo_reserva": reserva["codigo_reserva"],
            "cliente": {
                "id": reserva["cliente_id"],
                "nombre": f"{reserva['cliente_nombres']} {reserva['cliente_apellidos']}",
                "email": reserva["cliente_email"],
                "telefono": reserva["cliente_telefono"]
            },
            "habitacion": {
                "id": reserva["hab_id"],
                "numero": reserva["numero"],
                "tipo": reserva["tipo"],
                "piso": reserva["piso"],
                "precio_noche": reserva["precio_actual"]
            },
            "fecha_entrada": reserva["fecha_entrada"],
            "fecha_salida": reserva["fecha_salida"],
            "num_huespedes": reserva["num_huespedes"],
            "num_noches": num_noches,
            "precio_total": reserva["precio_total"],
            "estado": reserva["estado"],
            "notas": reserva["notas"],
            "creado_por": f"{reserva['creador_nombres']} {reserva['creador_apellidos']}" if reserva["creador_nombres"] else None,
            "created_at": reserva["created_at"],
            "updated_at": reserva["updated_at"]
        }
    }


@router.post("", response_model=dict)
async def create_reserva(
    reserva_data: ReservaCreate,
    current_user = Depends(require_admin_or_recepcionista)
):
    """
    Crea una nueva reserva.
    """
    # Validar fechas
    if reserva_data.fecha_entrada >= reserva_data.fecha_salida:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de salida debe ser posterior a la fecha de entrada"
        )
    
    # Verificar que el usuario existe
    usuario = await execute_one(
        "SELECT id FROM usuarios WHERE id = %s",
        (reserva_data.usuario_id,)
    )
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no existe"
        )
    
    # Verificar que la habitación existe y está activa
    habitacion = await execute_one(
        "SELECT h.*, th.capacidad_maxima FROM habitaciones h LEFT JOIN tipos_habitacion th ON h.tipo_id = th.id WHERE h.id = %s AND h.activa = TRUE",
        (reserva_data.habitacion_id,)
    )
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La habitación no existe o no está activa"
        )
    
    # Validar capacidad
    if reserva_data.num_huespedes > habitacion["capacidad_maxima"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La habitación tiene capacidad máxima de {habitacion['capacidad_maxima']} huéspedes"
        )
    
    # Verificar disponibilidad (buscar reservas que se traslapen)
    conflicto = await execute_one("""
        SELECT id FROM reservas 
        WHERE habitacion_id = %s 
        AND estado NOT IN ('cancelada', 'check_out')
        AND fecha_entrada < %s 
        AND fecha_salida > %s
    """, (reserva_data.habitacion_id, reserva_data.fecha_salida, reserva_data.fecha_entrada))
    
    if conflicto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La habitación no está disponible para las fechas seleccionadas"
        )
    
    # Calcular precio total
    num_noches = (reserva_data.fecha_salida - reserva_data.fecha_entrada).days
    precio_total = habitacion["precio_actual"] * num_noches
    
    # Generar código de reserva
    codigo = f"RES-{uuid.uuid4().hex[:8].upper()}"
    
    # Insertar reserva
    from database import execute_insert
    query = """
        INSERT INTO reservas (codigo_reserva, usuario_id, habitacion_id, fecha_entrada, fecha_salida, 
                             num_huespedes, precio_total, estado, notas, created_by, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'pendiente', %s, %s, NOW(), NOW())
    """
    reserva_id = await execute_insert(query, (
        codigo,
        reserva_data.usuario_id,
        reserva_data.habitacion_id,
        reserva_data.fecha_entrada,
        reserva_data.fecha_salida,
        reserva_data.num_huespedes,
        precio_total,
        reserva_data.notas,
        current_user.id
    ))
    
    # Registrar en historial
    await execute_update("""
        INSERT INTO historial_reservas (reserva_id, accion, detalles, usuario_id, created_at, updated_at)
        VALUES (%s, 'creacion', %s, %s, NOW(), NOW())
    """, (reserva_id, '{"mensaje": "Reserva creada"}', current_user.id))
    
    logger.info(f"Reserva creada: {codigo} por {current_user.username}")
    
    return {
        "status": "success",
        "message": "Reserva creada exitosamente",
        "data": {
            "id": reserva_id,
            "codigo_reserva": codigo,
            "precio_total": precio_total
        }
    }


@router.patch("/{reserva_id}", response_model=dict)
async def update_reserva(
    reserva_id: int,
    reserva_data: ReservaUpdate,
    current_user = Depends(require_admin_or_recepcionista)
):
    """
    Actualiza una reserva existente.
    """
    # Verificar que la reserva existe
    reserva = await execute_one(
        "SELECT estado FROM reservas WHERE id = %s",
        (reserva_id,)
    )
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )
    
    # No permitir modificar reservas canceladas o con check-out
    if reserva["estado"] in ['cancelada', 'check_out']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede modificar una reserva cancelada o con check-out realizado"
        )
    
    # Construir query de actualización
    update_fields = []
    params = []
    
    if reserva_data.fecha_entrada is not None:
        update_fields.append("fecha_entrada = %s")
        params.append(reserva_data.fecha_entrada)
    if reserva_data.fecha_salida is not None:
        update_fields.append("fecha_salida = %s")
        params.append(reserva_data.fecha_salida)
    if reserva_data.num_huespedes is not None:
        update_fields.append("num_huespedes = %s")
        params.append(reserva_data.num_huespedes)
    if reserva_data.notas is not None:
        update_fields.append("notas = %s")
        params.append(reserva_data.notas)
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay campos para actualizar"
        )
    
    query = f"UPDATE reservas SET {', '.join(update_fields)} WHERE id = %s"
    params.append(reserva_id)
    
    await execute_update(query, tuple(params))
    
    # Registrar en historial
    await execute_update("""
        INSERT INTO historial_reservas (reserva_id, accion, detalles, usuario_id, created_at, updated_at)
        VALUES (%s, 'modificacion', %s, %s, NOW(), NOW())
    """, (reserva_id, f'{{"campos_actualizados": {list(reserva_data.dict(exclude_unset=True).keys())}}}', current_user.id))
    
    logger.info(f"Reserva actualizada: {reserva_id} por {current_user.username}")
    
    return {
        "status": "success",
        "message": "Reserva actualizada exitosamente"
    }


@router.post("/{reserva_id}/estado", response_model=dict)
async def cambiar_estado(
    reserva_id: int,
    estado_data: ReservaEstado,
    current_user = Depends(require_admin_or_recepcionista)
):
    """
    Cambia el estado de una reserva.
    """
    # Verificar que la reserva existe
    reserva = await execute_one(
        "SELECT estado, habitacion_id FROM reservas WHERE id = %s",
        (reserva_id,)
    )
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )
    
    estado_actual = reserva["estado"]
    nuevo_estado = estado_data.estado
    
    # Validar transiciones de estado
    transiciones_validas = {
        'pendiente': ['confirmada', 'cancelada'],
        'confirmada': ['check_in', 'cancelada'],
        'check_in': ['check_out'],
        'check_out': [],
        'cancelada': []
    }
    
    if nuevo_estado not in transiciones_validas.get(estado_actual, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'No se puede cambiar de "{estado_actual}" a "{nuevo_estado}"'
        )
    
    # Actualizar estado
    await execute_update(
        "UPDATE reservas SET estado = %s WHERE id = %s",
        (nuevo_estado, reserva_id)
    )
    
    # Actualizar estado de habitación si es necesario
    habitacion_estado = None
    if nuevo_estado == 'check_in':
        habitacion_estado = 'ocupada'
    elif nuevo_estado == 'check_out':
        habitacion_estado = 'limpieza'
    elif nuevo_estado == 'cancelada':
        habitacion_estado = 'disponible'
    
    if habitacion_estado:
        await execute_update(
            "UPDATE habitaciones SET estado = %s WHERE id = %s",
            (habitacion_estado, reserva["habitacion_id"])
        )
    
    # Registrar en historial
    detalles = {
        "estado_anterior": estado_actual,
        "estado_nuevo": nuevo_estado,
        "motivo": estado_data.motivo or ""
    }
    await execute_update("""
        INSERT INTO historial_reservas (reserva_id, accion, detalles, usuario_id, created_at, updated_at)
        VALUES (%s, 'cambio_estado', %s, %s, NOW(), NOW())
    """, (reserva_id, str(detalles).replace("'", '"'), current_user.id))
    
    logger.info(f"Reserva {reserva_id}: {estado_actual} -> {nuevo_estado} por {current_user.username}")
    
    return {
        "status": "success",
        "message": f"Estado actualizado a: {nuevo_estado}",
        "data": {
            "estado_anterior": estado_actual,
            "estado_nuevo": nuevo_estado
        }
    }


@router.post("/{reserva_id}/cancelar", response_model=dict)
async def cancelar_reserva(
    reserva_id: int,
    motivo: Optional[str] = "",
    current_user = Depends(get_current_user)
):
    """
    Cancela una reserva.
    """
    # Verificar que la reserva existe
    reserva = await execute_one(
        "SELECT usuario_id, habitacion_id, estado FROM reservas WHERE id = %s",
        (reserva_id,)
    )
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )
    
    # Clientes solo pueden cancelar sus propias reservas
    if current_user.rol.nombre == 'cliente' and reserva["usuario_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para cancelar esta reserva"
        )
    
    # Validar que se puede cancelar
    if reserva["estado"] not in ['pendiente', 'confirmada']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'No se puede cancelar una reserva en estado {reserva["estado"]}'
        )
    
    # Cancelar reserva directamente
    await execute_update(
        "UPDATE reservas SET estado = 'cancelada' WHERE id = %s",
        (reserva_id,)
    )
    
    # Registrar en historial
    await execute_update("""
        INSERT INTO historial_reservas (reserva_id, accion, detalles, usuario_id, created_at, updated_at)
        VALUES (%s, 'cancelacion', %s, %s, NOW(), NOW())
    """, (reserva_id, '{"motivo": "' + (motivo or 'Sin motivo') + '"}', current_user.id))
    
    # Actualizar estado de habitación
    await execute_update(
        "UPDATE habitaciones SET estado = 'disponible' WHERE id = %s",
        (reserva["habitacion_id"],)
    )
    
    logger.info(f"Reserva cancelada: {reserva_id} por {current_user.username}")
    
    return {
        "status": "success",
        "message": "Reserva cancelada exitosamente"
    }


@router.get("/{reserva_id}/historial", response_model=dict)
async def get_historial(
    reserva_id: int,
    current_user = Depends(require_admin_or_recepcionista)
):
    """
    Obtiene el historial de una reserva.
    """
    historial = await execute_query("""
        SELECT hr.*, u.nombres, u.apellidos
        FROM historial_reservas hr
        LEFT JOIN usuarios u ON hr.usuario_id = u.id
        WHERE hr.reserva_id = %s
        ORDER BY hr.created_at DESC
    """, (reserva_id,))
    
    formatted_historial = []
    for h in historial:
        formatted_historial.append({
            "id": h["id"],
            "accion": h["accion"],
            "detalles": h["detalles"],
            "usuario_nombre": f"{h['nombres']} {h['apellidos']}" if h["nombres"] else None,
            "created_at": h["created_at"]
        })
    
    return {
        "status": "success",
        "data": formatted_historial
    }


@router.get("/mis-reservas/lista", response_model=dict)
async def mis_reservas(current_user = Depends(get_current_user)):
    """
    Obtiene las reservas del usuario autenticado.
    """
    reservas = await execute_query("""
        SELECT r.*, h.numero as habitacion_numero, th.nombre as tipo_habitacion
        FROM reservas r
        LEFT JOIN habitaciones h ON r.habitacion_id = h.id
        LEFT JOIN tipos_habitacion th ON h.tipo_id = th.id
        WHERE r.usuario_id = %s
        ORDER BY r.created_at DESC
    """, (current_user.id,))
    
    formatted_reservas = []
    for r in reservas:
        formatted_reservas.append({
            "id": r["id"],
            "codigo_reserva": r["codigo_reserva"],
            "habitacion_numero": r["habitacion_numero"],
            "tipo_habitacion": r["tipo_habitacion"],
            "fecha_entrada": r["fecha_entrada"],
            "fecha_salida": r["fecha_salida"],
            "num_huespedes": r["num_huespedes"],
            "precio_total": r["precio_total"],
            "estado": r["estado"],
            "created_at": r["created_at"]
        })
    
    return {
        "status": "success",
        "data": formatted_reservas
    }
