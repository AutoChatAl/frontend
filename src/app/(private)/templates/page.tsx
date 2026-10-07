'use client';
import { LayoutTemplate, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import TemplateBuilderModal from '@/app/(private)/templates/components/TemplateBuilderModal';
import TemplateStatusBadge from '@/app/(private)/templates/components/TemplateStatusBadge';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import { SkeletonPage, SkeletonTable } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { templateService } from '@/services/template.service';
import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import type { WhatsAppOfficialInstance, WhatsAppTemplate } from '@/types/WhatsAppOfficial';

const CATEGORY_BADGE: Record<string, { type: string; text: string }> = {
  MARKETING: { type: 'instagram', text: 'Marketing' },
  UTILITY: { type: 'processing', text: 'Utilidade' },
  AUTHENTICATION: { type: 'group', text: 'Autenticação' },
};

const EDITABLE_STATUSES = ['APPROVED', 'REJECTED', 'PAUSED', 'DRAFT'];

export default function TemplatesPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<WhatsAppOfficialInstance[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const loadData = useCallback(async (channelId?: string) => {
    try {
      const [channelList, templateList] = await Promise.all([
        // Acessório: serve só o filtro por número. Quem tem `campaigns` sem
        // `whatsapp-official` continua vendo a lista de templates.
        whatsappOfficialService.getInstances().catch(() => []),
        templateService.list(channelId || undefined),
      ]);
      setChannels(channelList);
      setTemplates(templateList);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível carregar os modelos de mensagem.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChannelFilter = (channelId: string) => {
    setSelectedChannelId(channelId);
    setLoading(true);
    loadData(channelId || undefined);
  };

  const handleSync = async () => {
    const targets = selectedChannelId ? channels.filter((c) => c.id === selectedChannelId) : channels;
    if (targets.length === 0) {
      addToast('error', 'Conecte um número do WhatsApp Oficial antes de atualizar.');
      return;
    }
    setSyncing(true);
    try {
      const results = await Promise.all(targets.map((c) => templateService.sync(c.id)));
      const total = results.reduce((acc, r) => acc + r.synced, 0);
      addToast('success', `${total} ${total === 1 ? 'modelo de mensagem atualizado' : 'modelos de mensagem atualizados'} com a Meta${targets.length > 1 ? ` (${targets.length} números)` : ''}.`);
      await loadData(selectedChannelId || undefined);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível atualizar com a Meta. Tente de novo em alguns instantes.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await templateService.remove(deleteTarget.id);
      addToast('success', 'Modelo de mensagem excluído.');
      await loadData(selectedChannelId || undefined);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível excluir o modelo de mensagem.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const channelOptions = useMemo(() => ([
    { value: '', label: 'Todos os números' },
    ...channels.map((c) => ({
      value: c.id,
      label: c.whatsappOfficial.verifiedName || c.whatsappOfficial.displayPhoneNumber || c.name,
    })),
  ]), [channels]);

  const channelLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of channels) {
      map.set(c.id, c.whatsappOfficial.verifiedName || c.whatsappOfficial.displayPhoneNumber || c.name);
    }
    return map;
  }, [channels]);

  const bodyPreview = (template: WhatsAppTemplate): string => {
    const body = template.components.find((c) => c.type === 'BODY');
    const text = body?.text ?? '';
    return text.length > 90 ? `${text.slice(0, 90)}...` : text;
  };

  if (loading && templates.length === 0 && channels.length === 0) {
    return <SkeletonPage><SkeletonTable rows={6} columns={4}/></SkeletonPage>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Modelos de mensagem</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Textos prontos do WhatsApp Oficial. Você cria aqui, a Meta aprova e depois eles podem chamar seus clientes a qualquer momento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />} onClick={handleSync} disabled={syncing || channels.length === 0}>
            Atualizar com a Meta
          </Button>
          <Button icon={<Plus size={16} />} onClick={() => { setEditingTemplate(null); setBuilderOpen(true); }} disabled={channels.length === 0}>
            Novo modelo
          </Button>
        </div>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate size={56} />}
          title="Conecte o WhatsApp Oficial para criar modelos de mensagem"
          description="Modelos de mensagem são textos aprovados pela Meta. Eles são obrigatórios para enviar campanhas e para chamar clientes que não falam com você há mais de 24h pelo WhatsApp Oficial."
          action={{ label: 'Conectar WhatsApp Oficial', onClick: () => router.push('/channels') }}
        />
      ) : (
        <>
          {channels.length > 1 && (
            <div className="max-w-xs">
              <Dropdown label="Filtrar por número" options={channelOptions} value={selectedChannelId} onChange={handleChannelFilter} />
            </div>
          )}

          {templates.length === 0 ? (
            <EmptyState
              icon={<LayoutTemplate size={56} />}
              title="Nenhum modelo de mensagem ainda"
              description="Crie seu primeiro modelo ou clique em Atualizar com a Meta para trazer os que você já tem lá."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((template) => {
                const categoryBadge = CATEGORY_BADGE[template.category] ?? { type: 'neutral', text: template.category };
                const canEdit = EDITABLE_STATUSES.includes(template.status);
                return (
                  <Card key={template.id} className="p-5 flex flex-col gap-3 group relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-white truncate">{template.name}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {template.language}
                          {channels.length > 1 && channelLabelById.get(template.channelId) && (
                            <> · {channelLabelById.get(template.channelId)}</>
                          )}
                        </p>
                      </div>
                      <TemplateStatusBadge status={template.status} />
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap min-h-10">{bodyPreview(template)}</p>

                    {template.status === 'REJECTED' && template.rejectionReason && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg px-3 py-2">
                        Motivo da reprovação: {template.rejectionReason}. Corrija e reenvie.
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                      <Badge type={categoryBadge.type} text={categoryBadge.text} />
                      {template.qualityScore && template.qualityScore !== 'UNKNOWN' && (
                        <Badge type={template.qualityScore === 'GREEN' ? 'success' : template.qualityScore === 'RED' ? 'error' : 'warning'} text={`Qualidade ${template.qualityScore === 'GREEN' ? 'alta' : template.qualityScore === 'RED' ? 'baixa' : 'média'}`} />
                      )}
                    </div>

                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-slate-800/90 rounded-lg p-0.5">
                      {canEdit && (
                        <IconButton icon={<Pencil size={15} />} variant="primary" title="Editar" onClick={() => { setEditingTemplate(template); setBuilderOpen(true); }} />
                      )}
                      <IconButton icon={<Trash2 size={15} />} variant="danger" title="Excluir" onClick={() => setDeleteTarget(template)} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <TemplateBuilderModal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSaved={() => loadData(selectedChannelId || undefined)}
        channels={channels}
        defaultChannelId={selectedChannelId || channels[0]?.id || ''}
        editing={editingTemplate}
        onError={(message) => addToast('error', message)}
        onSuccess={(message) => addToast('success', message)}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir modelo de mensagem"
        message={`Excluir o modelo "${deleteTarget?.name}"? Ele também será removido da sua conta na Meta.`}
        confirmLabel="Excluir"
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
