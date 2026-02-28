import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useOrders() {
  return useInfiniteQuery({
    queryKey: ['orders'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', '20');
      const res = await api.get(`/orders?${params.toString()}`);
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.cursor : undefined,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data.data;
    },
    enabled: !!orderId,
  });
}
