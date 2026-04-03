"""
URLs para el módulo de usuarios.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Usuarios
    path('', views.UsuarioListView.as_view(), name='usuario-list'),
    path('<int:pk>/', views.UsuarioDetailView.as_view(), name='usuario-detail'),
    path('create/', views.UsuarioCreateView.as_view(), name='usuario-create'),
    path('<int:pk>/update/', views.UsuarioUpdateView.as_view(), name='usuario-update'),
    path('<int:pk>/delete/', views.UsuarioDeleteView.as_view(), name='usuario-delete'),
    path('<int:pk>/cambiar-password/', views.CambiarPasswordView.as_view(), name='cambiar-password'),
    
    # Roles
    path('roles/', views.RolListView.as_view(), name='rol-list'),
    path('roles/<int:pk>/', views.RolDetailView.as_view(), name='rol-detail'),
    
    # Perfil
    path('perfil/', views.PerfilView.as_view(), name='perfil'),
]
