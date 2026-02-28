import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { User } from '@babloo/shared';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User> => {
      const res = await api.get('/users/me');
      return res.data.data;
    },
    enabled,
  });
}
