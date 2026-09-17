import type { FlowAiMode, FlowAttendanceStatus, FlowMediaKind, FlowNode, FlowNodeKind } from '@/types/Flow';

export interface BlockMeta {
  kind: FlowNodeKind;
  label: string;
  hint: string;
  /**
   * `trigger` são os blocos de entrada — os que o motor pode escolher para iniciar o
   * fluxo (`flow-engine.service`, ramo dos blocos de entrada). Todo o resto é `action`:
   * só roda depois que alguém já entrou. A paleta separa os dois porque a diferença
   * decide onde o bloco pode aparecer no desenho, não só como ele se parece.
   */
  group: 'trigger' | 'action';
  /** Cor do ponto de conexão e do rótulo do tipo no card. */
  dot: string;
  tint: string;
  /** Consome o modelo de linguagem: fica travado sem plano de IA contratado. */
  requiresAi?: boolean;
}

/**
 * Blocos que o usuário arrasta para o canvas, do que começa o fluxo ao que o
 * encerra. A lista é fechada: o motor de execução precisa saber tratar cada tipo.
 */
export const BLOCKS: BlockMeta[] = [
  { kind: 'trigger', label: 'Iniciar por palavra', hint: 'Começa o fluxo quando o contato escreve algo', dot: 'bg-indigo-500', tint: 'text-indigo-600 dark:text-indigo-400', group: 'trigger' },
  { kind: 'welcome', label: 'Boas-vindas', hint: 'Começa o fluxo na primeira mensagem do contato', dot: 'bg-green-500', tint: 'text-green-600 dark:text-green-400', group: 'trigger' },
  { kind: 'story_reply', label: 'Reagiu ao story', hint: 'Começa o fluxo quando o contato reage a um story seu', dot: 'bg-pink-500', tint: 'text-pink-600 dark:text-pink-400', group: 'trigger' },
  { kind: 'story_mention', label: 'Mencionou no story', hint: 'Começa o fluxo quando o contato cita seu perfil no story dele', dot: 'bg-red-500', tint: 'text-red-600 dark:text-red-400', group: 'trigger' },
  // Mesmo matiz do gatilho por palavra: os dois começam por mensagem recebida, e
  // a paleta de matizes distintos já acabou (ver DESIGN_SYSTEM 13.1).
  { kind: 'catch_all', label: 'Qualquer mensagem', hint: 'Último recurso: pega quem não caiu em nenhum outro gatilho', dot: 'bg-indigo-500', tint: 'text-indigo-600 dark:text-indigo-400', group: 'trigger' },
  { kind: 'message', label: 'Enviar mensagem', hint: 'Manda um texto para o contato', dot: 'bg-slate-400', tint: 'text-slate-500 dark:text-slate-400', group: 'action' },
  { kind: 'link', label: 'Enviar link', hint: 'Card com um botão que abre uma página', dot: 'bg-sky-500', tint: 'text-sky-600 dark:text-sky-400', group: 'action' },
  { kind: 'media', label: 'Enviar mídia', hint: 'Manda uma imagem, vídeo ou áudio', dot: 'bg-lime-500', tint: 'text-lime-600 dark:text-lime-400', group: 'action' },
  { kind: 'document', label: 'Enviar documento', hint: 'Manda um arquivo, como um PDF', dot: 'bg-stone-500', tint: 'text-stone-600 dark:text-stone-400', group: 'action' },
  { kind: 'question', label: 'Perguntar com opções', hint: 'Faz uma pergunta e abre um caminho por resposta', dot: 'bg-violet-500', tint: 'text-violet-600 dark:text-violet-400', group: 'action' },
  { kind: 'ai', label: 'Inteligência artificial', hint: 'Entrega a conversa para a IA, ou separa caminhos pela intenção', dot: 'bg-yellow-500', tint: 'text-yellow-600 dark:text-yellow-400', requiresAi: true, group: 'action' },
  { kind: 'wait_reply', label: 'Aguardar resposta', hint: 'Segura o fluxo até o contato falar qualquer coisa', dot: 'bg-purple-500', tint: 'text-purple-600 dark:text-purple-400', group: 'action' },
  { kind: 'condition', label: 'Desviar por palavra', hint: 'Separa quem respondeu com a palavra de quem não', dot: 'bg-amber-500', tint: 'text-amber-600 dark:text-amber-400', group: 'action' },
  { kind: 'business_hours', label: 'Horário de atendimento', hint: 'Separa quem chega no expediente de quem chega fora dele', dot: 'bg-orange-500', tint: 'text-orange-600 dark:text-orange-400', group: 'action' },
  { kind: 'randomizer', label: 'Dividir aleatoriamente', hint: 'Sorteia entre caminhos, para testar versões', dot: 'bg-fuchsia-500', tint: 'text-fuchsia-600 dark:text-fuchsia-400', group: 'action' },
  { kind: 'delay', label: 'Aguardar tempo', hint: 'Segura o fluxo antes do próximo passo', dot: 'bg-blue-500', tint: 'text-blue-600 dark:text-blue-400', group: 'action' },
  { kind: 'tag', label: 'Aplicar etiqueta', hint: 'Marca o contato para segmentar depois', dot: 'bg-emerald-500', tint: 'text-emerald-600 dark:text-emerald-400', group: 'action' },
  { kind: 'untag', label: 'Remover etiqueta', hint: 'Tira uma marcação do contato', dot: 'bg-teal-500', tint: 'text-teal-600 dark:text-teal-400', group: 'action' },
  { kind: 'has_tag', label: 'Verificar etiqueta', hint: 'Separa quem tem a etiqueta de quem não tem', dot: 'bg-cyan-500', tint: 'text-cyan-600 dark:text-cyan-400', group: 'action' },
  { kind: 'funnel_stage', label: 'Mover no funil', hint: 'Leva o contato para outra etapa do funil', dot: 'bg-zinc-500', tint: 'text-zinc-600 dark:text-zinc-400', group: 'action' },
  { kind: 'assign', label: 'Atribuir atendente', hint: 'Entrega a conversa a uma pessoa da equipe', dot: 'bg-rose-500', tint: 'text-rose-600 dark:text-rose-400', group: 'action' },
  { kind: 'attendance', label: 'Situação do atendimento', hint: 'Marca a conversa como em andamento, aguardando ou resolvida', dot: 'bg-gray-500', tint: 'text-gray-600 dark:text-gray-400', group: 'action' },
  { kind: 'notify', label: 'Notificar equipe', hint: 'Manda um aviso para o painel do workspace', dot: 'bg-neutral-500', tint: 'text-neutral-600 dark:text-neutral-400', group: 'action' },
  { kind: 'handoff', label: 'Passar para atendente', hint: 'Tira da automação e chama uma pessoa', dot: 'bg-rose-500', tint: 'text-rose-600 dark:text-rose-400', group: 'action' },
];

