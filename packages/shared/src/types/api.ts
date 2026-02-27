export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface PollResponse {
  data: {
    statusEvents: import('./models').StatusEvent[];
    messages: import('./models').Message[];
    offers: import('./models').NegotiationOffer[];
  };
  latestSeq: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PricingEstimate {
  floorPrice: number;
  ceiling: number;
  durationMinutes: { min: number; max: number };
}
