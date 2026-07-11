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

/** Store holding the authenticated user; setUser also manages the SSE channel. */
export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: false,
  hasLoaded: false,
  setUser: (user) => {
    // The SSE channel is tied to the session: opened on login/restore
    // and closed on logout (register/login/me all go through here).
    if (user) connectRealtime();
    else disconnectRealtime();
    set({ user, hasLoaded: true });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
