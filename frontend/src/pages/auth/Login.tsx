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
    <div className="space-y-6">

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Usuario */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">
            Usuario
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            placeholder="Ingrese su usuario"
            required
          />
        </div>

        {/* Contraseña */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Ingrese su contraseña"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
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

      {/* Registro */}
      <div className="text-center text-sm text-slate-500">
        ¿No tiene cuenta?{' '}
        <Link
          to="/register"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Regístrese aquí
        </Link>
      </div>

      {/* Demo */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
        <strong>Credenciales de demo:</strong>
        <br />
        admin / admin123
      </div>
    </div>
  );
};

export default Login;
