"""
Managers personalizados para el modelo Usuario.
"""
from django.contrib.auth.models import BaseUserManager
from django.db import models


class UsuarioManager(BaseUserManager):
    """
    Manager personalizado para el modelo Usuario.
    """

    def create_user(self, username, email, nombres, apellidos, password=None, **extra_fields):
        """
        Crea y guarda un usuario regular.
        """
        if not username:
            raise ValueError('El nombre de usuario es obligatorio')
        if not email:
            raise ValueError('El correo electrónico es obligatorio')
        if not nombres:
            raise ValueError('Los nombres son obligatorios')
        if not apellidos:
            raise ValueError('Los apellidos son obligatorios')

        email = self.normalize_email(email)
        
        # Asignar rol de cliente por defecto si no se especifica
        if 'rol' not in extra_fields or extra_fields['rol'] is None:
            from .models import Rol
            extra_fields['rol'], _ = Rol.objects.get_or_create(
                nombre='cliente',
                defaults={
                    'descripcion': 'Cliente del hotel para hacer reservas',
                    'permisos': ["reservas:own", "perfil:own"]
                }
            )

        user = self.model(
            username=username,
            email=email,
            nombres=nombres,
            apellidos=apellidos,
            **extra_fields
        )
        
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, nombres, apellidos, password=None, **extra_fields):
        """
        Crea y guarda un superusuario.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superusuario debe tener is_superuser=True.')

        # Asignar rol de admin
        from .models import Rol
        extra_fields['rol'], _ = Rol.objects.get_or_create(
            nombre='admin',
            defaults={
                'descripcion': 'Administrador del sistema con acceso total',
                'permisos': ["usuarios:all", "habitaciones:all", "reservas:all", "reportes:all", "config:all"]
            }
        )

        return self.create_user(username, email, nombres, apellidos, password, **extra_fields)

    def activos(self):
        """Retorna solo usuarios activos."""
        return self.filter(is_active=True)

    def por_rol(self, rol_nombre):
        """Filtra usuarios por nombre de rol."""
        return self.filter(rol__nombre=rol_nombre)
