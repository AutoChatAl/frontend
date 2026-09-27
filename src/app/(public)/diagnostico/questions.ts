import type { AdLeadSegment } from '@/types/AdLead';

import type { ChoiceStep, InputStep, Step } from './types';

/*
 * Roteiro do diagnóstico. `**texto**` vira negrito no balão; `{primeiro}` é
 * trocado pelo nome que a pessoa digitou.
 *
 * A primeira pergunta separa três públicos: o infoprodutor/criador, que busca
 * engajamento e venda pelas redes; a empresa que atende no WhatsApp e no
 * Instagram; e quem é as duas coisas. Cada um segue por um caminho curto —
 * a página existe para levar o lead ao WhatsApp.
 *
 * Toda opção tem uma `reaction`: a resposta do Synq que liga aquele problema ao
 * que o produto resolve. Elas só citam o que existe de verdade na plataforma.
 * Os pontos somam no perfil que a opção indica (ver diagnosis.ts).
 */

const PROFILE_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'perfil',
  label: 'Seu negócio',
  question: 'Pra começar: o que melhor descreve você?',
  options: [
    {
      label: 'Infoprodutor ou criador de conteúdo',
      segment: 'infoprodutor',
      instagram: true,
      reaction: 'Boa! O Synq transforma comentário, story e live em conversa no Direct — é ali que o criador ganha engajamento e vende.',
    },
    {
      label: 'Os dois: crio conteúdo e tenho uma empresa',
      segment: 'ambos',
      instagram: true,
      reaction: 'Combinação poderosa: o conteúdo atrai e a empresa vende. O Synq junta as duas pontas — comentário, Direct e WhatsApp no mesmo painel.',
    },
    {
      label: 'Loja ou e-commerce',
      segment: 'loja',
      reaction: 'Perfeito. Loja vende no detalhe do atendimento, e é aí que o Synq entra: WhatsApp e Instagram respondidos na hora, num lugar só.',
    },
    {
      label: 'Prestador de serviço (clínica, escritório, agência…)',
      segment: 'servico',
      reaction: 'Perfeito. Em serviço, cada mensagem é um orçamento ou um agendamento — e o Synq garante que nenhuma fique sem resposta.',
    },
    {
      label: 'Outro tipo de negócio',
      segment: 'outro',
      reaction: 'Beleza. Vou entender como você atende hoje para te mostrar onde o Synq faz diferença.',
    },
  ],
};

const AUDIENCE_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'audiencia',
  label: 'Tamanho da audiência',
  question: 'Qual o tamanho da sua audiência no Instagram?',
  options: [
    {
      label: 'Até 10 mil seguidores',
      points: { engajamento: 3 },
      reaction: 'Fase ótima para crescer: cada comentário conta. Com o Synq, o "comenta QUERO que eu te mando" faz o post ganhar interação e ainda gera contato.',
    },
    {
      label: 'De 10 mil a 50 mil',
      points: { engajamento: 2, instagram: 1 },
      reaction: 'Nesse tamanho o Direct começa a lotar. O Synq responde por você e entrega o link enquanto o interesse ainda está quente.',
    },
    {
      label: 'De 50 mil a 200 mil',
      points: { instagram: 2, manual: 2 },
      reaction: 'Com essa audiência, responder na mão já não fecha a conta. O Synq responde cada comentário e cada Direct sozinho, sem fila.',
    },
    {
      label: 'Mais de 200 mil',
      points: { instagram: 2, manual: 3 },
      reaction: 'Com essa audiência, cada post vira centenas de conversas. O Synq responde todas sozinho, sem equipe virando a noite.',
    },
  ],
};

const CHANNELS_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'canais',
  label: 'Canais de venda',
  question: 'Por onde sua empresa mais **vende ou atende clientes** hoje?',
  options: [
    {
      label: 'WhatsApp e Instagram, os dois',
      points: { desorganizado: 2, instagram: 2 },
      instagram: true,
      reaction: 'Dois canais, duas caixas de entrada. No Synq, WhatsApp e Instagram ficam no mesmo painel — nenhuma conversa se perde no caminho.',
    },
    {
      label: 'Principalmente pelo WhatsApp',
      points: { desorganizado: 1, manual: 1 },
      instagram: false,
      reaction: 'Anotado. O Synq conecta o seu WhatsApp e responde por você, com o histórico de cada cliente à vista.',
    },
    {
      label: 'Principalmente pelo Instagram',
      points: { instagram: 3 },
      instagram: true,
      reaction: 'Anotado. No Synq, Direct e comentários são respondidos automaticamente — e quem comenta recebe o link na hora.',
    },
    {
      label: 'Ainda vendo pouco por esses canais',
      points: { manual: 1 },
      instagram: false,
      reaction: 'Anotado. Começar com automação desde cedo faz cada conversa que chega virar oportunidade.',
    },
  ],
};

