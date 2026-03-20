'use client';

import {
  AlertCircle,
  MessageCircle,
  Mic,
  Pencil,
  Plus,
  Reply,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import CreateAutoReplyModal from './components/CreateAutoReplyModal';
import EditAutoReplyModal from './components/EditAutoReplyModal';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleSwitch from '@/components/ToggleSwitch';
import { autoReplyService } from '@/services/auto-reply.service';
import type { AutoReply } from '@/types/AutoReply';

const MATCH_MODE_LABELS: Record<string, string> = {
  CONTAINS: 'Contém',
  EXACT: 'Exata',
  STARTS_WITH: 'Começa com',
};

export default function AutoRepliesPage() {
  const [rules, setRules] = useState<AutoReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AutoReply | null>(null);
  const [editTarget, setEditTarget] = useState<AutoReply | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await autoReplyService.list();
      const normalized = data.map((r: AutoReply & { _id?: string }) => ({
        ...r,
        id: r.id || r._id || '',
      }));
      setRules(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar auto-respostas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = async (rule: AutoReply) => {
    try {
      await autoReplyService.toggle(rule.id);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)),
      );
      addToast('success', `Auto-resposta ${rule.enabled ? 'desativada' : 'ativada'}`);
    } catch (err) {
      addToast('error', 'Erro ao alterar status da auto-resposta');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await autoReplyService.delete(deleteTarget.id);
      setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      addToast('success', 'Auto-resposta excluída');
    } catch (err) {
      addToast('error', 'Erro ao excluir auto-resposta');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <PageLoader message="Carregando auto-respostas..." />;
  }

  if (error && rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button onClick={fetchRules} size="sm">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Auto-Respostas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Configure respostas automáticas baseadas em palavras-chave
            {rules.length > 0 && (
              <span className="ml-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {rules.length} {rules.length === 1 ? 'regra' : 'regras'}
              </span>
            )}
          </p>
        </div>

        <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
          Nova Auto-Resposta
        </Button>
      </header>

      {rules.length === 0 ? (
        <EmptyState
          icon={<Reply size={22} />}
          title="Nenhuma auto-resposta configurada"
          description="Crie regras para responder automaticamente quando um contato enviar uma palavra-chave."
          action={{
            label: 'Criar primeira regra',
            icon: <Plus size={15} />,
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => {
            const isWA = rule.channelType === 'WHATSAPP';
            return (
              <div
                key={rule.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 transition-all ${
                  !rule.enabled ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isWA ? 'bg-green-100 dark:bg-green-900/30' : 'bg-pink-100 dark:bg-pink-900/30'
                    }`}>
                      <MessageCircle size={18} className={isWA ? 'text-green-600 dark:text-green-400' : 'text-pink-600 dark:text-pink-400'} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge type={isWA ? 'whatsapp' : 'instagram'} text={isWA ? 'WhatsApp' : 'Instagram'} pill />
                        <Badge type="neutral" text={MATCH_MODE_LABELS[rule.matchMode] || rule.matchMode} pill />
                        {rule.caseSensitive && (
                          <Badge type="warning" text="Aa" pill />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Quando receber:</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg inline-block">
                            &quot;{rule.keyword}&quot;
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Responder com:</p>
                          <div className="text-sm text-slate-700 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                            {(rule.replyType === 'TEXT' || rule.replyType === 'TEXT_AND_AUDIO') && rule.replyMessage && (
                              <p className="line-clamp-3 whitespace-pre-wrap">{rule.replyMessage}</p>
                            )}
                            {rule.channelType === 'INSTAGRAM' && rule.replyLinkDescription && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 whitespace-pre-wrap">
                                {rule.replyLinkDescription}
                              </p>
                            )}
                            {rule.replyLinkUrl && (
                              <div className="pt-0.5">
                                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                  <Reply size={12} />
                                  <span className="text-xs font-medium truncate">{rule.replyLinkLabel || rule.replyLinkUrl}</span>
                                </div>
                              </div>
                            )}
                            {(rule.replyType === 'AUDIO' || rule.replyType === 'TEXT_AND_AUDIO') && (
                              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                <Mic size={14} />
                                <span className="text-xs font-medium">Mensagem de áudio</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <ToggleSwitch
                      checked={rule.enabled}
                      onChange={() => handleToggle(rule)}
                    />
                    <IconButton
                      icon={<Pencil size={16} />}
                      onClick={() => setEditTarget(rule)}
                      variant="default"
                      size="md"
                    />
                    <IconButton
                      icon={<Trash2 size={16} />}
                      onClick={() => setDeleteTarget(rule)}
                      variant="danger"
                      size="md"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateAutoReplyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchRules();
          addToast('success', 'Auto-resposta criada com sucesso!');
        }}
      />

      {editTarget && (
        <EditAutoReplyModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            fetchRules();
            addToast('success', 'Auto-resposta atualizada com sucesso!');
          }}
          autoReply={editTarget}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Excluir Auto-Resposta"
          message={`Tem certeza que deseja excluir a auto-resposta para "${deleteTarget.keyword}"?`}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
