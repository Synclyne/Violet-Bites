import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { colors, radius, shadow } from "../../lib/theme";
import { usePromo } from "../../stores/promo";
import { useHideNavOnScroll } from "../../lib/navVisibility";

interface Code { code: string; percent_off: number }

export default function Promos() {
  const { code: applied, apply, clear } = usePromo();
  const onScroll = useHideNavOnScroll();
  const [codes, setCodes] = useState<Code[]>([]);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");

  useFocusEffect(useCallback(() => {
    api<Code[]>("/discounts").then(setCodes).catch(() => {});
  }, []));

  const validate = async (code: string) => {
    try {
      const res = await api<{ percentOff: number }>("/discounts/validate", {
        method: "POST", body: { code: code.trim() },
      });
      apply(code.trim(), res.percentOff);
      setMsg("");
      setInput("");
    } catch {
      setMsg("That code isn't valid");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Promotions</Text>
      <Text style={styles.sub}>Apply a code — it's used at checkout</Text>

      <View style={styles.inputRow}>
        <Ionicons name="pricetag-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Enter promo code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          value={input}
          onChangeText={setInput}
        />
        <Pressable style={styles.applyBtn} onPress={() => input.trim() && validate(input)}>
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>
      {msg ? <Text style={styles.error}>{msg}</Text> : null}

      {applied && (
        <View style={styles.appliedCard}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={styles.appliedText}>
            <Text style={{ fontWeight: "800" }}>{applied}</Text> is active
          </Text>
          <Pressable onPress={clear} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      <Text style={styles.section}>Available offers</Text>
      <FlatList
        data={codes}
        keyExtractor={(c) => c.code}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
        renderItem={({ item: c }) => {
          const isActive = applied === c.code;
          return (
            <View style={styles.offer}>
              <View style={styles.offerBadge}>
                <Text style={styles.offerPercent}>{c.percent_off}%</Text>
                <Text style={styles.offerOff}>OFF</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.offerCode}>{c.code}</Text>
                <Text style={styles.offerDesc}>{c.percent_off}% off your whole order</Text>
              </View>
              <Pressable
                style={[styles.offerBtn, isActive && { backgroundColor: colors.success }]}
                onPress={() => (isActive ? clear() : validate(c.code))}
              >
                <Text style={styles.offerBtnText}>{isActive ? "Applied" : "Apply"}</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.sub}>No offers right now</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  sub: { color: colors.textMuted, marginBottom: 16 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, paddingLeft: 14, paddingRight: 6,
    paddingVertical: 6, marginBottom: 8,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 6 },
  applyBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  applyText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  error: { color: colors.danger, marginBottom: 8 },
  appliedCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F0FDF4", borderRadius: radius.card, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  appliedText: { flex: 1, color: colors.text },
  section: { fontSize: 16, fontWeight: "800", color: colors.text, marginVertical: 12 },
  offer: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, ...shadow,
  },
  offerBadge: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  offerPercent: { color: "#fff", fontWeight: "900", fontSize: 16 },
  offerOff: { color: "#fff", fontWeight: "700", fontSize: 10 },
  offerCode: { fontWeight: "800", color: colors.text, fontSize: 15 },
  offerDesc: { color: colors.textMuted, fontSize: 13 },
  offerBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  offerBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
