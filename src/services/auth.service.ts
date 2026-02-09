import { apiClient } from '@/utils/ApiClient';

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  workspaceName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  workspace?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

class AuthService {
  public async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.token) {
      this.saveToken(response.token);
    }
    return response;
  }

  public async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.token) {
      this.saveToken(response.token);
    }
    return response;
  }

  public saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  public getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  public removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public logout(): void {
    this.removeToken();
  }
}

export const authService = new AuthService();
