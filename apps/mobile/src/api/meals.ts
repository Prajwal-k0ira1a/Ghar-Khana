import { api } from './client';

export interface MealOccurrence {
  id: string;
  subscriptionId: string;
  scheduledDate: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: string;
  customizationSource: string;
  cutoffAt: string;
  isPastCutoff: boolean;
  menuItemName?: string;
  glyph: string;
  variant: 'confirmed' | 'customized' | 'skipped' | 'warning';
}

export const mealsApi = {
  listForSubscription: (subscriptionId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return api.get<MealOccurrence[]>(
      `/subscriptions/${subscriptionId}/meals${query ? `?${query}` : ''}`
    );
  },
  getById: (id: string) => api.get<MealOccurrence>(`/meals/${id}`),
  customize: (id: string, menuItemId: string, quantity = 1) =>
    api.patch<MealOccurrence>(`/meals/${id}`, { menuItemId, quantity }),
  skip: (id: string) => api.post<MealOccurrence>(`/meals/${id}/skip`),
  restore: (id: string) => api.post<MealOccurrence>(`/meals/${id}/restore`),
};
