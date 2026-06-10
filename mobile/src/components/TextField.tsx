import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius } from "../lib/theme";

export function TextField({
  label, error, ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? { borderColor: colors.danger } : null]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: colors.text,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
});
