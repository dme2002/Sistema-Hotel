"""
Modelos de reservas para Pydantic.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class EstadoReserva(str, Enum):
    """Enum para estados de reserva."""
    PENDIENTE = "pendiente"
    CONFIRMADA = "confirmada"
    CHECK_IN = "check_in"
    CHECK_OUT = "check_out"
    CANCELADA = "cancelada"


class ReservaBase(BaseModel):
    """Modelo base para reservas."""
    fecha_entrada: date
    fecha_salida: date
    num_huespedes: int = Field(default=1, ge=1)
    notas: Optional[str] = None


class ReservaCreate(BaseModel):
    """Modelo para crear reserva."""
    usuario_id: int
    habitacion_id: int
    fecha_entrada: date
    fecha_salida: date
    num_huespedes: int = Field(default=1, ge=1)
    notas: Optional[str] = None


class ReservaUpdate(BaseModel):
    """Modelo para actualizar reserva."""
    fecha_entrada: Optional[date] = None
    fecha_salida: Optional[date] = None
    num_huespedes: Optional[int] = Field(default=None, ge=1)
    notas: Optional[str] = None


class ReservaEstado(BaseModel):
    """Modelo para cambiar estado de reserva."""
    estado: EstadoReserva
    motivo: Optional[str] = None


class ClienteInfo(BaseModel):
    """Información del cliente."""
    id: int
    nombre: str
    email: str
    telefono: Optional[str] = None


class HabitacionInfo(BaseModel):
    """Información de la habitación."""
    id: int
    numero: str
    tipo: str
    piso: int
    precio_noche: float


class Reserva(ReservaBase):
    """Modelo completo de reserva."""
    id: int
    codigo_reserva: str
    usuario_id: int
    cliente_nombre: Optional[str] = None
    habitacion_id: int
    habitacion_numero: Optional[str] = None
    tipo_habitacion: Optional[str] = None
    precio_total: float
    estado: EstadoReserva = EstadoReserva.PENDIENTE
    cliente: Optional[ClienteInfo] = None
    habitacion: Optional[HabitacionInfo] = None
    num_noches: Optional[int] = None
    creado_por: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HistorialReserva(BaseModel):
    """Modelo para historial de reservas."""
    id: int
    accion: str
    detalles: Dict[str, Any]
    usuario_nombre: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    """Modelo para estadísticas del dashboard."""
    total_habitaciones: int
    habitaciones_disponibles: int
    habitaciones_ocupadas: int
    habitaciones_mantenimiento: int
    reservas_activas: int
    reservas_pendientes: int
    ingresos_mes: float
    total_usuarios: int

    class Config:
        from_attributes = True
