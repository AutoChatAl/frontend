/* eslint-disable no-console */
'use client';

import {
  AlertCircle,
  Loader2,
  MessageCircle,
  Reply,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import Modal from '@/components/Modal';
import { autoReplyService } from '@/services/auto-reply.service';
import { channelsService } from '@/services/channels.service';
import type { CreateAutoReplyInput } from '@/types/AutoReply';
import type { InstagramAccount, WhatsAppInstance } from '@/types/Channel';

interface Channel {
  id: string;
  name: string;
  type: 'WHATSAPP' | 'INSTAGRAM';
  status: string;
}

interface CreateAutoReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MATCH_MODES = [
  { value: 'CONTAINS', label: 'Contém', description: 'A mensagem contém a palavra-chave' },
  { value: 'EXACT', label: 'Exata', description: 'A mensagem é exatamente a palavra-chave' },
  { value: 'STARTS_WITH', label: 'Começa com', description: 'A mensagem começa com a palavra-chave' },
] as const;

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
    hasError
      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400'
  }`;
}

export default function CreateAutoReplyModal({ isOpen, onClose, onSuccess }: CreateAutoReplyModalProps) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateAutoReplyInput>({
    channelId: '',
    channelType: 'WHATSAPP',
    keyword: '',
    matchMode: 'CONTAINS',
    caseSensitive: false,
    replyMessage: '',
    enabled: true,
  });

  const loadChannels = useCallback(async () => {
    try {
      setLoadingData(true);
      const [waChannels, igChannels] = await Promise.all([
        channelsService.getWhatsAppInstances().catch(() => []),
        channelsService.getInstagramAccounts().catch(() => []),
      ]);

      const allChannels: Channel[] = [
        ...waChannels.map((ch: WhatsAppInstance) => ({
          id: ch.id,
          name: ch.name || ch.whatsapp?.phoneNumber || 'WhatsApp',
          type: 'WHATSAPP' as const,
          status: ch.status,
        })),
        ...igChannels.map((ch: InstagramAccount) => ({
          id: ch.id,
          name: ch.instagram?.username || ch.name || 'Instagram',
          type: 'INSTAGRAM' as const,
          status: ch.status,
        })),
      ];

      setChannels(allChannels);
    } catch (err) {
      console.error('Erro ao carregar canais:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadChannels();
      setFormData({
        channelId: '',
        channelType: 'WHATSAPP',
        keyword: '',
        matchMode: 'CONTAINS',
        caseSensitive: false,
        replyMessage: '',
        enabled: true,
      });
      setErrors({});
    }
  }, [isOpen, loadChannels]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.channelId) newErrors.channelId = 'Selecione um canal';
    if (!formData.keyword.trim()) newErrors.keyword = 'Informe a palavra-chave';
    if (!formData.replyMessage.trim()) newErrors.replyMessage = 'Informe a mensagem de resposta';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await autoReplyService.create(formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao criar auto-resposta:', err);
      setErrors({ general: err instanceof Error ? err.message : 'Erro ao criar auto-resposta' });
    } finally {
      setLoading(false);
    }
  };

  const handleChannelSelect = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    setFormData((prev) => ({
      ...prev,
      channelId,
      channelType: channel?.type ?? 'WHATSAPP',
    }));
    setErrors((prev) => ({ ...prev, channelId: '' }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Auto-Resposta" size="md">
      <div className="space-y-5">
        {errors.general && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{errors.general}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Canal
          </label>
          {loadingData ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={16} className="animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Carregando canais...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map((channel) => {
                const isSelected = formData.channelId === channel.id;
                const isWA = channel.type === 'WHATSAPP';
                return (
                  <label
                    key={channel.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={channel.id}
                      checked={isSelected}
                      onChange={() => handleChannelSelect(channel.id)}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isWA ? 'bg-green-100 dark:bg-green-900/30' : 'bg-pink-100 dark:bg-pink-900/30'
                    }`}>
                      <MessageCircle size={16} className={isWA ? 'text-green-600 dark:text-green-400' : 'text-pink-600 dark:text-pink-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {channel.name}
                      </p>
                      <p className="text-xs text-slate-400">{channel.type === 'WHATSAPP' ? 'WhatsApp' : 'Instagram'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      channel.status === 'CONNECTED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {channel.status === 'CONNECTED' ? 'Conectado' : channel.status}
                    </span>
                  </label>
                );
              })}
              {channels.length === 0 && (
                <p className="text-sm text-slate-400 p-3">Nenhum canal disponível. Conecte um canal primeiro.</p>
              )}
            </div>
          )}
          {errors.channelId && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.channelId}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Palavra-chave / Frase
          </label>
          <input
            type="text"
            value={formData.keyword}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, keyword: e.target.value }));
              setErrors((prev) => ({ ...prev, keyword: '' }));
            }}
            placeholder="Ex: eu quero, quero comprar, me ajuda..."
            className={inputCls(!!errors.keyword)}
          />
          {errors.keyword && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.keyword}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Modo de correspondência
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MATCH_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, matchMode: mode.value }))}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                  formData.matchMode === mode.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-medium text-slate-800 dark:text-white">{mode.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{mode.description}</p>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.caseSensitive}
            onChange={(e) => setFormData((prev) => ({ ...prev, caseSensitive: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Diferenciar maiúsculas/minúsculas
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Mensagem de resposta
          </label>
          <textarea
            value={formData.replyMessage}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, replyMessage: e.target.value }));
              setErrors((prev) => ({ ...prev, replyMessage: '' }));
            }}
            placeholder="Ex: Aqui está seu link do Pix: https://pix.exemplo.com/12345"
            rows={4}
            className={inputCls(!!errors.replyMessage)}
          />
          {errors.replyMessage && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.replyMessage}
            </p>
          )}
        </div>

        {formData.keyword && formData.replyMessage && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Preview
            </p>
            <div className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-2 rounded-xl rounded-tr-sm text-sm max-w-[80%]">
                  {formData.keyword}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl rounded-tl-sm text-sm max-w-[80%] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Reply size={10} className="text-indigo-500" />
                    <span className="text-[10px] font-semibold text-indigo-500">Auto-resposta</span>
                  </div>
                  {formData.replyMessage}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-indigo-500/25"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Reply size={16} />}
            {loading ? 'Criando...' : 'Criar Auto-Resposta'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
