import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';

/**
 * Listens to Socket.IO events for a given order and writes updates
 * directly into TanStack Query cache. No parallel state.
 *
 * Returns typing state for the UI.
 */
export function useSocketEvents(orderId: string | undefined) {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [typingUserId, setTypingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !orderId || !isConnected) return;

    // ── message:new → append to messages cache ──
    const onMessageNew = (message: any) => {
      if (message.orderId !== orderId) return;
      queryClient.setQueryData<any>(['messages', orderId], (old: any) => {
        if (!old) return old;
        // Append to the last page's data
        const pages = [...old.pages];
        const lastPage = { ...pages[pages.length - 1] };
        lastPage.data = [...(lastPage.data ?? []), message];
        pages[pages.length - 1] = lastPage;
        return { ...old, pages };
      });
    };

    // ── offer:new → invalidate offers cache ──
    const onOfferNew = (offer: any) => {
      if (offer.orderId !== orderId) return;
      queryClient.invalidateQueries({ queryKey: ['offers', orderId] });
    };

    // ── offer:accepted → invalidate orders cache ──
    const onOfferAccepted = () => {
      queryClient.invalidateQueries({ queryKey: ['offers', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    // ── order:updated → invalidate order + list cache ──
    const onOrderUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    // ── typing:indicator → set typing state briefly ──
    const onTypingIndicator = (data: { userId: string; orderId: string }) => {
      if (data.orderId !== orderId) return;
      setTypingUserId(data.userId);
      // Clear after 3s
      setTimeout(() => setTypingUserId(null), 3000);
    };

    socket.on('message:new', onMessageNew);
    socket.on('offer:new', onOfferNew);
    socket.on('offer:accepted', onOfferAccepted);
    socket.on('order:updated', onOrderUpdated);
    socket.on('typing:indicator', onTypingIndicator);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('offer:new', onOfferNew);
      socket.off('offer:accepted', onOfferAccepted);
      socket.off('order:updated', onOrderUpdated);
      socket.off('typing:indicator', onTypingIndicator);
    };
  }, [socket, orderId, isConnected, queryClient]);

  return { typingUserId, isConnected };
}
