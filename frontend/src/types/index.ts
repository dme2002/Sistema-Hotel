// ============================================
// TIPOS DEL SISTEMA HOTELERO
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  telefono?: string;
  rol?: Role;
  rol_id?: number;
  is_active: boolean;
  ultimo_acceso?: string;
  created_at?: string;
}

export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos?: string[];
}

export interface RoomType {
  id: number;
  nombre: string;
  descripcion?: string;
  capacidad_maxima: number;
  precio_base: number;
  amenities?: string[];
}

export interface Room {
  id: number;
  numero: string;
  tipo_id: number;
  tipo?: RoomType;
  tipo_nombre?: string;
  capacidad_maxima?: number;
  amenities?: string[];
  piso: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'limpieza';
  precio_actual: number;
  descripcion?: string;
  caracteristicas?: Record<string, any>;
  activa: boolean;
}

export interface Reservation {
  id: number;
  codigo_reserva: string;
  usuario_id: number;
  cliente_nombre?: string;
  cliente?: {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
  };
  habitacion_id: number;
  habitacion_numero?: string;
  tipo_habitacion?: string;
  habitacion?: {
    id: number;
    numero: string;
    tipo: string;
    piso: number;
    precio_noche: number;
  };
  fecha_entrada: string;
  fecha_salida: string;
  num_huespedes: number;
  num_noches?: number;
  precio_total: number;
  estado: 'pendiente' | 'confirmada' | 'check_in' | 'check_out' | 'cancelada';
  notas?: string;
  creado_por?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_habitaciones: number;
  habitaciones_disponibles: number;
  habitaciones_ocupadas: number;
  habitaciones_mantenimiento: number;
  reservas_activas: number;
  reservas_pendientes: number;
  ingresos_mes: number;
  total_usuarios: number;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  password: string;
  confirmar_password: string;
}

export interface ReservationCreate {
  usuario_id: number;
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  num_huespedes: number;
  notas?: string;
}