const BY_KIND = new Map(BLOCKS.map((block) => [block.kind, block]));

/** Blocos que podem iniciar um fluxo, na ordem da paleta. */
export const TRIGGER_BLOCKS = BLOCKS.filter((block) => block.group === 'trigger');

/** Blocos que só rodam depois que o fluxo já começou. */
export const ACTION_BLOCKS = BLOCKS.filter((block) => block.group === 'action');

/** Se o bloco é um ponto de entrada. Fonte única para paleta e validações. */
export function isTriggerKind(kind: FlowNodeKind): boolean {
  return BY_KIND.get(kind)?.group === 'trigger';
}

/** Se o bloco depende do plano de IA. Fonte única do cadeado no construtor. */
export function requiresAiPlan(kind: FlowNodeKind): boolean {
  return BY_KIND.get(kind)?.requiresAi === true;
}

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
  case 'story_reply':
    // Sem filtro a regra inteira cabe no rótulo do bloco; com filtro, o resumo
    // é o que diz quais reações entram.
    return keywordSummary(node) || 'Qualquer reação ou resposta a um story';
  case 'welcome':
  case 'message':
  case 'question':
    return node.text ?? '';
  case 'link':
    return node.linkUrl ? `${node.text ?? ''} → ${node.buttonLabel || 'Abrir'}`.trim() : '';
  case 'media':
    return node.mediaUrl ? `Enviar ${MEDIA_KIND_LABEL[node.mediaKind ?? 'image'].toLowerCase()}` : '';
  case 'document':
    return node.mediaUrl ? `Enviar ${node.fileName?.trim() || 'documento'}` : '';
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
  case 'story_mention':
    return 'Quando o contato cita o perfil no story dele';
  case 'catch_all':
    return cooldownSummary(node.cooldownMinutes ?? CATCH_ALL_DEFAULT_COOLDOWN);
  case 'business_hours':
    return 'A mensagem chegou dentro do expediente?';
  case 'funnel_stage':
    return node.funnelStageId ? 'Mover o contato de etapa' : '';
  case 'assign':
    return node.assigneeUserId ? 'Entregar a conversa a um atendente' : '';
  case 'attendance':
    return node.attendanceStatus ? `Marcar como “${ATTENDANCE_LABEL[node.attendanceStatus]}”` : '';
  case 'notify':
    return node.text ?? '';
  case 'ai':
    return aiSummary(node);
  default:
    return '';
  }
}

export const ATTENDANCE_LABEL: Record<FlowAttendanceStatus, string> = {
  OPEN: 'Em aberto',
  IN_PROGRESS: 'Em atendimento',
  WAITING: 'Aguardando o cliente',
  RESOLVED: 'Resolvido',
};

export const AI_MODE_LABEL: Record<FlowAiMode, string> = {
  handover: 'Assumir a conversa',
  classify: 'Separar por intenção',
};

