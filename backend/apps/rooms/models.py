"""
Modelos para gestión de habitaciones.
"""
from django.db import models
from apps.core.models import TimeStampedModel


class TipoHabitacion(TimeStampedModel):
    """
    Modelo para tipos de habitación.
    """
    nombre = models.CharField(max_length=50, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    capacidad_maxima = models.PositiveIntegerField(default=2, verbose_name='Capacidad máxima')
    precio_base = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio base')
    amenities = models.JSONField(default=list, blank=True, verbose_name='Amenities')

    class Meta:
        db_table = 'tipos_habitacion'
        verbose_name = 'Tipo de habitación'
        verbose_name_plural = 'Tipos de habitación'
        ordering = ['precio_base']

    def __str__(self):
        return f"{self.nombre} (Cap: {self.capacidad_maxima})"


class Habitacion(TimeStampedModel):
    """
    Modelo para habitaciones del hotel.
    """
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('ocupada', 'Ocupada'),
        ('mantenimiento', 'En mantenimiento'),
        ('limpieza', 'En limpieza'),
    ]

    numero = models.CharField(max_length=10, unique=True, verbose_name='Número')
    tipo = models.ForeignKey(
        TipoHabitacion, 
        on_delete=models.PROTECT,
        db_column='tipo_id',
        verbose_name='Tipo'
    )
    piso = models.PositiveIntegerField(default=1, verbose_name='Piso')
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='disponible',
        verbose_name='Estado'
    )
    precio_actual = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio actual')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    caracteristicas = models.JSONField(default=dict, blank=True, verbose_name='Características')
    activa = models.BooleanField(default=True, verbose_name='Activa')

    class Meta:
        db_table = 'habitaciones'
        verbose_name = 'Habitación'
        verbose_name_plural = 'Habitaciones'
        ordering = ['piso', 'numero']

    def __str__(self):
        return f"Habitación {self.numero} - {self.tipo.nombre}"

    def esta_disponible(self, fecha_entrada, fecha_salida, excluir_reserva_id=None):
        """
        Verifica si la habitación está disponible para un rango de fechas.
        """
        from apps.reservations.models import Reserva
        
        queryset = Reserva.objects.filter(
            habitacion=self,
            estado__in=['pendiente', 'confirmada', 'check_in']
        ).filter(
            models.Q(fecha_entrada__range=(fecha_entrada, fecha_salida)) |
            models.Q(fecha_salida__range=(fecha_entrada, fecha_salida)) |
            models.Q(fecha_entrada__lte=fecha_entrada, fecha_salida__gte=fecha_salida)
        )
        
        if excluir_reserva_id:
            queryset = queryset.exclude(id=excluir_reserva_id)
        
        return not queryset.exists()

    def get_precio_noche(self):
        """Retorna el precio por noche."""
        return self.precio_actual or self.tipo.precio_base
