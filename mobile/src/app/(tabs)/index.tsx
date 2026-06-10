import { useCallback, useEffect, useState } from "react";
import {
  FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import type { Category, MenuItem } from "../../lib/types";
import { colors, radius } from "../../lib/theme";
import { MenuItemCard } from "../../components/MenuItemCard";
import { useAuth } from "../../stores/auth";
import { useCart } from "../../stores/cart";
import { useWishlist } from "../../stores/wishlist";

export default function Home() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const cartCount = useCart((s) => s.count());
  const loadWishlist = useWishlist((s) => s.load);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (activeCat) params.set("category", String(activeCat));
      if (search) params.set("search", search);
      const qs = params.toString();
      const data = await api<{ categories: Category[]; items: MenuItem[] }>(
        `/menu${qs ? `?${qs}` : ""}`);
      setCategories(data.categories);
      setItems(data.items);
    } catch (e: any) {
      setError(e.message ?? "Failed to load menu");
    }
  }, [activeCat, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadWishlist().catch(() => {}); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>Hi {user?.name?.split(" ")[0]} 👋</Text>
          <Text style={styles.hungry}>Hungry? Order & eat.</Text>
        </View>
        <Pressable style={styles.cartBtn} onPress={() => router.push("/cart")}>
          <Text style={{ fontSize: 20 }}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
          )}
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search food..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <View>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={[{ id: 0, name: "All", icon: "✨" } as Category, ...categories]}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          renderItem={({ item: c }) => {
            const active = (activeCat ?? 0) === c.id;
            return (
              <Pressable
                onPress={() => setActiveCat(c.id === 0 ? null : c.id)}
                style={[styles.chip, active && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.chipText, active && { color: "#fff" }]}>
                  {c.icon} {c.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={load}><Text style={styles.retry}>Tap to retry</Text></Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 6, paddingBottom: 24 }}
          renderItem={({ item }) => <MenuItemCard item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => {
              setRefreshing(true); await load(); setRefreshing(false);
            }} />
          }
          ListEmptyComponent={
            <Text style={[styles.error, { marginTop: 40 }]}>No dishes found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 12,
  },
  hi: { fontSize: 22, fontWeight: "800", color: colors.text },
  hungry: { fontSize: 14, color: colors.textMuted },
  cartBtn: { padding: 8 },
  badge: {
    position: "absolute", top: 0, right: 0, backgroundColor: colors.accent,
    borderRadius: radius.pill, minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  search: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.surface,
    borderRadius: radius.input, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  chip: {
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  error: { color: colors.textMuted, textAlign: "center" },
  retry: { color: colors.primary, fontWeight: "700" },
});
