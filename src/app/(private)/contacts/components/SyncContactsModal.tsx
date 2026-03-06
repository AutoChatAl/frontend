/* eslint-disable no-console */
'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useState } from 'react';

import Modal from '@/components/Modal';
import { contactService } from '@/services/contact.service';
import { channelsService } from '@/services/channels.service';
import type { WhatsAppInstance } from '@/types/Channel';

interface SyncResult {
  channelName: string;
  created: number;
  updated: number;
}

interface SyncContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  whatsappChannels: WhatsAppInstance[];
}

export default function SyncContactsModal({
  isOpen,
  onClose,
  onSuccess,
  whatsappChannels,
}: SyncContactsModalProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SyncResult[] | null>(null);

  const connectedChannels = whatsappChannels.filter((ch) => ch.status === 'CONNECTED');

  const handleSync = async () => {
    if (!selectedChannelId) return;

    const channel = connectedChannels.find((ch) => ch.id === selectedChannelId);
    if (!channel) return;

    try {
      setSyncing(true);
      setError(null);

      const result = await contactService.syncContacts(selectedChannelId);

      setResults([
        {
          channelName: channel.name,
          created: result.created,
          updated: result.updated,
        },
      ]);

      onSuccess();
    } catch (err) {
      console.error('Erro ao sincronizar contatos:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível sincronizar os contatos. Verifique se o canal está conectado e tente novamente.',
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleClose = () => {
    if (syncing) return;
    setSelectedChannelId('');
    setError(null);
    setResults(null);
    onClose();
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (results) {
    const totalCreated = results.reduce((s, r) => s + r.created, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Sincronização Concluída" size="sm">
        <div className="flex flex-col items-center gap-6 py-2">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="text-green-500" size={32} />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Contatos sincronizados!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Os contatos do WhatsApp foram importados para sua base.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalCreated}
              </div>
              <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                Novos contatos
              </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {totalUpdated}
              </div>
              <div className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Atualizados</div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            Fechar
          </button>
        </div>
      </Modal>
    );
  }

  // ── Confirmation screen ─────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sincronizar Contatos" size="sm">
      <div className="space-y-5">
        {/* WhatsApp-only warning */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Disponível apenas para WhatsApp
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
              A sincronização de contatos está disponível somente para canais WhatsApp neste momento.
              Os contatos serão importados a partir da lista de conversas da instância selecionada.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Channel selection */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Selecione o canal para importar contatos
          </p>

          {connectedChannels.length === 0 ? (
            <div className="flex items-start gap-3 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <MessageCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Nenhum canal WhatsApp conectado
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Conecte um canal WhatsApp antes de sincronizar os contatos.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {connectedChannels.map((channel) => {
                const isSelected = selectedChannelId === channel.id;
                return (
                  <label
                    key={channel.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sync-channel"
                      value={channel.id}
                      checked={isSelected}
                      onChange={() => setSelectedChannelId(channel.id)}
                      className="sr-only"
                    />

                    <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <MessageCircle size={18} className="text-green-600 dark:text-green-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {channel.name}
                      </p>
                      {channel.number && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                          +{channel.number}
                        </p>
                      )}
                    </div>

                    {/* Connected badge */}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 font-medium shrink-0">
                      Conectado
                    </span>

                    {/* Radio indicator */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Info note */}
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          A sincronização importará todos os contatos da lista de conversas do WhatsApp selecionado.
          Contatos existentes terão seus nomes atualizados.
        </p>

        {/* Footer */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={syncing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={!selectedChannelId || syncing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/25"
          >
            {syncing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
