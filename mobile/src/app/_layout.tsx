import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../stores/auth";
import { colors } from "../lib/theme";

export default function RootLayout() {
  const { user, hydrated, hydrate } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) router.replace("/(auth)/welcome");
    if (user && inAuthGroup) router.replace("/");
  }, [user, hydrated, segments]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{
      headerTintColor: colors.text,
      headerStyle: { backgroundColor: colors.background },
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ title: "Cart" }} />
      <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
      <Stack.Screen name="order-success" options={{ headerShown: false }} />
      <Stack.Screen name="food/[id]" options={{ title: "" }} />
      <Stack.Screen name="order/[id]" options={{ title: "Order" }} />
      <Stack.Screen name="review/[orderId]" options={{ title: "Leave a review" }} />
    </Stack>
  );
}
