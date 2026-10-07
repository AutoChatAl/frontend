import type { BuyerWelcome, RecoveryStep, SalesPlatform } from '@/types/CartRecovery';

export interface PlatformGuide {
  steps: string[];
  codeRequired: boolean;
  codeLabel: string | null;
  codeStep: string | null;
}

export const PLATFORM_GUIDES: Record<SalesPlatform, PlatformGuide> = {
  HOTMART: {
    steps: [
      'Na Hotmart, abra "Ferramentas" e entre na opção de avisos automáticos (aparece como "Webhook").',
      'Cadastre uma nova configuração, cole o endereço copiado e marque os avisos de compra: aprovada, cancelada, reembolsada, abandono de carrinho e boleto ou Pix gerado.',
    ],
    codeRequired: true,
    codeLabel: 'Código de segurança da Hotmart (Hottok)',
    codeStep: 'Na mesma tela da Hotmart, copie o código de segurança (ela chama de "Hottok") e cole aqui.',
  },
  KIWIFY: {
    steps: [
      'Na Kiwify, abra "Configurações" e entre na opção de avisos automáticos (aparece como "Webhooks").',
      'Crie um novo, cole o endereço copiado e marque: carrinho abandonado, pedido pendente (Pix e boleto), pedido pago, reembolso e cancelamento.',
    ],
    codeRequired: false,
    codeLabel: null,
    codeStep: null,
  },
  EDUZZ: {
    steps: [
      'Na Eduzz, abra "Minhas Ferramentas", depois "MyEduzz" e "Notificações".',
      'Cadastre o endereço copiado como um novo aviso de vendas (aparece como "Postback").',
    ],
    codeRequired: false,
    codeLabel: 'Chave da Eduzz (opcional)',
    codeStep: 'Se a Eduzz mostrar uma chave de acesso, copie e cole aqui. Se não aparecer, pode pular.',
  },
  MONETIZZE: {
    steps: [
      'Na Monetizze, abra "Postback" e clique em "Cadastrar Postback".',
      'Cole o endereço copiado e marque as situações de venda: aguardando pagamento, abandono de checkout, finalizada, cancelada e devolvida.',
    ],
    codeRequired: false,
    codeLabel: 'Chave única da Monetizze (opcional)',
    codeStep: 'Se quiser mais segurança, copie a "chave única" que a Monetizze mostra e cole aqui. Pode pular.',
  },
  PERFECTPAY: {
    steps: [
      'Na PerfectPay, abra "Configurações" e depois a opção de avisos automáticos (aparece como "Webhook").',
      'Cole o endereço copiado e salve.',
    ],
    codeRequired: true,
    codeLabel: 'Código de segurança da PerfectPay',
    codeStep: 'Na mesma tela da PerfectPay, copie o código de segurança que aparece e cole aqui.',
  },
};

export const MESSAGE_VARIABLES = ['{first_name}', '{name}', '{product_name}', '{value}', '{checkout_url}'] as const;

export const DEFAULT_CART_STEPS: RecoveryStep[] = [
  {
    delayMinutes: 15,
    messageTemplate:
      'Olá {first_name}, percebi que você começou uma compra do {product_name} mas não finalizou. Posso te ajudar? Conclua aqui: {checkout_url}',
    enabled: true,
  },
  {
    delayMinutes: 60,
    messageTemplate:
      'Oi {first_name}! O {product_name} ainda está esperando por você. Ficou alguma dúvida? É só responder esta mensagem. Para concluir: {checkout_url}',
    enabled: true,
  },
  {
    delayMinutes: 1440,
    messageTemplate:
      'Último lembrete, {first_name}: sua compra do {product_name} ({value}) ainda não foi concluída. Se quiser finalizar, o link é este: {checkout_url}',
    enabled: true,
  },
];

export const DEFAULT_PAYMENT_PENDING_STEPS: RecoveryStep[] = [
  {
    delayMinutes: 30,
    messageTemplate:
      'Oi {first_name}! Vi que você gerou o Pix ou boleto do {product_name}, mas o pagamento ainda não caiu. Se precisar, o link para pagar está aqui: {checkout_url}',
    enabled: true,
  },
  {
    delayMinutes: 720,
    messageTemplate:
      '{first_name}, seu Pix ou boleto do {product_name} ({value}) ainda está esperando pagamento. Lembrando que o Pix vence rápido. Se ele expirou, é só gerar outro por aqui: {checkout_url}',
    enabled: true,
  },
  {
    delayMinutes: 1440,
    messageTemplate:
      'Último lembrete, {first_name}: o pagamento do {product_name} ainda não foi confirmado. Ficou alguma dúvida? Responda esta mensagem que eu te ajudo. Link: {checkout_url}',
    enabled: true,
  },
];

export const DEFAULT_BUYER_WELCOME: BuyerWelcome = {
  enabled: false,
  message:
    'Oi {first_name}! Sua compra do {product_name} foi aprovada. Seja muito bem-vindo(a)! Se tiver qualquer dúvida, é só responder esta mensagem.',
  delayMinutes: 0,
};

export function formatDelay(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'na hora';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }
  const days = Math.floor(minutes / 1440);
  const restHours = Math.floor((minutes % 1440) / 60);
  const dayLabel = days === 1 ? '1 dia' : `${days} dias`;
  return restHours ? `${dayLabel} e ${restHours} h` : dayLabel;
}
