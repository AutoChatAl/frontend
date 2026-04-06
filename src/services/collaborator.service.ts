import { apiClient } from '@/utils/ApiClient';

import type { Permission } from './auth.service';

export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'collaborator';
  permissions: Permission[];
  createdAt: string;
}

export interface Invite {
  id: string;
  email: string;
  workspaceId: string;
  permissions: Permission[];
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

interface InviteValidation {
  email: string;
  workspaceName: string;
}

interface AcceptInviteResponse {
  token: string;
  user: { id: string; email: string; name?: string };
}

class CollaboratorService {
  public async getMembers(): Promise<Member[]> {
    const response = await apiClient.get<Member[]>('/collaborators/members');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar os membros.');
    }
    return response.data as Member[];
  }

  public async getInvites(): Promise<Invite[]> {
    const response = await apiClient.get<Invite[]>('/collaborators/invites');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar os convites.');
    }
    return response.data as Invite[];
  }

  public async sendInvite(email: string, permissions: Permission[]): Promise<void> {
    const response = await apiClient.post<{ ok: boolean }>('/collaborators/invite', { email, permissions });
    if (!response.success) {
      const data = response.data as { reason?: string } | undefined;
      if (data?.reason === 'USER_ALREADY_MEMBER') {
        throw new Error('Este usuário já é membro do workspace.');
      }
      if (data?.reason === 'INVITE_ALREADY_PENDING') {
        throw new Error('Já existe um convite pendente para este email.');
      }
      if (data?.reason === 'EMAIL_SEND_FAILED') {
        throw new Error('Não foi possível enviar o email de convite.');
      }
      throw new Error('Erro ao enviar convite. Tente novamente.');
    }
  }

  public async updateMember(membershipId: string, permissions: Permission[]): Promise<void> {
    const response = await apiClient.put<{ ok: boolean }>(`/collaborators/members/${membershipId}`, { permissions });
    if (!response.success) {
      throw new Error('Não foi possível atualizar as permissões.');
    }
  }

  public async removeMember(membershipId: string): Promise<void> {
    const response = await apiClient.delete<{ ok: boolean }>(`/collaborators/members/${membershipId}`);
    if (!response.success) {
      throw new Error('Não foi possível remover o membro.');
    }
  }

  public async cancelInvite(inviteId: string): Promise<void> {
    const response = await apiClient.delete<{ ok: boolean }>(`/collaborators/invites/${inviteId}`);
    if (!response.success) {
      throw new Error('Não foi possível cancelar o convite.');
    }
  }

  public async validateInvite(token: string): Promise<InviteValidation> {
    const response = await apiClient.get<InviteValidation>(`/collaborators/invite/validate?token=${token}`);
    if (!response.success || !response.data) {
      const data = response.data as { reason?: string } | undefined;
      if (data?.reason === 'INVITE_EXPIRED') {
        throw new Error('Este convite expirou. Solicite um novo convite ao administrador.');
      }
      if (data?.reason === 'INVITE_ALREADY_USED') {
        throw new Error('Este convite já foi utilizado.');
      }
      throw new Error('Convite inválido ou não encontrado.');
    }
    return response.data as InviteValidation;
  }

  public async acceptInvite(token: string, name: string, password: string): Promise<AcceptInviteResponse> {
    const response = await apiClient.post<AcceptInviteResponse>('/collaborators/invite/accept', { token, name, password });
    if (!response.success || !response.data) {
      const data = response.data as { reason?: string } | undefined;
      if (data?.reason === 'INVITE_EXPIRED') {
        throw new Error('Este convite expirou.');
      }
      if (data?.reason === 'USER_ALREADY_MEMBER') {
        throw new Error('Você já é membro deste workspace.');
      }
      throw new Error('Não foi possível aceitar o convite. Tente novamente.');
    }
    return response.data as AcceptInviteResponse;
  }
}

export const collaboratorService = new CollaboratorService();
