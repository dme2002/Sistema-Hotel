"""
Modelos de habitaciones para Pydantic.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class EstadoHabitacion(str, Enum):
    """Enum para estados de habitación."""
    DISPONIBLE = "disponible"
    OCUPADA = "ocupada"
    MANTENIMIENTO = "mantenimiento"
    LIMPIEZA = "limpieza"


class TipoHabitacionBase(BaseModel):
    """Modelo base para tipos de habitación."""
    nombre: str
    descripcion: Optional[str] = None
    capacidad_maxima: int = Field(default=2, ge=1)
    precio_base: float = Field(default=0.0, ge=0)
    amenities: List[str] = []


class TipoHabitacion(TipoHabitacionBase):
    """Modelo completo de tipo de habitación."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class HabitacionBase(BaseModel):
    """Modelo base para habitaciones."""
    numero: str = Field(..., min_length=1, max_length=10)
    tipo_id: int
    piso: int = Field(default=1, ge=1)
    precio_actual: float = Field(default=0.0, ge=0)
    descripcion: Optional[str] = None
    caracteristicas: Dict[str, Any] = {}


class HabitacionCreate(HabitacionBase):
    """Modelo para crear habitación."""
    pass


class HabitacionUpdate(BaseModel):
    """Modelo para actualizar habitación."""
    numero: Optional[str] = Field(default=None, min_length=1, max_length=10)
    tipo_id: Optional[int] = None
    piso: Optional[int] = None
    estado: Optional[EstadoHabitacion] = None
    precio_actual: Optional[float] = None
    descripcion: Optional[str] = None
    caracteristicas: Optional[Dict[str, Any]] = None
    activa: Optional[bool] = None


class Habitacion(HabitacionBase):
    """Modelo completo de habitación."""
    id: int
    estado: EstadoHabitacion = EstadoHabitacion.DISPONIBLE
    tipo: Optional[TipoHabitacion] = None
    tipo_nombre: Optional[str] = None
    capacidad_maxima: Optional[int] = None
    amenities: Optional[List[str]] = None
    activa: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DisponibilidadRequest(BaseModel):
    """Modelo para consulta de disponibilidad."""
    fecha_entrada: date
    fecha_salida: date
    capacidad: int = Field(default=1, ge=1)

    class Config:
        json_schema_extra = {
            "example": {
                "fecha_entrada": "2024-01-15",
                "fecha_salida": "2024-01-20",
                "capacidad": 2
            }
        }


class DisponibilidadResponse(BaseModel):
    """Modelo para respuesta de disponibilidad."""
    fecha_entrada: date
    fecha_salida: date
    habitaciones: List[Habitacion]


class VerificacionDisponibilidad(BaseModel):
    """Modelo para verificación de disponibilidad."""
    habitacion_id: int
    numero: str
    disponible: bool
    fecha_entrada: date
    fecha_salida: date
