import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface ToggleAvailabilityInput {
  isAvailable: boolean;
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isAvailable }: ToggleAvailabilityInput) => {
      const res = await api.patch('/pro/availability', { isAvailable });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-profile'] });
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
    },
  });
}
