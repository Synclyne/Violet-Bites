import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../lib/theme";
import { Button } from "../components/Button";

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 72 }}>🛵</Text>
      <Text style={styles.title}>Order Successful!</Text>
      <Text style={styles.sub}>
        Order #{orderId} is in. Your payment went through — food is on the way soon.
      </Text>
      <View style={styles.actions}>
        <Button title="Track Order" onPress={() => router.replace(`/order/${orderId}`)} />
        <Button title="Back to Home" variant="outline" onPress={() => router.replace("/")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background, alignItems: "center",
    justifyContent: "center", padding: 24, gap: 12,
  },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  sub: { textAlign: "center", color: colors.textMuted, lineHeight: 20 },
  actions: { alignSelf: "stretch", gap: 12, marginTop: 24 },
});
