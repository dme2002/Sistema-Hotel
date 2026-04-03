"""
Vistas para el módulo de usuarios.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password, make_password
from django.shortcuts import get_object_or_404

from .models import Rol, Usuario
from .serializers import (
    RolSerializer, UsuarioListSerializer, UsuarioDetailSerializer,
    UsuarioCreateSerializer, UsuarioUpdateSerializer, CambioPasswordSerializer
)


class IsAdminUser(permissions.BasePermission):
    """
    Permiso que solo permite acceso a administradores.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.es_admin()


class IsAdminOrRecepcionista(permissions.BasePermission):
    """
    Permiso que permite acceso a administradores y recepcionistas.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.es_admin() or request.user.es_recepcionista()


# ==================== VISTAS DE ROLES ====================

class RolListView(generics.ListAPIView):
    """
    Lista todos los roles disponibles.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAuthenticated]


class RolDetailView(generics.RetrieveAPIView):
    """
    Obtiene detalles de un rol específico.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAuthenticated]


# ==================== VISTAS DE USUARIOS ====================

class UsuarioListView(generics.ListAPIView):
    """
    Lista todos los usuarios con filtros opcionales.
    """
    serializer_class = UsuarioListSerializer
    permission_classes = [IsAdminOrRecepcionista]

    def get_queryset(self):
        queryset = Usuario.objects.all()
        
        # Filtros
        rol = self.request.query_params.get('rol')
        activo = self.request.query_params.get('activo')
        search = self.request.query_params.get('search')
        
        if rol:
            queryset = queryset.filter(rol__nombre=rol)
        if activo is not None:
            queryset = queryset.filter(is_active=activo.lower() == 'true')
        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(nombres__icontains=search) |
                models.Q(apellidos__icontains=search)
            )
        
        return queryset.order_by('-created_at')


class UsuarioDetailView(generics.RetrieveAPIView):
    """
    Obtiene detalles de un usuario específico.
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioDetailSerializer
    permission_classes = [IsAdminOrRecepcionista]


class UsuarioCreateView(generics.CreateAPIView):
    """
    Crea un nuevo usuario.
    """
    serializer_class = UsuarioCreateSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'status': 'success',
            'message': 'Usuario creado exitosamente',
            'data': UsuarioDetailSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class UsuarioUpdateView(generics.UpdateAPIView):
    """
    Actualiza un usuario existente.
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioUpdateSerializer
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'status': 'success',
            'message': 'Usuario actualizado exitosamente',
            'data': UsuarioDetailSerializer(instance).data
        })


class UsuarioDeleteView(APIView):
    """
    Desactiva un usuario (eliminación lógica).
    """
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        user = get_object_or_404(Usuario, pk=pk)
        
        # No permitir eliminar el propio usuario
        if user == request.user:
            return Response({
                'status': 'error',
                'message': 'No puede eliminar su propio usuario'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_active = False
        user.save(update_fields=['is_active'])
        
        return Response({
            'status': 'success',
            'message': 'Usuario desactivado exitosamente'
        })


class CambiarPasswordView(APIView):
    """
    Cambia la contraseña de un usuario.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(Usuario, pk=pk)
        serializer = CambioPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Verificar password actual si no es admin cambiando otro usuario
            if user != request.user:
                # Admin puede cambiar sin verificar password actual
                user.password = make_password(serializer.validated_data['nuevo_password'])
                user.save(update_fields=['password'])
                return Response({
                    'status': 'success',
                    'message': 'Contraseña actualizada exitosamente'
                })
            
            # Usuario cambiando su propia contraseña
            if check_password(serializer.validated_data['password_actual'], user.password):
                user.password = make_password(serializer.validated_data['nuevo_password'])
                user.save(update_fields=['password'])
                return Response({
                    'status': 'success',
                    'message': 'Contraseña actualizada exitosamente'
                })
            else:
                return Response({
                    'status': 'error',
                    'message': 'Contraseña actual incorrecta'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'status': 'error',
            'message': 'Datos inválidos',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== VISTA DE PERFIL ====================

class PerfilView(APIView):
    """
    Obtiene y actualiza el perfil del usuario autenticado.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioDetailSerializer(request.user)
        return Response({
            'status': 'success',
            'data': serializer.data
        })

    def patch(self, request):
        # Solo permitir actualizar ciertos campos
        allowed_fields = ['nombres', 'apellidos', 'telefono']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = UsuarioUpdateSerializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'status': 'success',
                'message': 'Perfil actualizado exitosamente',
                'data': UsuarioDetailSerializer(request.user).data
            })
        
        return Response({
            'status': 'error',
            'message': 'Datos inválidos',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
