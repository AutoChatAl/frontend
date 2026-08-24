import { MessageCircle, MessageSquare, type LucideIcon } from 'lucide-react';

import type { WorkspaceChannelType } from '@/hooks/WorkspaceChannelsHook';
import type { AutoReply } from '@/types/AutoReply';
import type { CommentAutomation } from '@/types/CommentAutomation';

/**
 * As duas automações moram na mesma tela mas vêm de coleções e serviços
 * diferentes. Esta união é o mínimo que a listagem precisa saber para ordenar,
 * filtrar e decidir qual modal abrir — o resto fica dentro de `rule`.
 */
export type AutomationKind = 'DM' | 'COMMENT';

export type AutomationRow =
  | {
    kind: 'DM';
    id: string;
    channelId: string;
    channelType: WorkspaceChannelType;
    enabled: boolean;
    createdAt: string;
    rule: AutoReply;
  }
  | {
    kind: 'COMMENT';
    id: string;
    channelId: string;
    /** Automação de comentário só existe no Instagram. */
    channelType: 'INSTAGRAM';
    enabled: boolean;
    createdAt: string;
    rule: CommentAutomation;
  };

export const KIND_META: Record<AutomationKind, {
  label: string;
  plural: string;
  icon: LucideIcon;
  chip: string;
  tile: string;
}> = {
  DM: {
    label: 'Mensagem direta',
    plural: 'DMs',
    icon: MessageCircle,
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    tile: 'text-indigo-600 dark:text-indigo-400',
  },
  COMMENT: {
    label: 'Comentário',
    plural: 'Comentários',
    icon: MessageSquare,
    chip: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300',
    tile: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
};

export const CHANNEL_TYPE_LABEL: Record<WorkspaceChannelType, string> = {
  WHATSAPP: 'WhatsApp',
  WHATSAPP_OFFICIAL: 'API Oficial',
  INSTAGRAM: 'Instagram',
};

export const MATCH_MODE_LABELS: Record<string, string> = {
  CONTAINS: 'Contém',
  EXACT: 'Exata',
  STARTS_WITH: 'Começa com',
};

/** Rótulos curtos do que a resposta carrega além do texto. */
export const REPLY_EXTRA_LABEL = {
  audio: 'Áudio',
  image: 'Imagem',
  document: 'Documento',
} as const;

export function hasAudio(replyType: string): boolean {
  return ['AUDIO', 'TEXT_AND_AUDIO', 'IMAGE_AND_AUDIO', 'DOCUMENT_AND_AUDIO'].includes(replyType);
}

export function hasImage(replyType: string): boolean {
  return ['IMAGE', 'TEXT_AND_IMAGE', 'IMAGE_AND_AUDIO'].includes(replyType);
}

export function hasDocument(replyType: string): boolean {
  return ['DOCUMENT', 'TEXT_AND_DOCUMENT', 'DOCUMENT_AND_AUDIO'].includes(replyType);
}

export function hasText(replyType: string): boolean {
  return ['TEXT', 'TEXT_AND_AUDIO', 'TEXT_AND_IMAGE', 'TEXT_AND_DOCUMENT'].includes(replyType);
}

export function toDmRow(rule: AutoReply): AutomationRow {
  return {
    kind: 'DM',
    id: rule.id,
    channelId: rule.channelId,
    channelType: rule.channelType,
    enabled: rule.enabled,
    createdAt: rule.createdAt,
    rule,
  };
}

export function toCommentRow(rule: CommentAutomation): AutomationRow {
  return {
    kind: 'COMMENT',
    id: rule.id,
    channelId: rule.channelId,
    channelType: 'INSTAGRAM',
    enabled: rule.enabled,
    createdAt: rule.createdAt,
    rule,
  };
}
