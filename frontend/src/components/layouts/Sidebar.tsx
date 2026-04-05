import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Users,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const Sidebar = () => {
  const { logout, user, isAdmin, isRecepcionista, isCliente } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: isAdmin(),
    },
    {
      path: '/rooms',
      label: 'Habitaciones',
      icon: BedDouble,
      show: true,
    },
    {
      path: '/reservations',
      label: 'Reservas',
      icon: CalendarDays,
      show: isAdmin() || isRecepcionista(),
    },
    {
      path: '/my-reservations',
      label: 'Mis Reservas',
      icon: CalendarDays,
      show: isCliente(),
    },
    {
      path: '/users',
      label: 'Usuarios',
      icon: Users,
      show: isAdmin(),
    },
    {
      path: '/profile',
      label: 'Mi Perfil',
      icon: UserCircle,
      show: true,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-50">
      
      {/* 🔷 Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">

          {/* Icono adaptado */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <rect x="6" y="4" width="12" height="16" rx="1" />
              <path d="M9 20v-3h6v3" />
              <path d="M9 8h.01M12 8h.01M15 8h.01" />
              <path d="M9 11h.01M12 11h.01M15 11h.01" />
            </svg>
          </div>

          {/* Texto */}
          <div>
            <h1 className="font-bold text-white tracking-tight">
              HotelOps
            </h1>
            <p className="text-xs text-slate-400">
              Gestión hotelera
            </p>
          </div>

        </div>
      </div>

      {/* 🧭 Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* 👤 User + Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-white">
            {user?.nombres} {user?.apellidos}
          </p>
          <p className="text-xs text-slate-400 capitalize">
            {user?.rol?.nombre}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;