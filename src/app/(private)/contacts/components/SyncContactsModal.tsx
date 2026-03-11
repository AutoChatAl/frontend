/* eslint-disable no-console */
'use client';

import {
  AlertTriangle,
  Loader2,
  MessageCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useState } from 'react';

import Modal from '@/components/Modal';
import { contactService } from '@/services/contact.service';
import type { WhatsAppInstance, InstagramAccount } from '@/types/Channel';

interface SyncContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { created: number; updated: number }) => void;
  whatsappChannels: WhatsAppInstance[];
  instagramChannels?: InstagramAccount[];
}

export default function SyncContactsModal({
  isOpen,
  onClose,
  onSuccess,
  whatsappChannels,
  instagramChannels = [],
}: SyncContactsModalProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'WHATSAPP' | 'INSTAGRAM' | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedWA = whatsappChannels.filter((ch) => ch.status === 'CONNECTED');
  const connectedIG = instagramChannels.filter((ch) => ch.status === 'CONNECTED');

  const handleSelectChannel = (id: string, type: 'WHATSAPP' | 'INSTAGRAM') => {
    setSelectedChannelId(id);
    setSelectedType(type);
  };

  const handleSync = async () => {
    if (!selectedChannelId || !selectedType) return;

    try {
      setSyncing(true);
      setError(null);

      if (selectedType === 'WHATSAPP') {
        const result = await contactService.syncContacts(selectedChannelId);
        setSelectedChannelId('');
        setSelectedType(null);
        setError(null);
        onClose();
        onSuccess({ created: result.created, updated: result.updated });
      } else {
        const result = await contactService.syncInstagramContacts(selectedChannelId);
        setSelectedChannelId('');
        setSelectedType(null);
        setError(null);
        onClose();
        onSuccess({ created: result.upserted, updated: 0 });
      }
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
    setSelectedType(null);
    setError(null);
    onClose();
  };

  const hasChannels = connectedWA.length > 0 || connectedIG.length > 0;

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
            Selecione o canal para importar contatos
          </p>

          {!hasChannels ? (
            <div className="flex items-start gap-3 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <MessageCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Nenhum canal conectado
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Conecte um canal WhatsApp ou Instagram antes de sincronizar os contatos.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* WhatsApp channels */}
              {connectedWA.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 mb-1">WhatsApp</p>
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
                          onChange={() => handleSelectChannel(channel.id, 'WHATSAPP')}
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
                </>
              )}

              {/* Instagram channels */}
              {connectedIG.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-1">Instagram</p>
                  {connectedIG.map((channel) => {
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
                          onChange={() => handleSelectChannel(channel.id, 'INSTAGRAM')}
                          className="sr-only"
                        />

                        <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                          <MessageCircle size={18} className="text-pink-600 dark:text-pink-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {channel.instagram?.username || channel.name}
                          </p>
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Info note */}
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          {selectedType === 'INSTAGRAM'
            ? 'A sincronização importará contatos das conversas do Instagram DM. Apenas quem já interagiu será importado.'
            : 'A sincronização importará todos os contatos da lista de conversas do canal selecionado. Contatos existentes terão seus nomes atualizados.'
          }
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
