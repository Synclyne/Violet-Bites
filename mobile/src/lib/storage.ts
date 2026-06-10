import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// SecureStore is unavailable on web; fall back to localStorage so the app
// (and browser-based testing) still works there.
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") { globalThis.localStorage?.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === "web") { globalThis.localStorage?.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};
