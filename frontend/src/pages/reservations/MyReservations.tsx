import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Eye } from 'lucide-react';
import { reservationService } from '@/services/api';
import type { Reservation } from '@/types';

const MyReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await reservationService.getMyReservations();
      setReservations(response.data.data);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
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
      check_in: 'Check-in',
      check_out: 'Check-out',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
        <p className="text-gray-500">Historial de mis reservas</p>
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="card">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">{reservation.codigo_reserva}</p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Habitación {reservation.habitacion_numero}
                  </h3>
                </div>
                {getStatusBadge(reservation.estado)}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Entrada:</span>
                  <span className="text-gray-900">{reservation.fecha_entrada}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Salida:</span>
                  <span className="text-gray-900">{reservation.fecha_salida}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Huéspedes:</span>
                  <span className="text-gray-900">{reservation.num_huespedes}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-semibold text-primary-600">
                    ${reservation.precio_total}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/reservations/${reservation.id}`}
                  className="flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reservations.length === 0 && (
        <div className="text-center py-12">
          <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No tiene reservas
          </h3>
          <p className="text-gray-500 mb-4">
            Aún no ha realizado ninguna reserva
          </p>
          <Link to="/rooms" className="btn-primary">
            Ver Habitaciones
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
