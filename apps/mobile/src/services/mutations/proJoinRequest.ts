import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface JoinRequestInput {
  orderId: string;
}

export function useJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: JoinRequestInput) => {
      const res = await api.post(`/pro/orders/${orderId}/join-request`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-open-slots'] });
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
    },
  });
}
