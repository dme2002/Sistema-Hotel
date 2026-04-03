"""
Serializadores para el módulo de habitaciones.
"""
from rest_framework import serializers
from .models import TipoHabitacion, Habitacion


class TipoHabitacionSerializer(serializers.ModelSerializer):
    """
    Serializador para tipos de habitación.
    """
    class Meta:
        model = TipoHabitacion
        fields = [
            'id', 'nombre', 'descripcion', 'capacidad_maxima',
            'precio_base', 'amenities', 'created_at'
        ]
        read_only_fields = ['created_at']


class HabitacionListSerializer(serializers.ModelSerializer):
    """
    Serializador para listar habitaciones.
    """
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    capacidad_maxima = serializers.IntegerField(source='tipo.capacidad_maxima', read_only=True)
    amenities = serializers.JSONField(source='tipo.amenities', read_only=True)

    class Meta:
        model = Habitacion
        fields = [
            'id', 'numero', 'tipo', 'tipo_nombre', 'piso',
            'estado', 'precio_actual', 'capacidad_maxima',
            'amenities', 'descripcion', 'caracteristicas', 'activa'
        ]


class HabitacionDetailSerializer(serializers.ModelSerializer):
    """
    Serializador detallado para habitaciones.
    """
    tipo_detalle = TipoHabitacionSerializer(source='tipo', read_only=True)

    class Meta:
        model = Habitacion
        fields = [
            'id', 'numero', 'tipo', 'tipo_detalle', 'piso',
            'estado', 'precio_actual', 'descripcion',
            'caracteristicas', 'activa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HabitacionCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear habitaciones.
    """
    class Meta:
        model = Habitacion
        fields = [
            'numero', 'tipo', 'piso', 'precio_actual',
            'descripcion', 'caracteristicas'
        ]

    def validate_numero(self, value):
        """Valida que el número de habitación sea único."""
        if Habitacion.objects.filter(numero=value).exists():
            raise serializers.ValidationError('Ya existe una habitación con este número.')
        return value


class HabitacionUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar habitaciones.
    """
    class Meta:
        model = Habitacion
        fields = [
            'tipo', 'piso', 'estado', 'precio_actual',
            'descripcion', 'caracteristicas', 'activa'
        ]


class DisponibilidadSerializer(serializers.Serializer):
    """
    Serializador para consultar disponibilidad.
    """
    fecha_entrada = serializers.DateField(required=True)
    fecha_salida = serializers.DateField(required=True)
    capacidad = serializers.IntegerField(required=False, default=1, min_value=1)

    def validate(self, data):
        if data['fecha_entrada'] >= data['fecha_salida']:
            raise serializers.ValidationError({
                'fecha_salida': 'La fecha de salida debe ser posterior a la fecha de entrada.'
            })
        return data


class HabitacionDisponibleSerializer(serializers.ModelSerializer):
    """
    Serializador para habitaciones disponibles.
    """
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    capacidad_maxima = serializers.IntegerField(source='tipo.capacidad_maxima', read_only=True)
    amenities = serializers.JSONField(source='tipo.amenities', read_only=True)

    class Meta:
        model = Habitacion
        fields = [
            'id', 'numero', 'tipo_nombre', 'piso', 'precio_actual',
            'capacidad_maxima', 'amenities', 'descripcion', 'caracteristicas'
        ]
