import { useState } from 'react';
import { UserCircle, Mail, Phone, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    telefono: user?.telefono || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authService.changePassword({
        password_actual: '',
        nuevo_password: '',
        confirmar_password: '',
      });
      setMessage('Perfil actualizado exitosamente');
      if (user) {
        setUser({ ...user, ...formData });
      }
    } catch (error) {
      setMessage('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500">Gestione su información personal</p>
      </div>

      {/* Profile Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card">
          <div className="card-body text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-primary-700">
                {user.nombres[0]}
                {user.apellidos[0]}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {user.nombres} {user.apellidos}
            </h3>
            <p className="text-gray-500 capitalize">{user.rol?.nombre}</p>
            
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5" />
                <span>{user.email}</span>
              </div>
              {user.telefono && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span>{user.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>
                  Miembro desde{' '}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Editar Perfil
            </h3>
          </div>
          <div className="card-body">
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  message.includes('exitosamente')
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nombres</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) =>
                      setFormData({ ...formData, nombres: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) =>
                      setFormData({ ...formData, apellidos: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
