export const FLOW_NODE_KINDS = [
  'trigger',
  'welcome',
  'story_reply',
  'story_mention',
  'catch_all',
  'message',
  'link',
  'media',
  'document',
  'question',
  'wait_reply',
  'condition',
  'delay',
  'tag',
  'untag',
  'has_tag',
  'handoff',
  'randomizer',
  'ai',
  'business_hours',
  'funnel_stage',
  'assign',
  'attendance',
  'notify',
] as const;

export type FlowNodeKind = (typeof FLOW_NODE_KINDS)[number];

/**
 * Modos do bloco de IA: entregar a conversa para a atendente de IA, ou usar o
 * modelo só para separar caminhos e seguir dentro do fluxo.
 */
export const FLOW_AI_MODES = ['handover', 'classify'] as const;

export type FlowAiMode = (typeof FLOW_AI_MODES)[number];

/** Espelha o `attendanceStatus` do contato. */
export const FLOW_ATTENDANCE_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED'] as const;

export type FlowAttendanceStatus = (typeof FLOW_ATTENDANCE_STATUSES)[number];

/** Formatos do bloco de mídia. O documento é o outro bloco. */
export const FLOW_MEDIA_KINDS = ['image', 'video', 'audio'] as const;

export type FlowMediaKind = (typeof FLOW_MEDIA_KINDS)[number];

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  x: number;
  y: number;
  label: string;
  /** message, question, link, welcome — corpo enviado ao contato. */
  text?: string;
  /** link — rótulo do botão e destino do card. */
  buttonLabel?: string;
  linkUrl?: string;
  /** media, document — endereço público do arquivo; o bloco guarda a URL, não o arquivo. */
  mediaUrl?: string;
  /** media — formato do arquivo. O bloco de documento não usa. */
  mediaKind?: FlowMediaKind;
  /** document — nome com que o arquivo chega ao contato. */
  fileName?: string;
  /**
   * trigger, condition — mesmas opções de casamento das auto-respostas.
   * story_reply usa os mesmos campos como filtro opcional: vazio deixa passar
   * qualquer reação.
   */
  keywords?: string[];
  keywordLogic?: 'ANY' | 'ALL';
  matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive?: boolean;
  choices?: string[];
  /**
   * Manda as opções como botão/quick reply do canal em vez de lista numerada.
   * Só vale até 3 opções — ausente significa ligado, para não mudar fluxos antigos.
   */
  choicesAsButtons?: boolean;
  delayMinutes?: number;
  tagName?: string;
  /** question — prazo para responder; habilita a saída "não respondeu". */
  replyTimeoutMinutes?: number;
  /** randomizer — peso de cada saída em %, uma entrada por caminho. */
  randomWeights?: number[];
  /** ai — entregar a conversa para a IA ou separar caminhos por intenção. */
  aiMode?: FlowAiMode;
  /** ai (classify) — intenções procuradas; cada uma vira uma saída do bloco. */
  aiIntents?: string[];
  /** funnel_stage — etapa do funil para onde o contato vai. */
  funnelStageId?: string;
  /** assign — id do usuário que assume a conversa. */
  assigneeUserId?: string;
  /** attendance — situação em que o atendimento fica. */
  attendanceStatus?: FlowAttendanceStatus;
  /** catch_all — descanso entre dois disparos para o mesmo contato. 0 = sem descanso. */
  cooldownMinutes?: number;
}

/** `fromHandle` separa as saídas de um bloco que ramifica (sim/não, escolha N). */
export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  fromHandle?: string;
}

export interface Flow {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  /** Canais em que o fluxo escuta. Vazio significa que ele não roda. */
  channelIds: string[];
  enabled: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlowPayload {
  name: string;
  description?: string;
  channelIds?: string[];
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

export interface UpdateFlowPayload {
  name?: string;
  description?: string;
  channelIds?: string[];
  enabled?: boolean;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}
