import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const Header = () => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end">

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.nombres?.[0]}
                {user?.apellidos?.[0]}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.nombres} {user?.apellidos}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.rol?.nombre}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
