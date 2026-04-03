import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { reservationService } from '@/services/api';
import type { Reservation } from '@/types';
import { useAuthStore } from '@/store/authStore';

const ReservationsList = () => {
  const { isAdmin, isRecepcionista } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: '',
  });

  useEffect(() => {
    loadReservations();
  }, [filters]);

  const loadReservations = async () => {
    try {
      const params: any = {};
      if (filters.estado) params.estado = filters.estado;

      const response = await reservationService.getAll(params);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500">Gestión de reservas del hotel</p>
        </div>
        {(isAdmin() || isRecepcionista()) && (
          <Link
            to="/reservations/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Reserva
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            className="form-input w-48"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="check_in">Check-in</option>
            <option value="check_out">Check-out</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Habitación</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="font-medium">{reservation.codigo_reserva}</td>
                  <td>{reservation.cliente_nombre}</td>
                  <td>{reservation.habitacion_numero}</td>
                  <td>{reservation.fecha_entrada}</td>
                  <td>{reservation.fecha_salida}</td>
                  <td className="font-medium text-primary-600">
                    ${reservation.precio_total}
                  </td>
                  <td>{getStatusBadge(reservation.estado)}</td>
                  <td>
                    <Link
                      to={`/reservations/${reservation.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reservations.length === 0 && (
        <div className="text-center py-12">
          <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay reservas
          </h3>
          <p className="text-gray-500">
            No se encontraron reservas con los filtros seleccionados
          </p>
        </div>
      )}
    </div>
  );
};

export default ReservationsList;
