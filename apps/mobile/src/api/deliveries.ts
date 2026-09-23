import { api } from './client';
import type { DeliveryStatus } from '@gharkhana/types';

export interface Delivery {
  id: string;
  mealOccurrenceId: string;
  status: DeliveryStatus;
  partnerName: string | null;
  scheduledDate: string;
  occurrenceStatus: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
}

export const deliveriesApi = {
  list: (params?: { status?: string; date?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<Delivery[]>(`/deliveries${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get<Delivery>(`/deliveries/${id}`),
  accept: (id: string, deliveryPartnerId?: string) =>
    api.post<Delivery>(`/deliveries/${id}/accept`, { deliveryPartnerId }),
  markPickedUp: (id: string) => api.post<Delivery>(`/deliveries/${id}/picked-up`),
  markDelivered: (id: string) => api.post<Delivery>(`/deliveries/${id}/delivered`),
  markFailed: (id: string, failureReason: string, deliveryNotes?: string) =>
    api.post<Delivery>(`/deliveries/${id}/failed`, { failureReason, deliveryNotes }),
};
