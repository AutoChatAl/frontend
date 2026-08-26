import {
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CreditCard,
  Instagram,
  KanbanSquare,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  MessageSquare,
  MessagesSquare,
  Reply,
  Send,
  Share2,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TicketPercent,
  Trello,
  User,
  Users,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';

/** Seções exibidas como cabeçalho no dropdown — espelham os grupos da sidebar. */
export type DestinationSection = 'Geral' | 'Público' | 'Engajamento' | 'Automação' | 'Sistema';

export type DestinationIcon = ComponentType<{
    size?: number;
    className?: string;
}>;

export interface NavDestination {
    id: string;
    /** Rótulo no imperativo — o usuário busca pela ação, não pela rota. */
    label: string;
    description: string;
    href: string;
    icon: DestinationIcon;
    section: DestinationSection;
    /** Item equivalente na sidebar — usado para respeitar as permissões do usuário. */
    menuId: string;
    /** Restrito ao dono do workspace: colaborador não enxerga o destino. */
    ownerOnly?: boolean;
    /** Sinônimos e termos alternativos usados só na busca. */
    keywords: string[];
}

/**
 * Catálogo de destinos navegáveis do sistema. Cada entrada aponta para uma
 * rota real e é filtrada pelas permissões do usuário através de `menuId`.
 */
export const NAV_DESTINATIONS: NavDestination[] = [
  // Geral
  {
    id: 'dashboard',
    label: 'Ver Visão Geral',
    description: 'Métricas de mensagens, faturamento e campanhas',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'Geral',
    menuId: 'dashboard',
    keywords: ['dashboard', 'inicio', 'home', 'metricas', 'graficos', 'resumo', 'painel'],
  },
  {
    id: 'channels',
    label: 'Gerenciar Canais',
    description: 'Conectar e monitorar WhatsApp e Instagram',
    href: '/channels',
    icon: Share2,
    section: 'Geral',
    menuId: 'channels',
    keywords: ['canal', 'canais', 'conexao', 'integrar', 'status', 'desconectar'],
  },
  {
    id: 'channels-whatsapp',
    label: 'Conectar WhatsApp',
    description: 'Ler o QR Code e ativar uma nova instância',
    href: '/channels',
    icon: Smartphone,
    section: 'Geral',
    menuId: 'channels',
    keywords: ['whatsapp', 'qr code', 'instancia', 'numero', 'conectar', 'zap'],
  },
  {
    id: 'channels-instagram',
    label: 'Conectar Instagram',
    description: 'Autorizar uma conta pelo login da Meta',
    href: '/channels',
    icon: Instagram,
    section: 'Geral',
    menuId: 'channels',
    keywords: ['instagram', 'meta', 'direct', 'oauth', 'conta', 'insta'],
  },
  {
    id: 'whatsapp-official',
    label: 'Configurar API Oficial',
    description: 'Número verificado pela API Oficial do WhatsApp',
    href: '/whatsapp-official',
    icon: BadgeCheck,
    section: 'Geral',
    menuId: 'whatsapp-official',
    keywords: ['api oficial', 'cloud api', 'meta', 'verificado', 'whatsapp business', 'selo'],
  },

  // Público
  {
    id: 'inbox',
    label: 'Abrir o Chat',
    description: 'Conversas em andamento com seus contatos',
    href: '/inbox',
    icon: MessagesSquare,
    section: 'Público',
    menuId: 'inbox',
    keywords: ['chat', 'conversas', 'inbox', 'atendimento', 'mensagens', 'responder'],
  },
  {
    id: 'contacts',
    label: 'Ver Contatos',
    description: 'Base de contatos e fila de atendimento humano',
    href: '/contacts',
    icon: Users,
    section: 'Público',
    menuId: 'contacts',
    keywords: ['contatos', 'clientes', 'leads', 'fila', 'atendimento humano', 'tags', 'importar'],
  },
  {
    id: 'groups',
    label: 'Gerenciar Grupos',
    description: 'Listas de contatos para disparos segmentados',
    href: '/groups',
    icon: Layers,
    section: 'Público',
    menuId: 'groups',
    keywords: ['grupos', 'listas', 'segmento', 'audiencia', 'publico'],
  },

  // Engajamento
  {
    id: 'campaigns-create',
    label: 'Criar Campanha',
    description: 'Novo disparo em massa para um grupo de contatos',
    href: '/campaigns',
    icon: Send,
    section: 'Engajamento',
    menuId: 'campaigns',
    keywords: ['campanha', 'disparo', 'envio em massa', 'nova campanha', 'broadcast', 'agendar disparo'],
  },
  {
    id: 'campaigns-list',
    label: 'Ver Campanhas',
    description: 'Acompanhar disparos agendados e em execução',
    href: '/campaigns',
    icon: Send,
    section: 'Engajamento',
    menuId: 'campaigns',
    keywords: ['campanhas', 'disparos', 'historico', 'agendadas', 'pausar'],
  },
  {
    id: 'templates',
    label: 'Gerenciar Templates',
    description: 'Modelos de mensagem reutilizáveis',
    href: '/templates',
    icon: LayoutTemplate,
    section: 'Engajamento',
    menuId: 'templates',
    keywords: ['template', 'modelo', 'mensagem pronta', 'texto', 'variaveis'],
  },
  {
    id: 'funnel',
    label: 'Abrir o Funil',
    description: 'Etapas de negociação dos seus contatos',
    href: '/funnel',
    icon: KanbanSquare,
    section: 'Engajamento',
    menuId: 'funnel',
    keywords: ['funil', 'kanban', 'pipeline', 'etapas', 'negociacao', 'oportunidade'],
  },
  {
    id: 'scheduling',
    label: 'Ver Agendamentos',
    description: 'Compromissos, serviços e horários disponíveis',
    href: '/scheduling',
    icon: CalendarDays,
    section: 'Engajamento',
    menuId: 'scheduling',
    keywords: ['agenda', 'agendamento', 'horario', 'compromisso', 'servico', 'reserva', 'calendario'],
  },

  // Automação
  {
    id: 'auto-replies',
    label: 'Configurar Auto-Respostas',
    description: 'Respostas automáticas por palavra-chave',
    href: '/auto-replies',
    icon: Reply,
    section: 'Automação',
    menuId: 'auto-replies',
    keywords: ['auto resposta', 'resposta automatica', 'palavra chave', 'gatilho', 'robo'],
  },
  {
    id: 'comment-automations',
    label: 'Automatizar Comentários',
    description: 'Respostas automáticas a comentários do Instagram',
    href: '/auto-replies?tipo=comentario',
    icon: MessageSquare,
    section: 'Automação',
    menuId: 'auto-replies',
    keywords: ['comentario', 'instagram', 'post', 'dm automatica', 'reels'],
  },
  {
    id: 'ia-assistant',
    label: 'Configurar Assistente Virtual',
    description: 'Nome, segmento e tom de voz da IA',
    href: '/ia?tab=general',
    icon: Bot,
    section: 'Automação',
    menuId: 'ia',
    keywords: ['ia', 'assistente', 'virtual', 'prompt', 'tom de voz', 'personalidade', 'segmento', 'nome do bot'],
  },
  {
    id: 'ia-catalog',
    label: 'Catálogo de Produtos da IA',
    description: 'Itens que a IA pode citar, recomendar e enviar',
    href: '/ia?tab=catalog',
    icon: ShoppingBag,
    section: 'Automação',
    menuId: 'ia',
    keywords: ['ia', 'catalogo', 'produtos', 'servicos', 'preco', 'importar planilha', 'cross-sell'],
  },
  {
    id: 'ia-channels',
    label: 'Configurar Canais de IA',
    description: 'Escolher em quais canais a IA responde',
    href: '/ia?tab=channels',
    icon: Share2,
    section: 'Automação',
    menuId: 'ia',
    keywords: ['ia', 'canais', 'ativar ia', 'ligar ia', 'whatsapp', 'instagram'],
  },
  {
    id: 'ia-triggers',
    label: 'Definir Regras e Gatilhos da IA',
    description: 'Quando a IA deve assumir ou devolver a conversa',
    href: '/ia?tab=triggers',
    icon: Zap,
    section: 'Automação',
    menuId: 'ia',
    keywords: ['ia', 'regras', 'gatilhos', 'triggers', 'condicoes', 'transbordo'],
  },
  {
    id: 'ia-scheduling',
    label: 'Ativar Agendamento pela IA',
    description: 'Deixar a IA consultar e marcar horários',
    href: '/ia?tab=scheduling',
    icon: CalendarDays,
    section: 'Automação',
    menuId: 'ia',
    keywords: ['ia', 'agendamento', 'marcar horario', 'agenda', 'consultar'],
  },
  {
    id: 'ia-funnel',
    label: 'Ativar Funil Automático da IA',
    description: 'Mover contatos de etapa conforme a conversa',
    href: '/ia?tab=funnel',
    icon: Trello,
    section: 'Automação',
    menuId: 'ia',
    keywords: ['ia', 'funil', 'automatico', 'etapas', 'mover contato'],
  },

  // Sistema
  {
    id: 'settings-account',
    label: 'Editar Dados da Conta',
    description: 'Nome, e-mail e informações do workspace',
    href: '/settings?tab=account',
    icon: User,
    section: 'Sistema',
    menuId: 'settings',
    keywords: ['conta', 'perfil', 'dados', 'workspace', 'nome', 'email', 'empresa'],
  },
  {
    id: 'settings-security',
    label: 'Ajustar Segurança e 2FA',
    description: 'Senha e verificação em duas etapas',
    href: '/settings?tab=security',
    icon: Shield,
    section: 'Sistema',
    menuId: 'settings',
    keywords: ['seguranca', 'senha', '2fa', 'autenticacao', 'totp', 'trocar senha', 'codigo'],
  },
  {
    id: 'settings-notifications',
    label: 'Ajustar Notificações',
    description: 'O que você recebe por e-mail e no painel',
    href: '/settings?tab=notifications',
    icon: Bell,
    section: 'Sistema',
    menuId: 'settings',
    ownerOnly: true,
    keywords: ['notificacao', 'alertas', 'email', 'avisos', 'sino'],
  },
  {
    id: 'settings-billing',
    label: 'Ver Plano e Faturamento',
    description: 'Assinatura, limites de uso e histórico de cobrança',
    href: '/settings?tab=billing',
    icon: CreditCard,
    section: 'Sistema',
    menuId: 'settings',
    ownerOnly: true,
    keywords: ['plano', 'assinatura', 'faturamento', 'cobranca', 'pagamento', 'cartao', 'fatura', 'limite', 'stripe'],
  },
  {
    id: 'settings-members',
    label: 'Gerenciar Membros e Permissões',
    description: 'Convidar colaboradores e definir acessos',
    href: '/settings?tab=members',
    icon: Users,
    section: 'Sistema',
    menuId: 'settings',
    ownerOnly: true,
    keywords: ['membro', 'colaborador', 'equipe', 'convite', 'permissao', 'acesso', 'usuario'],
  },
  {
    id: 'plans',
    label: 'Comparar Planos',
    description: 'Ver o que cada plano inclui e fazer upgrade',
    href: '/plans',
    icon: Sparkles,
    section: 'Sistema',
    menuId: 'settings',
    keywords: ['plano', 'planos', 'upgrade', 'preco', 'assinar', 'trocar plano'],
  },
  {
    id: 'suporte',
    label: 'Falar com o Suporte',
    description: 'Abrir um chamado com o time do Synq',
    href: '/suporte',
    icon: LifeBuoy,
    section: 'Sistema',
    menuId: 'suporte',
    keywords: ['suporte', 'ajuda', 'chamado', 'duvida', 'contato', 'problema'],
  },
  {
    id: 'cupons',
    label: 'Gerenciar Cupons',
    description: 'Descontos e códigos promocionais',
    href: '/cupons',
    icon: TicketPercent,
    section: 'Sistema',
    menuId: 'cupons',
    keywords: ['cupom', 'desconto', 'promocao', 'codigo', 'voucher'],
  },
  {
    id: 'gastos-ia',
    label: 'Ver Gastos de IA',
    description: 'Consumo e custo das mensagens processadas pela IA',
    href: '/gastos-ia',
    icon: BarChart3,
    section: 'Sistema',
    menuId: 'gastos-ia',
    keywords: ['gastos', 'custo', 'consumo', 'tokens', 'ia', 'uso', 'creditos'],
  },
];

/** Minúsculas, sem acento e sem espaços nas pontas — base da comparação. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/**
 * Pontua o destino contra os termos buscados. Retorna 0 quando algum termo
 * não aparece em lugar nenhum — todos os termos precisam casar.
 */
function scoreDestination(destination: NavDestination, terms: string[]): number {
  const label = normalizeText(destination.label);
  const haystack = normalizeText([
    destination.label,
    destination.description,
    destination.section,
    ...destination.keywords,
  ].join(' '));
  let score = 0;
  for (const term of terms) {
    if (label.startsWith(term)) {
      score += 6;
    }
    else if (label.includes(term)) {
      score += 4;
    }
    else if (haystack.includes(term)) {
      score += 2;
    }
    else {
      return 0;
    }
  }
  return score;
}

/** Filtra e ordena os destinos por relevância. Busca vazia devolve tudo. */
export function filterDestinations(destinations: NavDestination[], query: string): NavDestination[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return destinations;
  }
  return destinations
    .map((destination) => ({ destination, score: scoreDestination(destination, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.destination);
}
