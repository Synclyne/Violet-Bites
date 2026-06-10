import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../stores/auth";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { colors } from "../../lib/theme";
import { ApiError } from "../../lib/api";

export default function Register() {
  const register = useAuth((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) return setError("Enter your name");
    if (!email.includes("@")) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setError("");
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
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
      <Text style={styles.title}>Create account</Text>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" />
      <TextField label="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
      <TextField label="Password" value={password} onChangeText={setPassword}
        secureTextEntry placeholder="At least 6 characters" error={error} />
      <Button title="Sign Up" onPress={submit} loading={loading} />
      <Text style={styles.alt}>
        Have an account? <Link href="/(auth)/login" style={styles.link}>Log in</Link>
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
