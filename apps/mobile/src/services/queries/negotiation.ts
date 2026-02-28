import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useMessages(orderId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', orderId],
    queryFn: async ({ pageParam }: { pageParam?: number }) => {
      const params = new URLSearchParams();
      if (pageParam != null) params.set('sinceSeq', String(pageParam));
      params.set('limit', '50');
      const res = await api.get(`/orders/${orderId}/messages?${params.toString()}`);
      return res.data;
    },
    initialPageParam: 0 as number,
    getNextPageParam: (lastPage) => {
      const msgs = lastPage.data;
      if (!msgs || msgs.length === 0) return undefined;
      // Return the last seq as the next cursor
      return msgs[msgs.length - 1].seq;
    },
    enabled: !!orderId,
  });
}

export function useOffers(orderId: string) {
  return useQuery({
    queryKey: ['offers', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}/offers`);
      return res.data.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Polling fallback — only enabled when socket is disconnected.
 * Polls every 10s for new messages, offers, and status events.
 */
export function usePoll(orderId: string, sinceSeq: number, enabled: boolean) {
  return useQuery({
    queryKey: ['poll', orderId, sinceSeq],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}/poll?sinceSeq=${sinceSeq}`);
      return res.data.data;
    },
    enabled: enabled && !!orderId,
    refetchInterval: enabled ? 10_000 : false,
  });
}
