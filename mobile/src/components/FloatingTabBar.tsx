import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, radius, shadow } from "../lib/theme";
import { useCart } from "../stores/cart";
import { useNavVisibility } from "../lib/navVisibility";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: "home", off: "home-outline" },
  orders: { on: "receipt", off: "receipt-outline" },
  promos: { on: "add", off: "add" },
  cart: { on: "cart", off: "cart-outline" },
  profile: { on: "person", off: "person-outline" },
};

const BUBBLE = 46;
const PAD = 8; // bar horizontal padding

// Liquid Glass needs iOS 26+; everywhere else we fall back to the solid pill.
const glass = isLiquidGlassAvailable();

function GlassOrView({ style, children }: { style: any; children: React.ReactNode }) {
  if (glass) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive style={[style, styles.glassReset]}>
        {children}
      </GlassView>
    );
  }
  return <View style={style}>{children}</View>;
}

export function FloatingTabBar({ state, navigation }: any) {
  const cartCount = useCart((s) => s.count());
  const { hidden: minimized, setHidden } = useNavVisibility();
  const [barW, setBarW] = useState(0);

  // expand/minimize cross-fade
  const minA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(minA, {
      toValue: minimized ? 1 : 0,
      useNativeDriver: true, friction: 10, tension: 70,
    }).start();
  }, [minimized]);

  // selection bubble slides between tab slots
  const bubbleA = useRef(new Animated.Value(state.index)).current;
  useEffect(() => {
    Animated.spring(bubbleA, {
      toValue: state.index,
      useNativeDriver: true, friction: 9, tension: 90,
    }).start();
  }, [state.index]);

  const slotW = barW > 0 ? (barW - PAD * 2) / state.routes.length : 0;
  const bubbleX = bubbleA.interpolate({
    inputRange: [0, Math.max(state.routes.length - 1, 1)],
    outputRange: [
      PAD + (slotW - BUBBLE) / 2,
      PAD + (state.routes.length - 1) * slotW + (slotW - BUBBLE) / 2,
    ],
  });

  const barOpacity = minA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const barScale = minA.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] });
  const barShift = minA.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const miniOpacity = minA.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const miniScale = minA.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const activeRoute = state.routes[state.index];
  const activeIcon = (ICONS[activeRoute.name] ?? ICONS.index).on;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* minimized bubble: shows the active tab; tap to expand */}
      <Animated.View
        pointerEvents={minimized ? "auto" : "none"}
        style={[styles.miniWrap, { opacity: miniOpacity, transform: [{ scale: miniScale }] }]}
      >
        <Pressable onPress={() => setHidden(false)} hitSlop={10}>
          <GlassOrView style={styles.mini}>
            <Ionicons name={activeIcon} size={24} color={colors.primary} />
          </GlassOrView>
        </Pressable>
      </Animated.View>

      {/* full bar */}
      <Animated.View
        pointerEvents={minimized ? "none" : "auto"}
        style={{ opacity: barOpacity, transform: [{ translateY: barShift }, { scale: barScale }], alignSelf: "stretch" }}
      >
        <GlassOrView style={styles.bar}>
          <View
            style={styles.barInner}
            onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
          >
            {slotW > 0 && (
              <Animated.View style={[styles.bubble, { transform: [{ translateX: bubbleX }] }]} />
            )}
            {state.routes.map((route: any, index: number) => {
              const focused = state.index === index;
              const onPress = () => {
                setHidden(false);
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              };

              if (route.name === "promos") {
                return (
                  <View key={route.key} style={styles.item}>
                    <Pressable onPress={onPress} style={styles.plusBtn} hitSlop={8}>
                      <Ionicons name="add" size={26} color="#fff" />
                    </Pressable>
                  </View>
                );
              }

              const icon = ICONS[route.name] ?? ICONS.index;
              return (
                <Pressable key={route.key} onPress={onPress} style={styles.item} hitSlop={8}>
                  <View>
                    <Ionicons
                      name={focused ? icon.on : icon.off}
                      size={24}
                      color={focused ? colors.primary : colors.textMuted}
                    />
                    {route.name === "cart" && cartCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cartCount}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </GlassOrView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  bar: {
    backgroundColor: colors.surface, borderRadius: radius.pill,
    marginHorizontal: 20, marginBottom: 24, height: 64,
    overflow: "hidden", ...shadow, shadowOpacity: 0.16, elevation: 8,
  },
  barInner: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "space-around", paddingHorizontal: PAD,
  },
  glassReset: { backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
  bubble: {
    position: "absolute", left: 0, width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2,
    backgroundColor: glass ? "rgba(124,58,237,0.14)" : "#F3E8FF",
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", height: "100%" },
  plusBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  miniWrap: { position: "absolute", bottom: 24, alignSelf: "center" },
  mini: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center",
    ...shadow, shadowOpacity: 0.18, elevation: 8,
  },
  badge: {
    position: "absolute", top: -6, right: -10, backgroundColor: colors.accent,
    borderRadius: radius.pill, minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
