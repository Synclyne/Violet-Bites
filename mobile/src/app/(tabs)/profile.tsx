import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../lib/api";
import type { Address, Order } from "../../lib/types";
import { useAuth } from "../../stores/auth";
import { colors, radius, shadow } from "../../lib/theme";
import { Button } from "../../components/Button";

export default function Profile() {
  const { user, logout } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderCount, setOrderCount] = useState(0);

  useFocusEffect(useCallback(() => {
    api<Address[]>("/me/addresses").then(setAddresses).catch(() => {});
    api<Order[]>("/orders").then((o) => setOrderCount(o.length)).catch(() => {});
  }, []));

  const removeAddress = (a: Address) => {
    Alert.alert("Delete address", `Remove "${a.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await api(`/me/addresses/${a.id}`, { method: "DELETE" });
          setAddresses((list) => list.filter((x) => x.id !== a.id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}><Text style={{ fontSize: 28 }}>👤</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.stat}>{orderCount} orders placed</Text>
      </View>

      <Text style={styles.section}>Saved addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ gap: 8 }}
        ListEmptyComponent={<Text style={styles.muted}>No addresses saved yet</Text>}
        renderItem={({ item: a }) => (
          <View style={styles.addr}>
            <View style={{ flex: 1 }}>
              <Text style={styles.addrLabel}>{a.label}{a.is_default ? " · default" : ""}</Text>
              <Text style={styles.muted}>{a.street}, {a.city}</Text>
            </View>
            <Pressable onPress={() => removeAddress(a)} hitSlop={8}>
              <Text style={{ color: colors.danger }}>Delete</Text>
            </Pressable>
          </View>
        )}
      />

      <Button title="Log Out" variant="outline" onPress={() => logout()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 60, gap: 12 },
  headerCard: {
    backgroundColor: colors.surface, borderRadius: radius.card, padding: 20,
    alignItems: "center", gap: 4, ...shadow,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  name: { fontSize: 20, fontWeight: "800", color: colors.text },
  email: { color: colors.textMuted },
  stat: { color: colors.accent, fontWeight: "700", marginTop: 4 },
  section: { fontSize: 16, fontWeight: "800", color: colors.text },
  muted: { color: colors.textMuted },
  addr: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderRadius: radius.card, padding: 14, ...shadow,
  },
  addrLabel: { fontWeight: "700", color: colors.text },
});
