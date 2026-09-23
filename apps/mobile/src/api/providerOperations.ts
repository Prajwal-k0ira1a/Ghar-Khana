import { api } from './client';
import type { OccurrenceStatus, Subscription } from '@gharkhana/types';

export interface DishPreparationCount {
  dishName: string;
  portions: number;
}

export interface TodayPreparationSummary {
  date: string;
  totalPortions: number;
  byDish: DishPreparationCount[];
  meals: Array<{
    id: string;
    subscriptionId: string;
    customerName?: string;
    dishName: string;
    mealType: string;
    quantity: number;
    status: OccurrenceStatus;
    deliveryAddress?: string;
  }>;
}

export interface ProviderEarningsSummary {
  periodStart: string;
  periodEnd: string;
  grossRevenue: string;
  platformFee: string;
  netReceivable: string;
  currency: string;
  deliveredMealsCount: number;
}

export interface ProviderSubscriberItem extends Subscription {
  customerName?: string;
  customerPhone?: string;
  locationLabel?: string;
  addressLine?: string;
  dishName?: string;
}

export const providerOperationsApi = {
  getTodayMeals: (date?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const query = params.toString();
    return api.get<TodayPreparationSummary>(
      `/provider/meals/today${query ? `?${query}` : ''}`
    );
  },

  getUpcomingMeals: (days = 7) =>
    api.get<unknown[]>(`/provider/meals/upcoming?days=${days}`),

  updateMealStatus: (
    occurrenceId: string,
    status: 'SCHEDULED' | 'PREPARING' | 'READY'
  ) =>
    api.patch<{ id: string; status: OccurrenceStatus }>(
      `/provider/meals/${occurrenceId}/status`,
      { status }
    ),

  getSubscribers: () =>
    api.get<ProviderSubscriberItem[]>('/provider/subscriptions'),

  getEarnings: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return api.get<ProviderEarningsSummary>(
      `/provider/earnings${query ? `?${query}` : ''}`
    );
  },
};
