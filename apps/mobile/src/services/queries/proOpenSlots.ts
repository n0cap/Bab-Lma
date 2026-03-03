import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export interface ProOpenSlot {
  id: string;
  serviceType: 'menage' | 'cuisine' | 'childcare';
  status: string;
  floorPrice: number;
  finalPrice: number | null;
  location: string;
  createdAt: string;
  detail?: {
    teamType?: string | null;
    squadSize?: number | null;
  } | null;
  client?: {
    id: string;
    fullName: string;
  } | null;
  filledSlots: number;
  totalSlots: number;
}

export function useProOpenSlots() {
  return useQuery({
    queryKey: ['pro-open-slots'],
    queryFn: async () => {
      const res = await api.get('/pro/open-slots');
      return res.data.data as ProOpenSlot[];
    },
  });
}
