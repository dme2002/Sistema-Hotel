"""
Vistas para el módulo de reservas.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import connection
from django.utils import timezone

from .models import Reserva, HistorialReserva
from .serializers import (
    ReservaListSerializer, ReservaDetailSerializer,
    ReservaCreateSerializer, ReservaUpdateSerializer,
    ReservaEstadoSerializer, HistorialReservaSerializer,
    DashboardStatsSerializer
)


class IsAdminUser(permissions.BasePermission):
    """Permiso solo para administradores."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.es_admin()


class IsAdminOrRecepcionista(permissions.BasePermission):
    """Permiso para administradores y recepcionistas."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.es_admin() or request.user.es_recepcionista()


# ==================== VISTAS DE RESERVAS ====================

class ReservaListView(generics.ListAPIView):
    """Lista todas las reservas con filtros."""
    serializer_class = ReservaListSerializer
    permission_classes = [IsAdminOrRecepcionista]

    def get_queryset(self):
        queryset = Reserva.objects.all()
        
        # Filtros
        estado = self.request.query_params.get('estado')
        usuario = self.request.query_params.get('usuario')
        habitacion = self.request.query_params.get('habitacion')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if usuario:
            queryset = queryset.filter(usuario_id=usuario)
        if habitacion:
            queryset = queryset.filter(habitacion_id=habitacion)
        if fecha_desde:
            queryset = queryset.filter(fecha_entrada__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_salida__lte=fecha_hasta)
        
        return queryset.select_related('usuario', 'habitacion', 'habitacion__tipo')


class ReservaDetailView(generics.RetrieveAPIView):
    """Obtiene detalles de una reserva."""
    queryset = Reserva.objects.all()
    serializer_class = ReservaDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        # Clientes solo pueden ver sus propias reservas
        if self.request.user.es_cliente() and obj.usuario != self.request.user:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("No tiene permiso para ver esta reserva.")
        return obj


class ReservaCreateView(generics.CreateAPIView):
    """Crea una nueva reserva."""
    serializer_class = ReservaCreateSerializer
    permission_classes = [IsAdminOrRecepcionista]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reserva = serializer.save()
        
        return Response({
            'status': 'success',
            'message': 'Reserva creada exitosamente',
            'data': ReservaDetailSerializer(reserva).data
        }, status=status.HTTP_201_CREATED)


class ReservaUpdateView(generics.UpdateAPIView):
    """Actualiza una reserva existente."""
    queryset = Reserva.objects.all()
    serializer_class = ReservaUpdateSerializer
    permission_classes = [IsAdminOrRecepcionista]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Registrar en historial
        HistorialReserva.objects.create(
            reserva=instance,
            accion='modificacion',
            detalles={'campos_actualizados': list(request.data.keys())},
            usuario=request.user
        )

        return Response({
            'status': 'success',
            'message': 'Reserva actualizada exitosamente',
            'data': ReservaDetailSerializer(instance).data
        })


class ReservaCambiarEstadoView(APIView):
    """Cambia el estado de una reserva."""
    permission_classes = [IsAdminOrRecepcionista]

    def post(self, request, pk):
        reserva = get_object_or_404(Reserva, pk=pk)
        serializer = ReservaEstadoSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': 'Datos inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        nuevo_estado = serializer.validated_data['estado']
        motivo = serializer.validated_data.get('motivo', '')
        
        # Validar transiciones de estado
        transiciones_validas = {
            'pendiente': ['confirmada', 'cancelada'],
            'confirmada': ['check_in', 'cancelada'],
            'check_in': ['check_out'],
            'check_out': [],
            'cancelada': []
        }
        
        if nuevo_estado not in transiciones_validas.get(reserva.estado, []):
            return Response({
                'status': 'error',
                'message': f'No se puede cambiar de "{reserva.estado}" a "{nuevo_estado}"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        estado_anterior = reserva.estado
        reserva.estado = nuevo_estado
        reserva.save(update_fields=['estado', 'updated_at'])
        
        # Actualizar estado de habitación si es necesario
        if nuevo_estado == 'check_in':
            reserva.habitacion.estado = 'ocupada'
            reserva.habitacion.save(update_fields=['estado'])
        elif nuevo_estado == 'check_out':
            reserva.habitacion.estado = 'limpieza'
            reserva.habitacion.save(update_fields=['estado'])
        elif nuevo_estado == 'cancelada':
            reserva.habitacion.estado = 'disponible'
            reserva.habitacion.save(update_fields=['estado'])
        
        # Registrar en historial
        HistorialReserva.objects.create(
            reserva=reserva,
            accion='cambio_estado',
            detalles={
                'estado_anterior': estado_anterior,
                'estado_nuevo': nuevo_estado,
                'motivo': motivo
            },
            usuario=request.user
        )
        
        return Response({
            'status': 'success',
            'message': f'Estado actualizado a: {nuevo_estado}',
            'data': {'estado_anterior': estado_anterior, 'estado_nuevo': nuevo_estado}
        })


class ReservaCancelarView(APIView):
    """Cancela una reserva."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reserva = get_object_or_404(Reserva, pk=pk)
        
        # Clientes solo pueden cancelar sus propias reservas
        if request.user.es_cliente() and reserva.usuario != request.user:
            return Response({
                'status': 'error',
                'message': 'No tiene permiso para cancelar esta reserva'
            }, status=status.HTTP_403_FORBIDDEN)
        
        motivo = request.data.get('motivo', '')
        
        # Usar stored procedure
        with connection.cursor() as cursor:
            cursor.callproc('sp_cancelar_reserva', [reserva.id, request.user.id, motivo])
            result = cursor.fetchone()
            success = result[0] if result else False
            message = result[1] if result and len(result) > 1 else 'Operación completada'
        
        if success:
            # Actualizar estado de habitación
            reserva.habitacion.estado = 'disponible'
            reserva.habitacion.save(update_fields=['estado'])
            
            return Response({
                'status': 'success',
                'message': message
            })
        else:
            return Response({
                'status': 'error',
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)


class ReservaHistorialView(generics.ListAPIView):
    """Obtiene el historial de una reserva."""
    serializer_class = HistorialReservaSerializer
    permission_classes = [IsAdminOrRecepcionista]

    def get_queryset(self):
        reserva_id = self.kwargs['pk']
        return HistorialReserva.objects.filter(reserva_id=reserva_id)


# ==================== VISTAS DE DASHBOARD ====================

class DashboardStatsView(APIView):
    """Obtiene estadísticas para el dashboard."""
    permission_classes = [IsAdminOrRecepcionista]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.callproc('sp_dashboard_stats')
            columns = [col[0] for col in cursor.description]
            result = cursor.fetchone()
            stats = dict(zip(columns, result)) if result else {}
        
        return Response({
            'status': 'success',
            'data': stats
        })


class MisReservasView(generics.ListAPIView):
    """Obtiene las reservas del usuario autenticado."""
    serializer_class = ReservaListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reserva.objects.filter(
            usuario=self.request.user
        ).select_related('habitacion', 'habitacion__tipo').order_by('-created_at')
