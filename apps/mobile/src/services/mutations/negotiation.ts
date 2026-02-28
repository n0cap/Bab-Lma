import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, generateIdempotencyKey } from '../api';

export function useSendMessage(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const clientMessageId = generateIdempotencyKey();
      const res = await api.post(`/orders/${orderId}/messages`, {
        content,
        clientMessageId,
      });
      return res.data.data;
    },
    onSuccess: (message) => {
      // Optimistic: append to messages cache
      queryClient.setQueryData<any>(['messages', orderId], (old: any) => {
        if (!old) return old;
        const pages = [...old.pages];
        const lastPage = { ...pages[pages.length - 1] };
        lastPage.data = [...(lastPage.data ?? []), message];
        pages[pages.length - 1] = lastPage;
        return { ...old, pages };
      });
    },
  });
}

export function useCreateOffer(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post(`/orders/${orderId}/offers`, { amount });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', orderId] });
    },
  });
}

export function useAcceptOffer(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const res = await api.post(`/orders/${orderId}/offers/${offerId}/accept`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
