import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../lib/theme";

export function Button({
  title, onPress, variant = "primary", loading = false, disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "pink";
  loading?: boolean;
  disabled?: boolean;
}) {
  const bg = variant === "primary" ? colors.primary
    : variant === "pink" ? colors.accent : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.7 : 1 },
        variant === "outline" && { borderWidth: 2, borderColor: colors.primary },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.primary : "#fff"} />
      ) : (
        <Text style={[styles.label, variant === "outline" && { color: colors.primary }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: "center", justifyContent: "center",
  },
  label: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
