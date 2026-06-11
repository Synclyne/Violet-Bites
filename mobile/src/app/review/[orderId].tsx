import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";
import { Button } from "../../components/Button";

export default function ReviewOrder() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (rating === 0) return Alert.alert("Pick a rating", "Tap the stars first");
    setSending(true);
    try {
      await api("/reviews", {
        method: "POST",
        body: { orderId: Number(orderId), rating, comment: comment.trim() },
      });
      // navigate first: Alert is a no-op on web, so back() must not live in its callback
      router.back();
      Alert.alert("Thanks!", "Your review was submitted.");
    } catch (e: any) {
      Alert.alert("Couldn't submit", e.message ?? "Try again");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was your order?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
            <Ionicons
              name={n <= rating ? "star" : "star-outline"}
              size={40}
              color={n <= rating ? "#F59E0B" : colors.border}
            />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Tell us more (optional)"
        placeholderTextColor={colors.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
      />
      <Button title="Submit Review" variant="pink" onPress={submit} loading={sending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center", marginTop: 16 },
  stars: { flexDirection: "row", justifyContent: "center", gap: 10 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, padding: 14, minHeight: 100, textAlignVertical: "top",
    color: colors.text,
  },
});
