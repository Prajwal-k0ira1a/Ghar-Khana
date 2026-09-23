import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { providersApi, type ProviderListItem } from '../../src/api/providers';
import { Input } from '../../src/components/ui/Input';
import { Colors, Spacing, Typography } from '../../src/theme/tokens';
import { Search } from 'lucide-react-native';

const FALLBACK_PROVIDERS: ProviderListItem[] = [
  {
    id: 'prov_1',
    userId: 'usr_hira',
    displayName: "Hira's Home Kitchen",
    description: 'Authentic Dal Bhat, Newari Thali & freshly steamed dumplings.',
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
    description: 'Organic village ghee, pure vegetarian dal bhat, and roti tarkari.',
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
    description: 'Low-oil, balanced nutrition tailored for office workers.',
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
        return 'From NPR 170 / meal';
      case 'prov_3':
        return 'From NPR 190 / meal';
      default:
        return 'From NPR 180 / meal';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Home Kitchens</Text>
        <Text style={styles.subtitle}>
          Verified household cooks preparing small-batch daily meals near you.
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <Input
          leftIcon={<Search color={Colors.textMuted} size={16} />}
          onChangeText={setSearchQuery}
          placeholder="Search by neighborhood or kitchen name"
          value={searchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        {(
          [
            ['ALL', 'All'],
            ['LUNCH', 'Lunch'],
            ['DINNER', 'Dinner'],
            ['VEG', 'Vegetarian'],
          ] as const
        ).map(([key, label]) => {
          const isActive = selectedFilter === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedFilter(key)}
              style={[
                styles.filterTab,
                isActive && styles.filterTabActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Provider List (1 primary + 2 supporting lines per item) */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: Spacing.xl }} />
      ) : (
        <View style={styles.listContainer}>
          {providers.map((provider, idx, arr) => (
            <TouchableOpacity
              key={provider.id}
              activeOpacity={0.6}
              onPress={() => handleProviderPress(provider)}
              style={[
                styles.providerRow,
                idx < arr.length - 1 && styles.providerRowBorder,
              ]}
            >
              <Text style={styles.displayName}>{provider.displayName}</Text>

              <Text style={styles.typeDistanceLine}>
                {provider.providerType === 'HOUSEHOLD' ? 'Household kitchen' : 'Home kitchen'} · {provider.distance || '1.5 km away'}
              </Text>

              <Text style={styles.priceRatingLine}>
                {getStartingPrice(provider.id)} · {provider.rating || 4.8} rating
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 4,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  searchSection: {
    marginBottom: Spacing.xs,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: Colors.textPrimary,
  },
  filterTabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  filterTabTextActive: {
    color: Colors.textPrimary,
  },
  listContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  providerRow: {
    paddingVertical: Spacing.md + 2,
  },
  providerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  displayName: {
    ...Typography.subtitle,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  typeDistanceLine: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  priceRatingLine: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
