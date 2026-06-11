import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { Address, Order } from "../../lib/types";
import { useAuth } from "../../stores/auth";
import { useWishlist } from "../../stores/wishlist";
import { colors, radius, shadow } from "../../lib/theme";
import { useHideNavOnScroll } from "../../lib/navVisibility";

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const favCount = useWishlist((s) => s.items.length);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const onScroll = useHideNavOnScroll();

  useFocusEffect(useCallback(() => {
    api<Address[]>("/me/addresses").then(setAddresses).catch(() => {});
    api<Order[]>("/orders").then((o) => setOrderCount(o.length)).catch(() => {});
  }, []));

  const removeAddress = (a: Address) => {
    Alert.alert("Delete address", `Remove "${a.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await api(`/me/addresses/${a.id}`, { method: "DELETE" });
          setAddresses((list) => list.filter((x) => x.id !== a.id));
        },
      },
    ]);
  };

  const initial = (user?.name?.[0] ?? "?").toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}
      onScroll={onScroll} scrollEventThrottle={16}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
      </View>

      <View style={styles.tiles}>
        <Tile icon="heart-outline" label="Favorites" badge={favCount || undefined}
          onPress={() => router.push("/wishlist")} />
        <Tile icon="receipt-outline" label="Orders" badge={orderCount || undefined}
          onPress={() => router.push("/orders")} />
        <Tile icon="pricetag-outline" label="Promos"
          onPress={() => router.push("/promos")} />
      </View>

      <View style={styles.card}>
        <MenuRow icon="location-outline" title="Addresses"
          subtitle={addresses.length ? `${addresses.length} saved` : "None saved yet"} />
        {addresses.map((a) => (
          <View key={a.id} style={styles.addrRow}>
            <Ionicons name={a.label.toLowerCase() === "home" ? "home-outline" : "business-outline"}
              size={18} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addrLabel}>
                {a.label}{a.is_default ? <Text style={styles.defaultTag}>  ·  default</Text> : null}
              </Text>
              <Text style={styles.addrSub}>{a.street}, {a.city}</Text>
            </View>
            <Pressable onPress={() => removeAddress(a)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Pressable onPress={() => router.push("/promos")}>
          <MenuRow icon="gift-outline" title="Promotions" subtitle="See available offers" chevron />
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={() => router.push("/orders")}>
          <MenuRow icon="time-outline" title="Order history" subtitle={`${orderCount} orders placed`} chevron />
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={() =>
          Alert.alert("Log out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log Out", style: "destructive", onPress: () => logout() },
          ])
        }>
          <MenuRow icon="log-out-outline" title="Log out" danger />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Tile({ icon, label, badge, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; badge?: number; onPress: () => void;
}) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <View>
        <Ionicons name={icon} size={24} color={colors.text} />
        {badge !== undefined && (
          <View style={styles.tileBadge}><Text style={styles.tileBadgeText}>{badge}</Text></View>
        )}
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({ icon, title, subtitle, chevron, danger }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string;
  chevron?: boolean; danger?: boolean;
}) {
  return (
    <View style={styles.menuRow}>
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {chevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  headerRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 20,
  },
  name: { fontSize: 26, fontWeight: "800", color: colors.text },
  email: { color: colors.textMuted, marginTop: 2 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 22 },
  tiles: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  tile: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.card,
    alignItems: "center", paddingVertical: 18, gap: 8, ...shadow,
  },
  tileLabel: { fontSize: 13, fontWeight: "700", color: colors.text },
  tileBadge: {
    position: "absolute", top: -6, right: -12, backgroundColor: colors.accent,
    borderRadius: radius.pill, minWidth: 17, height: 17,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  tileBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    marginHorizontal: 16, marginBottom: 14, ...shadow,
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 54 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  menuSub: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  addrRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  addrLabel: { fontWeight: "700", color: colors.text, fontSize: 14 },
  defaultTag: { color: colors.accent, fontWeight: "600", fontSize: 12 },
  addrSub: { color: colors.textMuted, fontSize: 13 },
});
