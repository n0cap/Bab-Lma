import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import type { AuthTokens } from '@babloo/shared';

interface SignupInput {
  email?: string;
  phone?: string;
  password?: string;
  fullName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface OtpRequestInput {
  phone: string;
  purpose: 'login' | 'signup' | 'reset';
}

interface OtpVerifyInput {
  challengeId: string;
  code: string;
  fullName?: string;
}

export function useSignup() {
  return useMutation({
    mutationFn: async (input: SignupInput): Promise<AuthTokens> => {
      const res = await api.post('/auth/signup', input);
      return res.data.data;
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<AuthTokens> => {
      const res = await api.post('/auth/login', input);
      return res.data.data;
    },
  });
}

export function useOtpRequest() {
  return useMutation({
    mutationFn: async (input: OtpRequestInput): Promise<{ challengeId: string }> => {
      const res = await api.post('/auth/otp/request', input);
      return res.data.data;
    },
  });
}

export function useOtpVerify() {
  return useMutation({
    mutationFn: async (input: OtpVerifyInput): Promise<AuthTokens> => {
      const res = await api.post('/auth/otp/verify', input);
      return res.data.data;
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/auth/logout');
    },
  });
}
