import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../components/Button";

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🍔</Text>
        <Text style={styles.title}>Violet Bites</Text>
        <Text style={styles.tagline}>Fresh food, delivered to your door.</Text>
      </View>
      <View style={styles.actions}>
        <Button title="Get Started" variant="pink" onPress={() => router.push("/(auth)/register")} />
        <Button title="I already have an account" variant="outline"
          onPress={() => router.push("/(auth)/login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#7C3AED", justifyContent: "space-between", padding: 24, paddingTop: 120, paddingBottom: 48 },
  hero: { alignItems: "center", gap: 12 },
  emoji: { fontSize: 72 },
  title: { fontSize: 36, fontWeight: "800", color: "#fff" },
  tagline: { fontSize: 16, color: "#E9D5FF" },
  actions: { gap: 12 },
});
