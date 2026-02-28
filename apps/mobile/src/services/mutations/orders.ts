import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface MenageDetail {
  serviceType: 'menage';
  surface: number;
  cleanType: 'simple' | 'deep';
  teamType: 'solo' | 'duo' | 'squad';
  squadSize?: number;
  notes?: string;
}

interface CuisineDetail {
  serviceType: 'cuisine';
  guests: number;
  dishes?: string;
}

interface ChildcareDetail {
  serviceType: 'childcare';
  children: number;
  hours: number;
  notes?: string;
}

type OrderDetail = MenageDetail | CuisineDetail | ChildcareDetail;

interface CreateOrderInput {
  serviceType: 'menage' | 'cuisine' | 'childcare';
  location: string;
  scheduledStartAt?: string;
  detail: OrderDetail;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const res = await api.post('/orders', input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const res = await api.post(`/orders/${orderId}/cancel`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function usePricingEstimate() {
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await api.post('/pricing/estimate', params);
      return res.data.data as { floorPrice: number; ceiling: number; durationMinutes: { min: number; max: number } };
    },
  });
}
