"""
URLs para el módulo de habitaciones.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Tipos de habitación
    path('tipos/', views.TipoHabitacionListView.as_view(), name='tipo-list'),
    path('tipos/<int:pk>/', views.TipoHabitacionDetailView.as_view(), name='tipo-detail'),
    
    # Habitaciones
    path('', views.HabitacionListView.as_view(), name='habitacion-list'),
    path('<int:pk>/', views.HabitacionDetailView.as_view(), name='habitacion-detail'),
    path('create/', views.HabitacionCreateView.as_view(), name='habitacion-create'),
    path('<int:pk>/update/', views.HabitacionUpdateView.as_view(), name='habitacion-update'),
    path('<int:pk>/delete/', views.HabitacionDeleteView.as_view(), name='habitacion-delete'),
    
    # Disponibilidad
    path('disponibles/', views.HabitacionesDisponiblesView.as_view(), name='habitaciones-disponibles'),
    path('<int:pk>/disponibilidad/', views.VerificarDisponibilidadView.as_view(), name='verificar-disponibilidad'),
]
