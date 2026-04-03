import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
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
      amenities?: string[] | string;
    };
    capacidad_maxima?: number;
    amenities?: string[] | string;
    piso: number;
    estado: Room['estado'];
    precio_actual: number;
    descripcion?: string;
    caracteristicas?: Record<string, unknown>;
    activa: boolean;
  };
};

const parseAmenities = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }
  }

  return [];
};

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authStore = useAuthStore();

  const isAdmin =
    typeof authStore.isAdmin === 'function' ? authStore.isAdmin() : false;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setRoom(null);
      setLoading(false);
      return;
    }

    const roomId = Number(id);

    if (Number.isNaN(roomId)) {
      setRoom(null);
      setLoading(false);
      return;
    }

    loadRoom(roomId);
  }, [id]);

  const loadRoom = async (roomId: number) => {
    try {
      setLoading(true);

      const response = await roomService.getById(roomId);
      const rawRoom = (response.data as RoomDetailApiResponse)?.data;

      if (!rawRoom) {
        console.log('No vino data desde API:', response.data);
        setRoom(null);
        return;
      }

      const sourceAmenities =
        rawRoom.amenities ?? rawRoom.tipo_detalle?.amenities;

      const normalizedRoom: Room = {
        id: rawRoom.id,
        numero: rawRoom.numero,
        tipo_id: rawRoom.tipo ?? 0,
        tipo_nombre: rawRoom.tipo_nombre ?? rawRoom.tipo_detalle?.nombre ?? 'Sin tipo',
        capacidad_maxima:
          rawRoom.capacidad_maxima ?? rawRoom.tipo_detalle?.capacidad_maxima ?? 0,
        amenities: parseAmenities(sourceAmenities),
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

  const getStatusIcon = (estado: string, activa: boolean) => {
  if (!activa) {
    return <XCircle className="w-5 h-5 text-red-500" />;
  }

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
  };;

  const getStatusBadge = (estado: string, activa: boolean) => {
  if (!activa) {
    return <span className="badge-red">No disponible</span>;
  }

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

        {isAdmin && (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <div className="mt-1">{getStatusBadge(room.estado, Boolean(room.activa))}</div>
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

          {Array.isArray(room.amenities) && room.amenities.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Comodidades
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

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Estado Actual
              </h3>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {getStatusIcon(room.estado, Boolean(room.activa))}
                <div>
                  <p className="font-medium text-gray-900">
                    {!room.activa
                      ? 'No disponible'
                      : typeof room.estado === 'string' && room.estado.length > 0
                      ? room.estado.charAt(0).toUpperCase() + room.estado.slice(1)
                      : 'Sin estado'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {!room.activa
                      ? 'Habitación desactivada'
                      : room.estado === 'disponible'
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

          {isAdmin && (
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