const TEAM_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'equipe',
  label: 'Tamanho da equipe',
  question: 'Quantas pessoas respondem clientes?',
  options: [
    {
      label: 'Só eu',
      points: { manual: 3 },
      reaction: 'Então cada minuto respondendo a mesma pergunta é um minuto a menos cuidando do negócio. O Synq assume as respostas repetidas por você.',
    },
    {
      label: '2 a 5 pessoas',
      points: { desorganizado: 2, manual: 1 },
      reaction: 'Com mais de uma pessoa, o risco é duas responderem o mesmo cliente — ou nenhuma. No Synq cada conversa tem um responsável.',
    },
    {
      label: '6 a 15 pessoas',
      points: { desorganizado: 3, manual: 2 },
      reaction: 'Com esse time, organização vale ouro. No Synq cada conversa tem responsável e você acompanha tudo num painel só.',
    },
    {
      label: 'Mais de 15 pessoas',
      points: { desorganizado: 3, manual: 3, ferramenta: 1 },
      reaction: 'Com esse time, cada minuto de processo manual vira custo multiplicado por 15. O Synq automatiza o repetitivo e leva o resto para a pessoa certa.',
    },
  ],
};

// Todos os caminhos passam por aqui: é o que diz de onde a pessoa parte.
const AUTOMATION_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'automacao',
  label: 'Experiência com automação',
  question: 'Você já usou alguma **automação** no Instagram ou no WhatsApp?',
  options: [
    {
      label: 'Nunca usei, faço tudo na mão',
      points: { manual: 4 },
      reaction: 'Então tem muito tempo para ganhar de volta. No Synq você cria uma automação sem programar: escolhe a palavra-chave, escreve a resposta e pronto.',
    },
    {
      label: 'Só as respostas rápidas do app',
      points: { manual: 3 },
      reaction: 'Resposta rápida ainda depende de alguém apertar o botão. No Synq a resposta sai sozinha, a qualquer hora — até de madrugada.',
    },
    {
      label: 'Já usei, mas parei ou não funcionou',
      points: { ferramenta: 3, manual: 1 },
      reaction: 'Acontece muito: ferramenta difícil de configurar ou que só resolvia metade. No Synq o fluxo é montado arrastando blocos, com WhatsApp e Instagram no mesmo painel.',
    },
    {
      label: 'Uso uma ferramenta de automação hoje',
      points: { ferramenta: 4 },
      reaction: 'Ótimo, você já sabe o valor disso. Vou ver se a sua ferramenta está entregando tudo o que poderia.',
    },
  ],
};

const COMMENTS_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'comentarios',
  label: 'Comentários e Direct',
  question: 'Quando alguém comenta num post, reels ou live **pedindo o link**, o que acontece?',
  options: [
    {
      label: 'Respondo um por um, quando dá tempo',
      points: { manual: 3, instagram: 2 },
      reaction: 'No Synq isso acontece sozinho: quem comenta a palavra-chave recebe uma resposta no post e o link no Direct, na hora.',
    },
    {
      label: 'Peço pra chamar no Direct e mando na mão',
      points: { manual: 3, instagram: 3 },
      reaction: 'Cada "me chama no Direct" é um passo a mais — e muita gente desiste nele. Com o Synq o link chega no Direct sem a pessoa precisar fazer nada.',
    },
    {
      label: 'Muita gente fica sem resposta',
      points: { instagram: 5 },
      reaction: 'Cada comentário sem resposta é alguém que levantou a mão para comprar. Com o Synq ninguém fica sem retorno — nem nos posts, nem nas lives.',
    },
    {
      label: 'Quase ninguém comenta',
      points: { engajamento: 5 },
      reaction: 'Dá para virar isso: com "comenta QUERO que eu te mando o link", o seguidor ganha um motivo para comentar — e o Synq entrega o link no Direct na hora.',
    },
    {
      label: 'Já tenho automação que manda o link',
      points: { ferramenta: 2 },
      reaction: 'Bom começo. No Synq a mesma lógica vale para lives e stories, e cada pessoa pode seguir para o seu funil com etiqueta.',
    },
  ],
};

const GOAL_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'objetivo',
  label: 'Seu objetivo agora',
  question: 'E qual é o seu **principal objetivo** nas redes agora?',
  options: [
    {
      label: 'Mais engajamento: comentários, alcance e seguidores',
      points: { engajamento: 6 },
      reaction: 'Anotado. Automação de comentários é uma das formas mais diretas de fazer o post gerar conversa — já te mostro como.',
    },
    {
      label: 'Transformar seguidores em leads',
      points: { instagram: 5, engajamento: 1 },
      reaction: 'Anotado. No Synq, quem comenta ou responde um story vira contato, com etiqueta e histórico da conversa.',
    },
    {
      label: 'Vender mais no lançamento ou no perpétuo',
      points: { instagram: 6 },
      reaction: 'Anotado. No lançamento, responder rápido é o que separa quem compra de quem esquece — e o Synq responde na hora.',
    },
    {
      label: 'Atender alunos e seguidores sem virar refém do Direct',
      points: { manual: 6 },
      reaction: 'Anotado. A IA do Synq tira dúvidas com base no que você ensinar e só chama você quando precisa.',
    },
  ],
};

