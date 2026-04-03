import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Users,
  UserCircle,
  Hotel,
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Hotel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Hotel</h1>
            <p className="text-xs text-gray-500">Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-gray-900">
            {user?.nombres} {user?.apellidos}
          </p>
          <p className="text-xs text-gray-500 capitalize">{user?.rol?.nombre}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
