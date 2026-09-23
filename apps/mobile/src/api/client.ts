import type { ApiResponse, ApiErrorResponse } from '@gharkhana/types';

declare const process: {
  env: Record<string, string | undefined>;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private onTokenExpired: (() => Promise<string | null>) | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setOnTokenExpired(handler: () => Promise<string | null>) {
    this.onTokenExpired = handler;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration
    if (response.status === 401 && this.onTokenExpired) {
      const errorJson: ApiErrorResponse = await response.clone().json().catch(() => ({}));
      if (errorJson?.error?.code === 'TOKEN_EXPIRED') {
        const newToken = await this.onTokenExpired();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        }
      }
    }

    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}`,
          },
        };
      }
      throw errorData.error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    const json: ApiResponse<T> = await response.json();
    return json.data;
  }

  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const api = new ApiClient();
