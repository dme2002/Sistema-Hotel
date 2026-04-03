import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'recepcionista' | 'cliente';
}

const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isRecepcionista } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol requerido
  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin()) {
      return <Navigate to="/profile" replace />;
    }
    if (requiredRole === 'recepcionista' && !isAdmin() && !isRecepcionista()) {
      return <Navigate to="/profile" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
