import React from "react";
import { Tabs } from "expo-router";
import { ChefHat, UtensilsCrossed, Users, Store } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { Colors } from "../../src/theme/tokens";

export default function ProviderTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding =
    insets.bottom > 0
      ? insets.bottom + (Platform.OS === "android" ? 6 : 2)
      : 8;
  const tabHeight = 52 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.surfaceBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Preparation",
          tabBarIcon: ({ color }) => (
            <ChefHat color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Dishes",
          tabBarIcon: ({ color }) => (
            <UtensilsCrossed color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: "Subscribers",
          tabBarIcon: ({ color }) => <Users color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Kitchen",
          tabBarIcon: ({ color }) => <Store color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}
