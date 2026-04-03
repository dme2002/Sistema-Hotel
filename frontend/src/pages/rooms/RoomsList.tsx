import { useEffect, useState } from 'react';
import { BedDouble, Plus, Filter } from 'lucide-react';
import { roomService } from '@/services/api';
import type { Room } from '@/types';
import { useAuthStore } from '@/store/authStore';
import CreateRoomModal from '@/components/CreateRoomModal';
import RoomDetailModal from '@/components/RoomDetailModal';

const RoomsList = () => {
  const { isAdmin } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filters, setFilters] = useState({ estado: '', piso: '' });

  useEffect(() => {
    loadRooms();
  }, [filters]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.piso) params.piso = filters.piso;
      const response = await roomService.getAll(params);
      setRooms(response.data.data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      disponible: 'bg-green-100 text-green-700',
      ocupada: 'bg-red-100 text-red-700',
      mantenimiento: 'bg-yellow-100 text-yellow-700',
      limpieza: 'bg-blue-100 text-blue-700',
    };
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      ocupada: 'Ocupada',
      mantenimiento: 'Mantenimiento',
      limpieza: 'Limpieza',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${styles[estado] || 'bg-gray-100 text-gray-600'}`}>
        {labels[estado] || estado}
      </span>
    );
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
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Habitación
          </button>
        )}
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadRooms}
      />
      <RoomDetailModal
        room={selectedRoom}
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onUpdated={loadRooms}
        isAdmin={isAdmin()}
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
              <option key={piso} value={piso}>Piso {piso}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setSelectedRoom(room)}
            className="card hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left w-full"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <BedDouble className="w-6 h-6 text-white" />
                </div>
                {statusBadge(room.estado)}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Habitación {room.numero}
              </h3>
              <p className="text-gray-500 text-sm mb-3">{room.tipo_nombre}</p>

              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-gray-400">Piso {room.piso}</span>
                <span className="font-bold text-blue-600">
                  ${room.precio_actual}<span className="text-xs font-normal text-gray-400">/noche</span>
                </span>
              </div>

              {room.capacidad_maxima && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  👤 Capacidad: {room.capacidad_maxima} personas
                </p>
              )}

              <p className="text-xs text-blue-400 mt-3 font-medium">
                {isAdmin() ? 'Clic para ver · editar · eliminar' : 'Clic para ver detalles'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay habitaciones</h3>
          <p className="text-gray-500">No se encontraron habitaciones con los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
};

export default RoomsList;
