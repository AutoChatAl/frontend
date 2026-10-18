import { getErrorMessage } from '@/types/ErrorCode';
import type { Group, GroupWithContacts, CreateGroupInput, ImportGroupPayload, ImportGroupResult, ImportedGroup, UpdateGroupInput } from '@/types/Group';
import { apiClient } from '@/utils/ApiClient';

const IMPORT_TIMEOUT_MS = 120000;
const MAX_IMPORT_BYTES = 6 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xlsm', '.csv'];

interface GroupImportErrorBody {
    reason?: string;
    code?: string;
    message?: string;
    maxContactsPerGroup?: number;
    limit?: number;
    details?: {
        maxContactsPerGroup?: number;
        limit?: number;
    };
}

function asErrorBody(data: unknown): GroupImportErrorBody | undefined {
  if (!data || typeof data !== 'object')
    return undefined;
  return data as GroupImportErrorBody;
}

function readErrorParts(body: GroupImportErrorBody): { code?: string; detail?: string } {
  const raw = (body.reason ?? body.code)?.trim();
  if (!raw)
    return {};
  const separator = raw.indexOf(':');
  if (separator === -1)
    return { code: raw };
  const code = raw.slice(0, separator).trim();
  const detail = raw.slice(separator + 1).trim();
  return detail ? { code, detail } : { code };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function limitFromText(text: string | undefined): number | null {
  if (!text)
    return null;
  const match = /no máximo\s+([\d.]+)/i.exec(text);
  const raw = match?.[1]?.replace(/\./g, '');
  if (!raw)
    return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function isUserFacingLimitMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 400)
    return false;
  if (/[{}<>]|zod|expected|invalid_type|stack/i.test(trimmed))
    return false;
  return /\d/.test(trimmed);
}

/**
 * O limite do plano vem no texto ("O grupo aceita no máximo N contatos.")
 * ou num campo numérico do mesmo corpo. Sem o número, cai na mensagem já cadastrada.
 */
function groupLimitMessage(body: GroupImportErrorBody, detail: string | undefined): string {
  const candidates = [body.message, detail];
  for (const candidate of candidates) {
    if (candidate && isUserFacingLimitMessage(candidate))
      return candidate.trim();
  }
  const limit = finiteNumber(body.maxContactsPerGroup)
    ?? finiteNumber(body.limit)
    ?? finiteNumber(body.details?.maxContactsPerGroup)
    ?? finiteNumber(body.details?.limit)
    ?? limitFromText(body.message)
    ?? limitFromText(detail)
    ?? limitFromText(body.reason);
  if (limit != null)
    return `O grupo aceita no máximo ${limit.toLocaleString('pt-BR')} contatos.`;
  return getErrorMessage('GROUP_CONTACTS_LIMIT_EXCEEDED');
}

function messageForGroupImportError(data: unknown): string {
  const body = asErrorBody(data);
  if (!body)
    return 'Não foi possível criar o grupo com a planilha. Tente novamente.';
  const { code, detail } = readErrorParts(body);
  if (!code)
    return 'Não foi possível criar o grupo com a planilha. Tente novamente.';
  if (code === 'GROUP_CONTACTS_LIMIT_EXCEEDED')
    return groupLimitMessage(body, detail);
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
