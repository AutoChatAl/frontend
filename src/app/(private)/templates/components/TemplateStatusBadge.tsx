'use client';
import { CheckCircle2, Clock, XCircle, PauseCircle, Ban, FileEdit, ShieldQuestion } from 'lucide-react';

import Badge from '@/components/Badge';
import type { WaTemplateStatus } from '@/types/WhatsAppOfficial';

const STATUS_CONFIG: Record<WaTemplateStatus, { type: string; text: string; icon: React.ComponentType<{ size: number }> }> = {
  DRAFT: { type: 'neutral', text: 'Rascunho', icon: FileEdit },
  PENDING: { type: 'processing', text: 'Em análise', icon: Clock },
  APPROVED: { type: 'success', text: 'Aprovado', icon: CheckCircle2 },
  REJECTED: { type: 'error', text: 'Reprovado', icon: XCircle },
  PAUSED: { type: 'warning', text: 'Pausado', icon: PauseCircle },
  DISABLED: { type: 'neutral', text: 'Desabilitado', icon: Ban },
  IN_APPEAL: { type: 'processing', text: 'Em recurso', icon: ShieldQuestion },
  PENDING_DELETION: { type: 'neutral', text: 'Excluindo', icon: Clock },
  LIMIT_EXCEEDED: { type: 'warning', text: 'Limite excedido', icon: Ban },
  ARCHIVED: { type: 'neutral', text: 'Arquivado', icon: Ban },
};

export default function TemplateStatusBadge({ status }: { status: WaTemplateStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return <Badge type={config.type} text={config.text} icon={config.icon} />;
}
