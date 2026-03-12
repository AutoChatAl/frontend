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
    if (!response.success || !response.data) {
      throw new Error('Não foi possível registrar. Verifique os dados e tente novamente.');
    }
    const authData = response.data as AuthResponse;
    if (authData.token) {
      this.saveToken(authData.token);
    }
    if (authData.user) {
      this.saveUser(authData.user);
    }
    return authData;
  }

  public async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível fazer login. Verifique os dados e tente novamente.');
    }
    const authData = response.data as AuthResponse;
    if (authData.token) {
      this.saveToken(authData.token);
    }
    if (authData.user) {
      this.saveUser(authData.user);
    }
    return authData;
  }

  public async fetchMe(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível encontrar o usuário. Tente novamente.');
    }
    const user = response.data as AuthUser;
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
