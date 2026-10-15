import type { Permission } from '@/services/auth.service';
import { HIDDEN_FEATURES } from '@lib/featureFlags';

/**
 * Versão do conteúdo dos tours. Sempre que adicionamos/reordenamos/melhoramos
 * steps de forma significativa, bumpamos este valor. O frontend compara com a
 * versão salva no localStorage do usuário; se for diferente, faz reset
 * automático do progresso para que a NOVA experiência seja mostrada sem
 * precisar clicar em "Refazer tour" manualmente.
 */
export const ONBOARDING_VERSION = 'v8-2026-06-08-welcome-fix';

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
const ALL_TOURS: TourConfig[] = [
  {
    id: 'dashboard',
    pathname: '/dashboard',
    label: 'Visão Geral',
    steps: [
      {
        id: 'dashboard:channels-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-channels"]',
        title: 'Conecte seu WhatsApp ou Instagram aqui',
        description:
          'É o primeiro passo: ligue o número de WhatsApp ou a conta do Instagram do seu negócio. Sem isso, nenhuma mensagem é enviada nem recebida.',
        placement: 'right',
      },
      {
        id: 'dashboard:auto-replies-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-auto-replies"]',
        title: 'Crie sua primeira automação aqui',
        description:
          'Deixe o Synq responder sozinho: quando alguém perguntar o preço ou comentar no seu post, a resposta sai na hora, de dia ou de noite.',
        placement: 'right',
      },
      {
        id: 'dashboard:ia-nav',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-ia"]',
        title: 'Ensine a IA sobre seu negócio aqui',
        description:
          'Conte o que você vende, os preços e os horários. A IA usa isso para atender seus clientes a qualquer hora e chama você quando for preciso.',
        placement: 'right',
      },
      {
        id: 'dashboard:overview',
        tourId: 'dashboard',
        selector: '[data-tour="sidebar-dashboard"]',
        title: 'Acompanhe os resultados aqui',
        description:
          'Veja quantas mensagens saíram, quantos clientes novos chegaram e como suas automações estão funcionando. Você pode refazer este tour guiado quando quiser em Configurações > Conta.',
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
          'Aqui você conecta os números e as contas que vão enviar e receber mensagens. Sem isso, campanhas, automações e a IA não funcionam.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'channels:tabs',
        tourId: 'channels',
        selector: '[data-tour="channels-cards"]',
        title: 'Um quadro para cada tipo de canal',
        description:
          'WhatsApp e Instagram ficam lado a lado, cada um mostrando os números e as contas já conectados. Você pode ter vários ao mesmo tempo.',
        placement: 'bottom',
      },
      {
        id: 'channels:add',
        tourId: 'channels',
        selector: '[data-tour="channels-add"]',
        title: 'Conecte um novo número ou conta',
        description:
          'Cada quadro tem o seu botão de conectar. No WhatsApp você lê um QR Code com o celular; no Instagram você entra com o usuário e a senha da sua conta profissional.',
        placement: 'bottom',
      },
    ],
  },

  {
    id: 'auto-replies',
    pathname: '/auto-replies',
    label: 'Automações',
    permission: 'auto-replies',
    steps: [
      {
        id: 'auto-replies:intro',
        tourId: 'auto-replies',
        selector: null,
        title: 'Suas automações',
        description:
          'Escolha as palavras que fazem o Synq responder sozinho, na hora. Funciona no WhatsApp e no Direct do Instagram.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'auto-replies:new',
        tourId: 'auto-replies',
        selector: '[data-tour="auto-replies-new"]',
        title: 'Crie uma nova automação',
        description:
          'Diga quando responder (a mensagem contém a palavra, é igual a ela ou começa com ela), quais palavras valem e qual será a resposta. Dá para anexar imagem, áudio ou documento também.',
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
          'Conte para a IA o que você vende, como fala com seus clientes e o que ela pode ou não fazer. Ela aprende sobre o seu negócio e atende a qualquer hora.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'ia:tabs',
        tourId: 'ia',
        selector: '[data-tour="ia-tabs"]',
        title: 'Simples primeiro, detalhes depois',
        description:
          'Comece pelo modo simples: 3 perguntas e um teste. As abas completas ficam em Configurações avançadas.',
        placement: 'bottom',
        allowMissingTarget: true,
      },
      {
        id: 'ia:channels',
        tourId: 'ia',
        selector: '[data-tour="ia-channels"]',
        title: 'Ligue a IA em cada número ou conta',
        description:
          'A IA pode ficar ligada em um número e desligada em outro. Use isso para testar com calma antes de liberar para todos os clientes.',
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
          'Aqui fica todo mundo que já conversou com o seu negócio. Os contatos do WhatsApp você pode trazer da sua agenda, e os do Instagram entram sozinhos assim que alguém manda uma mensagem no Direct. Você pode editar, organizar por tags e usar esses contatos nas campanhas e nos grupos.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'contacts:human-queue',
        tourId: 'contacts',
        selector: '[data-tour="sidebar-contacts"]',
        title: 'Fila "Quero falar com humano"',
        description:
          'Repare no número vermelho no menu Contatos: ele mostra quantas pessoas pediram para falar com alguém de verdade em vez da automação. Esses contatos ficam no topo da lista para você ou sua equipe assumir a conversa rapidinho, sem ninguém ficar esperando.',
        placement: 'right',
      },
      {
        id: 'contacts:sync',
        tourId: 'contacts',
        selector: '[data-tour="contacts-sync"]',
        title: 'Traga os contatos do WhatsApp',
        description:
          'Puxe os contatos da agenda do seu WhatsApp conectado, sem digitar um por um. Os do Instagram já chegam sozinhos conforme as pessoas conversam com você.',
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
          'Use grupos para separar quem recebe cada campanha, como clientes fiéis, novos clientes ou quem ainda não comprou.',
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
          'A IA consulta sua agenda e pode até marcar horários com o cliente direto na conversa. Configure seus horários, serviços e dias livres.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'scheduling:tabs',
        tourId: 'scheduling',
        selector: '[data-tour="scheduling-tabs"]',
        title: 'Calendário e configurações',
        description:
          'Veja sua agenda no calendário e ajuste os horários de funcionamento e a duração dos serviços nas outras abas.',
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
          'Sempre que um cliente desistir da compra na Hotmart, Kiwify, Eduzz, Monetizze ou PerfectPay, o Synq manda mensagens no WhatsApp ou no Instagram para trazer ele de volta. Você configura uma vez e o resto acontece sozinho.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'cart-recovery:tabs',
        tourId: 'cart-recovery',
        selector: '[data-tour="cart-recovery-tabs"]',
        title: 'Acompanhe e configure',
        description:
          'Em "Carrinhos" você vê na hora quem desistiu, o valor que ficou para trás e as vendas recuperadas. Em "Integrações" você liga cada plataforma de venda (Hotmart, Kiwify, Eduzz…) ao Synq. Cada plano permite um número diferente de integrações ativas.',
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
          'Conta, segurança (verificação em duas etapas), notificações, faturamento, equipe e o botão para refazer o tour guiado ficam todos aqui.',
        placement: 'center',
        allowMissingTarget: true,
      },
      {
        id: 'settings:nav',
        tourId: 'settings',
        selector: '[data-tour="settings-nav"]',
        title: 'Navegue pelas seções',
        description:
          'Cada aba cuida de uma parte das configurações. O dono da conta vê mais opções (faturamento, membros e atendimento) do que os colaboradores.',
        placement: 'bottom',
      },
    ],
  },
];

/**
 * Tours ocultos do onboarding (ver HIDDEN_FEATURES em @lib/featureFlags).
 * Nada e deletado: os steps continuam definidos em ALL_TOURS acima e voltam
 * a aparecer assim que a flag for desligada.
 */
const HIDDEN_TOUR_IDS = new Set<string>([
  ...(HIDDEN_FEATURES.cartRecovery ? ['cart-recovery'] : []),
]);

export const TOURS: TourConfig[] = ALL_TOURS.filter((tour) => !HIDDEN_TOUR_IDS.has(tour.id));

export function findTourByPathname(pathname: string): TourConfig | undefined {
  return TOURS.find((t) => pathname === t.pathname || pathname.startsWith(`${t.pathname}/`));
}

export function getStepIds(tour: TourConfig): string[] {
  return tour.steps.map((s) => s.id);
}