const PAIN_STEP: ChoiceStep = {
  kind: 'choice',
  key: 'dor',
  label: 'Maior problema hoje',
  question: 'E qual é o **maior problema** do seu atendimento?',
  options: [
    {
      label: 'Demora para responder, cliente fica esperando',
      points: { desorganizado: 3, manual: 3 },
      reaction: 'Quem responde primeiro costuma levar a venda. Com o Synq, a primeira resposta sai em segundos, a qualquer hora.',
    },
    {
      label: 'Mensagem ou comentário esquecido, cliente sem retorno',
      points: { desorganizado: 6 },
      reaction: 'No Synq toda conversa fica num painel só, com responsável e situação — nada cai no esquecimento.',
    },
    {
      label: 'Não sei o que minha equipe está fazendo',
      points: { desorganizado: 6 },
      reaction: 'No Synq você vê cada atendimento, quem está cuidando dele e o que ainda falta responder.',
    },
    {
      label: 'Muita tarefa manual e repetitiva',
      points: { manual: 7 },
      reaction: 'É exatamente o que o Synq automatiza: respostas por palavra-chave, IA que tira dúvidas e lembrete de agendamento.',
    },
    {
      label: 'Muita gente comenta e pergunta, mas pouca gente compra',
      points: { instagram: 8 },
      instagramOnly: true,
      reaction: 'O Synq manda o link no Direct de quem comenta e leva cada pessoa para o seu funil — o interesse vira conversa de venda.',
    },
    {
      label: 'A ferramenta que uso não resolve',
      points: { ferramenta: 7 },
      reaction: 'Você não está sozinho nessa. No resultado te mostro o que muda com o Synq.',
    },
  ],
};

/**
 * Caminho de cada público depois da primeira pergunta. Quem é criador e empresa
 * ao mesmo tempo responde o essencial dos dois: audiência e comentários do lado
 * do conteúdo, equipe e maior problema do lado do atendimento.
 */
const PATHS: Record<'criador' | 'empresa' | 'ambos', ChoiceStep[]> = {
  criador: [AUDIENCE_STEP, AUTOMATION_STEP, COMMENTS_STEP, GOAL_STEP],
  empresa: [CHANNELS_STEP, TEAM_STEP, AUTOMATION_STEP, PAIN_STEP],
  ambos: [AUDIENCE_STEP, TEAM_STEP, AUTOMATION_STEP, COMMENTS_STEP, PAIN_STEP],
};

function pathFor(segment?: AdLeadSegment): ChoiceStep[] {
  if (segment === 'infoprodutor') return PATHS.criador;
  if (segment === 'ambos') return PATHS.ambos;
  return PATHS.empresa;
}

export const INTRO_MESSAGE =
  'A maioria das empresas e criadores perde vendas e engajamento no Instagram e no WhatsApp sem saber onde. Responda **algumas perguntas rápidas** — leva 1 minuto — e eu te mostro onde está o seu e como resolver.';

export const ANALYZING_ITEMS = ['Perfil e canais', 'Nível de automação', 'Gargalos identificados'];

export const CLOSING_MESSAGE = 'Pronto, {primeiro}. Aqui está o seu diagnóstico — e como o Synq resolve cada ponto.';

const CONTACT_STEPS: InputStep[] = [
  {
    kind: 'input',
    key: 'name',
    label: 'Seu nome',
    question: 'Seu diagnóstico está pronto. Como você se chama?',
    placeholder: 'Seu nome',
    inputType: 'text',
    autoComplete: 'name',
    maxLength: 120,
    validate: (value) => value.length >= 2,
    error: 'Informe seu nome.',
  },
  {
    kind: 'input',
    key: 'whatsapp',
    label: 'WhatsApp',
    question: 'Prazer, {primeiro}! Qual o seu WhatsApp com DDD?',
    placeholder: '(00) 00000-0000',
    inputType: 'tel',
    autoComplete: 'tel-national',
    maxLength: 15,
    validate: (value) => {
      const digits = value.replace(/\D/g, '').length;
      return digits === 10 || digits === 11;
    },
    error: 'Informe um número com DDD.',
    requiresConsent: true,
  },
];

interface SequenceContext {
  segment?: AdLeadSegment;
  instagram: boolean;
}

/**
 * Ordem completa das perguntas para as respostas dadas até agora. O caminho é
 * decidido na primeira pergunta, então as posições já respondidas nunca mudam
 * quando a lista é recalculada.
 */
export function buildSequence({ segment, instagram }: SequenceContext): Step[] {
  const choiceSteps = [PROFILE_STEP, ...pathFor(segment)].map((step) =>
    instagram ? step : { ...step, options: step.options.filter((option) => !option.instagramOnly) },
  );
  return [...choiceSteps, ...CONTACT_STEPS];
}

/** Máscara do WhatsApp com DDD: (00) 0000-0000 ou (00) 00000-0000. */
export function formatLocalPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
