/** Por onde o aviso aparece: dentro do sistema, notificação do navegador, ou os dois. */
export type AlertMode = 'in-app' | 'browser' | 'both';

/** Toques disponíveis. São sintetizados no navegador — não existe arquivo de som. */
export type AlertTone = 'soft' | 'classic' | 'alert';

/**
 * Como o atendente quer ser avisado de conversa nova. Espelha o `AlertPreferences`
 * do backend (`infra/config/alertPreferences.ts`) — é da pessoa, não do workspace.
 */
export interface AlertPreferences {
  /** Chave geral: desligada, nada abaixo tem efeito. */
  enabled: boolean;
  mode: AlertMode;
  sound: boolean;
  soundTone: AlertTone;
  /** Avisar de mensagem recebida do contato. */
  incomingMessages: boolean;
  /** Só a primeira mensagem de uma conversa nova (ou de uma que saiu do arquivo). */
  newConversationsOnly: boolean;
  /** Avisar quando a IA, um fluxo ou uma palavra-chave passar a conversa para uma pessoa. */
  humanHandoff: boolean;
}

export type AlertPreferencesPatch = Partial<AlertPreferences>;

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  enabled: true,
  mode: 'both',
  sound: true,
  soundTone: 'soft',
  incomingMessages: true,
  newConversationsOnly: false,
  humanHandoff: true,
};

export const ALERT_MODE_OPTIONS: ReadonlyArray<{ value: AlertMode; label: string; description: string }> = [
  {
    value: 'both',
    label: 'No sistema e no navegador',
    description: 'Aviso dentro do Synq e, quando você estiver em outra aba ou programa, notificação do navegador.',
  },
  {
    value: 'in-app',
    label: 'Só dentro do sistema',
    description: 'Um cartão no canto da tela, apenas com o Synq aberto e visível.',
  },
  {
    value: 'browser',
    label: 'Só notificação do navegador',
    description: 'A notificação do sistema operacional, mesmo com o Synq na frente.',
  },
];

export const ALERT_TONE_OPTIONS: ReadonlyArray<{ value: AlertTone; label: string }> = [
  { value: 'soft', label: 'Suave' },
  { value: 'classic', label: 'Clássico' },
  { value: 'alert', label: 'Alerta' },
];
