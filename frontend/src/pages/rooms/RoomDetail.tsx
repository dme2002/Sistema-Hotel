import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BedDouble,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { roomService } from '@/services/api';
import type { Room } from '@/types';
import { useAuthStore } from '@/store/authStore';

type RoomDetailApiResponse = {
  status?: string;
  data?: {
    id: number;
    numero: string;
    tipo?: number;
    tipo_nombre?: string;
    tipo_detalle?: {
      nombre?: string;
      capacidad_maxima?: number;
      amenities?: string[];
    };
    capacidad_maxima?: number;
    amenities?: string[];
    piso: number;
    estado: Room['estado'];
    precio_actual: number;
    descripcion?: string;
    caracteristicas?: Record<string, unknown>;
    activa: boolean;
  };
};

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRoom(parseInt(id));
    }
  }, [id]);

  const loadRoom = async (roomId: number) => {
    try {
      const response = await roomService.getById(roomId);
      const payload = response.data as RoomDetailApiResponse | RoomDetailApiResponse['data'];
      const rawRoom = (payload as RoomDetailApiResponse)?.data ?? payload;

      if (!rawRoom) {
        setRoom(null);
        return;
      }

      const normalizedRoom: Room = {
        id: rawRoom.id,
        numero: rawRoom.numero,
        tipo_id: rawRoom.tipo ?? 0,
        tipo_nombre: rawRoom.tipo_nombre ?? rawRoom.tipo_detalle?.nombre,
        capacidad_maxima:
          rawRoom.capacidad_maxima ?? rawRoom.tipo_detalle?.capacidad_maxima,
        amenities: rawRoom.amenities ?? rawRoom.tipo_detalle?.amenities,
        piso: rawRoom.piso,
        estado: rawRoom.estado,
        precio_actual: rawRoom.precio_actual,
        descripcion: rawRoom.descripcion,
        caracteristicas: rawRoom.caracteristicas,
        activa: rawRoom.activa,
      };

      setRoom(normalizedRoom);
    } catch (error) {
      console.error('Error loading room:', error);
      setRoom(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!room || !confirm('¿Está seguro de desactivar esta habitación?')) return;

    try {
      await roomService.delete(room.id);
      navigate('/rooms');
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ocupada':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'mantenimiento':
        return <Wrench className="w-5 h-5 text-yellow-500" />;
      case 'limpieza':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      default:
        return null;
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
    return (
      <span className={styles[estado] || 'badge-gray'}>
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

  if (!room) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Habitación no encontrada
        </h2>
        <Link to="/rooms" className="text-primary-600 hover:underline mt-2">
          Volver a habitaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/rooms"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Habitación {room.numero}
            </h1>
            <p className="text-gray-500">{room.tipo_nombre}</p>
          </div>
        </div>
        
        {isAdmin() && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Desactivar
            </button>
          </div>
        )}
      </div>

      {/* Room Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Información General
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Número</p>
                  <p className="font-medium text-gray-900">{room.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Piso</p>
                  <p className="font-medium text-gray-900">{room.piso}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium text-gray-900">{room.tipo_nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacidad</p>
                  <p className="font-medium text-gray-900">
                    {room.capacidad_maxima} personas
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Precio por noche</p>
                  <p className="font-medium text-primary-600">
                    ${room.precio_actual}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <div className="mt-1">{getStatusBadge(room.estado)}</div>
                </div>
              </div>
              
              {room.descripcion && (
                <div>
                  <p className="text-sm text-gray-500">Descripción</p>
                  <p className="text-gray-900">{room.descripcion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Amenities
                </h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Estado Actual
              </h3>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {getStatusIcon(room.estado)}
                <div>
                  <p className="font-medium text-gray-900">
                    {room.estado.charAt(0).toUpperCase() + room.estado.slice(1)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {room.estado === 'disponible'
                      ? 'Lista para reservar'
                      : room.estado === 'ocupada'
                      ? 'Actualmente ocupada'
                      : room.estado === 'mantenimiento'
                      ? 'En mantenimiento'
                      : 'En limpieza'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {isAdmin() && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Acciones Rápidas
                </h3>
              </div>
              <div className="card-body space-y-2">
                <button className="w-full btn-secondary flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar Habitación
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
