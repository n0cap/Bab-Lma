import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export interface TeamMemberAssignment {
  id: string;
  status: 'assigned' | 'confirmed' | 'declined';
  assignedAt: string;
  confirmedAt: string | null;
  professional: {
    id: string;
    rating: number;
    reliability: number;
    totalSessions: number;
    user: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
  };
}

interface JoinRequestsResponse {
  pending: TeamMemberAssignment[];
  confirmed: TeamMemberAssignment[];
}

export function useJoinRequests(orderId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['pro-join-requests', orderId],
    enabled: Boolean(orderId) && enabled,
    queryFn: async () => {
      const res = await api.get(`/pro/orders/${orderId}/join-requests`);
      return res.data.data as JoinRequestsResponse;
    },
  });
}
