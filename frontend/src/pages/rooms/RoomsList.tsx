import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Plus, Search, Filter } from 'lucide-react';
import { roomService } from '@/services/api';
import type { Room } from '@/types';
import { useAuthStore } from '@/store/authStore';

import CreateRoomModal from '@/components/CreateRoomModal';

const RoomsList = () => {
  const { isAdmin } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    estado: '',
    piso: '',
  });

  useEffect(() => {
    loadRooms();
  }, [filters]);

  const loadRooms = async () => {
    try {
      const params: any = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.piso) params.piso = filters.piso;

      const response = await roomService.getAll(params);
      setRooms(response.data.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      disponible: 'badge-green',
      ocupada: 'badge-red',
      mantenimiento: 'badge-yellow',
      limpieza: 'badge-blue',
    };
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      ocupada: 'Ocupada',
      mantenimiento: 'Mantenimiento',
      limpieza: 'Limpieza',
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
          <h1 className="text-2xl font-bold text-gray-900">Habitaciones</h1>
          <p className="text-gray-500">Gestión de habitaciones del hotel</p>
        </div>
        {isAdmin() && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Habitación
          </button>
        )}
      </div>

      <CreateRoomModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadRooms}
      />

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
            <option value="disponible">Disponible</option>
            <option value="ocupada">Ocupada</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="limpieza">Limpieza</option>
          </select>
          <select
            value={filters.piso}
            onChange={(e) => setFilters({ ...filters, piso: e.target.value })}
            className="form-input w-48"
          >
            <option value="">Todos los pisos</option>
            {[1, 2, 3, 4].map((piso) => (
              <option key={piso} value={piso}>
                Piso {piso}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <Link
            key={room.id}
            to={`/rooms/${room.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BedDouble className="w-6 h-6 text-primary-600" />
                </div>
                {getStatusBadge(room.estado)}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Habitación {room.numero}
              </h3>
              <p className="text-gray-500 text-sm mb-2">{room.tipo_nombre}</p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Piso {room.piso}</span>
                <span className="font-semibold text-primary-600">
                  ${room.precio_actual}/noche
                </span>
              </div>
              
              {room.capacidad_maxima && (
                <p className="text-xs text-gray-400 mt-2">
                  Capacidad: {room.capacidad_maxima} personas
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay habitaciones
          </h3>
          <p className="text-gray-500">
            No se encontraron habitaciones con los filtros seleccionados
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomsList;
