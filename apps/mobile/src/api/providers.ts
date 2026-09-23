import { api } from './client';
import type { Provider, MenuItem, Menu } from '@gharkhana/types';

export interface ProviderListItem extends Provider {
  isServiceable?: boolean;
  distance?: string;
  specialty?: string;
  menuItemCount?: number;
}

export interface ProviderFilters {
  lat?: number;
  lng?: number;
  mealType?: string;
  dietaryTag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ProviderDetailResponse {
  provider: Provider;
  menus: Menu[];
  menuItems: MenuItem[];
}

export const providersApi = {
  list: (filters: ProviderFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.lat) params.set('lat', filters.lat.toString());
    if (filters.lng) params.set('lng', filters.lng.toString());
    if (filters.mealType) params.set('mealType', filters.mealType);
    if (filters.dietaryTag) params.set('dietaryTag', filters.dietaryTag);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.pageSize) params.set('pageSize', filters.pageSize.toString());

    const query = params.toString();
    return api.get<ProviderListItem[]>(`/providers${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => api.get<Provider>(`/providers/${id}`),

  getMenus: (providerId: string) =>
    api.get<Menu[]>(`/menus/provider/${providerId}`),

  getMenuItems: (menuId: string) =>
    api.get<MenuItem[]>(`/menus/${menuId}/items`),
};
