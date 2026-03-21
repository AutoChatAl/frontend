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
  totpCode?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  twoFactorEnabled?: boolean;
  workspace?: { id: string; name: string } | null;
}

interface AuthResponse {
  token?: string;
  requires2FA?: boolean;
  workspace?: {
    id: string;
    name: string;
  };
  user?: AuthUser;
}

interface UpdateAccountData {
  workspaceName?: string;
  email?: string;
  name?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface Setup2FAResponse {
  secret: string;
  qrCode: string;
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
    if (authData.requires2FA) {
      return authData;
    }
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

  public async updateAccount(data: UpdateAccountData): Promise<{ user: AuthUser | null; workspace: { id: string; name: string } | null }> {
    const response = await apiClient.put<{ ok: boolean; user: AuthUser | null; workspace: { id: string; name: string } | null }>('/auth/account', data);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível atualizar a conta. Tente novamente.');
    }
    const result = response.data as { ok: boolean; user: AuthUser | null; workspace: { id: string; name: string } | null };
    if (result.user) {
      this.saveUser(result.user);
    }
    return result;
  }

  public async changePassword(data: ChangePasswordData): Promise<void> {
    const response = await apiClient.put<{ ok: boolean }>('/auth/password', data);
    if (!response.success) {
      const errData = response.data as { code?: string } | undefined;
      if (errData?.code === 'INVALID_CURRENT_PASSWORD') {
        throw new Error('Senha atual incorreta.');
      }
      throw new Error('Não foi possível alterar a senha. Tente novamente.');
    }
  }

  public async setup2FA(): Promise<Setup2FAResponse> {
    const response = await apiClient.post<Setup2FAResponse>('/auth/2fa/setup');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível configurar 2FA. Tente novamente.');
    }
    return response.data as Setup2FAResponse;
  }

  public async verify2FA(token: string): Promise<void> {
    const response = await apiClient.post<{ ok: boolean }>('/auth/2fa/verify', { token });
    if (!response.success) {
      throw new Error('Código inválido. Verifique e tente novamente.');
    }
  }

  public async disable2FA(token: string): Promise<void> {
    const response = await apiClient.post<{ ok: boolean }>('/auth/2fa/disable', { token });
    if (!response.success) {
      throw new Error('Código inválido. Não foi possível desativar 2FA.');
    }
  }

  public async clearData(): Promise<void> {
    const response = await apiClient.delete<{ ok: boolean }>('/auth/data');
    if (!response.success) {
      throw new Error('Não foi possível remover os dados. Tente novamente.');
    }
  }

  public async deleteAccount(): Promise<void> {
    const response = await apiClient.delete<{ ok: boolean }>('/auth/account');
    if (!response.success) {
      throw new Error('Não foi possível excluir a conta. Tente novamente.');
    }
  }

  public async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post<{ ok: boolean }>('/auth/forgot-password', { email });
    if (!response.success) {
      throw new Error('Não foi possível enviar o email. Tente novamente.');
    }
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<{ ok: boolean }>('/auth/reset-password', { token, newPassword });
    if (!response.success) {
      throw new Error('Token inválido ou expirado. Solicite um novo link de recuperação.');
    }
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
