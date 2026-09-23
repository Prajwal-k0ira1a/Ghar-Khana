import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealsApi } from '../api/meals';

/** Calendar-first server state (ARCHITECTURE.md §9 — short staleTime, calendar is hot). */
export const useSubscriptionMeals = (subscriptionId: string, from?: string, to?: string) =>
  useQuery({
    queryKey: ['meals', subscriptionId, from, to],
    queryFn: () => mealsApi.listForSubscription(subscriptionId, from, to),
    staleTime: 30_000,
    enabled: !!subscriptionId,
  });

export const useSkipMeal = (subscriptionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => mealsApi.skip(mealId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', subscriptionId] });
    },
  });
};

export const useRestoreMeal = (subscriptionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => mealsApi.restore(mealId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', subscriptionId] });
    },
  });
};

export const useCustomizeMeal = (subscriptionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, menuItemId }: { mealId: string; menuItemId: string }) =>
      mealsApi.customize(mealId, menuItemId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', subscriptionId] });
    },
  });
};
