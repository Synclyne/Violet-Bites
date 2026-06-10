import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import type { ItemOption, MenuItemDetail } from "../../lib/types";
import { colors, radius, shadow } from "../../lib/theme";
import { Button } from "../../components/Button";
import { Stepper } from "../../components/Stepper";
import { useCart } from "../../stores/cart";

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [item, setItem] = useState<MenuItemDetail | null>(null);
  const [error, setError] = useState("");
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [extraIds, setExtraIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api<MenuItemDetail>(`/menu/${id}`)
      .then((d) => {
        setItem(d);
        const firstSize = d.options.find((o) => o.kind === "size");
        if (firstSize) setSizeId(firstSize.id);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const selected: ItemOption[] = useMemo(() => {
    if (!item) return [];
    return item.options.filter((o) => o.id === sizeId || extraIds.includes(o.id));
  }, [item, sizeId, extraIds]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    return item.price + selected.reduce((s, o) => s + o.price_delta, 0);
  }, [item, selected]);

  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (!item) return <View style={styles.center}><Text>Loading…</Text></View>;

  const sizes = item.options.filter((o) => o.kind === "size");
  const extras = item.options.filter((o) => o.kind === "extra");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Image source={{ uri: item.image_url }} style={styles.hero} contentFit="cover" />
        <View style={styles.body}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.desc}>{item.description}</Text>

          {sizes.length > 0 && (
            <>
              <Text style={styles.section}>Size</Text>
              <View style={styles.optionRow}>
                {sizes.map((o) => (
                  <Pressable key={o.id} onPress={() => setSizeId(o.id)}
                    style={[styles.option, sizeId === o.id && styles.optionActive]}>
                    <Text style={[styles.optionText, sizeId === o.id && { color: "#fff" }]}>
                      {o.name}{o.price_delta > 0 ? ` +$${o.price_delta.toFixed(2)}` : ""}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {extras.length > 0 && (
            <>
              <Text style={styles.section}>Extras</Text>
              <View style={styles.optionRow}>
                {extras.map((o) => {
                  const on = extraIds.includes(o.id);
                  return (
                    <Pressable key={o.id}
                      onPress={() => setExtraIds(on
                        ? extraIds.filter((x) => x !== o.id) : [...extraIds, o.id])}
                      style={[styles.option, on && styles.optionActive]}>
                      <Text style={[styles.optionText, on && { color: "#fff" }]}>
                        {o.name} +${o.price_delta.toFixed(2)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.qtyRow}>
            <Text style={styles.section}>Quantity</Text>
            <Stepper value={quantity} onChange={(v) => setQuantity(Math.max(1, v))} />
          </View>

          <Text style={styles.section}>Reviews ({item.reviews.length})</Text>
          {item.reviews.length === 0 && (
            <Text style={styles.desc}>No reviews yet — be the first!</Text>
          )}
          {item.reviews.map((r, i) => (
            <View key={i} style={styles.review}>
              <Text style={styles.reviewHead}>{"⭐".repeat(r.rating)} · {r.user_name}</Text>
              {r.comment ? <Text style={styles.desc}>{r.comment}</Text> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.price}>${(unitPrice * quantity).toFixed(2)}</Text>
        <View style={{ flex: 1 }}>
          <Button title="Add to Cart" onPress={() => {
            add(item, selected, quantity);
            router.back();
          }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { width: "100%", height: 240 },
  body: { padding: 16, gap: 6 },
  name: { fontSize: 24, fontWeight: "800", color: colors.text },
  rating: { color: colors.textMuted },
  desc: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  section: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 14 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  option: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 13, fontWeight: "600", color: colors.text },
  qtyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  review: {
    backgroundColor: colors.surface, borderRadius: radius.card, padding: 12, marginTop: 8, ...shadow,
  },
  reviewHead: { fontWeight: "700", color: colors.text, marginBottom: 2 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row",
    alignItems: "center", gap: 16, padding: 16, paddingBottom: 28,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  price: { fontSize: 22, fontWeight: "800", color: colors.primary },
});
