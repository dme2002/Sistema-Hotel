"""
Serializadores para el módulo de usuarios.
"""
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Rol, Usuario, Sesion


class RolSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Rol.
    """
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'permisos', 'created_at']
        read_only_fields = ['created_at']


class UsuarioListSerializer(serializers.ModelSerializer):
    """
    Serializador para listar usuarios.
    """
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    nombre_completo = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'nombres', 'apellidos', 
            'nombre_completo', 'telefono', 'rol', 'rol_nombre',
            'is_active', 'last_login', 'created_at'
        ]
        read_only_fields = ['last_login', 'created_at']


class UsuarioDetailSerializer(serializers.ModelSerializer):
    """
    Serializador detallado para usuarios.
    """
    rol_detalle = RolSerializer(source='rol', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'nombres', 'apellidos',
            'telefono', 'rol', 'rol_detalle', 'is_active',
            'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['last_login', 'created_at', 'updated_at']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear usuarios.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    confirmar_password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'nombres', 'apellidos',
            'telefono', 'rol', 'password', 'confirmar_password'
        ]

    def validate(self, data):
        """Valida que las contraseñas coincidan."""
        if data['password'] != data['confirmar_password']:
            raise serializers.ValidationError({
                'confirmar_password': 'Las contraseñas no coinciden.'
            })
        return data

    def create(self, validated_data):
        """Crea el usuario con contraseña hasheada."""
        validated_data.pop('confirmar_password')
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar usuarios.
    """
    class Meta:
        model = Usuario
        fields = [
            'nombres', 'apellidos', 'telefono', 
            'rol', 'is_active'
        ]


class CambioPasswordSerializer(serializers.Serializer):
    """
    Serializador para cambio de contraseña.
    """
    password_actual = serializers.CharField(required=True, write_only=True)
    nuevo_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirmar_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data['nuevo_password'] != data['confirmar_password']:
            raise serializers.ValidationError({
                'confirmar_password': 'Las contraseñas no coinciden.'
            })
        return data


class SesionSerializer(serializers.ModelSerializer):
    """
    Serializador para sesiones.
    """
    username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Sesion
        fields = ['id', 'username', 'ip_address', 'created_at', 'expires_at', 'activa']
        read_only_fields = ['created_at']


class LoginSerializer(serializers.Serializer):
    """
    Serializador para login.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class RegistroSerializer(serializers.ModelSerializer):
    """
    Serializador para registro de clientes.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    confirmar_password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['username', 'email', 'nombres', 'apellidos', 'telefono', 'password', 'confirmar_password']

    def validate(self, data):
        if data['password'] != data['confirmar_password']:
            raise serializers.ValidationError({
                'confirmar_password': 'Las contraseñas no coinciden.'
            })
        return data

    def create(self, validated_data):
        validated_data.pop('confirmar_password')
        validated_data['password'] = make_password(validated_data['password'])
        # El rol de cliente se asigna automáticamente en el manager
        return Usuario.objects.create_user(**validated_data)
