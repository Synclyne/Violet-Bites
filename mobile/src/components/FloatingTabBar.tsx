import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, radius, shadow } from "../lib/theme";
import { useCart } from "../stores/cart";
import { useNavVisibility } from "../lib/navVisibility";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: "home", off: "home-outline" },
  orders: { on: "receipt", off: "receipt-outline" },
  cart: { on: "cart", off: "cart-outline" },
  profile: { on: "person", off: "person-outline" },
};

// Liquid Glass needs iOS 26+; everywhere else we fall back to the solid pill.
const glass = isLiquidGlassAvailable();

export function FloatingTabBar({ state, navigation }: any) {
  const cartCount = useCart((s) => s.count());
  const { hidden, setHidden } = useNavVisibility();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: hidden ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 60,
    }).start();
  }, [hidden]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 130] });

  const items = state.routes.map((route: any, index: number) => {
    const focused = state.index === index;
    const onPress = () => {
      setHidden(false); // switching tabs always reveals the nav
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
  });

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }] }]} pointerEvents="box-none">
      {glass ? (
        <GlassView glassEffectStyle="regular" isInteractive style={[styles.bar, styles.barGlass]}>
          {items}
        </GlassView>
      ) : (
        <View style={styles.bar}>{items}</View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  bar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: colors.surface, borderRadius: radius.pill,
    marginHorizontal: 20, marginBottom: 24, height: 64, alignSelf: "stretch",
    paddingHorizontal: 8, overflow: "hidden", ...shadow, shadowOpacity: 0.16, elevation: 8,
  },
  barGlass: {
    backgroundColor: "transparent", shadowOpacity: 0, elevation: 0,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", height: "100%" },
  plusBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -6, right: -10, backgroundColor: colors.accent,
    borderRadius: radius.pill, minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
