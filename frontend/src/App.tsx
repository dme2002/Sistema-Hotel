import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api';

// Layouts
import MainLayout from '@/components/layouts/MainLayout';
import AuthLayout from '@/components/layouts/AuthLayout';

// Pages - Auth
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Pages - Public
import Landing from '@/pages/Landing';

// Pages - Dashboard
import Dashboard from '@/pages/dashboard/Dashboard';

// Pages - Rooms
import RoomsList from '@/pages/rooms/RoomsList';
import RoomDetail from '@/pages/rooms/RoomDetail';
import RoomEdit from '@/pages/rooms/RoomEdit';

// Pages - Reservations
import ReservationsList from '@/pages/reservations/ReservationsList';
import ReservationCreate from '@/pages/reservations/ReservationCreate';
import ReservationDetail from '@/pages/reservations/ReservationDetail';
import MyReservations from '@/pages/reservations/MyReservations';

// Pages - Users
import UsersList from '@/pages/users/UsersList';

// Pages - Profile
import Profile from '@/pages/profile/Profile';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  const { isAuthenticated, setUser, logout } = useAuthStore();

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated) {
        try {
          const response = await authService.me();
          setUser(response.data.data);
        } catch (error) {
          console.error('Error loading user:', error);
          logout();
        }
      }
    };

    loadUser();
  }, [isAuthenticated, setUser, logout]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Dashboard - Admin only */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Rooms */}
          <Route path="/rooms" element={<RoomsList />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/rooms/:id/edit" element={<RoomEdit />} />

          {/* Reservations - Admin and Recepcionista */}
          <Route element={<ProtectedRoute requiredRole="recepcionista" />}>
            <Route path="/reservations" element={<ReservationsList />} />
            <Route path="/reservations/create" element={<ReservationCreate />} />
            <Route path="/reservations/:id" element={<ReservationDetail />} />
          </Route>

          {/* Customer only */}
          <Route path="/my-reservations" element={<MyReservations />} />

          {/* Users - Admin only */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/users" element={<UsersList />} />
          </Route>

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
