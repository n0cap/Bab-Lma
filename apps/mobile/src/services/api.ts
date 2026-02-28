import axios from 'axios';
import * as Crypto from 'expo-crypto';

const PROD_API_BASE_URL = 'https://babloo-api.up.railway.app/v1';

// Configure with EXPO_PUBLIC_API_BASE_URL for real devices/simulators.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (__DEV__ ? 'http://127.0.0.1:3000/v1' : PROD_API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

export function generateIdempotencyKey(): string {
  return Crypto.randomUUID();
}
