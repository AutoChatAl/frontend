import { Heart, ListChecks, Moon, UserCheck, type LucideIcon } from 'lucide-react';

import type { FlowEdge, FlowNode, FlowNodeKind } from '@/types/Flow';

import { blockMeta, defaultNodeFields } from './blocks';

export type FlowTemplateId = 'story-thanks' | 'after-hours' | 'qualify-handoff' | 'launch-list';

export interface FlowTemplateOptions {
  hasAiPlan: boolean;
}

export interface FlowTemplate {
  id: FlowTemplateId;
  name: string;
  description: string;
  nextStep: string;
  icon: LucideIcon;
  build: (options: FlowTemplateOptions) => { nodes: FlowNode[]; edges: FlowEdge[] };
}

const COLUMN = 320;
const ROW = 220;

function node(id: string, kind: FlowNodeKind, column: number, row: number, fields: Partial<FlowNode> = {}): FlowNode {
  return {
    id,
    kind,
    x: 40 + column * COLUMN,
    y: 40 + row * ROW,
    label: blockMeta(kind).label,
    ...defaultNodeFields(kind),
    ...fields,
  };
}

function edge(from: string, to: string, fromHandle = 'next'): FlowEdge {
  return { id: `e-${from}-${fromHandle}-${to}`, from, to, fromHandle };
}

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'story-thanks',
    name: 'Agradecer quem reagiu ao story',
    description: 'Quem reagir ou mencionar você no story recebe um obrigado e um link no Direct.',
    nextStep: 'Clique no bloco "Enviar link", cole o seu link, escolha a conta do Instagram em Canais e ative.',
    icon: Heart,
    build: () => ({
      nodes: [
        node('story-reply', 'story_reply', 0, 0),
        node('story-mention', 'story_mention', 0, 1),
        node('thanks-link', 'link', 1, 0, {
          text: 'Obrigado por interagir com o meu story! 💜 Separei este link especial para você:',
          buttonLabel: 'Ver agora',
          linkUrl: '',
        }),
      ],
      edges: [
        edge('story-reply', 'thanks-link'),
        edge('story-mention', 'thanks-link'),
      ],
    }),
  },
  {
    id: 'after-hours',
    name: 'Avisar quando estiver fechado',
    description: 'Fora do horário de atendimento, avisa o cliente e deixa a conversa encaminhada.',
    nextStep: 'Confira o seu horário de atendimento em Configurações, escolha os canais e ative.',
    icon: Moon,
    build: ({ hasAiPlan }) => ({
      nodes: [
        node('any-message', 'catch_all', 0, 0, { cooldownMinutes: 240 }),
        node('hours', 'business_hours', 1, 0),
        node('closed-message', 'message', 2, 0, {
          text: hasAiPlan
            ? 'Oi! Agora estamos fora do horário de atendimento 🌙 Nossa assistente virtual vai te ajudar por aqui, e a equipe continua a conversa assim que voltar.'
            : 'Oi! Agora estamos fora do horário de atendimento 🌙 Deixe sua mensagem que a nossa equipe responde assim que voltar.',
        }),
        hasAiPlan
          ? node('closed-next', 'ai', 3, 0, { aiMode: 'handover', aiIntents: [] })
          : node('closed-next', 'handoff', 3, 0),
      ],
      edges: [
        edge('any-message', 'hours'),
        edge('hours', 'closed-message', 'closed'),
        edge('closed-message', 'closed-next'),
      ],
    }),
  },
  {
    id: 'qualify-handoff',
    name: 'Entender o cliente e passar para a equipe',
    description: 'Pergunta o que a pessoa precisa, marca o contato com uma etiqueta e chama alguém da equipe.',
    nextStep: 'Se quiser, troque as opções da pergunta. Depois escolha os canais e ative.',
    icon: UserCheck,
    build: () => ({
      nodes: [
        node('start', 'welcome', 0, 1, { text: 'Oi! Que bom ter você por aqui 😊' }),
        node('ask', 'question', 1, 1, {
          text: 'Para eu te ajudar mais rápido, me conta: o que você procura?',
          choices: ['Quero comprar', 'Tirar uma dúvida', 'Já sou cliente'],
          choicesAsButtons: true,
        }),
        node('tag-buy', 'tag', 2, 0, { tagName: 'Quer comprar' }),
        node('tag-doubt', 'tag', 2, 1, { tagName: 'Dúvida' }),
        node('tag-client', 'tag', 2, 2, { tagName: 'Já é cliente' }),
        node('confirm', 'message', 3, 1, { text: 'Perfeito! Já vou chamar alguém da equipe para falar com você. É rapidinho 🙌' }),
        node('handoff', 'handoff', 4, 1),
      ],
      edges: [
        edge('start', 'ask'),
        edge('ask', 'tag-buy', 'choice-0'),
        edge('ask', 'tag-doubt', 'choice-1'),
        edge('ask', 'tag-client', 'choice-2'),
        edge('tag-buy', 'confirm'),
        edge('tag-doubt', 'confirm'),
        edge('tag-client', 'confirm'),
        edge('confirm', 'handoff'),
      ],
    }),
  },
  {
    id: 'launch-list',
    name: 'Lista VIP do lançamento',
    description: 'Quem mandar “LISTA” ganha a etiqueta “Lista VIP” e recebe a confirmação na hora.',
    nextStep: 'Escolha os canais e ative. Depois é só divulgar: “Manda LISTA no Direct para entrar na lista VIP”.',
    icon: ListChecks,
    build: () => ({
      nodes: [
        node('keyword', 'trigger', 0, 0, { keywords: ['lista'], matchMode: 'CONTAINS', keywordLogic: 'ANY', caseSensitive: false }),
        node('tag-vip', 'tag', 1, 0, { tagName: 'Lista VIP' }),
        node('confirm', 'message', 2, 0, {
          text: 'Pronto! Você está na lista VIP 🎉 Vou te avisar antes de todo mundo quando as vagas abrirem. Fique de olho nas mensagens!',
        }),
      ],
      edges: [
        edge('keyword', 'tag-vip'),
        edge('tag-vip', 'confirm'),
      ],
    }),
  },
];

const BY_ID = new Map<string, FlowTemplate>(FLOW_TEMPLATES.map((template) => [template.id, template]));

export function getFlowTemplate(id: string | null | undefined): FlowTemplate | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}
