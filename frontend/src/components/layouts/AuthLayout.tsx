import { Outlet } from 'react-router-dom';
import { Hotel } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Hotel className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Hotel Management</h1>
          <p className="text-primary-200 mt-1">Sistema de Gestión Hotelera</p>
        </div>
        
        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <Outlet />
        </div>
        
        {/* Footer */}
        <p className="text-center text-primary-200 text-sm mt-6">
          © 2024 Hotel Management System. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
