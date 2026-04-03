"""
Vistas para el módulo de habitaciones.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import connection
from datetime import datetime

from .models import TipoHabitacion, Habitacion
from .serializers import (
    TipoHabitacionSerializer, HabitacionListSerializer,
    HabitacionDetailSerializer, HabitacionCreateSerializer,
    HabitacionUpdateSerializer, DisponibilidadSerializer,
    HabitacionDisponibleSerializer
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


# ==================== VISTAS DE TIPOS DE HABITACIÓN ====================

class TipoHabitacionListView(generics.ListAPIView):
    """Lista todos los tipos de habitación."""
    queryset = TipoHabitacion.objects.all()
    serializer_class = TipoHabitacionSerializer
    permission_classes = [permissions.IsAuthenticated]


class TipoHabitacionDetailView(generics.RetrieveAPIView):
    """Obtiene detalles de un tipo de habitación."""
    queryset = TipoHabitacion.objects.all()
    serializer_class = TipoHabitacionSerializer
    permission_classes = [permissions.IsAuthenticated]


# ==================== VISTAS DE HABITACIONES ====================

class HabitacionListView(generics.ListAPIView):
    """Lista todas las habitaciones con filtros."""
    serializer_class = HabitacionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Habitacion.objects.all()
        
        # Filtros
        estado = self.request.query_params.get('estado')
        piso = self.request.query_params.get('piso')
        tipo = self.request.query_params.get('tipo')
        activa = self.request.query_params.get('activa')
        capacidad = self.request.query_params.get('capacidad')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if piso:
            queryset = queryset.filter(piso=piso)
        if tipo:
            queryset = queryset.filter(tipo_id=tipo)
        if activa is not None:
            queryset = queryset.filter(activa=activa.lower() == 'true')
        if capacidad:
            queryset = queryset.filter(tipo__capacidad_maxima__gte=int(capacidad))
        
        return queryset.select_related('tipo').order_by('piso', 'numero')


class HabitacionDetailView(generics.RetrieveAPIView):
    """Obtiene detalles de una habitación."""
    queryset = Habitacion.objects.all()
    serializer_class = HabitacionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class HabitacionCreateView(generics.CreateAPIView):
    """Crea una nueva habitación."""
    serializer_class = HabitacionCreateSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        habitacion = serializer.save()
        
        return Response({
            'status': 'success',
            'message': 'Habitación creada exitosamente',
            'data': HabitacionDetailSerializer(habitacion).data
        }, status=status.HTTP_201_CREATED)


class HabitacionUpdateView(generics.UpdateAPIView):
    """Actualiza una habitación existente."""
    queryset = Habitacion.objects.all()
    serializer_class = HabitacionUpdateSerializer
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'status': 'success',
            'message': 'Habitación actualizada exitosamente',
            'data': HabitacionDetailSerializer(instance).data
        })


class HabitacionDeleteView(APIView):
    """Desactiva una habitación (eliminación lógica)."""
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        habitacion = get_object_or_404(Habitacion, pk=pk)
        habitacion.activa = False
        habitacion.save(update_fields=['activa'])
        
        return Response({
            'status': 'success',
            'message': 'Habitación desactivada exitosamente'
        })


# ==================== VISTAS DE DISPONIBILIDAD ====================

class HabitacionesDisponiblesView(APIView):
    """Obtiene habitaciones disponibles para un rango de fechas."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = DisponibilidadSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': 'Datos inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Usar stored procedure
        with connection.cursor() as cursor:
            cursor.callproc('sp_habitaciones_disponibles', [
                data['fecha_entrada'],
                data['fecha_salida'],
                data.get('capacidad', 1)
            ])
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return Response({
            'status': 'success',
            'data': {
                'fecha_entrada': data['fecha_entrada'],
                'fecha_salida': data['fecha_salida'],
                'habitaciones': results
            }
        })


class VerificarDisponibilidadView(APIView):
    """Verifica si una habitación específica está disponible."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        habitacion = get_object_or_404(Habitacion, pk=pk)
        
        serializer = DisponibilidadSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': 'Datos inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Usar stored procedure
        with connection.cursor() as cursor:
            cursor.callproc('sp_verificar_disponibilidad', [
                habitacion.id,
                data['fecha_entrada'],
                data['fecha_salida'],
                None  # reserva_id para excluir
            ])
            result = cursor.fetchone()
            disponible = result[0] if result else False
        
        return Response({
            'status': 'success',
            'data': {
                'habitacion_id': habitacion.id,
                'numero': habitacion.numero,
                'disponible': bool(disponible),
                'fecha_entrada': data['fecha_entrada'],
                'fecha_salida': data['fecha_salida']
            }
        })
