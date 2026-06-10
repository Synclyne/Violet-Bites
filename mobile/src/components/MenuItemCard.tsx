import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type { MenuItem } from "../lib/types";
import { colors, radius, shadow } from "../lib/theme";
import { useWishlist } from "../stores/wishlist";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const router = useRouter();
  const { has, toggle } = useWishlist();
  const fav = has(item.id);
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/food/${item.id}`)}>
      <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
      <Pressable style={styles.heart} onPress={() => toggle(item)} hitSlop={8}>
        <Text style={{ fontSize: 18 }}>{fav ? "💜" : "🤍"}</Text>
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.card,
    margin: 6, overflow: "hidden", ...shadow,
  },
  image: { width: "100%", height: 110 },
  heart: {
    position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radius.pill, padding: 4,
  },
  body: { padding: 10, gap: 2 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  rating: { fontSize: 12, color: colors.textMuted },
  price: { fontSize: 15, fontWeight: "800", color: colors.primary },
});
