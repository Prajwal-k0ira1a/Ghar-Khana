import { api } from './client';
import type {
  Subscription,
  MealOccurrence,
  MealType,
  SubscriptionFrequency,
  SubscriptionStatus,
} from '@gharkhana/types';

export interface CreateSubscriptionPayload {
  providerId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  frequency: SubscriptionFrequency;
  mealType: MealType;
  days: number[];
  defaultMenuItemId: string;
  quantity?: number;
  promoCode?: string;
}

export interface SubscriptionWithDetails extends Subscription {
  providerName?: string;
  dishName?: string;
  locationLabel?: string;
  occurrencesCount?: number;
}

export const subscriptionsApi = {
  list: (status?: SubscriptionStatus) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const query = params.toString();
    return api.get<Subscription[]>(`/subscriptions${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => api.get<Subscription>(`/subscriptions/${id}`),

  create: (payload: CreateSubscriptionPayload, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return api.post<Subscription>('/subscriptions', payload, headers);
  },

  activate: (id: string) =>
    api.post<Subscription>(`/subscriptions/${id}/activate`),

  pause: (id: string) =>
    api.post<Subscription>(`/subscriptions/${id}/pause`),

  resume: (id: string) =>
    api.post<Subscription>(`/subscriptions/${id}/resume`),

  cancel: (id: string) =>
    api.post<Subscription>(`/subscriptions/${id}/cancel`),

  getMeals: (id: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return api.get<MealOccurrence[]>(`/subscriptions/${id}/meals${query ? `?${query}` : ''}`);
  },
};
