import { api } from './client';

export interface Review {
  id: string;
  providerId: string;
  subscriptionId: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  subscriptionId: string;
  category: string;
  status: string;
  createdAt: string;
}

export const reviewsApi = {
  create: (subscriptionId: string, rating: number, comment?: string) =>
    api.post<Review>('/reviews', { subscriptionId, rating, comment }),
  listForProvider: (providerId: string) =>
    api.get<Review[]>(`/reviews/provider/${providerId}`),
};

export const disputesApi = {
  raise: (subscriptionId: string, category: string) =>
    api.post<Dispute>('/disputes', { subscriptionId, category }),
  listMine: () => api.get<Dispute[]>('/disputes/mine'),
};
