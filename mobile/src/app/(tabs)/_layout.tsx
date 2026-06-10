import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../lib/theme";

const icon = (glyph: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{glyph}</Text>
  );

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("🏠") }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: icon("🧾") }} />
      <Tabs.Screen name="wishlist" options={{ title: "Wishlist", tabBarIcon: icon("💜") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("👤") }} />
    </Tabs>
  );
}
