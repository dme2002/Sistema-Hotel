import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types';

interface AuthState {
  // Tokens
  accessToken: string | null;
  refreshToken: string | null;
  
  // Usuario
  user: User | null;
  isAuthenticated: boolean;
  
  // Acciones
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  
  // Helpers
  getUserRole: () => string | null;
  isAdmin: () => boolean;
  isRecepcionista: () => boolean;
  isCliente: () => boolean;
}

interface JWTPayload {
  sub: string;
  username: string;
  rol: string;
  exp: number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      
      // Acciones
      setTokens: (accessToken: string, refreshToken: string) => {
        try {
          // Decodificar token para obtener info del usuario
          const decoded = jwtDecode<JWTPayload>(accessToken);
          
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      },
      
      setUser: (user: User) => {
        set({ user });
      },
      
      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
      
      // Helpers
      getUserRole: () => {
        const { user } = get();
        return user?.rol?.nombre || null;
      },
      
      isAdmin: () => {
        const role = get().getUserRole();
        return role === 'admin';
      },
      
      isRecepcionista: () => {
        const role = get().getUserRole();
        return role === 'recepcionista';
      },
      
      isCliente: () => {
        const role = get().getUserRole();
        return role === 'cliente';
      },
    }),
    {
      name: 'hotel-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
