import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../stores/auth";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { colors } from "../../lib/theme";
import { ApiError } from "../../lib/api";

export default function Login() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.includes("@")) return setError("Enter a valid email");
    if (!password) return setError("Enter your password");
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      // root layout redirects to tabs
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Something went wrong";
      if (e instanceof ApiError && e.status === 0) Alert.alert("Connection failed", msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <TextField label="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
      <TextField label="Password" value={password} onChangeText={setPassword}
        secureTextEntry placeholder="••••••••" error={error} />
      <Button title="Log In" onPress={submit} loading={loading} />
      <Text style={styles.alt}>
        New here? <Link href="/(auth)/register" style={styles.link}>Create an account</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 100, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 24 },
  alt: { textAlign: "center", marginTop: 16, color: colors.textMuted },
  link: { color: colors.accent, fontWeight: "700" },
});
