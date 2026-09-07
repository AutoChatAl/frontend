import type { AlertPreferences, AlertPreferencesPatch } from '@/types/AlertPreferences';
import { DEFAULT_ALERT_PREFERENCES } from '@/types/AlertPreferences';
import { apiClient } from '@/utils/ApiClient';

/**
 * Cache local por usuário. O primeiro evento de conversa pode chegar antes da
 * resposta do `GET`, e sem o cache ele seria julgado pelo padrão — que pode
 * não ser o que a pessoa escolheu. Chaveado pelo id para não vazar a escolha
 * de uma conta para outra no mesmo navegador.
 */
function cacheKey(userId: string): string {
  return `alert_prefs:${userId}`;
}

function normalize(input: Partial<AlertPreferences> | null | undefined): AlertPreferences {
  return { ...DEFAULT_ALERT_PREFERENCES, ...(input ?? {}) };
}

class AlertPreferencesService {
  public async get(): Promise<AlertPreferences> {
    const response = await apiClient.get<Partial<AlertPreferences>>('/auth/alert-preferences');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar as preferências de alerta.');
    }
    return normalize(response.data);
  }

  public async update(patch: AlertPreferencesPatch): Promise<AlertPreferences> {
    const response = await apiClient.put<Partial<AlertPreferences>>('/auth/alert-preferences', patch);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível salvar as preferências de alerta.');
    }
    return normalize(response.data);
  }

  public readCache(userId: string): AlertPreferences | null {
    try {
      const raw = localStorage.getItem(cacheKey(userId));
      return raw ? normalize(JSON.parse(raw) as Partial<AlertPreferences>) : null;
    } catch {
      return null;
    }
  }

  public writeCache(userId: string, preferences: AlertPreferences): void {
    try {
      localStorage.setItem(cacheKey(userId), JSON.stringify(preferences));
    } catch {
      // Sem armazenamento local (modo privado, cota cheia): a API continua sendo a verdade.
    }
  }
}

export const alertPreferencesService = new AlertPreferencesService();
