export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data?: T;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
      return {
        success: false,
        statusCode: 0,
        data: { reason: 'MIXED_CONTENT_BLOCKED' } as T,
      };
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 12_000) : null;

    const config: RequestInit = {
      ...options,
      ...(controller ? { signal: controller.signal } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          data: body,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data: body,
      };
    } catch (_error) {
      return {
        success: false,
        statusCode: 0,
        data: { reason: 'NETWORK_ERROR' } as T,
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }

  public async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  public async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }
}

export const apiClient = new ApiClient();
