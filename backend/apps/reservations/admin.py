"""
Configuración del admin para reservas.
"""
from django.contrib import admin
from .models import Reserva, HistorialReserva


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ('codigo_reserva', 'usuario', 'habitacion', 'fecha_entrada', 'fecha_salida', 'estado', 'precio_total')
    list_filter = ('estado', 'fecha_entrada', 'created_at')
    search_fields = ('codigo_reserva', 'usuario__username', 'usuario__nombres', 'usuario__apellidos', 'habitacion__numero')
    readonly_fields = ('created_at', 'updated_at', 'codigo_reserva')
    date_hierarchy = 'fecha_entrada'
    
    fieldsets = (
        (None, {'fields': ('codigo_reserva',)}),
        ('Cliente', {'fields': ('usuario',)}),
        ('Habitación', {'fields': ('habitacion',)}),
        ('Fechas', {'fields': ('fecha_entrada', 'fecha_salida', 'num_huespedes')}),
        ('Pago', {'fields': ('precio_total',)}),
        ('Estado', {'fields': ('estado', 'notas')}),
        ('Metadatos', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )


@admin.register(HistorialReserva)
class HistorialReservaAdmin(admin.ModelAdmin):
    list_display = ('reserva', 'accion', 'usuario', 'created_at')
    list_filter = ('accion', 'created_at')
    search_fields = ('reserva__codigo_reserva', 'accion')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
