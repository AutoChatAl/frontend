/* eslint-disable no-console */
'use client';

import {
  AlertTriangle,
  MessageCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useState } from 'react';

import Modal from '@/components/Modal';
import ModalActions from '@/components/ModalActions';
import { contactService } from '@/services/contact.service';
import type { WhatsAppInstance } from '@/types/Channel';

interface SyncContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { created: number; updated: number }) => void;
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

  const connectedWA = whatsappChannels.filter((ch) => ch.status === 'CONNECTED');

  const handleSync = async () => {
    if (!selectedChannelId) return;

    try {
      setSyncing(true);
      setError(null);

      const result = await contactService.syncContacts(selectedChannelId);
      setSelectedChannelId('');
      setError(null);
      onClose();
      onSuccess({ created: result.created, updated: result.updated });
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
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sincronizar Contatos" size="sm">
      <div className="space-y-5">
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

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Selecione o canal WhatsApp para importar contatos
          </p>

          {connectedWA.length === 0 ? (
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
              {connectedWA.map((channel) => {
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

                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 font-medium shrink-0">
                      Conectado
                    </span>

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

        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          A sincronização importará todos os contatos da lista de conversas do canal selecionado. Contatos existentes terão seus nomes atualizados.
        </p>

        <ModalActions
          onCancel={handleClose}
          onConfirm={handleSync}
          confirmLabel="Sincronizar"
          confirmIcon={<RefreshCw size={16} />}
          loading={syncing}
          loadingText="Sincronizando..."
          disabled={!selectedChannelId}
        />
      </div>
    </Modal>
  );
}
