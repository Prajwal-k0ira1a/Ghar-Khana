import React from "react";
import { Tabs } from "expo-router";
import { Home, Compass, Calendar, Bell, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { Colors } from "../../src/theme/tokens";

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  // Lift navbar comfortably above Android 3-button navigation shortcuts or iOS home bar
  const bottomPadding =
    insets.bottom > 0
      ? insets.bottom + (Platform.OS === "android" ? 6 : 2)
      : 10;
  const tabHeight = 54 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surfaceDark,
          borderTopColor: Colors.surfaceBorderDark,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMutedDark,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={20} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Compass color={color} size={20} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "My Meals",
          tabBarIcon: ({ color }) => <Calendar color={color} size={20} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <Bell color={color} size={20} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={20} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
