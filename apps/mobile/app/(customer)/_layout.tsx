import React from "react";
import { Tabs } from "expo-router";
import { Home, Compass, Calendar, Bell, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { Colors } from "../../src/theme/tokens";

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding =
    insets.bottom > 0
      ? insets.bottom + (Platform.OS === "android" ? 6 : 2)
      : 12;
  const tabHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: -1,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={21} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <Compass color={color} size={21} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "My Meals",
          tabBarIcon: ({ color, focused }) => (
            <Calendar color={color} size={21} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <Bell color={color} size={21} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={21} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
