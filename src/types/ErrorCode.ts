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
  | 'INSTAGRAM_INSTANCE_LIMIT_EXCEEDED'
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
  | 'WHATSAPP_INSTANCE_LIMIT_EXCEEDED'
  | 'CONTACT_NOT_FOUND'
  | 'CONTACT_IDENTITY_MISSING'
  | 'CONTACT_INVALID_PHONE'
  | 'CONTACT_SEND_FAILED'
  | 'GROUP_NOT_FOUND'
  | 'GROUP_NOT_MANUAL'
  | 'GROUP_CONTACTS_LIMIT_EXCEEDED'
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_NO_CONTACTS'
  | 'CAMPAIGN_RUN_FAILED'
  | 'CAMPAIGN_LIMIT_EXCEEDED'
  | 'CAMPAIGN_CONTACTS_LIMIT_EXCEEDED'
  | 'AUTO_REPLY_NOT_FOUND'
  | 'AUTO_REPLY_CREATE_FAILED'
  | 'AUTO_REPLY_UPDATE_FAILED'
  | 'AUTO_REPLY_DELETE_FAILED'
  | 'AUTO_REPLY_TOGGLE_FAILED'
  | 'AUTO_REPLY_LIMIT_EXCEEDED'
  | 'COMMENT_AUTOMATION_LIMIT_EXCEEDED'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'WEBHOOK_VERIFICATION_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export const ERROR_MESSAGES: Record<ErrorReason, string> = {
  UNAUTHORIZED: 'Sessao expirada. Faca login novamente.',
  TOKEN_MISSING: 'Sessao expirada. Faca login novamente.',
  TOKEN_INVALID: 'Sessao invalida. Faca login novamente.',
  TOKEN_EXPIRED: 'Sessao expirada. Faca login novamente.',
  FORBIDDEN: 'Voce nao tem permissao para realizar esta acao.',
  EMAIL_ALREADY_EXISTS: 'Este e-mail ja esta cadastrado.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  USER_NOT_FOUND: 'Usuario nao encontrado.',
  USER_WITHOUT_WORKSPACE: 'Usuario nao pertence a nenhum workspace.',

  NOT_FOUND: 'Recurso nao encontrado.',
  VALIDATION_ERROR: 'Dados invalidos. Verifique os campos informados.',
  INTERNAL_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',

  CHANNEL_NOT_FOUND: 'Canal nao encontrado.',
  CHANNEL_NOT_CONNECTED: 'Canal nao esta conectado.',
  CHANNEL_PROVIDER_MISMATCH: 'Provedor do canal incompativel.',
  CHANNEL_MISSING_CREDENTIALS: 'Credenciais do canal ausentes.',
  CHANNEL_DELETE_FAILED: 'Falha ao deletar canal.',

  INSTAGRAM_TOKEN_EXPIRED: 'Token do Instagram expirado. Reconecte a conta.',
  INSTAGRAM_SEND_FAILED: 'Falha ao enviar mensagem no Instagram.',
  INSTAGRAM_OPTIN_SEND_FAILED: 'Falha ao enviar solicitacao de opt-in.',
  INSTAGRAM_CONVERSATIONS_FAILED: 'Falha ao carregar conversas do Instagram.',
  INSTAGRAM_SYNC_FAILED: 'Falha ao sincronizar contatos do Instagram.',
  INSTAGRAM_CONNECT_FAILED: 'Falha ao conectar conta do Instagram.',
  INSTAGRAM_OAUTH_MISSING_PARAMS: 'Parametros de autenticacao do Instagram ausentes.',
  INSTAGRAM_INSTANCE_LIMIT_EXCEEDED: 'Limite de contas Instagram atingido. Remova uma conta existente para adicionar outra.',

  RECURRING_NOTIFICATION_TOKEN_INVALID: 'Token de notificacao recorrente invalido.',
  RECURRING_NOTIFICATION_TOKEN_EXPIRED: 'Token de notificacao recorrente expirado.',
  NO_RECURRING_OPTIN: 'Contato nao aceitou receber notificacoes recorrentes.',

  WHATSAPP_ENV_MISSING: 'Configuracao do WhatsApp ausente no servidor.',
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
  WHATSAPP_INSTANCE_LIMIT_EXCEEDED: 'Limite de instancias WhatsApp atingido. Remova uma instancia existente para adicionar outra.',

  CONTACT_NOT_FOUND: 'Contato nao encontrado.',
  CONTACT_IDENTITY_MISSING: 'Contato nao possui identidade neste canal.',
  CONTACT_INVALID_PHONE: 'Telefone do contato invalido.',
  CONTACT_SEND_FAILED: 'Falha ao enviar mensagem para o contato.',

  GROUP_NOT_FOUND: 'Grupo nao encontrado.',
  GROUP_NOT_MANUAL: 'Operacao disponivel apenas para grupos manuais.',
  GROUP_CONTACTS_LIMIT_EXCEEDED: 'Limite de contatos por grupo atingido. Maximo permitido: 250 contatos.',

  CAMPAIGN_NOT_FOUND: 'Campanha nao encontrada.',
  CAMPAIGN_NO_CONTACTS: 'Campanha nao possui contatos.',
  CAMPAIGN_RUN_FAILED: 'Falha ao executar campanha.',
  CAMPAIGN_LIMIT_EXCEEDED: 'Limite de campanhas atingido. Voce ja possui o maximo de campanhas permitidas no seu plano. Exclua uma campanha existente para criar uma nova.',
  CAMPAIGN_CONTACTS_LIMIT_EXCEEDED: 'Limite de contatos por campanha atingido. Maximo permitido: 250 contatos.',

  AUTO_REPLY_NOT_FOUND: 'Resposta automatica nao encontrada.',
  AUTO_REPLY_CREATE_FAILED: 'Falha ao criar resposta automatica.',
  AUTO_REPLY_UPDATE_FAILED: 'Falha ao atualizar resposta automatica.',
  AUTO_REPLY_DELETE_FAILED: 'Falha ao deletar resposta automatica.',
  AUTO_REPLY_TOGGLE_FAILED: 'Falha ao alternar resposta automatica.',
  AUTO_REPLY_LIMIT_EXCEEDED: 'Limite de respostas automaticas atingido. Exclua uma resposta existente para criar uma nova.',

  COMMENT_AUTOMATION_LIMIT_EXCEEDED: 'Limite de automacoes de comentario atingido. Exclua uma automacao existente para criar uma nova.',

  WEBHOOK_SIGNATURE_INVALID: 'Assinatura do webhook invalida.',
  WEBHOOK_VERIFICATION_FAILED: 'Verificacao do webhook falhou.',

  NETWORK_ERROR: 'Erro de conexao. Verifique sua internet.',
  UNKNOWN: 'Erro desconhecido. Tente novamente.',
};

export function getErrorMessage(reason?: string): string {
  if (!reason) return ERROR_MESSAGES.UNKNOWN;
  return ERROR_MESSAGES[reason as ErrorReason] || ERROR_MESSAGES.UNKNOWN;
}
