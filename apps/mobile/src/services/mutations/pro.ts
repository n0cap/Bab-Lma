import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface UpdateOrderStatusInput {
  orderId: string;
  toStatus: string;
  reason?: string;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, toStatus, reason }: UpdateOrderStatusInput) => {
      const res = await api.patch(`/orders/${orderId}/status`, { toStatus, reason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
