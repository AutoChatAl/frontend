import type { FlowNode, FlowNodeKind } from '@/types/Flow';

export interface BlockMeta {
  kind: FlowNodeKind;
  label: string;
  hint: string;
  /** Cor do ponto de conexão e do rótulo do tipo no card. */
  dot: string;
  tint: string;
}

/**
 * Blocos que o usuário arrasta para o canvas, do que começa o fluxo ao que o
 * encerra. A lista é fechada: o motor de execução precisa saber tratar cada tipo.
 */
export const BLOCKS: BlockMeta[] = [
  { kind: 'trigger', label: 'Iniciar por palavra', hint: 'Começa o fluxo quando o contato escreve algo', dot: 'bg-indigo-500', tint: 'text-indigo-600 dark:text-indigo-400' },
  { kind: 'message', label: 'Enviar mensagem', hint: 'Manda um texto para o contato', dot: 'bg-slate-400', tint: 'text-slate-500 dark:text-slate-400' },
  { kind: 'link', label: 'Enviar link', hint: 'Card com um botão que abre uma página', dot: 'bg-sky-500', tint: 'text-sky-600 dark:text-sky-400' },
  { kind: 'question', label: 'Perguntar com opções', hint: 'Faz uma pergunta e abre um caminho por resposta', dot: 'bg-violet-500', tint: 'text-violet-600 dark:text-violet-400' },
  { kind: 'wait_reply', label: 'Aguardar resposta', hint: 'Segura o fluxo até o contato falar qualquer coisa', dot: 'bg-purple-500', tint: 'text-purple-600 dark:text-purple-400' },
  { kind: 'condition', label: 'Desviar por palavra', hint: 'Separa quem respondeu com a palavra de quem não', dot: 'bg-amber-500', tint: 'text-amber-600 dark:text-amber-400' },
  { kind: 'randomizer', label: 'Dividir aleatoriamente', hint: 'Sorteia entre caminhos, para testar versões', dot: 'bg-fuchsia-500', tint: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { kind: 'delay', label: 'Aguardar tempo', hint: 'Segura o fluxo antes do próximo passo', dot: 'bg-blue-500', tint: 'text-blue-600 dark:text-blue-400' },
  { kind: 'tag', label: 'Aplicar etiqueta', hint: 'Marca o contato para segmentar depois', dot: 'bg-emerald-500', tint: 'text-emerald-600 dark:text-emerald-400' },
  { kind: 'untag', label: 'Remover etiqueta', hint: 'Tira uma marcação do contato', dot: 'bg-teal-500', tint: 'text-teal-600 dark:text-teal-400' },
  { kind: 'has_tag', label: 'Verificar etiqueta', hint: 'Separa quem tem a etiqueta de quem não tem', dot: 'bg-cyan-500', tint: 'text-cyan-600 dark:text-cyan-400' },
  { kind: 'handoff', label: 'Passar para atendente', hint: 'Tira da automação e chama uma pessoa', dot: 'bg-rose-500', tint: 'text-rose-600 dark:text-rose-400' },
];

const BY_KIND = new Map(BLOCKS.map((block) => [block.kind, block]));

export function blockMeta(kind: FlowNodeKind): BlockMeta {
  return BY_KIND.get(kind) ?? BLOCKS[1]!;
}

/* -------------------------------------------------------------- geometria */
/*
 * O SVG das ligações desenha a partir destes números, e o card usa os mesmos
 * valores em style inline. Fonte única para os dois não saírem de sincronia
 * quando o conteúdo do bloco muda.
 */
export const NODE_WIDTH = 248;
export const HEADER_HEIGHT = 52;
export const PREVIEW_HEIGHT = 58;
export const HANDLE_HEIGHT = 30;

export const RANDOM_BRANCHES_MAX = 4;
/**
 * Acima disso o WhatsApp não tem botão de resposta, então o envio nativo não
 * pode ser ligado e as opções vão numeradas no corpo da mensagem.
 */
export const NATIVE_CHOICES_MAX = 3;
/** Mesmo teto das auto-respostas. */
export const KEYWORDS_MAX = 20;
/** Rótulo fixo de cada caminho do randomizador, como no padrão do mercado. */
export const BRANCH_LABELS = ['A', 'B', 'C', 'D'];

/** Texto mostrado na prévia do card. Vazio esconde a área inteira. */
export function nodePreview(node: FlowNode): string {
  switch (node.kind) {
  case 'trigger':
  case 'condition':
    return keywordSummary(node);
  case 'message':
  case 'question':
    return node.text ?? '';
  case 'link':
    return node.linkUrl ? `${node.text ?? ''} → ${node.buttonLabel || 'Abrir'}`.trim() : '';
  case 'delay':
    return node.delayMinutes ? `Aguardar ${formatDelay(node.delayMinutes)}` : '';
  case 'tag':
    return node.tagName ? `Aplicar etiqueta “${node.tagName}”` : '';
  case 'untag':
    return node.tagName ? `Remover etiqueta “${node.tagName}”` : '';
  case 'has_tag':
    return node.tagName ? `O contato tem a etiqueta “${node.tagName}”?` : '';
  case 'wait_reply':
    return node.replyTimeoutMinutes
      ? `Esperar resposta por até ${formatDelay(node.replyTimeoutMinutes)}`
      : 'Esperar o contato responder';
  case 'handoff':
    return 'Encaminhar para a caixa de entrada';
  default:
    return '';
  }
}

export const MATCH_MODE_LABEL: Record<NonNullable<FlowNode['matchMode']>, string> = {
  CONTAINS: 'contém',
  EXACT: 'é exatamente',
  STARTS_WITH: 'começa com',
};

/** Resume a regra do bloco em linguagem corrida, para a prévia do card. */
export function keywordSummary(node: FlowNode): string {
  const keywords = (node.keywords ?? []).filter(Boolean);
  if (keywords.length === 0) return '';
  const mode = MATCH_MODE_LABEL[node.matchMode ?? 'CONTAINS'];
  const joiner = node.keywordLogic === 'ALL' ? ' e ' : ' ou ';
  const list = keywords.map((keyword) => `“${keyword}”`).join(joiner);
  const prefix = node.kind === 'trigger' ? 'Quando a mensagem' : 'Se a resposta';
  return `${prefix} ${mode} ${list}`;
}

/** Tempos oferecidos no bloco de espera, do follow-up curto ao do dia seguinte. */
export const DELAY_OPTIONS: { value: number; label: string }[] = [
  { value: 10, label: '10 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 240, label: '4 horas' },
  { value: 480, label: '8 horas' },
  { value: 1440, label: '24 horas' },
];

export function formatDelay(minutes: number): string {
  // Valor da lista mostra o rótulo exato; o cálculo abaixo cobre fluxos antigos
  // que foram salvos com um número digitado à mão.
  const preset = DELAY_OPTIONS.find((option) => option.value === minutes);
  if (preset) return preset.label;

  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 24) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours} h`.replace('.', ',');
  }
  const days = Math.round((minutes / (60 * 24)) * 10) / 10;
  return `${days} ${days === 1 ? 'dia' : 'dias'}`.replace('.', ',');
}

/**
 * Saídas de cada bloco. Um único `next` na maioria; condição abre em dois
 * caminhos, pergunta abre um por opção e o randomizador um por peso — é isso
 * que permite montar desvio em vez de uma fila linear.
 */
export function outputHandles(node: Pick<FlowNode, 'kind'> & Partial<FlowNode>): { id: string; label: string }[] {
  if (node.kind === 'handoff') return [];

  if (node.kind === 'condition') {
    return [
      { id: 'yes', label: 'Se bater' },
      { id: 'no', label: 'Senão' },
    ];
  }

  if (node.kind === 'wait_reply') {
    const answered = [{ id: 'answered', label: 'Respondeu' }];
    return node.replyTimeoutMinutes
      ? [...answered, { id: 'timeout', label: 'Não respondeu' }]
      : answered;
  }

  if (node.kind === 'has_tag') {
    return [
      { id: 'yes', label: 'Tem a etiqueta' },
      { id: 'no', label: 'Não tem' },
    ];
  }

  if (node.kind === 'question') {
    const choices = node.choices ?? [];
    const answers = choices.length === 0
      ? [{ id: 'next', label: 'Próximo passo' }]
      : choices.map((choice, i) => ({ id: `choice-${i}`, label: choice }));
    // O prazo só vira saída quando está configurado, para não poluir o card.
    return node.replyTimeoutMinutes
      ? [...answers, { id: 'timeout', label: 'Não respondeu' }]
      : answers;
  }

  if (node.kind === 'randomizer') {
    const weights = node.randomWeights ?? [50, 50];
    return weights.map((weight, i) => ({
      id: `branch-${i}`,
      label: `${BRANCH_LABELS[i] ?? i + 1} · ${weight}%`,
    }));
  }

  return [{ id: 'next', label: 'Próximo passo' }];
}

export function previewHeight(node: FlowNode): number {
  return nodePreview(node) ? PREVIEW_HEIGHT : 0;
}

export function nodeHeight(node: FlowNode): number {
  const handles = outputHandles(node);
  return HEADER_HEIGHT + previewHeight(node) + Math.max(handles.length, 1) * HANDLE_HEIGHT;
}

/** Y do ponto de conexão de uma saída, relativo ao topo do card. */
export function handleOffsetY(node: FlowNode, handleIndex: number): number {
  return HEADER_HEIGHT + previewHeight(node) + handleIndex * HANDLE_HEIGHT + HANDLE_HEIGHT / 2;
}

export function defaultNodeFields(kind: FlowNodeKind): Partial<FlowNode> {
  switch (kind) {
  case 'trigger':
    return { keywords: [''], matchMode: 'CONTAINS', keywordLogic: 'ANY', caseSensitive: false };
  case 'message':
    return { text: '' };
  case 'link':
    return { text: '', buttonLabel: 'Abrir', linkUrl: '' };
  case 'question':
    return { text: '', choices: ['Opção 1', 'Opção 2'], choicesAsButtons: true };
  case 'condition':
    return { keywords: [''], matchMode: 'CONTAINS', keywordLogic: 'ANY', caseSensitive: false };
  case 'randomizer':
    return { randomWeights: [50, 50] };
  case 'delay':
    return { delayMinutes: 60 };
  case 'tag':
  case 'untag':
  case 'has_tag':
    return { tagName: '' };
  default:
    return {};
  }
}

/**
 * Redistribui os pesos para fechar 100 quando um caminho é adicionado ou
 * removido — deixar a soma quebrada tornaria a divisão indefinida na execução.
 */
export function balancedWeights(count: number): number[] {
  const base = Math.floor(100 / count);
  const weights = Array.from({ length: count }, () => base);
  weights[0] = 100 - base * (count - 1);
  return weights;
}
