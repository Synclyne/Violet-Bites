import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../lib/api";
import type { Address, Order } from "../lib/types";
import { colors, radius, shadow } from "../lib/theme";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { useCart } from "../stores/cart";

export default function Checkout() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { lines, clear } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [placing, setPlacing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [label, setLabel] = useState("Home");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");

  const loadAddresses = async () => {
    const list = await api<Address[]>("/me/addresses");
    setAddresses(list);
    const def = list.find((a) => a.is_default) ?? list[0];
    if (def && addressId === null) setAddressId(def.id);
    if (list.length === 0) setShowNew(true);
  };

  useEffect(() => { loadAddresses().catch(() => {}); }, []);

  const saveAddress = async () => {
    if (!street.trim() || !city.trim()) {
      return Alert.alert("Missing info", "Enter street and city");
    }
    const created = await api<Address>("/me/addresses", {
      method: "POST", body: { label: label.trim() || "Home", street: street.trim(), city: city.trim() },
    });
    setShowNew(false);
    setStreet(""); setCity("");
    await loadAddresses();
    setAddressId(created.id);
  };

  const placeOrder = async () => {
    if (!addressId) return Alert.alert("Address needed", "Add a delivery address first");
    setPlacing(true);
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: {
          addressId,
          paymentMethod: payment,
          ...(code ? { discountCode: code } : {}),
          items: lines.map((l) => ({
            menuItemId: l.item.id,
            quantity: l.quantity,
            optionIds: l.options.map((o) => o.id),
          })),
        },
      });
      clear();
      router.replace({ pathname: "/order-success", params: { orderId: String(order.id) } });
    } catch (e: any) {
      Alert.alert("Order failed", e.message ?? "Try again");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.section}>Delivery address</Text>
      {addresses.map((a) => (
        <Pressable key={a.id} onPress={() => setAddressId(a.id)}
          style={[styles.card, addressId === a.id && styles.cardActive]}>
          <Text style={styles.cardTitle}>{a.label}</Text>
          <Text style={styles.cardSub}>{a.street}, {a.city}</Text>
        </Pressable>
      ))}
      {showNew ? (
        <View style={styles.card}>
          <TextField label="Label" value={label} onChangeText={setLabel} placeholder="Home" />
          <TextField label="Street" value={street} onChangeText={setStreet} placeholder="1 Main St" />
          <TextField label="City" value={city} onChangeText={setCity} placeholder="Springfield" />
          <Button title="Save address" variant="outline" onPress={saveAddress} />
        </View>
      ) : (
        <Pressable onPress={() => setShowNew(true)}>
          <Text style={styles.addNew}>+ Add new address</Text>
        </Pressable>
      )}

      <Text style={styles.section}>Payment method</Text>
      {(["cash", "card"] as const).map((m) => (
        <Pressable key={m} onPress={() => setPayment(m)}
          style={[styles.card, payment === m && styles.cardActive]}>
          <Text style={styles.cardTitle}>
            {m === "cash" ? "💵 Cash on delivery" : "💳 Card (simulated)"}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Items ({lines.length})</Text>
      {lines.map((l) => (
        <Text key={l.key} style={styles.cardSub}>
          {l.quantity}× {l.item.name} — ${(l.unitPrice * l.quantity).toFixed(2)}
        </Text>
      ))}

      <View style={{ marginTop: 12, marginBottom: 32 }}>
        <Button title="Place Order" onPress={placeOrder} loading={placing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, ...shadow },
  cardActive: { borderWidth: 2, borderColor: colors.primary },
  cardTitle: { fontWeight: "700", color: colors.text },
  cardSub: { color: colors.textMuted, marginTop: 2 },
  addNew: { color: colors.accent, fontWeight: "700" },
});
