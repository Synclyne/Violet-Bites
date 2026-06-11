import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import type { ItemOption, MenuItemDetail } from "../../lib/types";
import { colors, radius, shadow } from "../../lib/theme";
import { Stepper } from "../../components/Stepper";
import { useCart } from "../../stores/cart";
import { useWishlist } from "../../stores/wishlist";

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const { has, toggle } = useWishlist();
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
  const fav = has(item.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View>
          <Image source={{ uri: item.image_url }} style={styles.hero} contentFit="cover" />
          <Pressable style={[styles.fab, { left: 16 }]} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Pressable style={[styles.fab, { right: 16 }]} onPress={() => toggle(item)} hitSlop={8}>
            <Ionicons name={fav ? "heart" : "heart-outline"} size={22}
              color={fav ? colors.accent : colors.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <View style={styles.ratingChip}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)} ({item.reviews.length})</Text>
          </View>
          <Text style={styles.desc}>{item.description}</Text>
        </View>

        {sizes.length > 0 && (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Choose your size</Text>
              <View style={styles.requiredChip}><Text style={styles.requiredText}>Required</Text></View>
            </View>
            {sizes.map((o, i) => {
              const on = sizeId === o.id;
              return (
                <Pressable key={o.id} onPress={() => setSizeId(o.id)}
                  style={[styles.optionRow, i > 0 && styles.optionDivider]}>
                  <Text style={styles.optionName}>{o.name}</Text>
                  {o.price_delta > 0 && (
                    <Text style={styles.optionDelta}>+${o.price_delta.toFixed(2)}</Text>
                  )}
                  <Ionicons
                    name={on ? "radio-button-on" : "radio-button-off"}
                    size={22} color={on ? colors.primary : colors.border}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        {extras.length > 0 && (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Add extras</Text>
              <View style={[styles.requiredChip, { backgroundColor: colors.border }]}>
                <Text style={[styles.requiredText, { color: colors.textMuted }]}>Optional</Text>
              </View>
            </View>
            {extras.map((o, i) => {
              const on = extraIds.includes(o.id);
              return (
                <Pressable key={o.id}
                  onPress={() => setExtraIds(on
                    ? extraIds.filter((x) => x !== o.id) : [...extraIds, o.id])}
                  style={[styles.optionRow, i > 0 && styles.optionDivider]}>
                  <Text style={styles.optionName}>{o.name}</Text>
                  <Text style={styles.optionDelta}>+${o.price_delta.toFixed(2)}</Text>
                  <Ionicons
                    name={on ? "checkbox" : "square-outline"}
                    size={22} color={on ? colors.primary : colors.border}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Reviews ({item.reviews.length})</Text>
          </View>
          {item.reviews.length === 0 && (
            <Text style={[styles.desc, { paddingHorizontal: 16, paddingBottom: 14 }]}>
              No reviews yet — be the first!
            </Text>
          )}
          {item.reviews.map((r, i) => (
            <View key={i} style={[styles.reviewRow, i > 0 && styles.optionDivider]}>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons key={n} name={n <= r.rating ? "star" : "star-outline"}
                    size={13} color="#F59E0B" />
                ))}
                <Text style={styles.reviewName}>{r.user_name}</Text>
              </View>
              {r.comment ? <Text style={styles.desc}>{r.comment}</Text> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Stepper value={quantity} onChange={(v) => setQuantity(Math.max(1, v))} />
        <Pressable style={styles.addBtn} onPress={() => {
          add(item, selected, quantity);
          router.back();
        }}>
          <Text style={styles.addText}>
            Add {quantity} to cart  •  ${(unitPrice * quantity).toFixed(2)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { width: "100%", height: 280 },
  fab: {
    position: "absolute", top: 52, width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center",
    ...shadow,
  },
  body: { padding: 16, gap: 4 },
  name: { fontSize: 26, fontWeight: "800", color: colors.text },
  price: { fontSize: 20, fontWeight: "800", color: colors.primary },
  ratingChip: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border,
    marginTop: 4,
  },
  ratingText: { fontSize: 12, fontWeight: "600", color: colors.text },
  desc: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 4 },
  group: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    marginHorizontal: 16, marginBottom: 14, overflow: "hidden", ...shadow,
  },
  groupHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, paddingBottom: 10,
  },
  groupTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  requiredChip: {
    backgroundColor: colors.text, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  requiredText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  optionRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  optionDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  optionName: { flex: 1, fontSize: 15, color: colors.text },
  optionDelta: { fontSize: 14, color: colors.textMuted },
  reviewRow: { paddingHorizontal: 16, paddingVertical: 12 },
  reviewStars: { flexDirection: "row", alignItems: "center", gap: 2 },
  reviewName: { marginLeft: 8, fontWeight: "700", color: colors.text, fontSize: 13 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row",
    alignItems: "center", gap: 14, padding: 16, paddingBottom: 32,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  addBtn: {
    flex: 1, backgroundColor: colors.text, borderRadius: radius.pill,
    paddingVertical: 16, alignItems: "center",
  },
  addText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
