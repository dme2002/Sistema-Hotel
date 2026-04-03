"""
Configuración del admin para usuarios.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Rol, Usuario, Sesion


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion', 'created_at')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'get_full_name', 'rol', 'is_active', 'last_login')
    list_filter = ('is_active', 'rol', 'created_at', 'last_login')
    search_fields = ('username', 'email', 'nombres', 'apellidos', 'telefono')
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {'fields': ('nombres', 'apellidos', 'email', 'telefono')}),
        ('Permisos', {'fields': ('rol', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas importantes', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'nombres', 'apellidos', 'rol', 'password1', 'password2'),
        }),
    )

    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Nombre completo'


@admin.register(Sesion)
class SesionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ip_address', 'created_at', 'expires_at', 'activa')
    list_filter = ('activa', 'created_at')
    search_fields = ('usuario__username', 'usuario__email', 'ip_address')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
