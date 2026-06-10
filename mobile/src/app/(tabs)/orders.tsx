import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../lib/api";
import type { MenuItemDetail, Order, OrderStatus } from "../../lib/types";
import { colors, radius, shadow } from "../../lib/theme";
import { useCart } from "../../stores/cart";

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed", preparing: "Preparing", on_the_way: "On the way", delivered: "Delivered",
};

export default function Orders() {
  const router = useRouter();
  const addToCart = useCart((s) => s.add);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useFocusEffect(useCallback(() => {
    api<Order[]>("/orders").then(setOrders).catch((e) => setError(e.message));
  }, []));

  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>🧾</Text>
        <Text style={{ color: colors.textMuted }}>No orders yet — discover and order now</Text>
      </View>
    );
  }

  const reorder = (o: Order) => {
    for (const it of o.items) {
      // reorder uses fresh item data so prices/options stay current
      api<MenuItemDetail>(`/menu/${it.menu_item_id}`).then((detail) => {
        const opts = detail.options.filter((opt) =>
          it.selected_options.some((s) => s.id === opt.id));
        addToCart(detail, opts, it.quantity);
      }).catch(() => {});
    }
    router.push("/cart");
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingTop: 60 }}
      data={orders}
      keyExtractor={(o) => String(o.id)}
      renderItem={({ item: o }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/order/${o.id}`)}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>Order #{o.id}</Text>
            <View style={[styles.badge,
              o.status === "delivered" ? { backgroundColor: "#DCFCE7" } : { backgroundColor: "#F3E8FF" }]}>
              <Text style={[styles.badgeText,
                o.status === "delivered" ? { color: colors.success } : { color: colors.primary }]}>
                {STATUS_LABEL[o.status]}
              </Text>
            </View>
          </View>
          <Text style={styles.sub}>
            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
          </Text>
          <Text style={styles.total}>${o.total.toFixed(2)}</Text>
          {o.status === "delivered" && (
            <View style={styles.actions}>
              <Pressable style={styles.actionBtn} onPress={() => reorder(o)}>
                <Text style={styles.actionText}>Reorder</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={() => router.push(`/review/${o.id}`)}>
                <Text style={styles.actionText}>Review</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, ...shadow },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontWeight: "800", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  sub: { color: colors.textMuted, marginTop: 6 },
  total: { fontWeight: "800", color: colors.primary, marginTop: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
