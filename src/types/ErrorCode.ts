export type ErrorReason =
  | 'UNAUTHORIZED'
  | 'TOKEN_MISSING'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_WITHOUT_WORKSPACE'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'CHANNEL_NOT_FOUND'
  | 'CHANNEL_NOT_CONNECTED'
  | 'CHANNEL_PROVIDER_MISMATCH'
  | 'CHANNEL_MISSING_CREDENTIALS'
  | 'CHANNEL_DELETE_FAILED'
  | 'INSTAGRAM_TOKEN_EXPIRED'
  | 'INSTAGRAM_SEND_FAILED'
  | 'INSTAGRAM_OPTIN_SEND_FAILED'
  | 'INSTAGRAM_CONVERSATIONS_FAILED'
  | 'INSTAGRAM_SYNC_FAILED'
  | 'INSTAGRAM_CONNECT_FAILED'
  | 'INSTAGRAM_OAUTH_MISSING_PARAMS'
  | 'RECURRING_NOTIFICATION_TOKEN_INVALID'
  | 'RECURRING_NOTIFICATION_TOKEN_EXPIRED'
  | 'NO_RECURRING_OPTIN'
  | 'WHATSAPP_ENV_MISSING'
  | 'WHATSAPP_CONNECT_FAILED'
  | 'WHATSAPP_STATUS_FAILED'
  | 'WHATSAPP_QR_FAILED'
  | 'WHATSAPP_DISCONNECT_FAILED'
  | 'WHATSAPP_WEBHOOK_CONFIG_FAILED'
  | 'WHATSAPP_SEND_FAILED'
  | 'WHATSAPP_DELETE_MSG_FAILED'
  | 'WHATSAPP_MARK_READ_FAILED'
  | 'WHATSAPP_LIST_CONTACTS_FAILED'
  | 'WHATSAPP_LIST_GROUPS_FAILED'
  | 'WHATSAPP_SYNC_FAILED'
  | 'CONTACT_NOT_FOUND'
  | 'CONTACT_IDENTITY_MISSING'
  | 'CONTACT_INVALID_PHONE'
  | 'CONTACT_SEND_FAILED'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_NOT_MANUAL'
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_NO_CONTACTS'
  | 'CAMPAIGN_RUN_FAILED'
  | 'AUTO_REPLY_NOT_FOUND'
  | 'AUTO_REPLY_CREATE_FAILED'
  | 'AUTO_REPLY_UPDATE_FAILED'
  | 'AUTO_REPLY_DELETE_FAILED'
  | 'AUTO_REPLY_TOGGLE_FAILED'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'WEBHOOK_VERIFICATION_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export const ERROR_MESSAGES: Record<ErrorReason, string> = {
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  TOKEN_MISSING: 'Sessão expirada. Faça login novamente.',
  TOKEN_INVALID: 'Sessão inválida. Faça login novamente.',
  TOKEN_EXPIRED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação.',
  EMAIL_ALREADY_EXISTS: 'Este e-mail já está cadastrado.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  USER_WITHOUT_WORKSPACE: 'Usuário não pertence a nenhum workspace.',

  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos informados.',
  INTERNAL_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',

  CHANNEL_NOT_FOUND: 'Canal não encontrado.',
  CHANNEL_NOT_CONNECTED: 'Canal não está conectado.',
  CHANNEL_PROVIDER_MISMATCH: 'Provedor do canal incompatível.',
  CHANNEL_MISSING_CREDENTIALS: 'Credenciais do canal ausentes.',
  CHANNEL_DELETE_FAILED: 'Falha ao deletar canal.',

  INSTAGRAM_TOKEN_EXPIRED: 'Token do Instagram expirado. Reconecte a conta.',
  INSTAGRAM_SEND_FAILED: 'Falha ao enviar mensagem no Instagram.',
  INSTAGRAM_OPTIN_SEND_FAILED: 'Falha ao enviar solicitação de opt-in.',
  INSTAGRAM_CONVERSATIONS_FAILED: 'Falha ao carregar conversas do Instagram.',
  INSTAGRAM_SYNC_FAILED: 'Falha ao sincronizar contatos do Instagram.',
  INSTAGRAM_CONNECT_FAILED: 'Falha ao conectar conta do Instagram.',
  INSTAGRAM_OAUTH_MISSING_PARAMS: 'Parâmetros de autenticação do Instagram ausentes.',

  RECURRING_NOTIFICATION_TOKEN_INVALID: 'Token de notificação recorrente inválido.',
  RECURRING_NOTIFICATION_TOKEN_EXPIRED: 'Token de notificação recorrente expirado.',
  NO_RECURRING_OPTIN: 'Contato não aceitou receber notificações recorrentes.',

  WHATSAPP_ENV_MISSING: 'Configuração do WhatsApp ausente no servidor.',
  WHATSAPP_CONNECT_FAILED: 'Falha ao conectar WhatsApp.',
  WHATSAPP_STATUS_FAILED: 'Falha ao obter status do WhatsApp.',
  WHATSAPP_QR_FAILED: 'Falha ao obter QR code do WhatsApp.',
  WHATSAPP_DISCONNECT_FAILED: 'Falha ao desconectar WhatsApp.',
  WHATSAPP_WEBHOOK_CONFIG_FAILED: 'Falha ao configurar webhooks do WhatsApp.',
  WHATSAPP_SEND_FAILED: 'Falha ao enviar mensagem no WhatsApp.',
  WHATSAPP_DELETE_MSG_FAILED: 'Falha ao deletar mensagem no WhatsApp.',
  WHATSAPP_MARK_READ_FAILED: 'Falha ao marcar como lido no WhatsApp.',
  WHATSAPP_LIST_CONTACTS_FAILED: 'Falha ao listar contatos do WhatsApp.',
  WHATSAPP_LIST_GROUPS_FAILED: 'Falha ao listar grupos do WhatsApp.',
  WHATSAPP_SYNC_FAILED: 'Falha ao sincronizar contatos do WhatsApp.',

  CONTACT_NOT_FOUND: 'Contato não encontrado.',
  CONTACT_IDENTITY_MISSING: 'Contato não possui identidade neste canal.',
  CONTACT_INVALID_PHONE: 'Telefone do contato inválido.',
  CONTACT_SEND_FAILED: 'Falha ao enviar mensagem para o contato.',

  GROUP_NOT_FOUND: 'Grupo não encontrado.',
  GROUP_NOT_MANUAL: 'Operação disponível apenas para grupos manuais.',

  CAMPAIGN_NOT_FOUND: 'Campanha não encontrada.',
  CAMPAIGN_NO_CONTACTS: 'Campanha não possui contatos.',
  CAMPAIGN_RUN_FAILED: 'Falha ao executar campanha.',

  AUTO_REPLY_NOT_FOUND: 'Resposta automática não encontrada.',
  AUTO_REPLY_CREATE_FAILED: 'Falha ao criar resposta automática.',
  AUTO_REPLY_UPDATE_FAILED: 'Falha ao atualizar resposta automática.',
  AUTO_REPLY_DELETE_FAILED: 'Falha ao deletar resposta automática.',
  AUTO_REPLY_TOGGLE_FAILED: 'Falha ao alternar resposta automática.',

  WEBHOOK_SIGNATURE_INVALID: 'Assinatura do webhook inválida.',
  WEBHOOK_VERIFICATION_FAILED: 'Verificação do webhook falhou.',

  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNKNOWN: 'Erro desconhecido. Tente novamente.',
};

export function getErrorMessage(reason?: string): string {
  if (!reason) return ERROR_MESSAGES.UNKNOWN;
  return ERROR_MESSAGES[reason as ErrorReason] || ERROR_MESSAGES.UNKNOWN;
}
