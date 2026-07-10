import { create } from 'zustand';
import { connectRealtime, disconnectRealtime } from '@/lib/realtime';
import type { User } from '../domain/user';

interface AuthStoreState {
  user: User | null;
  isLoading: boolean;
  hasLoaded: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: false,
  hasLoaded: false,
  setUser: (user) => {
    // El canal SSE vive atado a la sesión: se abre al iniciar/restaurar
    // sesión y se cierra al desloguear (register/login/me pasan por acá).
    if (user) connectRealtime();
    else disconnectRealtime();
    set({ user, hasLoaded: true });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
