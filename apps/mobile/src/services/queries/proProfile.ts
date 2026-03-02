import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export interface ProProfile {
  id: string;
  userId: string;
  rating: number;
  totalSessions: number;
  reliability: number;
  isAvailable: boolean;
  skills: string[];
  zones: string[];
}

export function useProProfile() {
  return useQuery({
    queryKey: ['pro-profile'],
    queryFn: async () => {
      const res = await api.get('/pro/profile');
      return res.data.data as ProProfile;
    },
  });
}
