'use client';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import AttendantAlertStack, { type AttendantAlert } from '@/components/AttendantAlertStack';
import BrowserNotificationNudge from '@/components/BrowserNotificationNudge';
import { hasPermission } from '@/contexts/SidebarContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { alertPreferencesService } from '@/services/alert-preferences.service';
import { authService } from '@/services/auth.service';
import { inboxService } from '@/services/inbox.service';
import type { AlertPreferences, AlertPreferencesPatch, AlertTone } from '@/types/AlertPreferences';
import { DEFAULT_ALERT_PREFERENCES } from '@/types/AlertPreferences';
import type { InboxChannelType, InboxConversation } from '@/types/Inbox';
import { playAlertTone, primeAlertAudio } from '@/utils/alertSound';
import { subscribeToEvents } from '@/utils/SharedEventSource';

/** Estado da permissão de notificação do navegador, com o caso de não existir a API. */
export type BrowserNotificationPermission = NotificationPermission | 'unsupported';

interface AttendantAlertsContextValue {
  preferences: AlertPreferences;
  /** `false` enquanto o servidor não respondeu — o cache local pode estar valendo. */
  loaded: boolean;
  saving: boolean;
  updatePreferences: (patch: AlertPreferencesPatch) => Promise<void>;
  browserPermission: BrowserNotificationPermission;
  requestBrowserPermission: () => Promise<BrowserNotificationPermission>;
  /** Toca o toque para a pessoa ouvir antes de escolher. Devolve false se o navegador bloqueou o áudio. */
  previewSound: (tone?: AlertTone) => Promise<boolean>;
  /**
   * Dispara uma notificação do navegador de teste, sem depender de evento nenhum.
   * Separa os dois lados do problema: false = o navegador recusou (sem permissão);
   * true sem nada na tela = o sistema operacional está segurando as notificações.
   */
  previewBrowserNotification: () => boolean;
  /**
   * A tela do chat avisa qual conversa está aberta. Mensagem nessa conversa, com
   * a aba visível, não gera alerta — a pessoa já está olhando para ela.
   */
  setOpenConversationId: (conversationId: string | null) => void;
  /**
   * Conversa que o clique num alerta pediu para abrir. A caixa de entrada lê ao
   * montar (ou ao mudar, se já estava aberta), seleciona e consome. Vai por aqui,
   * e não pela URL, porque a página não remonta quando já está em /inbox.
   */
  pendingConversationId: string | null;
  requestOpenConversation: (conversationId: string | null) => void;
  consumePendingConversation: () => void;
}

const AttendantAlertsContext = createContext<AttendantAlertsContextValue | null>(null);

interface IncomingPayload {
  conversationId?: string;
  contactId?: string;
  channelType?: InboxChannelType;
  isNew?: boolean;
}

interface QueueEnteredPayload {
  contactId?: string;
  channelId?: string | null;
  conversationId?: string | null;
}

/** Uma mensagem por conversa nesta janela: cinco mensagens seguidas viram um aviso só. */
const REPEAT_WINDOW_MS = 8000;
/** Quanto tempo o cartão fica na tela. Mais longo que o toast comum: a pessoa pode estar longe. */
const TOAST_TTL_MS = 10000;
const MAX_TOASTS = 4;
const TITLE_BADGE = /^\(\d+\)\s/;
const SOUND_CLAIM_PREFIX = 'alert_sound_claim:';
/** "Agora não" no convite de permissão vale por uma semana — depois ele volta a perguntar. */
const NUDGE_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SOUND_CLAIM_TTL_MS = 5000;
const SOUND_CLAIM_PRUNE_MS = 60000;

function readBrowserPermission(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** A aba está em segundo plano ou a janela perdeu o foco — a pessoa não está olhando. */
function isAway(): boolean {
  if (typeof document === 'undefined') return false;
  return document.visibilityState !== 'visible' || !document.hasFocus();
}

/**
 * Duas abas do Synq recebem o mesmo evento, e o som deve sair de uma só. A primeira
 * a reclamar a chave toca; a outra encontra a marca e fica muda. O cartão e a
 * notificação seguem em cada aba — só uma está visível por vez, e o sistema
 * operacional já agrupa notificações pela mesma `tag`.
 */
function claimSound(key: string): boolean {
  try {
    const now = Date.now();
    const storageKey = `${SOUND_CLAIM_PREFIX}${key}`;
    const raw = localStorage.getItem(storageKey);
    if (raw && now - Number(raw) < SOUND_CLAIM_TTL_MS) return false;
    localStorage.setItem(storageKey, String(now));
    // Marcas velhas não servem para nada e não podem se acumular.
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const candidate = localStorage.key(index);
      if (!candidate || !candidate.startsWith(SOUND_CLAIM_PREFIX) || candidate === storageKey) continue;
      if (now - Number(localStorage.getItem(candidate)) > SOUND_CLAIM_PRUNE_MS) localStorage.removeItem(candidate);
    }
    return true;
  } catch {
    // Sem armazenamento local não há como coordenar as abas: cada uma toca o seu.
    return true;
  }
}

