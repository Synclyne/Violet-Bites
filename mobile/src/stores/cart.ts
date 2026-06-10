import { create } from "zustand";
import type { ItemOption, MenuItem } from "../lib/types";

export interface CartLine {
  key: string;            // menuItemId + sorted optionIds
  item: MenuItem;
  options: ItemOption[];
  quantity: number;
  unitPrice: number;      // base + option deltas
}

interface CartState {
  lines: CartLine[];
  add: (item: MenuItem, options: ItemOption[], quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
}

const lineKey = (itemId: number, options: ItemOption[]) =>
  `${itemId}:${options.map((o) => o.id).sort((a, b) => a - b).join(",")}`;

export const useCart = create<CartState>((set, get) => ({
  lines: [],
  add: (item, options, quantity) => {
    const key = lineKey(item.id, options);
    const unitPrice = Math.round(
      (item.price + options.reduce((s, o) => s + o.price_delta, 0)) * 100
    ) / 100;
    set((state) => {
      const existing = state.lines.find((l) => l.key === key);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + quantity } : l),
        };
      }
      return { lines: [...state.lines, { key, item, options, quantity, unitPrice }] };
    });
  },
  setQuantity: (key, quantity) =>
    set((state) => ({
      lines: quantity <= 0
        ? state.lines.filter((l) => l.key !== key)
        : state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
    })),
  remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
  clear: () => set({ lines: [] }),
  subtotal: () =>
    Math.round(get().lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) * 100) / 100,
  count: () => get().lines.reduce((s, l) => s + l.quantity, 0),
}));
