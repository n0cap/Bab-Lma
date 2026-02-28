import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fullName?: string }) => {
      const res = await api.patch('/users/me', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
