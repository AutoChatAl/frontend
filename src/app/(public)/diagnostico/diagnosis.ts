import type { AdLeadProfile, AdLeadSegment } from '@/types/AdLead';

import type { DiagnosisOutcome, ProfileScores } from './types';

export const PROFILES: AdLeadProfile[] = ['desorganizado', 'instagram', 'ferramenta', 'manual', 'engajamento'];

export interface DiagnosisContent {
  tag: string;
  title: string;
  lead: string;
  summary: string;
  costs: string[];
  /** Recursos do Synq que atacam o problema — só o que a plataforma faz hoje. */
  solutions: string[];
  /** O que só a conversa com o time entrega — é a ponte para o WhatsApp. Aceita `**negrito**`. */
  meeting: string;
}

export const DIAGNOSES: Record<AdLeadProfile, DiagnosisContent> = {
  desorganizado: {
    tag: 'Atendimento Desorganizado',
    title: 'Sua operação cresceu. O processo não.',
    lead: 'O atendimento depende da memória e da boa vontade das pessoas — não de um sistema.',
    summary:
      'A qualidade do atendimento muda conforme quem está de plantão, e ninguém sabe dizer quem ficou sem resposta hoje. O problema não é falta de esforço da equipe, é falta de estrutura para sustentar esse esforço.',
    costs: [
      'Clientes que somem sem ninguém perceber',
      'Vendas perdidas para quem respondeu primeiro',
      'Equipe sobrecarregada fazendo retrabalho',
    ],
    solutions: [
      'WhatsApp e Instagram numa caixa de entrada só',
      'Cada conversa com um responsável',
      'Funil de vendas com etiquetas para ninguém ficar sem retorno',
    ],
    meeting:
      'Como organizar o atendimento **da sua operação** num painel só — quem atende o quê e como nenhum cliente fica sem retorno.',
  },
  instagram: {
    tag: 'Seguidor que Não Vira Cliente',
    title: 'Seu Instagram gera conversa. Não gera venda.',
    lead: 'Tem gente comentando e chamando no Direct — mas boa parte nunca recebe o próximo passo.',
    summary:
      'Cada comentário pedindo preço ou link é alguém pronto para comprar. Quando a resposta demora ou nem chega, esse interesse esfria em minutos e vai para quem respondeu primeiro.',
    costs: [
      'Comentários com intenção de compra sem resposta',
      'Anúncio e lançamento gerando conversa que ninguém converte',
      'Equipe copiando e colando a mesma resposta o dia inteiro',
    ],
    solutions: [
      'Comentou a palavra-chave, recebeu o link no Direct',
      'A mesma automação em posts, reels, lives e stories',
      'Cada pessoa segue para o seu funil com etiqueta',
    ],
    meeting:
      'Quais **posts, anúncios e palavras-chave** automatizar primeiro — e o fluxo que leva quem comenta direto para a compra.',
  },
  ferramenta: {
    tag: 'Ferramenta que Não Entrega',
    title: 'Você paga por uma ferramenta que não resolve.',
    lead: 'Já investiu na plataforma e aprendeu a usar — e a operação continua não funcionando como deveria.',
    summary:
      'A ferramenta entrega o básico, mas falha onde importa: menu engessado que o cliente abandona, IA que erra e um canal de cada lado. O que segura a troca costuma ser só o medo do trabalho que ela dá.',
    costs: [
      'Mensalidade paga por algo que não resolve',
      'Trabalho feito no braço que deveria ser automático',
      'WhatsApp e Instagram separados, cada um com seu histórico',
    ],
    solutions: [
      'WhatsApp e Instagram na mesma plataforma',
      'IA que responde com base no que você ensinar',
      'Fluxos montados arrastando blocos, sem programar',
    ],
    meeting:
      'A comparação direta com o que você usa hoje — e como a troca acontece **sem parar seu atendimento**.',
  },
  manual: {
    tag: 'Operação Refém do Manual',
    title: 'Crescer virou sinônimo de responder mais.',
    lead: 'Seu tempo vai para tarefas que não precisam de você.',
    summary:
      'Responder a mesma dúvida pela vigésima vez, mandar link um por um, lembrar cliente de horário: isso consome o tempo de quem deveria estar vendendo ou criando. E fora do horário, ninguém responde.',
    costs: [
      'Cada nova demanda exige mais gente ou mais horas suas',
      'Quem chama à noite ou no fim de semana fica sem resposta',
      'Tempo gasto em tarefa repetitiva em vez de vender',
    ],
    solutions: [
      'Respostas automáticas por palavra-chave',
      'IA atendendo 24 horas e chamando você quando precisa',
      'Agendamentos com lembrete automático',
    ],
    meeting:
      'Quais **tarefas da sua operação** dá para automatizar já no primeiro mês — e quanto tempo isso devolve para você.',
  },
  engajamento: {
    tag: 'Engajamento Travado',
    title: 'Seu conteúdo alcança pouco e conversa menos ainda.',
    lead: 'Você posta, mas comentários e Direct não acompanham — e sem conversa, o conteúdo não vira venda.',
    summary:
      'Comentários e respostas no Direct são sinais de interesse que ajudam o post a chegar em mais gente. Quando o seguidor não tem motivo para interagir, o alcance cai e cada lançamento depende mais de anúncio pago.',
    costs: [
      'Posts com alcance cada vez menor',
      'Audiência que assiste, mas não interage',
      'Lançamentos que dependem só de anúncio pago',
    ],
    solutions: [
      '"Comenta QUERO" em posts, reels e lives',
      'Resposta no comentário e link no Direct na hora',
      'Automação para quem responde ou menciona seus stories',
    ],
    meeting:
      'Como usar **"comenta QUERO que eu te mando o link"** nos seus posts, reels e lives — com a resposta chegando no Direct na hora.',
  },
};

