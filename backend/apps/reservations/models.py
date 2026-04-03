"""
Modelos para gestión de reservas.
"""
from django.db import models
from django.utils import timezone
from apps.core.models import TimeStampedModel


class Reserva(TimeStampedModel):
    """
    Modelo para reservas de habitaciones.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('check_in', 'Check-in realizado'),
        ('check_out', 'Check-out realizado'),
        ('cancelada', 'Cancelada'),
    ]

    codigo_reserva = models.CharField(max_length=20, unique=True, verbose_name='Código de reserva')
    usuario = models.ForeignKey(
        'users.Usuario',
        on_delete=models.PROTECT,
        db_column='usuario_id',
        verbose_name='Usuario'
    )
    habitacion = models.ForeignKey(
        'rooms.Habitacion',
        on_delete=models.PROTECT,
        db_column='habitacion_id',
        verbose_name='Habitación'
    )
    fecha_entrada = models.DateField(verbose_name='Fecha de entrada')
    fecha_salida = models.DateField(verbose_name='Fecha de salida')
    num_huespedes = models.PositiveIntegerField(default=1, verbose_name='Número de huéspedes')
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio total')
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado'
    )
    notas = models.TextField(blank=True, verbose_name='Notas')
    created_by = models.ForeignKey(
        'users.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reservas_creadas',
        db_column='created_by',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'reservas'
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.codigo_reserva} - {self.usuario.get_full_name()}"

    def get_num_noches(self):
        """Calcula el número de noches de la reserva."""
        return (self.fecha_salida - self.fecha_entrada).days

    def puede_cancelar(self):
        """Verifica si la reserva puede ser cancelada."""
        return self.estado in ['pendiente', 'confirmada']

    def puede_check_in(self):
        """Verifica si se puede realizar check-in."""
        return self.estado == 'confirmada' and self.fecha_entrada <= timezone.now().date()

    def puede_check_out(self):
        """Verifica si se puede realizar check-out."""
        return self.estado == 'check_in'


class HistorialReserva(TimeStampedModel):
    """
    Modelo para historial de cambios en reservas.
    """
    reserva = models.ForeignKey(
        Reserva,
        on_delete=models.CASCADE,
        db_column='reserva_id',
        verbose_name='Reserva'
    )
    accion = models.CharField(max_length=50, verbose_name='Acción')
    detalles = models.JSONField(default=dict, blank=True, verbose_name='Detalles')
    usuario = models.ForeignKey(
        'users.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='usuario_id',
        verbose_name='Usuario'
    )

    class Meta:
        db_table = 'historial_reservas'
        verbose_name = 'Historial de reserva'
        verbose_name_plural = 'Historial de reservas'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reserva.codigo_reserva} - {self.accion}"
