"""
Configuración del admin para habitaciones.
"""
from django.contrib import admin
from .models import TipoHabitacion, Habitacion


@admin.register(TipoHabitacion)
class TipoHabitacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'capacidad_maxima', 'precio_base', 'created_at')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('capacidad_maxima',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Habitacion)
class HabitacionAdmin(admin.ModelAdmin):
    list_display = ('numero', 'tipo', 'piso', 'estado', 'precio_actual', 'activa')
    list_filter = ('estado', 'piso', 'tipo', 'activa')
    search_fields = ('numero', 'descripcion')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('estado', 'activa')
    
    fieldsets = (
        (None, {'fields': ('numero', 'tipo', 'piso')}),
        ('Detalles', {'fields': ('estado', 'precio_actual', 'descripcion')}),
        ('Características', {'fields': ('caracteristicas',)}),
        ('Estado', {'fields': ('activa',)}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )
