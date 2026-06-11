import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { Order, OrderStatus } from "../../lib/types";
import { colors, radius, shadow } from "../../lib/theme";
import { Button } from "../../components/Button";

const STEPS: { status: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: "placed", label: "Order placed", icon: "receipt-outline" },
  { status: "preparing", label: "Preparing your food", icon: "restaurant-outline" },
  { status: "on_the_way", label: "On the way", icon: "bicycle-outline" },
  { status: "delivered", label: "Delivered", icon: "checkmark-done-outline" },
];

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () =>
      api<Order>(`/orders/${id}`)
        .then((o) => { if (active) setOrder(o); })
        .catch((e) => { if (active) setError(e.message); });
    load();
    const t = setInterval(load, 10000); // poll every 10s per spec
    return () => { active = false; clearInterval(t); };
  }, [id]);

  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (!order) return <View style={styles.center}><Text>Loading…</Text></View>;

  const currentIdx = STEPS.findIndex((s) => s.status === order.status);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
      <View style={styles.card}>
        {STEPS.map((s, i) => {
          const done = i <= currentIdx;
          return (
            <View key={s.status} style={styles.step}>
              <View style={[styles.dot, done && { backgroundColor: colors.primary }]}>
                <Ionicons name={s.icon} size={16} color={done ? "#fff" : colors.textMuted} />
              </View>
              <Text style={[styles.stepLabel, done && { color: colors.text, fontWeight: "700" }]}>
                {s.label}
              </Text>
              {i === currentIdx && order.status !== "delivered" && (
                <Text style={styles.now}>now</Text>
              )}
              {done && i < currentIdx && (
                <Ionicons name="checkmark" size={16} color={colors.success} style={{ marginLeft: "auto" }} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Items</Text>
        {order.items.map((it) => (
          <Text key={it.id} style={styles.line}>
            {it.quantity}× {it.name}
            {it.selected_options.length > 0
              ? ` (${it.selected_options.map((o) => o.name).join(", ")})` : ""}
            {"  "}${(it.unit_price * it.quantity).toFixed(2)}
          </Text>
        ))}
        <Text style={styles.line}>Subtotal  ${order.subtotal.toFixed(2)}</Text>
        {order.discount > 0 && (
          <Text style={[styles.line, { color: colors.accent }]}>
            Discount ({order.discount_code})  -${order.discount.toFixed(2)}
          </Text>
        )}
        <Text style={styles.line}>Delivery  ${order.delivery_fee.toFixed(2)}</Text>
        <Text style={styles.total}>Total  ${order.total.toFixed(2)}</Text>
      </View>

      {order.address && (
        <View style={styles.card}>
          <Text style={styles.section}>Deliver to</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={styles.line}>
              {order.address.label} — {order.address.street}, {order.address.city}
            </Text>
          </View>
        </View>
      )}

      {order.status === "delivered" && (
        <Button title="Leave a review" variant="pink"
          onPress={() => router.push(`/review/${order.id}`)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, ...shadow },
  step: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  dot: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  stepLabel: { color: colors.textMuted, fontSize: 15 },
  now: {
    marginLeft: "auto", color: colors.accent, fontWeight: "800", fontSize: 12,
    textTransform: "uppercase",
  },
  section: { fontWeight: "800", color: colors.text, marginBottom: 6 },
  line: { color: colors.textMuted, paddingVertical: 2 },
  total: { fontWeight: "800", color: colors.text, marginTop: 6, fontSize: 16 },
});
