import { useRef } from "react";
import { create } from "zustand";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

// Shared "is the floating nav hidden" flag, driven by scroll direction.
export const useNavVisibility = create<{ hidden: boolean; setHidden: (h: boolean) => void }>(
  (set) => ({
    hidden: false,
    setHidden: (hidden) => set((s) => (s.hidden === hidden ? s : { hidden })),
  })
);

// Attach to any scrollable: onScroll={useHideNavOnScroll()} scrollEventThrottle={16}
// Scrolling down hides the nav, scrolling up (or reaching the top) shows it.
export function useHideNavOnScroll() {
  const last = useRef(0);
  const setHidden = useNavVisibility((s) => s.setHidden);
  return (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - last.current;
    if (y <= 0) setHidden(false);
    else if (dy > 6 && y > 40) setHidden(true);
    else if (dy < -6) setHidden(false);
    last.current = y;
  };
}
