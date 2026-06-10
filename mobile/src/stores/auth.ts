import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, setAuthToken, setOnUnauthorized } from "../lib/api";
import type { User } from "../lib/types";

const TOKEN_KEY = "vb_token";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  const adopt = async (token: string, user: User) => {
    setAuthToken(token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ user });
  };

  setOnUnauthorized(() => {
    setAuthToken(null);
    SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ user: null });
  });

  return {
    user: null,
    hydrated: false,
    hydrate: async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          const user = await api<User>("/me");
          set({ user, hydrated: true });
          return;
        } catch {
          setAuthToken(null);
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
      set({ hydrated: true });
    },
    login: async (email, password) => {
      const res = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST", body: { email, password },
      });
      await adopt(res.token, res.user);
    },
    register: async (name, email, password) => {
      const res = await api<{ token: string; user: User }>("/auth/register", {
        method: "POST", body: { name, email, password },
      });
      await adopt(res.token, res.user);
    },
    logout: async () => {
      setAuthToken(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({ user: null });
    },
  };
});
