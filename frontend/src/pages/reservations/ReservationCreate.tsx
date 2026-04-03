import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { reservationService, roomService, userService } from '@/services/api';
import type { Room, User } from '@/types';

const ReservationCreate = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    usuario_id: '',
    habitacion_id: '',
    fecha_entrada: new Date(),
    fecha_salida: new Date(Date.now() + 86400000),
    num_huespedes: 1,
    notas: '',
  });
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRooms();
    loadUsers();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await roomService.getAll({ estado: 'disponible' });
      setRooms(response.data.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const data = {
        usuario_id: parseInt(formData.usuario_id),
        habitacion_id: parseInt(formData.habitacion_id),
        fecha_entrada: formData.fecha_entrada.toISOString().split('T')[0],
        fecha_salida: formData.fecha_salida.toISOString().split('T')[0],
        num_huespedes: formData.num_huespedes,
        notas: formData.notas,
      };

      await reservationService.create(data);
      navigate('/reservations');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Error al crear la reserva. Intente nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/reservations"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Reserva</h1>
          <p className="text-gray-500">Crear una nueva reserva</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="card-body space-y-6">
          {/* Cliente */}
          <div>
            <label className="form-label">Cliente</label>
            <select
              value={formData.usuario_id}
              onChange={(e) =>
                setFormData({ ...formData, usuario_id: e.target.value })
              }
              className="form-input"
              required
            >
              <option value="">Seleccione un cliente</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre_completo} ({user.username})
                </option>
              ))}
            </select>
          </div>

          {/* Habitación */}
          <div>
            <label className="form-label">Habitación</label>
            <select
              value={formData.habitacion_id}
              onChange={(e) =>
                setFormData({ ...formData, habitacion_id: e.target.value })
              }
              className="form-input"
              required
            >
              <option value="">Seleccione una habitación</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.numero} - {room.tipo_nombre} (${room.precio_actual}/noche)
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Fecha de Entrada</label>
              <DatePicker
                selected={formData.fecha_entrada}
                onChange={(date) =>
                  setFormData({ ...formData, fecha_entrada: date || new Date() })
                }
                className="form-input"
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
              />
            </div>
            <div>
              <label className="form-label">Fecha de Salida</label>
              <DatePicker
                selected={formData.fecha_salida}
                onChange={(date) =>
                  setFormData({ ...formData, fecha_salida: date || new Date() })
                }
                className="form-input"
                dateFormat="yyyy-MM-dd"
                minDate={new Date(Date.now() + 86400000)}
              />
            </div>
          </div>

          {/* Huéspedes */}
          <div>
            <label className="form-label">Número de Huéspedes</label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.num_huespedes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  num_huespedes: parseInt(e.target.value),
                })
              }
              className="form-input"
              required
            />
          </div>

          {/* Notas */}
          <div>
            <label className="form-label">Notas (opcional)</label>
            <textarea
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              className="form-input"
              rows={3}
              placeholder="Notas adicionales sobre la reserva"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Reserva'
              )}
            </button>
            <Link to="/reservations" className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReservationCreate;
