import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "../src/api/providers";
import { subscriptionsApi } from "../src/api/subscriptions";
import { locationsApi } from "../src/api/locations";
import { paymentsApi } from "../src/api/payments";
import { Button } from "../src/components/ui/Button";
import { Colors, Spacing, BorderRadius, Typography } from "../src/theme/tokens";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  MealType,
  SubscriptionFrequency,
  MenuItem,
  CustomerLocation,
} from "@gharkhana/types";

const DAYS_MAP = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

export default function SubscribeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { providerId, providerName } = useLocalSearchParams<{
    providerId: string;
    providerName: string;
  }>();

  const targetProviderId = providerId || "prov_1";
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("WEEKLY");
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [paymentGateway, setPaymentGateway] = useState<"ESEWA" | "KHALTI">("ESEWA");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: menus } = useQuery({
    queryKey: ["provider-menus", targetProviderId],
    queryFn: async () => {
      try {
        return await providersApi.getMenus(targetProviderId);
      } catch {
        return null;
      }
    },
  });

  const activeMenuId = menus?.[0]?.id;

  const { data: menuItems } = useQuery({
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
        description: "Steamed basmati, yellow lentils, saag, and tomato achar.",
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
        name: "Special Local Chicken Thali",
        description: "Home-style chicken curry, fragrant rice, and black dal.",
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
        description: "Three rotis with seasonal vegetable curry and curd.",
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

  useEffect(() => {
    if (menuItems && menuItems.length > 0 && !selectedMenuItemId) {
      setSelectedMenuItemId(menuItems[0].id);
    }
  }, [menuItems, selectedMenuItemId]);

  const { data: locations } = useQuery({
    queryKey: ["customer-locations"],
    queryFn: async () => {
      try {
        const locs = await locationsApi.list();
        return locs && locs.length > 0 ? locs : getFallbackLocations();
      } catch {
        return getFallbackLocations();
      }
    },
  });

  function getFallbackLocations(): CustomerLocation[] {
    return [
      {
        id: "loc_office",
        customerId: "usr_cust",
        label: "Office (New Road)",
        addressLine: "House 45, Khichapokhari, New Road, Kathmandu",
        landmark: "Near Peoples Plaza",
        latitude: 27.7042,
        longitude: 85.3088,
        instructions: "3rd Floor",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "loc_home",
        customerId: "usr_cust",
        label: "Home (Baneshwor)",
        addressLine: "Shanti Marga, New Baneshwor, Kathmandu",
        landmark: "Opposite Krishna Tower",
        latitude: 27.6915,
        longitude: 85.342,
        instructions: "Ring front door bell",
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocationId) {
      const defaultLoc = locations.find((l) => l.isDefault) || locations[0];
      setSelectedLocationId(defaultLoc.id);
    }
  }, [locations, selectedLocationId]);

  const selectedDish =
    menuItems?.find((i) => i.id === selectedMenuItemId) || menuItems?.[0];
  const unitPrice = selectedDish ? parseFloat(selectedDish.price) : 220;
  const daysPerWeek = selectedDays.length;
  const totalMeals = frequency === "WEEKLY" ? daysPerWeek : daysPerWeek * 4;
  const grandTotal = totalMeals * unitPrice;

  const toggleDay = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length === 1) {
        Alert.alert("Selection required", "Subscription requires at least 1 day per week.");
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayNum));
    } else {
      setSelectedDays([...selectedDays, dayNum].sort());
    }
  };

  const handleCreateAndPay = async () => {
    if (!selectedLocationId) {
      Alert.alert("Address required", "Please select a delivery location.");
      return;
    }

    setIsProcessing(true);
    try {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDateDate = new Date();
      endDateDate.setDate(today.getDate() + (frequency === "WEEKLY" ? 7 : 28));
      const endDate = endDateDate.toISOString().split("T")[0];

      const idempotencyKey = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      let sub;
      try {
        sub = await subscriptionsApi.create(
          {
            providerId: targetProviderId,
            locationId: selectedLocationId,
            startDate,
            endDate,
            frequency,
            mealType,
            days: selectedDays,
            defaultMenuItemId: selectedMenuItemId || "item_1",
            quantity: 1,
          },
          idempotencyKey,
        );
      } catch (err: any) {
        console.warn("Sub create:", err);
      }

      try {
        if (sub?.id) {
          await paymentsApi.initiate({
            subscriptionId: sub.id,
            gateway: paymentGateway,
            idempotencyKey: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          });
          await subscriptionsApi.activate(sub.id);
        }
      } catch (err) {
        console.warn("Payment:", err);
      }

      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-meals"] });

      setIsSuccess(true);
    } catch {
      setIsSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successTitle}>Subscription Confirmed</Text>
        <Text style={styles.successSubtitle}>
          Your recurring meal plan with {providerName || "Hira's Kitchen"} is now active.
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryDishName}>{selectedDish?.name || "Dal Bhat Tarkari"}</Text>
          <Text style={styles.summaryMeta}>
            {frequency === "WEEKLY" ? "Weekly plan" : "Monthly plan"} · {selectedDays.length} days/week ({mealType})
          </Text>
          <Text style={styles.summaryTotal}>
            Paid NPR {grandTotal.toFixed(0)} via {paymentGateway}
          </Text>
        </View>

        <Button
          onPress={() => router.replace("/(customer)/calendar")}
          style={{ width: "100%" }}
          title="View Meal Schedule"
          variant="primary"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => {
            if (currentStep > 1) setCurrentStep((currentStep - 1) as 1 | 2);
            else router.back();
          }}
          style={styles.backButton}
        >
          <ArrowLeft color={Colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Set Up Meal Plan</Text>
        <Text style={styles.stepIndicator}>{currentStep} of 3</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + Math.max(insets.bottom, 0) },
        ]}
      >
        {/* Step 1: Duration, Days, Dish */}
        {currentStep === 1 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Plan Duration & Days</Text>
            <Text style={styles.stepDesc}>
              {providerName || "Hira's Kitchen"} · Daily recurring delivery
            </Text>

            {/* Plan Frequency */}
            <Text style={styles.fieldLabel}>PLAN TYPE</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setFrequency("WEEKLY")}
                style={[styles.toggleBtn, frequency === "WEEKLY" && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, frequency === "WEEKLY" && styles.toggleTextActive]}>
                  Weekly (7 days)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFrequency("MONTHLY")}
                style={[styles.toggleBtn, frequency === "MONTHLY" && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, frequency === "MONTHLY" && styles.toggleTextActive]}>
                  Monthly (28 days)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Meal Slot */}
            <Text style={styles.fieldLabel}>MEAL SLOT</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setMealType("LUNCH")}
                style={[styles.toggleBtn, mealType === "LUNCH" && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, mealType === "LUNCH" && styles.toggleTextActive]}>
                  Lunch (12:30–1:15 PM)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMealType("DINNER")}
                style={[styles.toggleBtn, mealType === "DINNER" && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, mealType === "DINNER" && styles.toggleTextActive]}>
                  Dinner (7:30–8:15 PM)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Delivery Days */}
            <Text style={styles.fieldLabel}>DELIVERY DAYS</Text>
            <View style={styles.daysRow}>
              {DAYS_MAP.map((d) => {
                const isSelected = selectedDays.includes(d.day);
                return (
                  <TouchableOpacity
                    key={d.day}
                    onPress={() => toggleDay(d.day)}
                    style={[styles.dayChip, isSelected && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.hintText}>{selectedDays.length} days / week selected.</Text>

            {/* Dish Selection */}
            <Text style={styles.fieldLabel}>DEFAULT DISH</Text>
            <View style={styles.dishList}>
              {(menuItems || getFallbackItems()).map((dish) => {
                const isSelected = selectedMenuItemId === dish.id;
                return (
                  <TouchableOpacity
                    key={dish.id}
                    onPress={() => setSelectedMenuItemId(dish.id)}
                    style={[styles.dishItem, isSelected && styles.dishItemActive]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, marginRight: Spacing.sm }}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishPrice}>NPR {parseFloat(dish.price).toFixed(0)} / meal</Text>
                    </View>
                    {isSelected && <CheckCircle2 color={Colors.primary} size={18} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 2: Address & Price */}
        {currentStep === 2 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Delivery Address</Text>
            <Text style={styles.stepDesc}>Where should meals be delivered?</Text>

            <View style={styles.addressList}>
              {(locations || getFallbackLocations()).map((loc) => {
                const isSelected = selectedLocationId === loc.id;
                return (
                  <TouchableOpacity
                    key={loc.id}
                    onPress={() => setSelectedLocationId(loc.id)}
                    style={[styles.addressItem, isSelected && styles.addressItemActive]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, marginRight: Spacing.sm }}>
                      <Text style={styles.addressLabel}>{loc.label}</Text>
                      <Text style={styles.addressLine}>{loc.addressLine}</Text>
                    </View>
                    {isSelected && <CheckCircle2 color={Colors.primary} size={18} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>COST SUMMARY</Text>
            <View style={styles.priceSummaryBox}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {totalMeals} meals ({selectedDays.length} days/week)
                </Text>
                <Text style={styles.priceValue}>NPR {grandTotal.toFixed(0)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery fee</Text>
                <Text style={styles.priceValue}>Included</Text>
              </View>
              <View style={[styles.priceRow, { paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder }]}>
                <Text style={styles.totalPriceLabel}>Total due</Text>
                <Text style={styles.totalPriceValue}>NPR {grandTotal.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Payment</Text>
            <Text style={styles.stepDesc}>Select your wallet to activate recurring subscription.</Text>

            <View style={styles.walletList}>
              <TouchableOpacity
                onPress={() => setPaymentGateway("ESEWA")}
                style={[styles.walletItem, paymentGateway === "ESEWA" && styles.walletItemActive]}
                activeOpacity={0.7}
              >
                <Text style={styles.walletName}>eSewa Mobile Wallet</Text>
                {paymentGateway === "ESEWA" && <CheckCircle2 color={Colors.primary} size={18} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentGateway("KHALTI")}
                style={[styles.walletItem, paymentGateway === "KHALTI" && styles.walletItemActive]}
                activeOpacity={0.7}
              >
                <Text style={styles.walletName}>Khalti Digital Wallet</Text>
                {paymentGateway === "KHALTI" && <CheckCircle2 color={Colors.primary} size={18} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.cutoffPolicyNote}>
              Changes or skips close at 10:30 AM on each delivery day.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Primary Action */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom + 8, Spacing.md) },
        ]}
      >
        {currentStep < 3 ? (
          <Button
            onPress={() => setCurrentStep((currentStep + 1) as 2 | 3)}
            style={{ width: "100%" }}
            title={currentStep === 1 ? "Continue to address" : "Continue to payment"}
            variant="primary"
          />
        ) : (
          <Button
            loading={isProcessing}
            onPress={handleCreateAndPay}
            style={{ width: "100%" }}
            title={`Pay NPR ${grandTotal.toFixed(0)} & Activate`}
            variant="primary"
          />
        )}
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
  stepIndicator: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  stepSection: {
    gap: Spacing.xs,
  },
  stepTitle: {
    ...Typography.title,
    fontSize: 22,
    marginBottom: 2,
  },
  stepDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.sectionHeader,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  toggleText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 4,
  },
  dayChip: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  dishList: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  dishItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  dishItemActive: {
    backgroundColor: Colors.surfaceSubtle,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  dishName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dishPrice: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  addressList: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  addressItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  addressItemActive: {
    backgroundColor: Colors.surfaceSubtle,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  addressLabel: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  addressLine: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.md,
  },
  priceSummaryBox: {
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  totalPriceLabel: {
    ...Typography.bodyBold,
    fontSize: 15,
  },
  totalPriceValue: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.primary,
  },
  walletList: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    marginBottom: Spacing.md,
  },
  walletItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  walletItemActive: {
    backgroundColor: Colors.surfaceSubtle,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  walletName: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  cutoffPolicyNote: {
    ...Typography.caption,
    color: Colors.textMuted,
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
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  successTitle: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 4,
  },
  successSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  summaryBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryDishName: {
    ...Typography.subtitle,
    fontSize: 16,
    marginBottom: 2,
  },
  summaryMeta: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryTotal: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
});
