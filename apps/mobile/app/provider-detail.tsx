import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "../src/api/providers";
import { Button } from "../src/components/ui/Button";
import { Colors, Spacing, Typography } from "../src/theme/tokens";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MenuItem } from "@gharkhana/types";

export default function ProviderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const providerId = id || "prov_1";

  const { data: provider, isLoading: isProviderLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      try {
        return await providersApi.getById(providerId);
      } catch {
        return {
          id: providerId,
          userId: "usr_hira",
          displayName: "Hira's Home Kitchen",
          description:
            "Authentic Newari and Nepali home-cooked daily meals prepared with love, minimal oil, and garden-fresh ingredients.",
          providerType: "HOME_COOK" as const,
          verificationStatus: "VERIFIED" as const,
          status: "ACTIVE" as const,
          dailyCapacity: { BREAKFAST: 10, LUNCH: 40, DINNER: 30, SNACKS: 20 },
          rating: 4.8,
          ratingCount: 36,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    },
  });

  const { data: menus } = useQuery({
    queryKey: ["provider-menus", providerId],
    queryFn: async () => {
      try {
        const res = await providersApi.getMenus(providerId);
        return res && res.length > 0 ? res : null;
      } catch {
        return null;
      }
    },
  });

  const activeMenuId = menus?.[0]?.id;

  const { data: menuItems, isLoading: isItemsLoading } = useQuery({
    queryKey: ["menu-items", activeMenuId],
    queryFn: async () => {
      if (!activeMenuId) return getFallbackItems();
      try {
        const items = await providersApi.getMenuItems(activeMenuId);
        return items && items.length > 0 ? items : getFallbackItems();
      } catch {
        return getFallbackItems();
      }
    },
  });

  function getFallbackItems(): MenuItem[] {
    return [
      {
        id: "item_1",
        menuId: "menu_1",
        name: "Classic Dal Bhat Tarkari",
        description: "Steamed basmati, yellow lentils, seasonal greens, and tomato achar.",
        price: "220.00",
        mealType: "LUNCH",
        availability: true,
        dietaryTags: ["Vegetarian"],
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "item_2",
        menuId: "menu_1",
        name: "Local Chicken Thali",
        description: "Home-style chicken curry, fragrant rice, black dal, and radish pickle.",
        price: "350.00",
        mealType: "LUNCH",
        availability: true,
        dietaryTags: ["Non-Veg"],
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "item_3",
        menuId: "menu_1",
        name: "Mixed Veg Tarkari & Roti Set",
        description: "Whole-wheat rotis with seasonal vegetable curry and curd.",
        price: "190.00",
        mealType: "LUNCH",
        availability: true,
        dietaryTags: ["Vegetarian"],
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const handleStartSubscription = () => {
    router.push({
      pathname: "/subscribe",
      params: {
        providerId: provider?.id || providerId,
        providerName: provider?.displayName || "Home Kitchen",
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={Colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {provider?.displayName || "Kitchen Profile"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 100 + Math.max(insets.bottom, 0) },
        ]}
      >
        {isProviderLoading ? (
          <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: Spacing.xl }} />
        ) : (
          <>
            {/* Kitchen Profile Block */}
            <View style={styles.profileBlock}>
              <Text style={styles.displayName}>{provider?.displayName}</Text>
              <Text style={styles.metaLine}>
                {provider?.providerType === "HOME_COOK" ? "Certified home cook" : "Household kitchen"} · 1.2 km away · {provider?.rating || 4.8} rating
              </Text>
              <Text style={styles.description}>
                {provider?.description || "Wholesome home-cooked daily meals tailored for household nutrition."}
              </Text>
              <Text style={styles.cutoffPolicyLine}>
                Daily cutoff: 10:30 AM · Capacity: 40 meals/day
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Menu Section */}
            <Text style={styles.sectionTitle}>AVAILABLE DISHES</Text>

            {isItemsLoading ? (
              <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: Spacing.md }} />
            ) : (
              <View style={styles.dishesList}>
                {(menuItems || getFallbackItems()).map((item, idx, arr) => (
                  <View
                    key={item.id}
                    style={[
                      styles.dishRow,
                      idx < arr.length - 1 && styles.dishRowBorder,
                    ]}
                  >
                    <View style={styles.dishInfoCol}>
                      <Text style={styles.dishName}>{item.name}</Text>
                      <Text style={styles.dishDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    <Text style={styles.dishPrice}>NPR {parseFloat(item.price).toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom + 8, Spacing.md) },
        ]}
      >
        <Button
          onPress={handleStartSubscription}
          style={{ width: "100%" }}
          title="Choose Meal Plan"
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    ...Typography.subtitle,
    textAlign: "center",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  profileBlock: {
    marginBottom: Spacing.lg,
  },
  displayName: {
    ...Typography.title,
    fontSize: 22,
    marginBottom: 4,
  },
  metaLine: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  cutoffPolicyLine: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.sectionHeader,
    fontSize: 11,
    marginBottom: Spacing.sm,
  },
  dishesList: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  dishRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
  },
  dishRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  dishInfoCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  dishName: {
    ...Typography.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dishDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  dishPrice: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.primary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
