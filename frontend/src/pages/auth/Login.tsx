import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(
        formData.username,
        formData.password
      );
      
      const { access_token, refresh_token } = response.data.data;
      setTokens(access_token, refresh_token);
      
      // Cargar datos del usuario
      const userResponse = await authService.me();
      const user = userResponse.data.data;
      setUser(user);
      
      // Redirigir según el rol
      if (user.rol?.nombre === 'admin') {
        navigate('/dashboard');
      } else if (user.rol?.nombre === 'recepcionista') {
        navigate('/reservations');
      } else {
        navigate('/rooms');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Error al iniciar sesión. Verifique sus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
        <p className="text-gray-500 mt-1">
          Inicie sesión para acceder al sistema
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="form-label">Usuario</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="form-input"
            placeholder="Ingrese su usuario"
            required
          />
        </div>

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
              placeholder="Ingrese su contraseña"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500">
          ¿No tiene cuenta?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Regístrese aquí
          </Link>
        </p>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          <strong>Credenciales de demo:</strong>
          <br />
          Admin: admin / admin123
        </p>
      </div>
    </div>
  );
};

export default Login;
