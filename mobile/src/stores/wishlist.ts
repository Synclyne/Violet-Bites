import { create } from "zustand";
import { api } from "../lib/api";
import type { MenuItem } from "../lib/types";

interface WishlistState {
  items: MenuItem[];
  load: () => Promise<void>;
  toggle: (item: MenuItem) => Promise<void>;
  has: (menuItemId: number) => boolean;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  items: [],
  load: async () => {
    set({ items: await api<MenuItem[]>("/favorites") });
  },
  toggle: async (item) => {
    if (get().has(item.id)) {
      set({ items: get().items.filter((i) => i.id !== item.id) });
      await api(`/favorites/${item.id}`, { method: "DELETE" });
    } else {
      set({ items: [...get().items, item] });
      await api("/favorites", { method: "POST", body: { menuItemId: item.id } });
    }
  },
  has: (menuItemId) => get().items.some((i) => i.id === menuItemId),
}));
