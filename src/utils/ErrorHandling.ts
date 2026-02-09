/**
 * Extrai e trata mensagens de erro de diferentes fontes
 * @param err - O erro capturado
 * @param fallback - Mensagem padrão caso não consiga extrair uma mensagem amigável
 * @returns Mensagem de erro tratada e amigável para o usuário
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const message = err.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Sessão expirada. Faça login novamente.';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'Você não tem permissão para realizar esta ação.';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'Recurso não encontrado.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    if (message.includes('timeout')) {
      return 'Tempo de espera excedido. Tente novamente.';
    }
    if (message.includes('internal server error') || message.includes('500')) {
      return 'Erro no servidor. Tente novamente mais tarde.';
    }
    if (message.includes('bad request') || message.includes('400')) {
      return 'Requisição inválida. Verifique os dados informados.';
    }
    if (message.includes('service unavailable') || message.includes('503')) {
      return 'Serviço temporariamente indisponível. Tente novamente.';
    }

  }

  return fallback;
}