export const SEGMENT_LABELS: Record<AdLeadSegment, string> = {
  infoprodutor: 'Infoprodutor / criador de conteúdo',
  ambos: 'Criador de conteúdo e empresa',
  loja: 'Loja ou e-commerce',
  servico: 'Prestador de serviço',
  outro: 'Outro tipo de negócio',
};

/** Segundo perfil só entra no resultado quando fica a menos disso do primeiro. */
const SECONDARY_GAP = 3;

/**
 * Perfil principal e, se estiver perto, o secundário. Quem não vende pelo
 * Instagram nunca recebe o diagnóstico do Instagram, mesmo que alguma opção
 * genérica tenha somado pontos lá.
 */
export function rankProfiles(scores: ProfileScores, instagram: boolean): Pick<DiagnosisOutcome, 'primary' | 'secondary'> {
  const ranked = PROFILES
    .filter((profile) => instagram || profile !== 'instagram')
    .sort((a, b) => scores[b] - scores[a]);
  const [first, runnerUp] = ranked;
  const primary = first ?? 'desorganizado';
  const secondary = runnerUp && scores[runnerUp] > 0 && scores[primary] - scores[runnerUp] < SECONDARY_GAP ? runnerUp : null;
  return { primary, secondary };
}

// Faixa de pontos por pergunta que os caminhos produzem na prática (do mais tranquilo ao mais crítico).
const AVERAGE_FLOOR = 3.25;
const AVERAGE_CEIL = 5.75;

/**
 * Nota de 15 a 85: quanto mais pontos de dor, pior a saúde da operação. Usa a
 * média por pergunta, não a soma — o caminho de quem é criador e empresa tem uma
 * pergunta a mais e, pela soma, sairia sempre pior.
 */
export function healthScore(scores: ProfileScores, scoredQuestions: number): number {
  const total = PROFILES.reduce((sum, profile) => sum + scores[profile], 0);
  const average = total / Math.max(1, scoredQuestions);
  const clamped = Math.min(AVERAGE_CEIL, Math.max(AVERAGE_FLOOR, average));
  return Math.round(85 - ((clamped - AVERAGE_FLOOR) / (AVERAGE_CEIL - AVERAGE_FLOOR)) * 70);
}

export type HealthZone = 'critico' | 'risco' | 'saudavel';

export interface HealthReading {
  zone: HealthZone;
  label: string;
  note: string;
}

export function readHealth(score: number): HealthReading {
  if (score <= 32) {
    return {
      zone: 'critico',
      label: 'Operação em estado crítico',
      note: 'Os gargalos se reforçam entre si. Sem mudança, o custo cresce mais rápido que o faturamento.',
    };
  }
  if (score <= 65) {
    return {
      zone: 'risco',
      label: 'Operação em risco',
      note: 'Funciona, mas depende de esforço manual e de pessoas específicas. É quando o problema ainda é barato de resolver.',
    };
  }
  return {
    zone: 'saudavel',
    label: 'Operação em bom estado',
    note: 'A base está organizada. O ganho agora vem de automatizar o que ainda depende de gente.',
  };
}

/** Mensagem que já vai escrita no WhatsApp, para o time abrir a conversa sabendo o resultado. */
export function buildWhatsappMessage(outcome: DiagnosisOutcome): string {
  const tags = [outcome.primary, outcome.secondary]
    .filter((profile): profile is AdLeadProfile => profile !== null)
    .map((profile) => DIAGNOSES[profile].tag)
    .join(' + ');
  return [
    'Oi! Acabei de fazer o diagnóstico no site da Synq.',
    '',
    `Nome: ${outcome.name}`,
    `Perfil: ${SEGMENT_LABELS[outcome.segment]}`,
    `Resultado: ${tags}`,
    `Saúde da operação: ${outcome.healthScore}/100`,
    '',
    'Quero entender como resolver isso na minha operação.',
  ].join('\n');
}
