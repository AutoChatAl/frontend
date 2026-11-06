/**
 * Motivos de falha/ignorado que o backend grava em cada envio (`message_jobs.error`),
 * traduzidos para a tela. Erro desconhecido volta como veio — o worker já grava
 * alguns em português.
 */
export const DISPATCH_ERROR_LABELS: Record<string, string> = {
  NO_PHONE: 'Contato sem telefone.',
  WA_TEMPLATE_REQUIRED: 'A campanha está sem modelo de mensagem.',
  WA_TEMPLATE_NOT_APPROVED: 'O modelo de mensagem não está aprovado na Meta.',
  WA_TEMPLATE_VARIABLE_EMPTY: 'Um campo do modelo de mensagem ficou vazio para este contato — confira o nome do contato e os campos do modelo.',
  WA_MARKETING_OPT_OUT: 'O contato recusou mensagens de marketing.',
  WA_OUTSIDE_SERVICE_WINDOW: 'Fora da janela de 24h de atendimento.',
  WA_MARKETING_LIMIT_REACHED: 'A Meta limitou mensagens de marketing para este número (131049).',
  WA_UNDELIVERABLE: 'O número não pode receber a mensagem: sem WhatsApp ou indisponível (131026).',
  WA_BILLING_ISSUE: 'Problema de pagamento na conta da Meta (131042).',
  WA_RATE_LIMITED: 'Limite de envio da Meta atingido. Tente novamente mais tarde.',
  UNSUPPORTED_CHANNEL: 'O tipo de canal não tem suporte para campanhas.',
  NO_IG_SCOPED_ID: 'O contato nunca conversou com esta conta do Instagram.',
  NO_RECURRING_OPTIN: 'O contato não aceitou receber notificações no Instagram.',
  RECURRING_TOKEN_EXPIRED: 'A autorização do contato no Instagram expirou.',
};

/**
 * Códigos da Meta que chegaram gravados crus (envios anteriores ao motivo próprio) ganham
 * a mesma explicação, para a tela não mostrar só o texto em inglês da Graph API.
 */
const GRAPH_CODE_HINTS: Record<string, string> = {
  131008: 'um campo do modelo ficou vazio, normalmente porque o contato está sem nome para preencher {{nome}}',
};

export function describeDispatchError(error: string): string {
  const known = DISPATCH_ERROR_LABELS[error];
  if (known)
    return known;
  const graph = error.match(/^WA_GRAPH_ERROR_(\w+)(?::\s*(.*))?$/);
  if (graph) {
    const [, code = '', detail] = graph;
    const hint = GRAPH_CODE_HINTS[code];
    if (hint)
      return `Erro da Meta (${code}): ${hint}.`;
    return `Erro da Meta (${code})${detail ? `: ${detail}` : ''}`;
  }
  return error;
}
