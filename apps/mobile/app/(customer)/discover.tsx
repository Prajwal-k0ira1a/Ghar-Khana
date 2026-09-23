import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { providersApi, type ProviderListItem } from '../../src/api/providers';
import { Colors } from '../../src/theme/tokens';
import {
  Search,
  Star,
  MapPin,
  Check,
  ChevronRight,
  Flame,
  Sparkles,
} from 'lucide-react-native';

const FALLBACK_PROVIDERS: ProviderListItem[] = [
  {
    id: 'prov_1',
    userId: 'usr_hira',
    displayName: "Hira's Home Kitchen",
    description: 'Authentic Dal Bhat, Newari Thali & freshly steamed local dumplings.',
    providerType: 'HOME_COOK',
    verificationStatus: 'VERIFIED',
    status: 'ACTIVE',
    dailyCapacity: { BREAKFAST: 10, LUNCH: 40, DINNER: 30, SNACKS: 20 },
    rating: 4.8,
    ratingCount: 36,
    distance: '1.2 km away',
    specialty: 'Authentic Dal Bhat & Newari Thali',
    isServiceable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prov_2',
    userId: 'usr_sushila',
    displayName: 'Sushila Aama ko Rasoi',
    description: 'Organic village ghee, pure vegetarian dal bhat, and soft roti tarkari.',
    providerType: 'HOUSEHOLD',
    verificationStatus: 'VERIFIED',
    status: 'ACTIVE',
    dailyCapacity: { BREAKFAST: 15, LUNCH: 30, DINNER: 25, SNACKS: 15 },
    rating: 4.9,
    ratingCount: 52,
    distance: '2.5 km away',
    specialty: 'Organic Village Ghee & Pure Vegetarian',
    isServiceable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prov_3',
    userId: 'usr_balkumari',
    displayName: 'Balkumari Healthy Tiffin',
    description: 'Low-oil, balanced nutrition tailored for busy office workers.',
    providerType: 'SMALL_HOME_KITCHEN',
    verificationStatus: 'VERIFIED',
    status: 'ACTIVE',
    dailyCapacity: { BREAKFAST: 20, LUNCH: 35, DINNER: 20, SNACKS: 10 },
    rating: 4.7,
    ratingCount: 24,
    distance: '3.1 km away',
    specialty: 'Low-oil Oats, Roti Tarkari, Spiced Lentils',
    isServiceable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'LUNCH' | 'DINNER' | 'VEG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: serverProviders, isLoading } = useQuery({
    queryKey: ['providers', selectedFilter, searchQuery],
    queryFn: async () => {
      try {
        const res = await providersApi.list({
          mealType: selectedFilter !== 'ALL' && selectedFilter !== 'VEG' ? selectedFilter : undefined,
          dietaryTag: selectedFilter === 'VEG' ? 'Vegetarian' : undefined,
          search: searchQuery || undefined,
        });
        return res && res.length > 0 ? res : FALLBACK_PROVIDERS;
      } catch {
        return FALLBACK_PROVIDERS;
      }
    },
  });

  const providers = (serverProviders || FALLBACK_PROVIDERS).filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.displayName.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchSpec = p.specialty?.toLowerCase().includes(q);
      return matchName || matchDesc || matchSpec;
    }
    return true;
  });

  const handleProviderPress = (provider: ProviderListItem) => {
    router.push({
      pathname: '/provider-detail',
      params: { id: provider.id },
    });
  };

  const getStartingPrice = (provId: string) => {
    switch (provId) {
      case 'prov_2':
        return 'NPR 170';
      case 'prov_3':
        return 'NPR 190';
      default:
        return 'NPR 180';
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Neighborhood Kitchens</Text>
        <Text style={styles.subtitle}>
          Subscribe to passionate home cooks preparing fresh daily tiffins near you.
        </Text>
      </View>

      {/* ── Pinterest Pill Search Input ── */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by neighborhood, cuisine, or cook..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ── Filter Pills (Pinterest Ribbon) ── */}
      <View style={styles.filterRibbonContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRibbonScroll}
        >
          {(
            [
              ['ALL', 'All Kitchens'],
              ['LUNCH', 'Lunch Tiffin'],
              ['DINNER', 'Dinner Tiffin'],
              ['VEG', 'Pure Vegetarian'],
            ] as const
          ).map(([key, label]) => {
            const isActive = selectedFilter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedFilter(key)}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Provider Cards (Pinterest Kitchen Showcase) ── */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.kitchenList}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              activeOpacity={0.85}
              onPress={() => handleProviderPress(provider)}
              style={styles.kitchenCard}
            >
              {/* Card Header Row */}
              <View style={styles.cardTopRow}>
                <View style={styles.avatarRow}>
                  <View style={styles.kitchenAvatar}>
                    <Text style={styles.kitchenAvatarLetter}>
                      {provider.displayName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <View style={styles.nameWithBadge}>
                      <Text style={styles.kitchenName}>{provider.displayName}</Text>
                      <View style={styles.verifiedBadge}>
                        <Check size={9} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    </View>
                    <Text style={styles.kitchenTypeSub}>
                      {provider.providerType === 'HOUSEHOLD'
                        ? 'Household Cook'
                        : 'Authentic Home Kitchen'}
                    </Text>
                  </View>
                </View>

                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {provider.rating || 4.8}
                  </Text>
                </View>
              </View>

              {/* Specialty & Description */}
              <Text style={styles.kitchenDesc} numberOfLines={2}>
                {provider.description}
              </Text>

              {/* Tag Badges */}
              <View style={styles.tagChipsRow}>
                <View style={styles.tagChip}>
                  <MapPin size={11} color="#64748B" />
                  <Text style={styles.tagChipText}>
                    {provider.distance || '1.5 km away'}
                  </Text>
                </View>

                <View style={styles.tagChip}>
                  <Flame size={11} color={Colors.primary} />
                  <Text style={styles.tagChipText}>
                    {provider.dailyCapacity?.LUNCH || 40} meals daily cap
                  </Text>
                </View>
              </View>

              {/* Card Footer with Price & CTA */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <Text style={styles.priceValue}>
                    {getStartingPrice(provider.id)}{' '}
                    <Text style={styles.priceUnit}>/ meal</Text>
                  </Text>
                </View>

                <View style={styles.viewMenuBtn}>
                  <Text style={styles.viewMenuBtnText}>View Menu</Text>
                  <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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

  // ── Header ──
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // ── Pill Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },

  // ── Filter Ribbon ──
  filterRibbonContainer: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  filterRibbonScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Kitchen Cards ──
  kitchenList: {
    gap: 16,
  },
  kitchenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kitchenAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitchenAvatarLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kitchenName: {
    fontSize: 15,
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
  kitchenTypeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },

  kitchenDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },

  tagChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tagChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  viewMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  viewMenuBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
