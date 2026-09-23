import { api } from './client';
import type { CustomerLocation } from '@gharkhana/types';

export interface CreateLocationPayload {
  label: string;
  addressLine: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  isDefault?: boolean;
}

export interface ServiceabilityResponse {
  isServiceable: boolean;
  distanceMeters?: number;
  providerId: string;
  locationId: string;
}

export const locationsApi = {
  list: () => api.get<CustomerLocation[]>('/locations/user/all'),

  create: (payload: CreateLocationPayload) =>
    api.post<CustomerLocation>('/locations', payload),

  update: (id: string, payload: Partial<CreateLocationPayload>) =>
    api.patch<CustomerLocation>(`/locations/${id}`, payload),

  delete: (id: string) => api.delete<void>(`/locations/${id}`),

  checkServiceability: (locationId: string, providerId: string) =>
    api.get<ServiceabilityResponse>(
      `/locations/${locationId}/serviceability?providerId=${encodeURIComponent(providerId)}`
    ),
};
