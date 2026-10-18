import { getErrorMessage } from '@/types/ErrorCode';
import type { Group, GroupWithContacts, CreateGroupInput, ImportGroupPayload, ImportGroupResult, ImportedGroup, UpdateGroupInput } from '@/types/Group';
import { apiClient } from '@/utils/ApiClient';

const IMPORT_TIMEOUT_MS = 120000;
const MAX_IMPORT_BYTES = 6 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xlsm', '.csv'];

interface GroupImportErrorBody {
    reason?: string;
    code?: string;
}

function asErrorBody(data: unknown): GroupImportErrorBody | undefined {
  if (!data || typeof data !== 'object')
    return undefined;
  return data as GroupImportErrorBody;
}

/** O backend pode mandar `CODIGO: detalhe`; só o código escolhe a mensagem. */
function readErrorCode(body: GroupImportErrorBody): string | undefined {
  const raw = (body.reason ?? body.code)?.trim();
  if (!raw)
    return undefined;
  const separator = raw.indexOf(':');
  return separator === -1 ? raw : raw.slice(0, separator).trim();
}

function messageForGroupImportError(data: unknown): string {
  const body = asErrorBody(data);
  const code = body ? readErrorCode(body) : undefined;
  if (!code)
    return 'Não foi possível criar o grupo com a planilha. Tente novamente.';
  return getErrorMessage(code);
}

function isImportResult(data: unknown): data is ImportGroupResult {
  if (!data || typeof data !== 'object')
    return false;
  const body = data as { group?: unknown; report?: unknown };
  return !!body.group && typeof body.group === 'object' && !!body.report && typeof body.report === 'object';
}

function normalizeImportedGroup(group: ImportedGroup & { _id?: string }): ImportedGroup {
  return { ...group, id: group.id || group._id || '' };
}

class GroupService {
  public async listGroups(): Promise<Group[]> {
    const response = await apiClient.get<Group[]>('/groups');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar grupos. Tente novamente.');
    }
    return response.data as Group[];
  }
  public async getGroup(id: string): Promise<GroupWithContacts> {
    const response = await apiClient.get<GroupWithContacts>(`/groups/${id}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar grupo. Tente novamente.');
    }
    return response.data as GroupWithContacts;
  }
  public async createGroup(data: CreateGroupInput): Promise<Group> {
    const response = await apiClient.post<Group>('/groups', data);
    if (!response.success || !response.data) {
      throw new Error('Falha ao criar grupo. Tente novamente.');
    }
    return response.data as Group;
  }
  public async updateGroup(id: string, data: UpdateGroupInput): Promise<Group> {
    const response = await apiClient.put<Group>(`/groups/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error('Falha ao atualizar grupo. Tente novamente.');
    }
    return response.data as Group;
  }
  public async deleteGroup(id: string): Promise<void> {
    const response = await apiClient.delete(`/groups/${id}`);
    if (!response.success) {
      throw new Error('Falha ao deletar grupo. Tente novamente.');
    }
  }
  public async setMembers(groupId: string, contactIds: string[]): Promise<void> {
    const response = await apiClient.post(`/groups/${groupId}/members`, { contactIds });
    if (!response.success) {
      throw new Error('Falha ao definir membros do grupo. Tente novamente.');
    }
  }
  /**
   * Cria o grupo manual já com os contatos da planilha (`POST /groups/import`).
   * Só envia quando o nome é válido e o consentimento foi confirmado na tela.
   */
  public async importGroup(input: { name: string; file: File; consentConfirmed: true }): Promise<ImportGroupResult> {
    const name = input.name.trim();
    if (name.length < 2)
      throw new Error('O nome do grupo precisa ter pelo menos 2 caracteres.');
    if (input.consentConfirmed !== true)
      throw new Error('Confirme que essas pessoas autorizaram receber mensagens antes de importar.');
    const extension = ACCEPTED_EXTENSIONS.find((item) => input.file.name.toLowerCase().endsWith(item));
    if (!extension)
      throw new Error(getErrorMessage('IMPORT_FILE_NOT_XLSX'));
    if (input.file.size === 0)
      throw new Error(getErrorMessage('IMPORT_FILE_EMPTY'));
    if (input.file.size > MAX_IMPORT_BYTES)
      throw new Error(getErrorMessage('IMPORT_FILE_TOO_LARGE'));
    const fileBase64 = await this.readFileAsBase64(input.file);
    const payload: ImportGroupPayload = {
      name,
      fileName: input.file.name,
      fileBase64,
      consentConfirmed: true,
    };
    const response = await apiClient.post<ImportGroupResult>('/groups/import', payload, { timeoutMs: IMPORT_TIMEOUT_MS });
    if (!response.success || !isImportResult(response.data))
      throw new Error(messageForGroupImportError(response.data));
    return {
      group: normalizeImportedGroup(response.data.group as ImportedGroup & { _id?: string }),
      report: response.data.report,
    };
  }
  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const separatorIndex = result.indexOf(',');
        resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
      reader.readAsDataURL(file);
    });
  }
}
export const groupService = new GroupService();