function nudgeKey(userId: string): string {
  return `alert_permission_nudge:${userId}`;
}

function isNudgeSnoozed(userId: string): boolean {
  try {
    const raw = localStorage.getItem(nudgeKey(userId));
    return !!raw && Date.now() - Number(raw) < NUDGE_SNOOZE_MS;
  } catch {
    return false;
  }
}

function contactLabel(conversation: InboxConversation | null): string {
  return conversation?.contactName?.trim() || conversation?.contactIdentifier?.trim() || 'Novo contato';
}

export function AttendantAlertsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthUser();
  const userId = user?.id ?? null;
  // Só quem enxerga a caixa de entrada recebe alerta dela. Sem o gate, o colaborador
  // sem `inbox` buscaria uma conversa a cada evento só para receber 403.
  const canListen = hasPermission(user, 'inbox');

  const [preferences, setPreferences] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationPermission>('unsupported');
  const [toasts, setToasts] = useState<AttendantAlert[]>([]);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [nudgeSnoozed, setNudgeSnoozed] = useState(true);
  const [requestingPermission, setRequestingPermission] = useState(false);

  // Espelhos para os handlers do stream, que são registrados uma vez só.
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const openConversationRef = useRef<string | null>(null);
  const lastAlertAtRef = useRef(new Map<string, number>());
  const unseenCountRef = useRef(0);
  const toastTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    setBrowserPermission(readBrowserPermission());
  }, []);

  useEffect(() => {
    if (userId) setNudgeSnoozed(isNudgeSnoozed(userId));
  }, [userId]);

  /**
   * Preferências: o cache local entra na hora, o servidor confirma em seguida. Assim
   * um evento que chegue no primeiro segundo é julgado pela escolha da pessoa, e não
   * pelo padrão.
   */
  useEffect(() => {
    if (!userId) return undefined;
    const cached = alertPreferencesService.readCache(userId);
    if (cached) setPreferences(cached);
    let cancelled = false;
    alertPreferencesService.get()
      .then((fresh) => {
        if (cancelled) return;
        setPreferences(fresh);
        alertPreferencesService.writeCache(userId, fresh);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [userId]);

  /**
   * O navegador só toca áudio depois de um gesto na página. O primeiro clique ou
   * tecla libera o contexto de som, para o toque do primeiro evento não sair mudo.
   */
  useEffect(() => {
    const prime = () => {
      primeAlertAudio();
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
    window.addEventListener('pointerdown', prime);
    window.addEventListener('keydown', prime);
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, []);

  const updatePreferences = useCallback(async (patch: AlertPreferencesPatch) => {
    const previous = preferencesRef.current;
    const optimistic = { ...previous, ...patch };
    // Otimista: o interruptor responde na hora e o próximo evento já respeita a escolha.
    setPreferences(optimistic);
    preferencesRef.current = optimistic;
    setSaving(true);
    try {
      const saved = await alertPreferencesService.update(patch);
      setPreferences(saved);
      if (userId) alertPreferencesService.writeCache(userId, saved);
    } catch (error) {
      setPreferences(previous);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  const requestBrowserPermission = useCallback(async (): Promise<BrowserNotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    setRequestingPermission(true);
    try {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
      return result;
    } catch {
      const current = readBrowserPermission();
      setBrowserPermission(current);
      return current;
    } finally {
      setRequestingPermission(false);
    }
  }, []);

  const snoozeNudge = useCallback(() => {
    setNudgeSnoozed(true);
    if (!userId) return;
    try {
      localStorage.setItem(nudgeKey(userId), String(Date.now()));
    } catch {
      // Sem armazenamento local o convite volta no próximo carregamento — aceitável.
    }
  }, [userId]);

  const previewSound = useCallback((tone?: AlertTone) => {
    return playAlertTone(tone ?? preferencesRef.current.soundTone);
  }, []);

  const setOpenConversationId = useCallback((conversationId: string | null) => {
    openConversationRef.current = conversationId;
  }, []);

  /**
   * Contador no título da aba enquanto a pessoa está longe: "(3) Synq". É o que se
   * enxerga na barra de abas sem nenhuma permissão — some ao voltar para a aba.
   */
  const bumpTitleBadge = useCallback(() => {
    if (!isAway()) return;
    unseenCountRef.current += 1;
    const base = document.title.replace(TITLE_BADGE, '');
    document.title = `(${unseenCountRef.current}) ${base}`;
  }, []);

  useEffect(() => {
    const clear = () => {
      if (document.visibilityState !== 'visible') return;
      if (unseenCountRef.current === 0) return;
      unseenCountRef.current = 0;
      document.title = document.title.replace(TITLE_BADGE, '');
    };
    document.addEventListener('visibilitychange', clear);
    window.addEventListener('focus', clear);
    return () => {
      document.removeEventListener('visibilitychange', clear);
      window.removeEventListener('focus', clear);
    };
  }, []);

  const requestOpenConversation = useCallback((conversationId: string | null) => {
    setPendingConversationId(conversationId);
  }, []);

  const consumePendingConversation = useCallback(() => {
    setPendingConversationId(null);
  }, []);

  const openAlert = useCallback((alert: Pick<AttendantAlert, 'conversationId'>) => {
    setPendingConversationId(alert.conversationId);
    router.push('/inbox');
  }, [router]);

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimersRef.current.delete(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((alert: AttendantAlert) => {
    setToasts((prev) => {
      const next = [alert, ...prev.filter((toast) => toast.id !== alert.id)];
      // Acima do limite, os mais antigos saem — a pilha não pode cobrir a tela.
      const kept = next.slice(0, MAX_TOASTS);
      for (const dropped of next.slice(MAX_TOASTS)) {
        const timer = toastTimersRef.current.get(dropped.id);
        if (timer) clearTimeout(timer);
        toastTimersRef.current.delete(dropped.id);
      }
      return kept;
    });
    const existing = toastTimersRef.current.get(alert.id);
    if (existing) clearTimeout(existing);
    toastTimersRef.current.set(alert.id, setTimeout(() => dismissToast(alert.id), TOAST_TTL_MS));
  }, [dismissToast]);

  const showBrowserNotification = useCallback((alert: AttendantAlert): boolean => {
    if (readBrowserPermission() !== 'granted') return false;
    try {
      const notification = new Notification(alert.title, {
        body: alert.body,
        icon: '/logo.png',
        // Mesma conversa substitui a notificação anterior em vez de empilhar.
        tag: alert.conversationId ?? alert.id,
      });
      notification.onclick = () => {
        window.focus();
        openAlert(alert);
        notification.close();
      };
      return true;
    } catch {
      return false;
    }
  }, [openAlert]);

  /**
   * Entrega o alerta pelos canais escolhidos. O som é independente do modo; o
   * cartão dentro do sistema entra também como reserva quando o modo é só
   * navegador mas a permissão não foi dada — melhor um cartão do que silêncio.
   */
  const fireAlert = useCallback((alert: AttendantAlert) => {
    const prefs = preferencesRef.current;
    if (prefs.sound && claimSound(alert.conversationId ?? alert.id)) void playAlertTone(prefs.soundTone);

    let shownInBrowser = false;
    if (prefs.mode === 'browser' || (prefs.mode === 'both' && isAway())) {
      shownInBrowser = showBrowserNotification(alert);
    }
    if (prefs.mode !== 'browser' || !shownInBrowser) {
      pushToast(alert);
    }
    bumpTitleBadge();
  }, [bumpTitleBadge, pushToast, showBrowserNotification]);

  const fireAlertRef = useRef(fireAlert);
  fireAlertRef.current = fireAlert;

  const previewBrowserNotification = useCallback((): boolean => showBrowserNotification({
    id: `preview:${Date.now()}`,
    kind: 'message',
    title: 'Teste do Synq',
    body: 'Se você está vendo isto, as notificações do navegador estão funcionando.',
    channelType: null,
    conversationId: null,
    createdAt: Date.now(),
  }), [showBrowserNotification]);

  /**
   * Stream do workspace, pela conexão que a lista de conversas e o sino já usam.
   * O servidor manda só ids; nome e prévia vêm de uma rota que respeita a
   * visibilidade — conversa de outro atendente responde 404 e não vira alerta.
   */
  useEffect(() => {
    if (!canListen || !authService.getToken()) return undefined;

    const withinRepeatWindow = (key: string): boolean => {
      const last = lastAlertAtRef.current.get(key) ?? 0;
      const now = Date.now();
      if (now - last < REPEAT_WINDOW_MS) return true;
      lastAlertAtRef.current.set(key, now);
      return false;
    };

    const onIncoming = async (event: MessageEvent) => {
      const prefs = preferencesRef.current;
      if (!prefs.enabled || !prefs.incomingMessages) return;
      let payload: IncomingPayload;
      try {
        payload = JSON.parse(event.data) as IncomingPayload;
      } catch {
        return;
      }
      const { conversationId } = payload;
      if (!conversationId) return;
      if (prefs.newConversationsOnly && !payload.isNew) return;
      // Conversa aberta com a aba visível: a pessoa já está lendo.
      if (openConversationRef.current === conversationId && !isAway()) return;
      if (withinRepeatWindow(`conversation:${conversationId}`)) return;

      const conversation = await inboxService.getConversation(conversationId).catch(() => null);
      if (!conversation) return;
      fireAlertRef.current({
        id: `incoming:${conversationId}:${Date.now()}`,
        kind: payload.isNew ? 'new-conversation' : 'message',
        title: contactLabel(conversation),
        body: conversation.lastMessagePreview?.trim() || 'Nova mensagem',
        channelType: conversation.channelType,
        conversationId,
        createdAt: Date.now(),
      });
    };

    const onQueueEntered = async (event: MessageEvent) => {
      const prefs = preferencesRef.current;
      if (!prefs.enabled || !prefs.humanHandoff) return;
      let payload: QueueEnteredPayload;
      try {
        payload = JSON.parse(event.data) as QueueEnteredPayload;
      } catch {
        return;
      }
      if (!payload.contactId) return;
      if (withinRepeatWindow(`handoff:${payload.contactId}`)) return;

      const conversation = payload.conversationId
        ? await inboxService.getConversation(payload.conversationId).catch(() => null)
        : null;
      // Sem conversa visível, o pedido pode ser de contato atribuído a outra pessoa.
      if (payload.conversationId && !conversation) return;
      fireAlertRef.current({
        id: `handoff:${payload.contactId}:${Date.now()}`,
        kind: 'handoff',
        title: conversation ? `${contactLabel(conversation)} pediu atendimento` : 'Contato pediu atendimento',
        body: conversation?.lastMessagePreview?.trim() || 'A conversa foi passada para um atendente humano.',
        channelType: conversation?.channelType ?? null,
        conversationId: conversation?.id ?? null,
        createdAt: Date.now(),
      });
    };

    return subscribeToEvents(inboxService.getInboxEventsUrl(), {
      'conversation.incoming': (event) => { void onIncoming(event); },
      'queue.entered': (event) => { void onQueueEntered(event); },
    });
  }, [canListen]);

  // Timers pendentes morrem com o provider — não disparam sobre estado desmontado.
  useEffect(() => () => {
    for (const timer of toastTimersRef.current.values()) clearTimeout(timer);
    toastTimersRef.current.clear();
  }, []);

  const value = useMemo<AttendantAlertsContextValue>(() => ({
    preferences,
    loaded,
    saving,
    updatePreferences,
    browserPermission,
    requestBrowserPermission,
    previewSound,
    previewBrowserNotification,
    setOpenConversationId,
    pendingConversationId,
    requestOpenConversation,
    consumePendingConversation,
  }), [
    preferences,
    loaded,
    saving,
    updatePreferences,
    browserPermission,
    requestBrowserPermission,
    previewSound,
    previewBrowserNotification,
    setOpenConversationId,
    pendingConversationId,
    requestOpenConversation,
    consumePendingConversation,
  ]);

  /**
   * Convite para liberar a notificação do navegador: só faz sentido quando o modo
   * escolhido a usa, a permissão ainda não foi decidida e a pessoa recebe alertas.
   * Sem ele, o padrão ("no sistema e no navegador") ficava pela metade sem ninguém
   * saber por quê — o navegador não pede permissão sozinho.
   */
  const showNudge = loaded
    && canListen
    && !nudgeSnoozed
    && preferences.enabled
    && preferences.mode !== 'in-app'
    && browserPermission === 'default';

  return (
    <AttendantAlertsContext.Provider value={value}>
      {children}
      <AttendantAlertStack
        alerts={toasts}
        onOpen={(alert) => { dismissToast(alert.id); openAlert(alert); }}
        onDismiss={dismissToast}
        header={showNudge ? (
          <BrowserNotificationNudge
            onEnable={() => { void requestBrowserPermission(); }}
            onDismiss={snoozeNudge}
            requesting={requestingPermission}
          />
        ) : null}
      />
    </AttendantAlertsContext.Provider>
  );
}

export function useAttendantAlerts(): AttendantAlertsContextValue {
  const ctx = useContext(AttendantAlertsContext);
  if (!ctx) throw new Error('useAttendantAlerts must be used within AttendantAlertsProvider');
  return ctx;
}
