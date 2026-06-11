import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWishlist } from "../stores/wishlist";
import { MenuItemCard } from "../components/MenuItemCard";
import { colors } from "../lib/theme";

export default function Wishlist() {
  const { items, load } = useWishlist();
  useFocusEffect(useCallback(() => { load().catch(() => {}); }, []));

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={56} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted }}>No favorites yet — tap the heart on any dish</Text>
      </View>
    );
  }
  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 6, paddingBottom: 40 }}
      data={items}
      numColumns={2}
      keyExtractor={(i) => String(i.id)}
      renderItem={({ item }) => <MenuItemCard item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24,
    backgroundColor: colors.background,
  },
});
