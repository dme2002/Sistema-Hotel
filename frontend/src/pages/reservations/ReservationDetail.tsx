import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Ban,
} from 'lucide-react';
import { reservationService } from '@/services/api';
import type { Reservation } from '@/types';
import { useAuthStore } from '@/store/authStore';

const ReservationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isRecepcionista } = useAuthStore();
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadReservation(parseInt(id));
    }
  }, [id]);

  const loadReservation = async (reservationId: number) => {
    try {
      const response = await reservationService.getById(reservationId);
      setReservation(response.data.data);
    } catch (error) {
      console.error('Error loading reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!reservation) return;
    
    try {
      await reservationService.changeStatus(reservation.id, newStatus);
      loadReservation(reservation.id);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleCancel = async () => {
    if (!reservation || !confirm('¿Está seguro de cancelar esta reserva?')) return;
    
    try {
      await reservationService.cancel(reservation.id);
      loadReservation(reservation.id);
    } catch (error) {
      console.error('Error canceling reservation:', error);
    }
  };

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      pendiente: 'badge-yellow',
      confirmada: 'badge-blue',
      check_in: 'badge-green',
      check_out: 'badge-gray',
      cancelada: 'badge-red',
    };
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      check_in: 'Check-in Realizado',
      check_out: 'Check-out Realizado',
      cancelada: 'Cancelada',
    };
    return <span className={styles[estado] || 'badge-gray'}>{labels[estado]}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Reserva no encontrada
        </h2>
        <Link to="/reservations" className="text-primary-600 hover:underline mt-2">
          Volver a reservas
        </Link>
      </div>
    );
  }

  const canEdit = isAdmin() || isRecepcionista();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/reservations"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reserva {reservation.codigo_reserva}
            </h1>
            <p className="text-gray-500">Detalles de la reserva</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(reservation.estado)}
        </div>
      </div>

      {/* Actions */}
      {canEdit && reservation.estado !== 'cancelada' && reservation.estado !== 'check_out' && (
        <div className="card p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {reservation.estado === 'pendiente' && (
              <>
                <button
                  onClick={() => handleChangeStatus('confirmada')}
                  className="btn-success flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-danger flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar
                </button>
              </>
            )}
            {reservation.estado === 'confirmada' && (
              <>
                <button
                  onClick={() => handleChangeStatus('check_in')}
                  className="btn-primary flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Check-in
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-danger flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar
                </button>
              </>
            )}
            {reservation.estado === 'check_in' && (
              <button
                onClick={() => handleChangeStatus('check_out')}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Check-out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservation Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Información de la Reserva
            </h3>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Código</p>
                <p className="font-medium text-gray-900">
                  {reservation.codigo_reserva}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <div className="mt-1">{getStatusBadge(reservation.estado)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Entrada</p>
                <p className="font-medium text-gray-900">
                  {reservation.fecha_entrada}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Salida</p>
                <p className="font-medium text-gray-900">
                  {reservation.fecha_salida}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Noches</p>
                <p className="font-medium text-gray-900">
                  {reservation.num_noches}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Huéspedes</p>
                <p className="font-medium text-gray-900">
                  {reservation.num_huespedes}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Precio Total</p>
              <p className="text-2xl font-bold text-primary-600">
                ${reservation.precio_total}
              </p>
            </div>
            
            {reservation.notas && (
              <div>
                <p className="text-sm text-gray-500">Notas</p>
                <p className="text-gray-900">{reservation.notas}</p>
              </div>
            )}
          </div>
        </div>

        {/* Client & Room Info */}
        <div className="space-y-6">
          {/* Client */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Información del Cliente
              </h3>
            </div>
            <div className="card-body">
              {reservation.cliente && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    {reservation.cliente.nombre}
                  </p>
                  <p className="text-gray-500">{reservation.cliente.email}</p>
                  {reservation.cliente.telefono && (
                    <p className="text-gray-500">
                      {reservation.cliente.telefono}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Room */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Información de la Habitación
              </h3>
            </div>
            <div className="card-body">
              {reservation.habitacion && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    Habitación {reservation.habitacion.numero}
                  </p>
                  <p className="text-gray-500">{reservation.habitacion.tipo}</p>
                  <p className="text-gray-500">
                    Piso {reservation.habitacion.piso}
                  </p>
                  <p className="text-primary-600">
                    ${reservation.habitacion.precio_noche}/noche
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;
