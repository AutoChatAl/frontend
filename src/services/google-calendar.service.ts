import type { GoogleCalendarStatus } from '@/types/GoogleCalendar';
import { apiClient } from '@/utils/ApiClient';

class GoogleCalendarService {
  public async getStatus(): Promise<GoogleCalendarStatus> {
    const response = await apiClient.get<GoogleCalendarStatus>('/google-calendar/status');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar o status do Google Agenda.');
    }
    return response.data as GoogleCalendarStatus;
  }
  public async getOAuthUrl(): Promise<string> {
    const response = await apiClient.get<{ url: string }>('/google-calendar/oauth/url');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível iniciar a conexão com o Google Agenda.');
    }
    return (response.data as { url: string }).url;
  }
  public async syncNow(): Promise<GoogleCalendarStatus> {
    const response = await apiClient.post<GoogleCalendarStatus>('/google-calendar/sync');
    if (!response.success || !response.data) {
      throw new Error('Falha ao sincronizar com o Google Agenda.');
    }
    return response.data as GoogleCalendarStatus;
  }
  public async disconnect(): Promise<void> {
    const response = await apiClient.delete('/google-calendar');
    if (!response.success) {
      throw new Error('Falha ao desconectar o Google Agenda.');
    }
  }
}
export const googleCalendarService = new GoogleCalendarService();
