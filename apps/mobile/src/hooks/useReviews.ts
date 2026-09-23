import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, disputesApi } from '../api/reviews';

export const useProviderReviews = (providerId: string) =>
  useQuery({
    queryKey: ['reviews', providerId],
    queryFn: () => reviewsApi.listForProvider(providerId),
    staleTime: 5 * 60_000,
    enabled: !!providerId,
  });

export const useCreateReview = (providerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      rating,
      comment,
    }: {
      subscriptionId: string;
      rating: number;
      comment?: string;
    }) => reviewsApi.create(subscriptionId, rating, comment),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', providerId] });
    },
  });
};

export const useMyDisputes = () =>
  useQuery({
    queryKey: ['disputes', 'mine'],
    queryFn: () => disputesApi.listMine(),
    staleTime: 60_000,
  });

export const useRaiseDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, category }: { subscriptionId: string; category: string }) =>
      disputesApi.raise(subscriptionId, category),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes', 'mine'] });
    },
  });
};
