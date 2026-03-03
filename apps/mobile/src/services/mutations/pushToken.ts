import { useMutation } from '@tanstack/react-query';
import { api } from '../api';

export async function registerPushToken(input: { token: string; platform: 'ios' | 'android' }) {
  await api.post('/users/push-token', input);
}

export async function unregisterPushToken(input: { token: string }) {
  await api.delete('/users/push-token', { data: input });
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: registerPushToken,
  });
}

export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: unregisterPushToken,
  });
}
