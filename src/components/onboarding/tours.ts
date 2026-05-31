import type { Permission } from '@/services/auth.service';

/**
 * Versão do conteúdo dos tours. Sempre que adicionamos/reordenamos/melhoramos
 * steps de forma significativa, bumpamos este valor. O frontend compara com a
 * versão salva no localStorage do usuário; se for diferente, faz reset
 * automático do progresso para que a NOVA experiência seja mostrada sem
 * precisar clicar em "Refazer tour" manualmente.
 */
export const ONBOARDING_VERSION = 'v6-2026-05-31-cart-recovery-sidebar';

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  /** Identificador único e estável do step (salvo no banco). */
  id: string;
  /** ID do tour (= página) ao qual este step pertence. */
  tourId: string;
  /** Seletor CSS do elemento alvo. Use `[data-tour="..."]`. Quando null, o passo aparece centralizado. */
  selector: string | null;
  /** Título mostrado em destaque no card. */
  title: string;
  /** Descrição explicando o que esse botão/elemento faz. */
  description: string;
  /** Posição preferida do tooltip. `auto` tenta encontrar a melhor. */
  placement?: TourPlacement;
  /** Se o step deve aparecer mesmo sem encontrar o elemento (útil pro step "boas-vindas"). */
  allowMissingTarget?: boolean;
}

export interface TourConfig {
  /** ID do tour (combina com `tourId` dos steps). */
  id: string;
  /** Pathname onde esse tour roda. */
  pathname: string;
  /** Nome amigável (mostrado em "Refazer tour"). */
  label: string;
  /** Permissão necessária para o tour aparecer (opcional). */
  permission?: Permission;
  /** Steps do tour, em ordem. */
  steps: TourStep[];
}

/**
 * Cada tour corresponde a uma página. Quando o usuário entra na página, se houver
 * steps daquele tour ainda não-concluídos e o tour não foi pulado, os steps aparecem
 * em sequência. O usuário pode pular o tour inteiro ou avançar/voltar entre os passos.
 */
