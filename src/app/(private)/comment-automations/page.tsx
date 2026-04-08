'use client';

import {
  AlertCircle,
  ExternalLink,
  Instagram,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleSwitch from '@/components/ToggleSwitch';
import { commentAutomationService } from '@/services/comment-automation.service';
import type { CommentAutomation } from '@/types/CommentAutomation';

import CreateCommentAutomationModal from './components/CreateCommentAutomationModal';
import EditCommentAutomationModal from './components/EditCommentAutomationModal';

const MATCH_MODE_LABELS: Record<string, string> = {
  CONTAINS: 'Contém',
  EXACT: 'Exata',
  STARTS_WITH: 'Começa com',
};

export default function CommentAutomationsPage() {
  const [rules, setRules] = useState<CommentAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommentAutomation | null>(null);
  const [editTarget, setEditTarget] = useState<CommentAutomation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commentAutomationService.list();
      const normalized = data.map((r: CommentAutomation & { _id?: string }) => ({
        ...r,
        id: r.id || r._id || '',
      }));
      setRules(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar automações de comentário');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = async (rule: CommentAutomation) => {
    try {
      await commentAutomationService.toggle(rule.id);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)),
      );
      addToast('success', `Automação ${rule.enabled ? 'desativada' : 'ativada'}`);
    } catch (_err) {
      addToast('error', 'Erro ao alterar status da automação');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await commentAutomationService.delete(deleteTarget.id);
      setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      addToast('success', 'Automação excluída');
    } catch (_err) {
      addToast('error', 'Erro ao excluir automação');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <PageLoader message="Carregando automações de comentário..." />;
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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-sm">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Automação de Comentários</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Responda comentários e envie DMs automaticamente no Instagram
                {rules.length > 0 && (
                  <span className="ml-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                    {rules.length} {rules.length === 1 ? 'automação' : 'automações'}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
          Nova Automação
        </Button>
      </header>

      {/* How it works banner */}
      {rules.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={22} />}
          title="Nenhuma automação de comentário"
          description="Crie automações para responder comentários e enviar DMs quando alguém comentar nas suas publicações do Instagram."
          action={{
            label: 'Criar primeira automação',
            icon: <Plus size={15} />,
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 transition-all ${
                !rule.enabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 bg-pink-100 dark:bg-pink-900/30">
                    <Instagram size={18} className="text-pink-600 dark:text-pink-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                      <Badge type="instagram" text="Instagram" pill />
                      {rule.triggerOnAnyComment ? (
                        <Badge type="warning" text="Qualquer comentário" pill />
                      ) : (
                        <Badge type="neutral" text={MATCH_MODE_LABELS[rule.matchMode] || rule.matchMode} pill />
                      )}
                      {rule.commentReplyEnabled && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 px-2 py-0.5 rounded-full">
                          <MessageSquare size={10} /> Responde comentário
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full">
                        <Send size={10} /> Envia DM
                      </span>
                      {rule.oncePerUser && (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          1x por pessoa
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Trigger */}
                      {!rule.triggerOnAnyComment && rule.keyword && (
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Quando comentarem:</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg inline-block">
                            &quot;{rule.keyword}&quot;
                          </p>
                        </div>
                      )}

                      {/* Comment reply */}
                      {rule.commentReplyEnabled && rule.commentReplyMessage && (
                        <div>
                          <p className="text-xs text-pink-400 dark:text-pink-500 mb-0.5 flex items-center gap-1">
                            <MessageSquare size={10} /> Resposta ao comentário:
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 bg-pink-50 dark:bg-pink-950/30 px-3 py-1.5 rounded-lg border border-pink-100 dark:border-pink-900/50 line-clamp-2">
                            {rule.commentReplyMessage}
                          </p>
                        </div>
                      )}

                      {/* DM */}
                      <div>
                        <p className="text-xs text-indigo-400 dark:text-indigo-500 mb-0.5 flex items-center gap-1">
                          <Send size={10} /> DM enviada:
                        </p>
                        <div className="text-sm text-slate-700 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                          <p className="line-clamp-2 whitespace-pre-wrap">{rule.dmMessage}</p>
                          {rule.dmLinkUrl && (
                            <div className="pt-0.5">
                              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                <ExternalLink size={12} />
                                <span className="text-xs font-medium truncate">{rule.dmLinkLabel || rule.dmLinkUrl}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
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
          ))}
        </div>
      )}

      <CreateCommentAutomationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchRules();
          addToast('success', 'Automação de comentário criada com sucesso!');
        }}
      />

      {editTarget && (
        <EditCommentAutomationModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            fetchRules();
            addToast('success', 'Automação atualizada com sucesso!');
          }}
          automation={editTarget}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Excluir Automação"
          message={`Tem certeza que deseja excluir a automação ${deleteTarget.keyword ? `para "${deleteTarget.keyword}"` : 'de qualquer comentário'}?`}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
