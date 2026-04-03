import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '@/services/api';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    password: '',
    confirmar_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar contraseñas
    if (formData.password !== formData.confirmar_password) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);
      navigate('/login', { 
        state: { message: 'Registro exitoso. Inicie sesión.' }
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Error al registrar. Intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Crear Cuenta</h2>
        <p className="text-gray-500 mt-1">
          Regístrese para acceder al sistema
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
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
              placeholder="Nombres"
              required
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
              placeholder="Apellidos"
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label">Usuario</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="form-input"
            placeholder="Nombre de usuario"
            required
          />
        </div>

        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="form-input"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div>
          <label className="form-label">Teléfono (opcional)</label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) =>
              setFormData({ ...formData, telefono: e.target.value })
            }
            className="form-input"
            placeholder="+1234567890"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="form-input pr-10"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Confirmar</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmar_password}
                onChange={(e) =>
                  setFormData({ ...formData, confirmar_password: e.target.value })
                }
                className="form-input pr-10"
                placeholder="Repita la contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Registrando...
            </>
          ) : (
            'Crear Cuenta'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500">
          ¿Ya tiene cuenta?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Inicie sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
