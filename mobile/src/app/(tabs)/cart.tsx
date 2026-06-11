import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../stores/cart";
import { usePromo } from "../../stores/promo";
import { colors, radius, shadow } from "../../lib/theme";
import { Button } from "../../components/Button";
import { Stepper } from "../../components/Stepper";

export const DELIVERY_FEE = 2.99;

export default function Cart() {
  const router = useRouter();
  const { lines, setQuantity, remove, subtotal } = useCart();
  const { code, percentOff, clear } = usePromo();

  const sub = subtotal();
  const discount = Math.round(sub * percentOff) / 100;
  const total = Math.round((sub - discount + DELIVERY_FEE) * 100) / 100;

  if (lines.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={56} color={colors.textMuted} />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Button title="Browse the menu" onPress={() => router.push("/")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cart</Text>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.key}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }}
        renderItem={({ item: l }) => (
          <View style={styles.line}>
            <Image source={{ uri: l.item.image_url }} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{l.item.name}</Text>
              {l.options.length > 0 && (
                <Text style={styles.opts}>{l.options.map((o) => o.name).join(", ")}</Text>
              )}
              <Text style={styles.price}>${l.unitPrice.toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Pressable onPress={() => remove(l.key)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
              <Stepper value={l.quantity} onChange={(v) => setQuantity(l.key, v)} min={1} />
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        {code ? (
          <View style={styles.promoRow}>
            <Ionicons name="pricetag" size={16} color={colors.accent} />
            <Text style={styles.promoText}>
              <Text style={{ fontWeight: "800" }}>{code}</Text> — {percentOff}% off
            </Text>
            <Pressable onPress={clear} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.promoRow} onPress={() => router.push("/promos")}>
            <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
            <Text style={[styles.promoText, { color: colors.accent, fontWeight: "700" }]}>
              Add a promo code
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </Pressable>
        )}
        <Row label="Subtotal" value={sub} />
        {discount > 0 && <Row label="Discount" value={-discount} accent />}
        <Row label="Delivery fee" value={DELIVERY_FEE} />
        <Row label="Total" value={total} bold />
        <Button title="Checkout" onPress={() =>
          router.push({ pathname: "/checkout", params: { code: code ?? "" } })} />
      </View>
    </View>
  );
}

function Row({ label, value, bold, accent }: {
  label: string; value: number; bold?: boolean; accent?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold, accent && { color: colors.accent }]}>
        {value < 0 ? "-" : ""}${Math.abs(value).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, paddingHorizontal: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyText: { fontSize: 16, color: colors.textMuted },
  line: {
    flexDirection: "row", gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.card, padding: 12, ...shadow,
  },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  name: { fontWeight: "700", color: colors.text },
  opts: { fontSize: 12, color: colors.textMuted },
  price: { fontWeight: "800", color: colors.primary, marginTop: 4 },
  footer: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 16, paddingBottom: 104, gap: 8, ...shadow,
  },
  promoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  promoText: { flex: 1, color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textMuted },
  rowValue: { color: colors.text, fontWeight: "600" },
  bold: { fontSize: 17, fontWeight: "800", color: colors.text },
});
