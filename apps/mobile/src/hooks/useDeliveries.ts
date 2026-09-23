import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveriesApi } from '../api/deliveries';

/** Status-based tracking per DELIVERY.md §9 (no live GPS at MVP). */
export const useDeliveries = (params?: { status?: string; date?: string }) =>
  useQuery({
    queryKey: ['deliveries', params],
    queryFn: () => deliveriesApi.list(params),
    staleTime: 30_000,
  });

export const useDelivery = (id: string) =>
  useQuery({
    queryKey: ['deliveries', id],
    queryFn: () => deliveriesApi.getById(id),
    staleTime: 30_000,
    enabled: !!id,
  });

export const useAcceptDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, partnerId }: { id: string; partnerId?: string }) =>
      deliveriesApi.accept(id, partnerId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
};

export const useAdvanceDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, step }: { id: string; step: 'picked-up' | 'delivered' }) =>
      step === 'picked-up' ? deliveriesApi.markPickedUp(id) : deliveriesApi.markDelivered(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
};
