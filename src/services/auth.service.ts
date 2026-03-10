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

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthResponse {
  token: string;
  workspace?: {
    id: string;
    name: string;
  };
  user?: AuthUser;
}

class AuthService {
  public async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.token) {
      this.saveToken(response.token);
    }
    if (response.user) {
      this.saveUser(response.user);
    }
    return response;
  }

  public async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.token) {
      this.saveToken(response.token);
    }
    if (response.user) {
      this.saveUser(response.user);
    }
    return response;
  }

  public async fetchMe(): Promise<AuthUser> {
    const user = await apiClient.get<AuthUser>('/auth/me');
    this.saveUser(user);
    return user;
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

  public saveUser(user: AuthUser): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  public getUser(): AuthUser | null {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        try { return JSON.parse(raw) as AuthUser; } catch { return null; }
      }
    }
    return null;
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public logout(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }
  }
}

export const authService = new AuthService();
