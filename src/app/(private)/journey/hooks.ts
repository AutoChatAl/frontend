import { useCallback, useEffect, useState } from 'react';

import { journeyService } from '@/services/journey.service';
import type { ClickSummary, JourneyContact, JourneyTimeline, RecentClick, TrackingSite } from '@/types/Journey';

interface UseClickOverviewReturn {
  summary: ClickSummary | null;
  recent: RecentClick[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useClickOverview(): UseClickOverviewReturn {
  const [summary, setSummary] = useState<ClickSummary | null>(null);
  const [recent, setRecent] = useState<RecentClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, nextRecent] = await Promise.all([
        journeyService.getClickSummary(),
        journeyService.listRecentClicks(),
      ]);
      setSummary(nextSummary);
      setRecent(nextRecent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar os cliques.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, recent, loading, error, reload: load };
}

interface UseJourneyContactsReturn {
  contacts: JourneyContact[];
  loading: boolean;
  error: string | null;
}

export function useJourneyContacts(search: string): UseJourneyContactsReturn {
  const [contacts, setContacts] = useState<JourneyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    journeyService
      .listContacts(search || undefined)
      .then((next) => {
        if (active) setContacts(next);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Erro ao carregar os contatos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search]);

  return { contacts, loading, error };
}

interface UseJourneyTimelineReturn {
  timeline: JourneyTimeline | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useJourneyTimeline(contactId: string | null): UseJourneyTimelineReturn {
  const [timeline, setTimeline] = useState<JourneyTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contactId) {
      setTimeline(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setTimeline(await journeyService.getTimeline(contactId));
    } catch (err) {
      setTimeline(null);
      setError(err instanceof Error ? err.message : 'Erro ao carregar a jornada.');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  return { timeline, loading, error, reload: load };
}

interface UseTrackingSiteReturn {
  site: TrackingSite | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveDomains: (domains: string[]) => Promise<void>;
  reload: () => void;
}

export function useTrackingSite(): UseTrackingSiteReturn {
  const [site, setSite] = useState<TrackingSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSite(await journeyService.getSite());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o rastreamento do site.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveDomains = useCallback(async (domains: string[]) => {
    setSaving(true);
    try {
      setSite(await journeyService.updateAllowedDomains(domains));
    } finally {
      setSaving(false);
    }
  }, []);

  return { site, loading, error, saving, saveDomains, reload: load };
}
