import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCart } from "../stores/cart";
import { api } from "../lib/api";
import { colors, radius, shadow } from "../lib/theme";
import { Button } from "../components/Button";
import { Stepper } from "../components/Stepper";

export const DELIVERY_FEE = 2.99;

export default function Cart() {
  const router = useRouter();
  const { lines, setQuantity, remove, subtotal } = useCart();
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState(0);
  const [codeMsg, setCodeMsg] = useState("");

  const sub = subtotal();
  const discount = Math.round(sub * percentOff) / 100;
  const total = Math.round((sub - discount + DELIVERY_FEE) * 100) / 100;

  const applyCode = async () => {
    try {
      const res = await api<{ percentOff: number }>("/discounts/validate", {
        method: "POST", body: { code: code.trim() },
      });
      setPercentOff(res.percentOff);
      setCodeMsg(`Applied: ${res.percentOff}% off`);
    } catch {
      setPercentOff(0);
      setCodeMsg("Invalid code");
    }
  };

  if (lines.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 48 }}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Button title="Browse the menu" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.key}
        contentContainerStyle={{ padding: 16, gap: 12 }}
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
                <Text style={{ color: colors.danger }}>Remove</Text>
              </Pressable>
              <Stepper value={l.quantity} onChange={(v) => setQuantity(l.key, v)} min={1} />
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.codeRow}>
          <TextInput
            style={styles.codeInput} placeholder="Discount code" value={code}
            onChangeText={setCode} autoCapitalize="characters"
            placeholderTextColor={colors.textMuted}
          />
          <Button title="Apply" variant="pink" onPress={applyCode} />
        </View>
        {codeMsg ? (
          <Text style={{ color: percentOff ? colors.success : colors.danger }}>{codeMsg}</Text>
        ) : null}
        <Row label="Subtotal" value={sub} />
        {discount > 0 && <Row label="Discount" value={-discount} accent />}
        <Row label="Delivery fee" value={DELIVERY_FEE} />
        <Row label="Total" value={total} bold />
        <Button title="Checkout" onPress={() =>
          router.push({ pathname: "/checkout", params: { code: percentOff ? code.trim() : "" } })} />
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
  container: { flex: 1, backgroundColor: colors.background },
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
    padding: 16, paddingBottom: 28, gap: 8, ...shadow,
  },
  codeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  codeInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textMuted },
  rowValue: { color: colors.text, fontWeight: "600" },
  bold: { fontSize: 17, fontWeight: "800", color: colors.text },
});
