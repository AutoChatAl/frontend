import type { ClickSummary, JourneyContact, JourneyTimeline, RecentClick, TrackingSite } from '@/types/Journey';
import { apiClient } from '@/utils/ApiClient';
import { getErrorFromResponse } from '@/utils/ErrorHandling';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

class JourneyService {
  public async getClickSummary(): Promise<ClickSummary> {
    const response = await apiClient.get<{ summary: ClickSummary }>('/journey/clicks/summary');
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar os cliques nos links.');
    }
    return response.data.summary;
  }

  public async listRecentClicks(limit = 30): Promise<RecentClick[]> {
    const response = await apiClient.get<{ clicks: RecentClick[] }>(`/journey/clicks/recent?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar os últimos cliques.');
    }
    return response.data.clicks;
  }

  public async listContacts(search?: string): Promise<JourneyContact[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await apiClient.get<{ contacts: JourneyContact[] }>(`/journey/contacts${query}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar os contatos.');
    }
    return response.data.contacts;
  }

  public async getTimeline(contactId: string): Promise<JourneyTimeline> {
    const response = await apiClient.get<{ timeline: JourneyTimeline }>(`/journey/contacts/${contactId}/timeline`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar a jornada do contato.');
    }
    return response.data.timeline;
  }

  public async getSite(): Promise<TrackingSite> {
    const response = await apiClient.get<{ site: TrackingSite }>('/journey/site');
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar o rastreamento do site.');
    }
    return response.data.site;
  }

  public async updateAllowedDomains(allowedDomains: string[]): Promise<TrackingSite> {
    const response = await apiClient.put<{ site: TrackingSite }>('/journey/site', { allowedDomains });
    if (!response.success || !response.data) {
      throw new Error(getErrorFromResponse(response));
    }
    return response.data.site;
  }

  public buildScriptTag(publicKey: string): string {
    return `<script async src="${API_URL}/t/s.js" data-key="${publicKey}"></script>`;
  }
}

export const journeyService = new JourneyService();
