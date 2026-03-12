/* eslint-disable no-console */
'use client';

import {
  AlertCircle,
  Loader2,
  MessageCircle,
  Plus,
  Reply,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import CreateAutoReplyModal from './components/CreateAutoReplyModal';

import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
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
      console.error('Erro ao carregar auto-respostas:', err);
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
      console.error('Erro ao alternar:', err);
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
      console.error('Erro ao excluir:', err);
      addToast('error', 'Erro ao excluir auto-resposta');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando auto-respostas...</p>
        </div>
      </div>
    );
  }

  if (error && rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={fetchRules}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Tentar novamente
          </button>
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

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
        >
          <Plus size={16} />
          Nova Auto-Resposta
        </button>
      </header>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            <Reply size={22} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Nenhuma auto-resposta configurada
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Crie regras para responder automaticamente quando um contato enviar uma palavra-chave.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
          >
            <Plus size={15} />
            Criar primeira regra
          </button>
        </div>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isWA
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                            : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400'
                        }`}>
                          {isWA ? 'WhatsApp' : 'Instagram'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                          {MATCH_MODE_LABELS[rule.matchMode] || rule.matchMode}
                        </span>
                        {rule.caseSensitive && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            Aa
                          </span>
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
                          <p className="text-sm text-slate-700 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 line-clamp-3">
                            {rule.replyMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <ToggleSwitch
                      checked={rule.enabled}
                      onChange={() => handleToggle(rule)}
                    />
                    <button
                      onClick={() => setDeleteTarget(rule)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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