/** Teto de intenções do bloco de IA — o mesmo do schema no servidor. */
export const AI_INTENTS_MAX = 5;
export const AI_INTENT_LABEL_MAX = 60;

export const MEDIA_KIND_LABEL: Record<FlowMediaKind, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
};

/** Prévia do curinga, com o mesmo texto que o seletor do painel mostra. */
function cooldownSummary(minutes: number): string {
  // Zero não é oferecido no painel, mas um fluxo criado pela API pode trazê-lo.
  if (minutes <= 0) return 'Qualquer mensagem, sempre que o contato escrever';
  const option = COOLDOWN_OPTIONS.find((entry) => entry.value === minutes);
  return option
    ? `Qualquer mensagem · ${option.label.toLowerCase()}`
    : `Qualquer mensagem · no máximo 1 vez a cada ${formatDelay(minutes)}`;
}

/** Resume o bloco de IA na prévia: a entrega, ou as intenções que ele separa. */
function aiSummary(node: FlowNode): string {
  if (node.aiMode === 'classify') {
    const intents = (node.aiIntents ?? []).filter(Boolean);
    return intents.length ? `Separar por: ${intents.join(', ')}` : '';
  }
  return 'A IA assume a conversa daqui em diante';
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
  const prefix = node.kind === 'condition'
    ? 'Se a resposta'
    : node.kind === 'story_reply'
      ? 'Quando a reação'
      : 'Quando a mensagem';
  return `${prefix} ${mode} ${list}`;
}

/**
 * Descanso do curinga quando o bloco não diz outro. O construtor não oferece
 * "sem descanso": reiniciar o fluxo a cada frase transformaria uma conversa
 * normal numa enxurrada de disparos.
 */
export const CATCH_ALL_DEFAULT_COOLDOWN = 1440;

/**
 * Descansos do gatilho curinga. Começam mais longos que os do bloco de espera:
 * aqui a pergunta é "de quanto em quanto tempo esse contato pode cair no fluxo
 * de novo", e não "quanto esperar antes do próximo passo".
 */
export const COOLDOWN_OPTIONS: { value: number; label: string }[] = [
  { value: 60, label: 'No máximo 1 vez por hora' },
  { value: 240, label: 'No máximo 1 vez a cada 4 horas' },
  { value: 1440, label: 'No máximo 1 vez por dia' },
  { value: 60 * 24 * 7, label: 'No máximo 1 vez por semana' },
];

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
  // Entregar para a IA encerra o fluxo, igual ao repasse para atendente: o que
  // vem depois é a IA conversando, não mais o desenho do canvas.
  if (node.kind === 'ai' && node.aiMode !== 'classify') return [];

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

  if (node.kind === 'business_hours') {
    return [
      { id: 'open', label: 'Dentro do horário' },
      { id: 'closed', label: 'Fora do horário' },
    ];
  }

  if (node.kind === 'ai' && node.aiMode === 'classify') {
    const intents = (node.aiIntents ?? []).filter(Boolean);
    // Sem intenção nenhuma o bloco não tem o que separar; a saída única evita
    // um card sem ponto de conexão enquanto o usuário ainda está preenchendo.
    if (intents.length === 0) return [{ id: 'other', label: 'Nenhuma' }];
    return [
      ...intents.map((intent, i) => ({ id: `intent-${i}`, label: intent })),
      // A IA precisa poder dizer "não é nada disso": sem esta saída ela seria
      // forçada a escolher uma intenção qualquer para o fluxo continuar.
      { id: 'other', label: 'Nenhuma' },
    ];
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
  case 'welcome':
  case 'message':
    return { text: '' };
  case 'link':
    return { text: '', buttonLabel: 'Abrir', linkUrl: '' };
  case 'media':
    return { mediaKind: 'image', mediaUrl: '' };
  case 'document':
    return { mediaUrl: '', fileName: '' };
  case 'question':
    return { text: '', choices: ['Opção 1', 'Opção 2'], choicesAsButtons: true };
  case 'condition':
    return { keywords: [''], matchMode: 'CONTAINS', keywordLogic: 'ANY', caseSensitive: false };
  case 'story_reply':
    // Sem palavra nenhuma: o evento já é o gatilho, e o filtro é o que se
    // adiciona depois para separar um emoji de outro.
    return { keywords: [], matchMode: 'CONTAINS', keywordLogic: 'ANY', caseSensitive: false };
  case 'randomizer':
    return { randomWeights: [50, 50] };
  case 'ai':
    return { aiMode: 'handover', aiIntents: [] };
  case 'funnel_stage':
    return { funnelStageId: '' };
  case 'assign':
    return { assigneeUserId: '' };
  case 'attendance':
    return { attendanceStatus: 'IN_PROGRESS' };
  case 'notify':
    return { text: '' };
  case 'catch_all':
    return { cooldownMinutes: CATCH_ALL_DEFAULT_COOLDOWN };
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
