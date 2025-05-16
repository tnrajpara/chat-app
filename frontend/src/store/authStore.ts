import api from "@/lib/api";
import { create } from "zustand";

interface UserData {
  email: string;
  name: string;
  iat: Number;
  exp: Number;
}

interface AuthState {
  isAuthenticated: boolean | null;
  userData: UserData | null;
  setAuth: (user: UserData) => void;
  clearAuth: () => void;
  verifyAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: null,
  userData: null,

  setAuth: (userData) => set({ isAuthenticated: true, userData }),

  clearAuth: () => set({ isAuthenticated: false, userData: null }),

  verifyAuth: async () => {
    try {
      const res = await api.get("/api/users/verify");

      if (res.status === 200) {
        set({ isAuthenticated: true, userData: res.data.user.payload });
      }
    } catch (err) {
      console.error("Authentication error:", err);
      set({ isAuthenticated: false, userData: null });
    }
  },
}));
