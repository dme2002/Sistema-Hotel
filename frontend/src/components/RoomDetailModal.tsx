import { useEffect, useState } from 'react';
import { X, BedDouble, Edit2, Trash2, Save, AlertTriangle } from 'lucide-react';
import { roomService } from '@/services/api';
import type { Room, RoomType } from '@/types';

interface Props {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  isAdmin: boolean;
}

const ESTADOS = ['disponible', 'ocupada', 'mantenimiento', 'limpieza'];

const RoomDetailModal = ({ room, isOpen, onClose, onUpdated, isAdmin }: Props) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [tipos, setTipos] = useState<RoomType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    tipo_id: 0,
    piso: 1,
    precio_actual: 0,
    estado: 'disponible',
    descripcion: '',
    activa: true,
  });

  useEffect(() => {
    if (isOpen && room) {
      setMode('view');
      setError('');
      setForm({
        tipo_id: room.tipo_id,
        piso: room.piso,
        precio_actual: room.precio_actual,
        estado: room.estado,
        descripcion: room.descripcion || '',
        activa: room.activa,
      });
      loadTipos();
    }
  }, [isOpen, room]);

  const loadTipos = async () => {
    try {
      const res = await roomService.getTypes();
      setTipos(res.data.data || []);
    } catch {}
  };

  const handleSave = async () => {
    if (!room) return;
    setSaving(true);
    setError('');
    try {
      await roomService.update(room.id, form as any);
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al actualizar habitación');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!room) return;
    setSaving(true);
    setError('');
    try {
      await roomService.delete(room.id);
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al eliminar habitación');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !room) return null;

  const statusColor: Record<string, string> = {
    disponible: 'bg-green-100 text-green-700',
    ocupada: 'bg-red-100 text-red-700',
    mantenimiento: 'bg-yellow-100 text-yellow-700',
    limpieza: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Habitación {room.numero}</h2>
              <p className="text-blue-200 text-sm">{room.tipo_nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* DELETE confirmation */}
          {mode === 'delete' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">¿Eliminar habitación?</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Esta acción desactivará la habitación <strong>{room.numero}</strong> del sistema.<br />
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setMode('view')} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
                >
                  {saving ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          )}

          {/* VIEW mode */}
          {mode === 'view' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Número</p>
                  <p className="font-semibold text-gray-900">{room.numero}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Piso</p>
                  <p className="font-semibold text-gray-900">{room.piso}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Tipo</p>
                  <p className="font-semibold text-gray-900">{room.tipo_nombre || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Precio/noche</p>
                  <p className="font-semibold text-blue-600">${room.precio_actual}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Estado</p>
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${statusColor[room.estado] || 'bg-gray-100 text-gray-600'}`}>
                    {room.estado.charAt(0).toUpperCase() + room.estado.slice(1)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Capacidad</p>
                  <p className="font-semibold text-gray-900">{room.capacidad_maxima || '—'} personas</p>
                </div>
              </div>
              {room.descripcion && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Descripción</p>
                  <p className="text-sm text-gray-700">{room.descripcion}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Activa</p>
                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${room.activa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {room.activa ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          )}

          {/* EDIT mode */}
          {mode === 'edit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de habitación</label>
                  <select
                    value={form.tipo_id}
                    onChange={(e) => setForm({ ...form, tipo_id: Number(e.target.value) })}
                    className="form-input"
                  >
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
                  <input
                    type="number"
                    min={1}
                    value={form.piso}
                    onChange={(e) => setForm({ ...form, piso: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por noche ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.precio_actual}
                    onChange={(e) => setForm({ ...form, precio_actual: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="form-input"
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="form-input resize-none"
                  placeholder="Descripción opcional..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={form.activa}
                  onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="activa" className="text-sm font-medium text-gray-700">Habitación activa</label>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {mode !== 'delete' && (
          <div className="px-6 pb-6 flex items-center justify-between">
            <div className="flex gap-2">
              {isAdmin && mode === 'view' && (
                <>
                  <button
                    onClick={() => setMode('edit')}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => setMode('delete')}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {mode === 'edit' && (
                <button onClick={() => setMode('view')} className="btn-secondary text-sm">
                  Cancelar
                </button>
              )}
              {mode === 'edit' && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              )}
              {mode === 'view' && (
                <button onClick={onClose} className="btn-secondary text-sm">
                  Cerrar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetailModal;
