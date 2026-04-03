"""
URLs para el módulo de reservas.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Reservas
    path('', views.ReservaListView.as_view(), name='reserva-list'),
    path('<int:pk>/', views.ReservaDetailView.as_view(), name='reserva-detail'),
    path('create/', views.ReservaCreateView.as_view(), name='reserva-create'),
    path('<int:pk>/update/', views.ReservaUpdateView.as_view(), name='reserva-update'),
    path('<int:pk>/estado/', views.ReservaCambiarEstadoView.as_view(), name='reserva-estado'),
    path('<int:pk>/cancelar/', views.ReservaCancelarView.as_view(), name='reserva-cancelar'),
    path('<int:pk>/historial/', views.ReservaHistorialView.as_view(), name='reserva-historial'),
    
    # Dashboard
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/mis-reservas/', views.MisReservasView.as_view(), name='mis-reservas'),
]
