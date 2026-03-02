import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api';

export interface ProOrder {
  id: string;
  serviceType: 'menage' | 'cuisine' | 'childcare';
  status: string;
  floorPrice: number;
  finalPrice: number | null;
  location: string;
  createdAt: string;
  assignmentStatus: 'assigned' | 'confirmed' | 'declined';
  assignmentId: string;
  assignedAt: string;
  confirmedAt: string | null;
  isLead: boolean;
  detail?: {
    surface?: number | null;
    cleanType?: string | null;
    teamType?: string | null;
    guests?: number | null;
    children?: number | null;
    hours?: number | null;
  } | null;
  client?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  statusEvents?: Array<{
    id: string;
    seq: number;
    toStatus: string;
    createdAt: string;
    reason?: string | null;
  }>;
}

interface ProOrdersPage {
  data: ProOrder[];
  cursor?: string;
  hasMore: boolean;
}

export function useProOrders() {
  return useInfiniteQuery({
    queryKey: ['pro-orders'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', '20');
      const res = await api.get<ProOrdersPage>(`/pro/orders?${params.toString()}`);
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
  });
}
