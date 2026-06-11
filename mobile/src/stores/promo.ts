import { create } from "zustand";

// Applied promo code, shared between the + (promos) tab and the cart.
interface PromoState {
  code: string | null;
  percentOff: number;
  apply: (code: string, percentOff: number) => void;
  clear: () => void;
}

export const usePromo = create<PromoState>((set) => ({
  code: null,
  percentOff: 0,
  apply: (code, percentOff) => set({ code: code.toUpperCase(), percentOff }),
  clear: () => set({ code: null, percentOff: 0 }),
}));
