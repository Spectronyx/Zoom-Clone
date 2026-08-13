import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatar_color: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

const API_BASE = 'http://localhost:8000/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('meetclone_jwt') : null,
  isLoading: true,

  login: (token: string, user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('meetclone_jwt', token);
    }
    set({ token, user, isLoading: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('meetclone_jwt');
    }
    set({ token: null, user: null, isLoading: false });
  },

  fetchMe: async () => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('meetclone_jwt') : null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/auth/me`, { headers });
      if (res.ok) {
        const user = await res.json();
        set({ user, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
