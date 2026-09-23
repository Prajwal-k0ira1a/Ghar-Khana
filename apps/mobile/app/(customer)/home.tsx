import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/authStore';
import { subscriptionsApi } from '../../src/api/subscriptions';
import { Colors } from '../../src/theme/tokens';
import {
  Bell,
  MapPin,
  Clock,
  ChevronRight,
  Flame,
  Check,
  Calendar as CalendarIcon,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react-native';

// Generate 7 days for the interactive week ribbon
function getWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = -1; i < 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateObj: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: i === 0,
      isoDate: d.toISOString().split('T')[0],
    });
  }
  return dates;
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedDayIndex, setSelectedDayIndex] = useState(1); // 1 = today

  const weekDates = getWeekDates();

  // 1. Fetch user's subscriptions
  const { data: subscriptions, isLoading: isSubLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: async () => {
      try {
        const res = await subscriptionsApi.list();
        return res && res.length > 0 ? res : null;
      } catch {
        return null;
      }
    },
  });

  const activeSub =
    subscriptions?.find((s) => s.status === 'ACTIVE') || subscriptions?.[0];

  // 2. Fetch meals for active subscription
  const { data: meals } = useQuery({
    queryKey: ['subscription-meals', activeSub?.id],
    enabled: !!activeSub?.id,
    queryFn: async () => {
      try {
        const res = await subscriptionsApi.getMeals(activeSub!.id);
        return res && res.length > 0 ? res : null;
      } catch {
        return null;
      }
    },
  });

  const todayMeal = meals?.[0];
  const upcomingMeals = meals?.slice(1, 4) || [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Header Greeting ── */}
      <View style={styles.topHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.greetingText}>
            Namaste, {user?.name ? user.name.split(' ')[0] : 'Foodie'} 👋
          </Text>
          <TouchableOpacity
            style={styles.locationChip}
            activeOpacity={0.7}
            onPress={() => router.push('/(customer)/profile')}
          >
            <MapPin size={13} color={Colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              Baneshwor, Kathmandu
            </Text>
            <ChevronRight size={12} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => router.push('/(customer)/notifications')}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#1E293B" strokeWidth={1.8} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* ── 7-Day Interactive Date Ribbon (Pinterest-style calendar) ── */}
      <View style={styles.ribbonContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ribbonScroll}
        >
          {weekDates.map((item, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <TouchableOpacity
                key={item.isoDate}
                onPress={() => setSelectedDayIndex(idx)}
                style={[
                  styles.datePill,
                  isSelected && styles.datePillActive,
                  item.isToday && !isSelected && styles.datePillToday,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dateDayName,
                    isSelected && styles.dateDayNameActive,
                  ]}
                >
                  {item.isToday ? 'Today' : item.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateDayNumber,
                    isSelected && styles.dateDayNumberActive,
                  ]}
                >
                  {item.dayNumber}
                </Text>
                <View
                  style={[
                    styles.dateDot,
                    isSelected ? styles.dateDotActive : styles.dateDotInactive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Case A: Active Subscription (Pinterest Hero Card) ── */}
      {activeSub ? (
        <View style={styles.heroCard}>
          {/* Card Header Tags */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.mealTypeTag}>
              <UtensilsCrossed size={12} color="#C2410C" />
              <Text style={styles.mealTypeTagText}>
                {activeSub.mealType || 'LUNCH'} TIFFIN
              </Text>
            </View>

            <View style={styles.timeTag}>
              <Clock size={12} color="#047857" />
              <Text style={styles.timeTagText}>12:30 – 1:15 PM</Text>
            </View>
          </View>

          {/* Dish Title & Description */}
          <View style={styles.dishInfoArea}>
            <Text style={styles.dishTitle}>
              {todayMeal?.status === 'SKIPPED'
                ? 'Meal Skipped for Today'
                : ((todayMeal as any)?.menuItemName ||
                  'Classic Nepali Dal Bhat Tarkari')}
            </Text>
            <Text style={styles.dishIngredients}>
              Basmati rice · Simmered yellow lentils · Seasonal green saag · Fresh tomato achar
            </Text>
          </View>

          {/* Kitchen Metadata Row */}
          <TouchableOpacity
            style={styles.kitchenMetaCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(customer)/discover')}
          >
            <View style={styles.kitchenAvatar}>
              <Text style={styles.kitchenAvatarText}>S</Text>
            </View>
            <View style={styles.kitchenDetails}>
              <View style={styles.kitchenNameRow}>
                <Text style={styles.kitchenName}>Sita's Home Kitchen</Text>
                <View style={styles.verifiedBadge}>
                  <Check size={9} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>
              <Text style={styles.kitchenSub}>★ 4.9 (52 reviews) · 1.2 km away</Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Live Preparation Progress (Dribbble micro-tracker) */}
          <View style={styles.progressArea}>
            <View style={styles.progressHeader}>
              <View style={styles.liveIndicator}>
                <Flame size={13} color={Colors.primary} />
                <Text style={styles.liveStatusText}>
                  {todayMeal?.status === 'SKIPPED'
                    ? 'Subscription active. Resumes tomorrow.'
                    : 'Kitchen is simmering your dal now'}
                </Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressStep, styles.progressStepDone]} />
              <View style={[styles.progressStep, styles.progressStepActive]} />
              <View style={styles.progressStep} />
            </View>

            <View style={styles.stepLabelsRow}>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>Cooking</Text>
              <Text style={styles.stepLabel}>Packed</Text>
              <Text style={styles.stepLabel}>On the Way</Text>
            </View>
          </View>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => router.push('/(customer)/calendar')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnSecondaryText}>Swap Dish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => router.push('/(customer)/calendar')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnPrimaryText}>Manage Schedule</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cutoffReminder}>
            ⚡ Changes close at 10:30 AM today
          </Text>
        </View>
      ) : !isSubLoading ? (
        /* ── Case B: Empty State (Showstopper Discovery Banner) ── */
        <View style={styles.emptyHeroCard}>
          <View style={styles.emptyIconCircle}>
            <Sparkles size={24} color={Colors.primary} />
          </View>
          <Text style={styles.emptyHeroTitle}>
            Wholesome Home Meals,{'\n'}Every Single Day
          </Text>
          <Text style={styles.emptyHeroDesc}>
            Subscribe to verified neighborhood home cooks in Kathmandu. Clean ingredients, zero MSG, delivered hot before lunch.
          </Text>

          <TouchableOpacity
            style={styles.emptyCtaButton}
            onPress={() => router.push('/(customer)/discover')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyCtaButtonText}>Browse Kitchens</Text>
            <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Upcoming Meals Section (Pinterest preview cards) ── */}
      <View style={styles.upcomingSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Menu</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/calendar')}>
            <Text style={styles.sectionLink}>View Calendar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.upcomingCards}>
          {(upcomingMeals.length > 0
            ? upcomingMeals
            : [
                { id: '1', day: 'Tomorrow', title: 'Special Chicken Thali', type: 'Lunch' },
                { id: '2', day: 'Friday', title: 'Organic Gundruk Bhat & Achar', type: 'Lunch' },
                { id: '3', day: 'Saturday', title: 'Paneer Butter Masala & Roti', type: 'Lunch' },
              ]
          ).map((item: any, idx) => (
            <TouchableOpacity
              key={item.id || idx}
              style={styles.upcomingCard}
              onPress={() => router.push('/(customer)/calendar')}
              activeOpacity={0.7}
            >
              <View style={styles.upcomingDateBadge}>
                <CalendarIcon size={13} color={Colors.primary} />
                <Text style={styles.upcomingDayText}>
                  {item.day || item.scheduledDate || 'Upcoming'}
                </Text>
              </View>

              <Text style={styles.upcomingDishTitle} numberOfLines={1}>
                {item.title || item.menuItemName || 'Dal Bhat Tarkari'}
              </Text>

              <Text style={styles.upcomingKitchenSub}>
                Sita's Home Kitchen · {item.type || 'Lunch'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Top Header ──
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    maxWidth: 180,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },

  // ── Date Ribbon ──
  ribbonContainer: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  ribbonScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  datePill: {
    width: 58,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  datePillToday: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  dateDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  dateDayNameActive: {
    color: '#FFFFFF',
  },
  dateDayNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  dateDayNumberActive: {
    color: '#FFFFFF',
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dateDotActive: {
    backgroundColor: '#FFFFFF',
  },
  dateDotInactive: {
    backgroundColor: '#10B981',
  },

  // ── Pinterest Hero Meal Card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 28,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  mealTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  mealTypeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },

  dishInfoArea: {
    marginBottom: 16,
  },
  dishTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  dishIngredients: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  kitchenMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 18,
  },
  kitchenAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  kitchenAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  kitchenDetails: {
    flex: 1,
  },
  kitchenNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kitchenName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedBadge: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitchenSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Progress Bar
  progressArea: {
    marginBottom: 20,
    paddingTop: 4,
  },
  progressHeader: {
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  progressStep: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
  },
  progressStepDone: {
    backgroundColor: Colors.secondary,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnPrimary: {
    flex: 1.3,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cutoffReminder: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },

  // Empty State Hero
  emptyHeroCard: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    marginBottom: 28,
    alignItems: 'flex-start',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  emptyHeroDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    marginBottom: 20,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyCtaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Upcoming Section ──
  upcomingSection: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  upcomingCards: {
    gap: 10,
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  upcomingDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  upcomingDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  upcomingDishTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  upcomingKitchenSub: {
    fontSize: 12,
    color: '#64748B',
  },
});
