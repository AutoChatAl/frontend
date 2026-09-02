export const FLOW_NODE_KINDS = [
  'trigger',
  'message',
  'link',
  'question',
  'wait_reply',
  'condition',
  'delay',
  'tag',
  'untag',
  'has_tag',
  'handoff',
  'randomizer',
] as const;

export type FlowNodeKind = (typeof FLOW_NODE_KINDS)[number];

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  x: number;
  y: number;
  label: string;
  text?: string;
  /** link — rótulo do botão e destino do card. */
  buttonLabel?: string;
  linkUrl?: string;
  /** trigger, condition — mesmas opções de casamento das auto-respostas. */
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