export const TOURS: TourConfig[] = [
  {
    id: 'dashboard',
    pathname: '/dashboard',
    label: 'Visão Geral',
    steps: [
      {
        id: 'dashboard:overview',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-dashboard"]',
        title: 'Visão Geral da sua operação',
        description:
          'Aqui você acompanha em tempo real mensagens enviadas, taxa de entrega, novos contatos e o desempenho dos seus colaboradores.',
        placement: 'right',
      },
      {
        id: 'dashboard:groups-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-groups"]',
        title: 'Grupos de contatos',
        description:
          'Crie listas de transmissão segmentadas (clientes VIP, leads frios, recuperação) para usar nas campanhas. Pode ser manual ou dinâmico por tags.',
        placement: 'right',
      },
      {
        id: 'dashboard:channels-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-channels"]',
        title: 'Conecte seus canais',
        description:
          'É por aqui que você liga sua conta do WhatsApp ou Instagram à plataforma. Sem um canal conectado, nada dispara nem recebe mensagens.',
        placement: 'right',
      },
      {
        id: 'dashboard:campaigns-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-campaigns"]',
        title: 'Dispare mensagens em massa',
        description:
          'Em Campanhas você cria envios em lote para listas de contatos ou grupos, com texto, mídia, áudio e variáveis personalizadas.',
        placement: 'right',
      },
      {
        id: 'dashboard:contacts-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-contacts"]',
        title: 'Seus contatos e a fila de atendimento',
        description:
          'Sua base completa de contatos vive aqui. Quem chegou pelo WhatsApp, e também quem manda DM no Instagram — esses entram automaticamente conforme conversam com você. É aqui também que aparece, em destaque, quem pediu para falar com um humano em vez do bot, para você ou seu time assumir a conversa rapidinho.',
        placement: 'right',
      },
      {
        id: 'dashboard:scheduling-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-scheduling"]',
        title: 'Agendamentos',
        description:
          'Configure horários de funcionamento, duração de serviços e veja sua agenda no calendário. A IA pode até marcar horários direto no chat com o cliente.',
        placement: 'right',
      },
      {
        id: 'dashboard:auto-replies-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-auto-replies"]',
        title: 'Auto-Respostas inteligentes',
        description:
          'Configure respostas automáticas para palavras-chave: quando alguém escrever “orçamento”, “preço”, “horário”, a sua mensagem dispara sozinha.',
        placement: 'right',
      },
      {
        id: 'dashboard:comments-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-comment-automations"]',
        title: 'Automação de comentários no Instagram',
        description:
          'Responda comentários em posts ou Reels automaticamente, e ainda envie um DM com link/cupom para cada pessoa que comentar.',
        placement: 'right',
      },
      {
        id: 'dashboard:cart-recovery-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-cart-recovery"]',
        title: 'Recuperação de carrinhos abandonados',
        description:
          'Conecte Hotmart, Kiwify, Eduzz, Monetizze e PerfectPay e o Synq dispara automaticamente mensagens no WhatsApp ou Instagram pra quem abandonou o checkout. Configure uma vez e rode no automático.',
        placement: 'right',
      },
      {
        id: 'dashboard:ia-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-ia"]',
        title: 'Chatbot com IA',
        description:
          'Um assistente que conversa com seus leads 24/7, responde dúvidas sobre produtos, agenda horários e passa para o humano quando preciso.',
        placement: 'right',
      },
      {
        id: 'dashboard:settings-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-settings"]',
        title: 'Configurações',
        description:
          'Conta, segurança, faturamento, notificações e gestão de colaboradores ficam aqui. Você também pode refazer este tour a qualquer momento.',
        placement: 'right',
      },
    ],
  },

  {
    id: 'channels',
    pathname: '/channels',
    label: 'Canais',
    permission: 'channels',
    steps: [
      {
        id: 'channels:intro',
        tourId: 'channels',
        selector: null,
        title: 'Conecte seus canais',
        description:
          'Esta é a página onde você conecta as contas que vão enviar e receber mensagens. Sem isso, campanhas e bots não funcionam.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'channels:tabs',
        tourId: 'channels',
        selector: '[data-tour="channels-tabs"]',
        title: 'Escolha o tipo de canal',
        description:
          'Alterne entre WhatsApp e Instagram. Você pode ter vários canais conectados ao mesmo tempo, inclusive contas distintas.',
        placement: 'bottom',
      },
      {
        id: 'channels:add',
        tourId: 'channels',
        selector: '[data-tour="channels-add"]',
        title: 'Adicione uma nova instância',
        description:
          'Clique para conectar uma nova conta. No WhatsApp você escaneia um QR Code, no Instagram você autoriza via login do Facebook.',
        placement: 'left',
      },
    ],
  },

  {
    id: 'campaigns',
    pathname: '/campaigns',
    label: 'Campanhas',
    permission: 'campaigns',
    steps: [
      {
        id: 'campaigns:intro',
        tourId: 'campaigns',
        selector: null,
        title: 'Disparos em massa',
        description:
          'Campanhas é o coração do disparo. Crie uma vez, agende, e a plataforma envia para todos os contatos do grupo ou da lista escolhida.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'campaigns:new',
        tourId: 'campaigns',
        selector: '[data-tour="campaigns-new"]',
        title: 'Crie sua primeira campanha',
        description:
          'Aqui você escolhe o canal, o público (grupo ou lista), monta a mensagem com texto/mídia/áudio e define se dispara agora ou agenda para depois.',
        placement: 'left',
      },
    ],
  },

  {
    id: 'auto-replies',
    pathname: '/auto-replies',
    label: 'Auto-Respostas',
    permission: 'auto-replies',
    steps: [
      {
        id: 'auto-replies:intro',
        tourId: 'auto-replies',
        selector: null,
        title: 'Respostas automáticas',
        description:
          'Defina gatilhos por palavra-chave que disparam respostas instantâneas. Funciona para WhatsApp e Instagram DM.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'auto-replies:new',
        tourId: 'auto-replies',
        selector: '[data-tour="auto-replies-new"]',
        title: 'Crie uma nova regra',
        description:
          'Escolha o tipo de match (contém, exato, começa com), a palavra-chave e a resposta. Pode anexar mídia e áudio também.',
        placement: 'left',
      },
    ],
  },

  {
    id: 'comment-automations',
    pathname: '/comment-automations',
    label: 'Comentários IG',
    permission: 'auto-replies',
    steps: [
      {
        id: 'comment-automations:intro',
        tourId: 'comment-automations',
        selector: null,
        title: 'Automação de comentários no Instagram',
        description:
          'Quando alguém comentar a palavra-chave no seu post/Reel, a plataforma responde no comentário e ainda envia um DM com o que você quiser.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'comment-automations:new',
        tourId: 'comment-automations',
        selector: '[data-tour="comment-automations-new"]',
        title: 'Crie sua primeira automação',
        description:
          'Escolha o post, a palavra-chave de gatilho e a resposta no DM (com link, cupom, áudio ou imagem). Aumenta muito a conversão.',
        placement: 'left',
      },
    ],
  },

  {
    id: 'ia',
    pathname: '/ia',
    label: 'IA',
    permission: 'ia',
    steps: [
      {
        id: 'ia:intro',
        tourId: 'ia',
        selector: null,
        title: 'Seu assistente com IA',
        description:
          'Configure a personalidade, segmento, tom de voz e regras do bot. Ele aprende sobre seu negócio e responde 24/7.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'ia:tabs',
        tourId: 'ia',
        selector: '[data-tour="ia-tabs"]',
        title: 'Configure por seção',
        description:
          'Identidade, regras personalizadas, produtos, canais ativos e agendamentos. Cada aba ajusta um aspecto do comportamento da IA.',
        placement: 'bottom',
      },
      {
        id: 'ia:channels',
        tourId: 'ia',
        selector: '[data-tour="ia-channels"]',
        title: 'Ative a IA por canal',
        description:
          'A IA pode ficar ligada em uns canais e desligada em outros. Use isso para testar com cuidado antes de soltar para todo mundo.',
        placement: 'top',
      },
    ],
  },

  {
    id: 'contacts',
    pathname: '/contacts',
    label: 'Contatos',
    permission: 'contacts',
    steps: [
      {
        id: 'contacts:intro',
        tourId: 'contacts',
        selector: null,
        title: 'Sua base de contatos completa',
        description:
          'Esta é a central de todo mundo que já interagiu com a sua marca. Os contatos do WhatsApp você pode importar da sua agenda, e os do Instagram entram automaticamente aqui assim que alguém envia uma DM — não precisa cadastrar manualmente. Você pode editar, organizar por tags e usar essa base inteira nas campanhas e nos grupos.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'contacts:human-queue',
        tourId: 'contacts',
        selector: '[data-tour="sidebar-contacts"]',
        title: 'Fila "Quero falar com humano"',
        description:
          'Repare no número vermelho que aparece no menu Contatos: ele mostra quantas pessoas pediram para o bot transferir o atendimento pra uma pessoa real. Esses contatos ficam em destaque no topo da lista para você (ou um colaborador) assumir a conversa rapidinho, sem ninguém ficar esperando.',
        placement: 'right',
      },
      {
        id: 'contacts:sync',
        tourId: 'contacts',
        selector: '[data-tour="contacts-sync"]',
        title: 'Sincronize com o WhatsApp',
        description:
          'Importe contatos diretamente da agenda do seu WhatsApp conectado, sem precisar digitar um por um. Os do Instagram, como falei, já chegam sozinhos conforme as pessoas conversam com você.',
        placement: 'left',
      },
    ],
  },

  {
    id: 'groups',
    pathname: '/groups',
    label: 'Grupos',
    permission: 'groups',
    steps: [
      {
        id: 'groups:intro',
        tourId: 'groups',
        selector: null,
        title: 'Grupos de contatos',
        description:
          'Use grupos para segmentar quem recebe cada campanha. Manuais (você escolhe) ou dinâmicos (por tags/critérios).',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'groups:new',
        tourId: 'groups',
        selector: '[data-tour="groups-new"]',
        title: 'Crie seu primeiro grupo',
        description:
          'Dá um nome, escolhe os contatos e pronto: você já tem uma lista pra usar em quantas campanhas quiser.',
        placement: 'left',
      },
    ],
  },

  {
    id: 'scheduling',
    pathname: '/scheduling',
    label: 'Agendamentos',
    permission: 'scheduling',
    steps: [
      {
        id: 'scheduling:intro',
        tourId: 'scheduling',
        selector: null,
        title: 'Agendamentos integrados à IA',
        description:
          'A IA consulta sua agenda e pode até marcar horários com o cliente direto pelo chat. Configure horários, serviços e disponibilidade.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'scheduling:tabs',
        tourId: 'scheduling',
        selector: '[data-tour="scheduling-tabs"]',
        title: 'Calendário e configurações',
        description:
          'Veja sua agenda no calendário, e configure os horários de funcionamento e duração dos serviços nas outras abas.',
        placement: 'bottom',
      },
    ],
  },

  {
    id: 'cart-recovery',
    pathname: '/cart-recovery',
    label: 'Recuperação de Carrinhos',
    permission: 'campaigns',
    steps: [
      {
        id: 'cart-recovery:intro',
        tourId: 'cart-recovery',
        selector: null,
        title: 'Recupere vendas perdidas no automático',
        description:
          'Sempre que um cliente abandonar o checkout na Hotmart, Kiwify, Eduzz, Monetizze ou PerfectPay, o Synq dispara uma sequência de mensagens no WhatsApp ou Instagram pra trazer ele de volta. Tudo configurado uma vez e rodando sozinho.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'cart-recovery:tabs',
        tourId: 'cart-recovery',
        selector: '[data-tour="cart-recovery-tabs"]',
        title: 'Acompanhe e configure',
        description:
          'Em "Carrinhos" você vê em tempo real quem abandonou, o valor perdido e os recuperados. Em "Integrações" você cadastra os webhooks de cada plataforma de venda (Hotmart, Kiwify, Eduzz…) que vai alimentar o sistema com esses dados. Cada plano permite uma quantidade diferente de integrações ativas.',
        placement: 'bottom',
      },
    ],
  },

  {
    id: 'settings',
    pathname: '/settings',
    label: 'Configurações',
    steps: [
      {
        id: 'settings:intro',
        tourId: 'settings',
        selector: null,
        title: 'Ajustes da sua conta',
        description:
          'Conta, segurança (2FA), notificações, faturamento, colaboradores e o botão pra refazer este tour ficam todos aqui dentro.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'settings:nav',
        tourId: 'settings',
        selector: '[data-tour="settings-nav"]',
        title: 'Navegue pelas seções',
        description:
          'Cada aba é uma área diferente de configuração. Donos veem mais opções (faturamento, notificações, membros) do que colaboradores.',
        placement: 'bottom',
      },
    ],
  },
];

export function findTourByPathname(pathname: string): TourConfig | undefined {
  return TOURS.find((t) => pathname === t.pathname || pathname.startsWith(`${t.pathname}/`));
}

export function getStepIds(tour: TourConfig): string[] {
  return tour.steps.map((s) => s.id);
}
