import {
  BadgeDollarSign,
  Heart,
  ListChecks,
  MapPin,
  MessageSquare,
  Moon,
  PartyPopper,
  QrCode,
  Radio,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

import type { BusinessType } from '@/types/BusinessType';

import type { AutomationDraft } from './components/automationForm';
import type { AutomationKind } from './components/automationMeta';

export type RecipeId =
  | 'comment-link'
  | 'live-link'
  | 'story-thanks'
  | 'pix-reminder'
  | 'buyer-welcome'
  | 'after-hours'
  | 'follow-up'
  | 'qualify-handoff'
  | 'launch-list'
  | 'price-reply'
  | 'address-hours'
  | 'catalog-link';

export type RecipeTarget =
  | {
    type: 'automation';
    kind: AutomationKind;
    draft: Partial<AutomationDraft>;
    requiresLink?: boolean;
    messagePlaceholder?: string;
    note?: string;
  }
  | { type: 'flow'; templateId: string }
  | { type: 'cart-recovery' }
  | { type: 'ai-follow-up' };

export interface AutomationRecipe {
  id: RecipeId;
  title: string;
  description: string;
  audiences: BusinessType[];
  icon: LucideIcon;
  target: RecipeTarget;
}

export const RECIPES: AutomationRecipe[] = [
  {
    id: 'comment-link',
    title: 'Mandar o link para quem comentar',
    description: 'Comentou “quero” no post, recebe o link no Direct e uma resposta no comentário.',
    audiences: ['ecommerce', 'infoproduct'],
    icon: MessageSquare,
    target: {
      type: 'automation',
      kind: 'COMMENT',
      requiresLink: true,
      note: 'Já deixamos tudo escrito. Só falta colar o seu link e escolher a conta do Instagram.',
      draft: {
        keywords: ['quero', 'link'],
        message: 'Oi, {{username}}! Que bom que você se interessou 😍 Toque no botão abaixo para ver todos os detalhes:',
        linkLabel: 'Ver agora',
      },
    },
  },
  {
    id: 'live-link',
    title: 'Mandar o link durante a live',
    description: 'Quem comentar “quero” na live recebe o link no Direct na mesma hora.',
    audiences: ['infoproduct', 'ecommerce'],
    icon: Radio,
    target: {
      type: 'automation',
      kind: 'LIVE',
      requiresLink: true,
      note: 'Já deixamos tudo escrito. Só falta colar o link da oferta e escolher a conta do Instagram.',
      draft: {
        keywords: ['quero', 'link'],
        message: 'Oi, {{username}}! Vi seu comentário na live 🔴 Aqui está o link que eu prometi:',
        linkLabel: 'Garantir o meu',
      },
    },
  },
  {
    id: 'story-thanks',
    title: 'Agradecer quem reagir ao story',
    description: 'Quem reagir ou mencionar você no story ganha um obrigado e um link no Direct.',
    audiences: ['ecommerce', 'infoproduct', 'local'],
    icon: Heart,
    target: { type: 'flow', templateId: 'story-thanks' },
  },
  {
    id: 'pix-reminder',
    title: 'Lembrar quem gerou o Pix e não pagou',
    description: 'Manda um lembrete automático para quem gerou o Pix ou o boleto e ainda não pagou.',
    audiences: ['ecommerce', 'infoproduct'],
    icon: QrCode,
    target: { type: 'cart-recovery' },
  },
  {
    id: 'buyer-welcome',
    title: 'Dar boas-vindas a quem comprou',
    description: 'Quando o cliente avisar que comprou, responde com boas-vindas e avisa que os detalhes chegam por e-mail.',
    audiences: ['infoproduct', 'ecommerce'],
    icon: PartyPopper,
    target: {
      type: 'automation',
      kind: 'DM',
      requiresLink: true,
      note: 'Já deixamos a mensagem pronta. Cole um link aberto, como a sua página de suporte ou de dúvidas. Nunca use o link do grupo ou da área de membros, porque qualquer pessoa que mandar essas palavras recebe a resposta. Para entregar o acesso só a quem comprou de verdade, use as boas-vindas da Recuperação.',
      draft: {
        keywords: ['comprei', 'já comprei', 'ja comprei', 'paguei', 'já paguei', 'ja paguei'],
        message: 'Que alegria ter você com a gente! 🎉 Seja muito bem-vindo(a). Os detalhes do pedido e do acesso chegam no e-mail usado na compra. Se tiver qualquer dúvida, toque no botão abaixo ou responda esta mensagem.',
        linkLabel: 'Tirar dúvidas',
      },
    },
  },
  {
    id: 'after-hours',
    title: 'Avisar quando estiver fechado',
    description: 'Fora do horário de atendimento, avisa o cliente e deixa a conversa encaminhada.',
    audiences: ['local'],
    icon: Moon,
    target: { type: 'flow', templateId: 'after-hours' },
  },
  {
    id: 'follow-up',
    title: 'Chamar de volta quem parou de responder',
    description: 'A IA manda uma mensagem gentil para retomar a conversa com quem sumiu.',
    audiences: ['local', 'ecommerce', 'infoproduct'],
    icon: RefreshCw,
    target: { type: 'ai-follow-up' },
  },
  {
    id: 'qualify-handoff',
    title: 'Entender o cliente e passar para a equipe',
    description: 'Pergunta o que a pessoa precisa, marca o contato e chama alguém da equipe.',
    audiences: ['local', 'infoproduct'],
    icon: UserCheck,
    target: { type: 'flow', templateId: 'qualify-handoff' },
  },
  {
    id: 'launch-list',
    title: 'Montar a lista VIP do lançamento',
    description: 'Quem mandar “LISTA” entra na lista VIP e recebe a confirmação na hora.',
    audiences: ['infoproduct'],
    icon: ListChecks,
    target: { type: 'flow', templateId: 'launch-list' },
  },
  {
    id: 'price-reply',
    title: 'Responder quem pergunta o preço',
    description: 'Quem comentar “preço” ou “valor” no post recebe o valor no Direct.',
    audiences: ['ecommerce', 'local'],
    icon: BadgeDollarSign,
    target: {
      type: 'automation',
      kind: 'COMMENT',
      note: 'Já deixamos as palavras e as respostas no comentário prontas. Escreva na mensagem do Direct o valor do seu produto ou serviço.',
      messagePlaceholder: 'Ex.: Oi, {{username}}! Esse modelo sai por R$ 89,90 e dá para parcelar em até 3x. Quer que eu te mande o link para comprar?',
      draft: {
        keywords: ['preço', 'preco', 'valor', 'quanto custa', 'qual o valor'],
      },
    },
  },
  {
    id: 'address-hours',
    title: 'Responder endereço e horário',
    description: 'Quem perguntar onde fica ou que horas abre recebe a resposta na hora.',
    audiences: ['local'],
    icon: MapPin,
    target: {
      type: 'automation',
      kind: 'DM',
      note: 'Já deixamos as palavras prontas. Escreva o seu endereço e o horário de funcionamento na mensagem.',
      messagePlaceholder: 'Ex.: Ficamos na Rua das Flores, 123, Centro. Abrimos de segunda a sábado, das 9h às 18h. Te esperamos!',
      draft: {
        keywords: ['endereço', 'endereco', 'onde fica', 'localização', 'localizacao', 'horário', 'horario', 'que horas'],
      },
    },
  },
  {
    id: 'catalog-link',
    title: 'Mandar o catálogo ou cardápio',
    description: 'Quem pedir o catálogo, o cardápio ou os produtos recebe o link na hora.',
    audiences: ['ecommerce', 'local'],
    icon: ShoppingBag,
    target: {
      type: 'automation',
      kind: 'DM',
      requiresLink: true,
      note: 'Já deixamos a mensagem pronta. Só falta colar o link do seu catálogo ou cardápio e escolher o número ou a conta.',
      draft: {
        keywords: ['catálogo', 'catalogo', 'cardápio', 'cardapio', 'ver os produtos'],
        message: 'Oi! 😊 Aqui está o nosso catálogo completo. É só tocar no botão para ver tudo:',
        linkLabel: 'Ver catálogo',
      },
    },
  },
];

const BY_ID = new Map<string, AutomationRecipe>(RECIPES.map((recipe) => [recipe.id, recipe]));

export function getRecipe(id: string | null | undefined): AutomationRecipe | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function recipesForBusiness(type: BusinessType | null): AutomationRecipe[] {
  if (!type) return [...RECIPES];
  const ours = RECIPES.filter((recipe) => recipe.audiences.includes(type));
  const others = RECIPES.filter((recipe) => !recipe.audiences.includes(type));
  return [...ours, ...others];
}

export const RECIPE_DESTINATION_LABEL: Record<RecipeTarget['type'], string> = {
  automation: 'Pronta em 1 minuto',
  flow: 'Fluxo pronto',
  'cart-recovery': 'Recuperação de vendas',
  'ai-follow-up': 'Atendente de IA',
};
