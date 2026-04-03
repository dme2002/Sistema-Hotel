"""
Modelos de usuarios para el sistema hotelero.
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator

from apps.core.models import TimeStampedModel
from .managers import UsuarioManager


class Rol(TimeStampedModel):
    """
    Modelo para roles de usuario.
    """
    nombre = models.CharField(max_length=50, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    permisos = models.JSONField(default=list, blank=True, verbose_name='Permisos')

    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Usuario(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Modelo de usuario personalizado para el sistema hotelero.
    """
    # Validador para teléfono
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="El número de teléfono debe estar en formato: '+999999999'. Hasta 15 dígitos."
    )
    username = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name='Nombre de usuario',
        validators=[RegexValidator(
            regex=r'^[\w.@+-]+$',
            message='Solo letras, números y @/./+/-/_'
        )]
    )
    email = models.EmailField(unique=True, verbose_name='Correo electrónico')
    nombres = models.CharField(max_length=100, verbose_name='Nombres')
    apellidos = models.CharField(max_length=100, verbose_name='Apellidos')
    telefono = models.CharField(
        max_length=20, 
        blank=True, 
        validators=[phone_regex],
        verbose_name='Teléfono'
    )
    rol = models.ForeignKey(
        Rol, 
        on_delete=models.PROTECT, 
        db_column='rol_id',
        verbose_name='Rol'
    )
    
    # Campos de estado
    is_active = models.BooleanField(default=True, db_column='activo', verbose_name='Activo')
    is_staff = models.BooleanField(default=False, verbose_name='Staff')

    objects = UsuarioManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'nombres', 'apellidos']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.username})"

    def get_full_name(self):
        """Retorna el nombre completo del usuario."""
        return f"{self.nombres} {self.apellidos}".strip()

    def get_short_name(self):
        """Retorna el nombre corto del usuario."""
        return self.nombres

    def tiene_permiso(self, permiso):
        """Verifica si el usuario tiene un permiso específico."""
        if self.rol and self.rol.permisos:
            return permiso in self.rol.permisos
        return False

    def es_admin(self):
        """Verifica si el usuario es administrador."""
        return self.rol.nombre == 'admin' if self.rol else False

    def es_recepcionista(self):
        """Verifica si el usuario es recepcionista."""
        return self.rol.nombre == 'recepcionista' if self.rol else False

    def es_cliente(self):
        """Verifica si el usuario es cliente."""
        return self.rol.nombre == 'cliente' if self.rol else False


class Sesion(TimeStampedModel):
    """
    Modelo para gestionar sesiones de usuario.
    """
    usuario = models.ForeignKey(
        Usuario, 
        on_delete=models.CASCADE,
        db_column='usuario_id',
        verbose_name='Usuario'
    )
    token_jti = models.CharField(max_length=255, unique=True, verbose_name='Token JTI')
    refresh_token = models.CharField(max_length=255, verbose_name='Refresh Token')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='Dirección IP')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')
    expires_at = models.DateTimeField(verbose_name='Expira en')
    ultima_actividad = models.DateTimeField(default=timezone.now, verbose_name='Última actividad')
    activa = models.BooleanField(default=True, verbose_name='Activa')

    class Meta:
        db_table = 'sesiones'
        verbose_name = 'Sesión'
        verbose_name_plural = 'Sesiones'
        ordering = ['-created_at']

    def __str__(self):
        return f"Sesión de {self.usuario.username} - {self.created_at}"

    def esta_activa(self):
        """Verifica si la sesión está activa y no ha expirado."""
        return self.activa and self.expires_at > timezone.now()

    def cerrar(self):
        """Cierra la sesión."""
        self.activa = False
        self.save(update_fields=['activa', 'updated_at'])
