import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface TeamApprovalInput {
  assignmentId: string;
  orderId: string;
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId }: TeamApprovalInput) => {
      const res = await api.patch(`/pro/assignments/${assignmentId}/approve`);
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pro-join-requests', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pro-open-slots'] });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId }: TeamApprovalInput) => {
      const res = await api.patch(`/pro/assignments/${assignmentId}/reject`);
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pro-join-requests', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pro-open-slots'] });
    },
  });
}
