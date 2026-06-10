import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../lib/theme";

export function Stepper({
  value, onChange, min = 1,
}: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.btn} onPress={() => onChange(Math.max(min - 1, value - 1))}>
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable style={styles.btn} onPress={() => onChange(value + 1)}>
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  btn: {
    width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 22 },
  value: { fontSize: 16, fontWeight: "700", color: colors.text, minWidth: 20, textAlign: "center" },
});
