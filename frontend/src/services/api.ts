import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - agregar token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    const isPublicAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    // Ignorar 401 del login/register para que el componente maneje el error
    if (error.response?.status === 401 && !isPublicAuthRoute) {
      const { refreshToken, logout, setTokens } = useAuthStore.getState();

      if (refreshToken && originalRequest) {
        try {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            {
              headers: { Authorization: `Bearer ${refreshToken}` },
            }
          );

          const { access_token, refresh_token } = response.data.data;
          setTokens(access_token, refresh_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          return api(originalRequest);
        } catch (refreshError) {
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// SERVICIOS DE AUTENTICACIÓN
// ============================================
export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  register: (data: {
    username: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    password: string;
    confirmar_password: string;
  }) => api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
  
  changePassword: (data: {
    password_actual: string;
    nuevo_password: string;
    confirmar_password: string;
  }) => api.post('/auth/change-password', data),
};

// ============================================
// SERVICIOS DE USUARIOS
// ============================================
export const userService = {
  getAll: (params?: {
    rol?: string;
    activo?: boolean;
    search?: string;
  }) => api.get('/users', { params }),
  
  getById: (id: number) => api.get(`/users/${id}`),
  
  create: (data: {
    username: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    password: string;
    rol_id: number;
  }) => api.post('/users', data),
  
  update: (id: number, data: Partial<User>) =>
    api.patch(`/users/${id}`, data),
  
  toggleStatus: (id: number) =>
    api.patch(`/users/${id}/toggle-status`),
  
  delete: (id: number) => api.delete(`/users/${id}`),
  
  getRoles: () => api.get('/users/roles'),
  
  getProfile: () => api.get('/users/profile/me'),
};

// ============================================
// SERVICIOS DE HABITACIONES
// ============================================
export const roomService = {
  getAll: (params?: {
    estado?: string;
    piso?: number;
    tipo?: number;
    activa?: boolean;
    capacidad?: number;
  }) => api.get('/rooms', { params }),
  
  getById: (id: number) => api.get(`/rooms/${id}`),
  
  getTypes: () => api.get('/rooms/tipos'),
  
  create: (data: {
    numero: string;
    tipo_id: number;
    piso: number;
    precio_actual: number;
    descripcion?: string;
    caracteristicas?: Record<string, any>;
  }) => api.post('/rooms', data),
  
  update: (id: number, data: Partial<Room>) =>
    api.patch(`/rooms/${id}`, data),
  
  delete: (id: number) => api.delete(`/rooms/${id}`),
  
  getAvailable: (data: {
    fecha_entrada: string;
    fecha_salida: string;
    capacidad?: number;
  }) => api.post('/rooms/disponibles', data),
  
  checkAvailability: (
    id: number,
    fecha_entrada: string,
    fecha_salida: string
  ) =>
    api.get(`/rooms/${id}/disponibilidad`, {
      params: { fecha_entrada, fecha_salida },
    }),
};

// ============================================
// SERVICIOS DE RESERVAS
// ============================================
export const reservationService = {
  getAll: (params?: {
    estado?: string;
    usuario?: number;
    habitacion?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => api.get('/reservations', { params }),
  
  getById: (id: number) => api.get(`/reservations/${id}`),
  
  create: (data: {
    usuario_id: number;
    habitacion_id: number;
    fecha_entrada: string;
    fecha_salida: string;
    num_huespedes: number;
    notas?: string;
  }) => api.post('/reservations', data),
  
  update: (id: number, data: Partial<Reservation>) =>
    api.patch(`/reservations/${id}`, data),
  
  changeStatus: (
    id: number,
    estado: string,
    motivo?: string
  ) =>
    api.post(`/reservations/${id}/estado`, { estado, motivo }),
  
  cancel: (id: number, motivo?: string) =>
    api.post(`/reservations/${id}/cancelar`, { motivo }),
  
  getHistory: (id: number) =>
    api.get(`/reservations/${id}/historial`),
  
  getMyReservations: () =>
    api.get('/reservations/mis-reservas/lista'),
};

// ============================================
// SERVICIOS DE DASHBOARD
// ============================================
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  
  getOcupacion: () => api.get('/dashboard/ocupacion'),
  
  getRecentReservations: () =>
    api.get('/dashboard/reservas-recientes'),
  
  getMonthlyIncome: () => api.get('/dashboard/ingresos-mensuales'),
};

import type { User } from '@/types';

export default api;
