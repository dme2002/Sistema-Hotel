"""
Serializadores para el módulo de reservas.
"""
from rest_framework import serializers
from django.db import connection
from django.utils import timezone
import uuid

from .models import Reserva, HistorialReserva
from apps.rooms.models import Habitacion
from apps.users.models import Usuario


class ReservaListSerializer(serializers.ModelSerializer):
    """
    Serializador para listar reservas.
    """
    cliente_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    habitacion_numero = serializers.CharField(source='habitacion.numero', read_only=True)
    tipo_habitacion = serializers.CharField(source='habitacion.tipo.nombre', read_only=True)
    num_noches = serializers.IntegerField(source='get_num_noches', read_only=True)

    class Meta:
        model = Reserva
        fields = [
            'id', 'codigo_reserva', 'cliente_nombre', 'habitacion_numero',
            'tipo_habitacion', 'fecha_entrada', 'fecha_salida', 'num_huespedes',
            'num_noches', 'precio_total', 'estado', 'created_at'
        ]


class ReservaDetailSerializer(serializers.ModelSerializer):
    """
    Serializador detallado para reservas.
    """
    cliente = serializers.SerializerMethodField()
    habitacion = serializers.SerializerMethodField()
    num_noches = serializers.IntegerField(source='get_num_noches', read_only=True)
    creado_por = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Reserva
        fields = [
            'id', 'codigo_reserva', 'cliente', 'habitacion',
            'fecha_entrada', 'fecha_salida', 'num_huespedes',
            'num_noches', 'precio_total', 'estado', 'notas',
            'creado_por', 'created_at', 'updated_at'
        ]

    def get_cliente(self, obj):
        return {
            'id': obj.usuario.id,
            'nombre': obj.usuario.get_full_name(),
            'email': obj.usuario.email,
            'telefono': obj.usuario.telefono
        }

    def get_habitacion(self, obj):
        return {
            'id': obj.habitacion.id,
            'numero': obj.habitacion.numero,
            'tipo': obj.habitacion.tipo.nombre,
            'piso': obj.habitacion.piso,
            'precio_noche': obj.habitacion.get_precio_noche()
        }


class ReservaCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear reservas.
    """
    usuario_id = serializers.IntegerField(required=True)
    habitacion_id = serializers.IntegerField(required=True)

    class Meta:
        model = Reserva
        fields = [
            'usuario_id', 'habitacion_id', 'fecha_entrada',
            'fecha_salida', 'num_huespedes', 'notas'
        ]

    def validate(self, data):
        # Validar fechas
        if data['fecha_entrada'] >= data['fecha_salida']:
            raise serializers.ValidationError({
                'fecha_salida': 'La fecha de salida debe ser posterior a la fecha de entrada.'
            })
        
        if data['fecha_entrada'] < timezone.now().date():
            raise serializers.ValidationError({
                'fecha_entrada': 'La fecha de entrada no puede ser en el pasado.'
            })

        # Validar que el usuario existe
        try:
            usuario = Usuario.objects.get(id=data['usuario_id'])
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({
                'usuario_id': 'El usuario no existe.'
            })

        # Validar que la habitación existe y está activa
        try:
            habitacion = Habitacion.objects.get(id=data['habitacion_id'], activa=True)
        except Habitacion.DoesNotExist:
            raise serializers.ValidationError({
                'habitacion_id': 'La habitación no existe o no está activa.'
            })

        # Validar capacidad
        if data['num_huespedes'] > habitacion.tipo.capacidad_maxima:
            raise serializers.ValidationError({
                'num_huespedes': f'La habitación tiene capacidad máxima de {habitacion.tipo.capacidad_maxima} huéspedes.'
            })

        # Verificar disponibilidad usando stored procedure
        with connection.cursor() as cursor:
            cursor.callproc('sp_verificar_disponibilidad', [
                habitacion.id,
                data['fecha_entrada'],
                data['fecha_salida'],
                None
            ])
            result = cursor.fetchone()
            if not result or not result[0]:
                raise serializers.ValidationError({
                    'habitacion_id': 'La habitación no está disponible para las fechas seleccionadas.'
                })

        return data

    def create(self, validated_data):
        usuario_id = validated_data.pop('usuario_id')
        habitacion_id = validated_data.pop('habitacion_id')
        
        usuario = Usuario.objects.get(id=usuario_id)
        habitacion = Habitacion.objects.get(id=habitacion_id)
        
        # Calcular precio total usando stored procedure
        with connection.cursor() as cursor:
            cursor.callproc('sp_calcular_precio', [
                habitacion.id,
                validated_data['fecha_entrada'],
                validated_data['fecha_salida'],
                0  # OUT parameter
            ])
            # Obtener el resultado del OUT parameter
            cursor.execute("SELECT @_sp_calcular_precio_3")
            precio_total = cursor.fetchone()[0]
        
        # Generar código de reserva único
        codigo = f"RES-{uuid.uuid4().hex[:8].upper()}"
        
        reserva = Reserva.objects.create(
            codigo_reserva=codigo,
            usuario=usuario,
            habitacion=habitacion,
            precio_total=precio_total or habitacion.get_precio_noche(),
            created_by=self.context.get('request').user if self.context.get('request') else None,
            **validated_data
        )
        
        # Registrar en historial
        HistorialReserva.objects.create(
            reserva=reserva,
            accion='creacion',
            detalles={'mensaje': 'Reserva creada'},
            usuario=self.context.get('request').user if self.context.get('request') else None
        )
        
        return reserva


class ReservaUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar reservas.
    """
    class Meta:
        model = Reserva
        fields = ['fecha_entrada', 'fecha_salida', 'num_huespedes', 'notas']

    def validate(self, data):
        instance = self.instance
        
        # No permitir modificar reservas canceladas o con check-out
        if instance.estado in ['cancelada', 'check_out']:
            raise serializers.ValidationError(
                'No se puede modificar una reserva cancelada o con check-out realizado.'
            )

        fecha_entrada = data.get('fecha_entrada', instance.fecha_entrada)
        fecha_salida = data.get('fecha_salida', instance.fecha_salida)

        if fecha_entrada >= fecha_salida:
            raise serializers.ValidationError({
                'fecha_salida': 'La fecha de salida debe ser posterior a la fecha de entrada.'
            })

        return data


class ReservaEstadoSerializer(serializers.Serializer):
    """
    Serializador para cambiar estado de reserva.
    """
    estado = serializers.ChoiceField(choices=Reserva.ESTADO_CHOICES)
    motivo = serializers.CharField(required=False, allow_blank=True)


class HistorialReservaSerializer(serializers.ModelSerializer):
    """
    Serializador para historial de reservas.
    """
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)

    class Meta:
        model = HistorialReserva
        fields = ['id', 'accion', 'detalles', 'usuario_nombre', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializador para estadísticas del dashboard.
    """
    total_habitaciones = serializers.IntegerField()
    habitaciones_disponibles = serializers.IntegerField()
    habitaciones_ocupadas = serializers.IntegerField()
    habitaciones_mantenimiento = serializers.IntegerField()
    reservas_activas = serializers.IntegerField()
    reservas_pendientes = serializers.IntegerField()
    ingresos_mes = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_usuarios = serializers.IntegerField()
