import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface DeclineAssignmentInput {
  assignmentId: string;
}

export function useDeclineAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId }: DeclineAssignmentInput) => {
      const res = await api.post(`/pro/assignments/${assignmentId}/decline`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
