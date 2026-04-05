import { useState, useEffect } from 'react';
import { X, Loader2, BedDouble, DollarSign, List, FileText } from 'lucide-react';
import { roomService } from '@/services/api';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRoomModal = ({ isOpen, onClose, onSuccess }: CreateRoomModalProps) => {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    numero: '',
    tipo_id: '',
    piso: '1',
    precio_actual: '',
    descripcion: '',
    caracteristicas: {
      wifi: true,
      tv: true,
      ac: false,
      vista: 'calle'
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadTypes();
    }
  }, [isOpen]);

  const loadTypes = async () => {
    try {
      const response = await roomService.getTypes();
      setTypes(response.data.data);
      // Set default type if available
      if (response.data.data.length > 0 && !formData.tipo_id) {
        const firstType = response.data.data[0];
        setFormData(prev => ({
          ...prev,
          tipo_id: firstType.id.toString(),
          precio_actual: firstType.precio_base.toString()
        }));
      }
    } catch (err) {
      console.error('Error al cargar tipos de habitación:', err);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const selectedType = types.find(t => t.id.toString() === typeId);
    setFormData({
      ...formData,
      tipo_id: typeId,
      precio_actual: selectedType ? selectedType.precio_base.toString() : formData.precio_actual
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await roomService.create({
        numero: formData.numero,
        tipo_id: parseInt(formData.tipo_id),
        piso: parseInt(formData.piso),
        precio_actual: parseFloat(formData.precio_actual),
        descripcion: formData.descripcion,
        caracteristicas: formData.caracteristicas
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        numero: '',
        tipo_id: types[0]?.id.toString() || '',
        piso: '1',
        precio_actual: types[0]?.precio_base.toString() || '',
        descripcion: '',
        caracteristicas: { wifi: true, tv: true, ac: false, vista: 'calle' }
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la habitación. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BedDouble className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nueva Habitación</h2>
              <p className="text-primary-100 text-sm">Registre una nueva habitación en el sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Número de Habitación
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  placeholder="Ej: 101"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Piso
              </label>
              <select
                value={formData.piso}
                onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                required
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>Piso {p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Tipo de Habitación
            </label>
            <select
              value={formData.tipo_id}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
              required
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nombre} - ${type.precio_base}/noche
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Precio Actual ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={formData.precio_actual}
                onChange={(e) => setFormData({ ...formData, precio_actual: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none min-h-[100px]"
              placeholder="Describa la habitación..."
            />
          </div>

          {/* Características Checkboxes */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-sm font-bold text-gray-700 mb-2">Comodidades</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.caracteristicas.wifi}
                  onChange={(e) => setFormData({
                    ...formData,
                    caracteristicas: { ...formData.caracteristicas, wifi: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-primary-600 transition-colors">WiFi Gratuito</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.caracteristicas.tv}
                  onChange={(e) => setFormData({
                    ...formData,
                    caracteristicas: { ...formData.caracteristicas, tv: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-primary-600 transition-colors">Smart TV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.caracteristicas.ac}
                  onChange={(e) => setFormData({
                    ...formData,
                    caracteristicas: { ...formData.caracteristicas, ac: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-primary-600 transition-colors">Aire Acondicionado</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-primary-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                'Guardar Habitación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
