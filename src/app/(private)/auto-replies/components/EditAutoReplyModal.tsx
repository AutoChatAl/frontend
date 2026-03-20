'use client';

import {
  AlertCircle,
  ExternalLink,
  Loader2,
  MessageCircle,
  Mic,
  Reply,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import ModalActions from '@/components/ModalActions';
import Textarea from '@/components/Textarea';
import WhatsAppEditor from '@/components/WhatsAppEditor';
import { autoReplyService } from '@/services/auto-reply.service';
import { channelsService } from '@/services/channels.service';
import type { AutoReply, UpdateAutoReplyInput } from '@/types/AutoReply';
import type { InstagramAccount, WhatsAppInstance } from '@/types/Channel';

interface Channel {
  id: string;
  name: string;
  type: 'WHATSAPP' | 'INSTAGRAM';
  status: string;
}

interface EditAutoReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  autoReply: AutoReply;
}

const MATCH_MODES = [
  { value: 'CONTAINS', label: 'Contém', description: 'A mensagem contém a palavra-chave' },
  { value: 'EXACT', label: 'Exata', description: 'A mensagem é exatamente a palavra-chave' },
  { value: 'STARTS_WITH', label: 'Começa com', description: 'A mensagem começa com a palavra-chave' },
] as const;

const REPLY_TYPES = [
  { value: 'TEXT' as const, label: 'Texto', icon: Type },
  { value: 'AUDIO' as const, label: 'Áudio', icon: Mic },
  { value: 'TEXT_AND_AUDIO' as const, label: 'Texto + Áudio', icon: MessageCircle },
] as const;

function stripWhatsAppFormatting(text: string) {
  return text
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '$1')
    .replace(/~([^~\n]+)~/g, '$1');
}

export default function EditAutoReplyModal({ isOpen, onClose, onSuccess, autoReply }: EditAutoReplyModalProps) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');

  const buildFormData = useCallback((): UpdateAutoReplyInput => {
    const data: UpdateAutoReplyInput = {
      channelId: autoReply.channelId,
      channelType: autoReply.channelType,
      keyword: autoReply.keyword,
      matchMode: autoReply.matchMode,
      caseSensitive: autoReply.caseSensitive,
      replyType: autoReply.replyType,
      replyMessage: autoReply.replyMessage,
      enabled: autoReply.enabled,
    };
    if (autoReply.replyAudioBase64) data.replyAudioBase64 = autoReply.replyAudioBase64;
    if (autoReply.replyAudioMimeType) data.replyAudioMimeType = autoReply.replyAudioMimeType;
    if (autoReply.replyLinkUrl) data.replyLinkUrl = autoReply.replyLinkUrl;
    if (autoReply.replyLinkLabel) data.replyLinkLabel = autoReply.replyLinkLabel;
    if (autoReply.replyLinkDescription) data.replyLinkDescription = autoReply.replyLinkDescription;
    return data;
  }, [autoReply]);

  const [formData, setFormData] = useState<UpdateAutoReplyInput>(buildFormData);

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
    } catch {
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadChannels();
      setFormData(buildFormData());
      setErrors({});
      setAudioFileName(autoReply.replyAudioBase64 ? 'Áudio existente' : '');
    }
  }, [isOpen, autoReply, loadChannels]);

  const needsText = formData.replyType === 'TEXT' || formData.replyType === 'TEXT_AND_AUDIO';
  const needsAudio = formData.replyType === 'AUDIO' || formData.replyType === 'TEXT_AND_AUDIO';
  const isInstagram = formData.channelType === 'INSTAGRAM';
  const hasLinkButton = !!formData.replyLinkUrl?.trim();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.channelId) newErrors.channelId = 'Selecione um canal';
    if (!formData.keyword?.trim()) newErrors.keyword = 'Informe a palavra-chave';
    if (needsText && !formData.replyMessage?.trim()) {
      newErrors.replyMessage = 'Informe a mensagem de resposta';
    }
    if (needsAudio && !formData.replyAudioBase64) {
      newErrors.replyAudio = 'Envie um arquivo de áudio';
    }
    if (formData.replyLinkUrl && !/^https?:\/\/.+/.test(formData.replyLinkUrl)) {
      newErrors.replyLinkUrl = 'Informe uma URL válida (ex: https://exemplo.com)';
    }
    if (formData.replyLinkDescription && formData.replyLinkDescription.length > 80) {
      newErrors.replyLinkDescription = 'A descrição do Instagram deve ter no máximo 80 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrors((prev) => ({ ...prev, replyAudio: 'O arquivo deve ser um áudio.' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, replyAudio: 'O áudio deve ter no máximo 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] ?? '';
      setFormData((prev) => ({
        ...prev,
        replyAudioBase64: base64,
        replyAudioMimeType: file.type,
      }));
      setAudioFileName(file.name);
      setErrors((prev) => ({ ...prev, replyAudio: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeAudio = () => {
    setFormData((prev) => {
      const next = { ...prev };
      delete next.replyAudioBase64;
      delete next.replyAudioMimeType;
      return next;
    });
    setAudioFileName('');
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await autoReplyService.update(autoReply.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Erro ao atualizar auto-resposta' });
    } finally {
      setLoading(false);
    }
  };

  const handleChannelSelect = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    const channelType = channel?.type ?? 'WHATSAPP';
    setFormData((prev) => {
      const next = { ...prev, channelId, channelType };
      if (prev.channelType === 'WHATSAPP' && channelType === 'INSTAGRAM' && next.replyMessage) {
        next.replyMessage = stripWhatsAppFormatting(next.replyMessage);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, channelId: '' }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Auto-Resposta" size="md">
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

        <Input
          label="Palavra-chave / Frase"
          type="text"
          value={formData.keyword ?? ''}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, keyword: e.target.value }));
            setErrors((prev) => ({ ...prev, keyword: '' }));
          }}
          placeholder="Ex: eu quero, quero comprar, me ajuda..."
          error={errors.keyword}
        />

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

        <Checkbox
          checked={formData.caseSensitive ?? false}
          onChange={(checked) => setFormData((prev) => ({ ...prev, caseSensitive: checked }))}
          label="Diferenciar maiúsculas/minúsculas"
          description="A palavra-chave será sensível a maiúsculas e minúsculas"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tipo de resposta
          </label>
          <div className="grid grid-cols-3 gap-2">
            {REPLY_TYPES.map((opt) => {
              const disabled = false;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setFormData((prev) => ({ ...prev, replyType: opt.value }))}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-center transition-all ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700'
                      : formData.replyType === opt.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <opt.icon size={16} />
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{opt.label}</p>
                </button>
              );
            })}
          </div>

        </div>

        {needsText && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mensagem de resposta
            </label>
            {isInstagram ? (
              <Textarea
                value={formData.replyMessage ?? ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, replyMessage: e.target.value }));
                  setErrors((prev) => ({ ...prev, replyMessage: '' }));
                }}
                placeholder="Ex: Aqui está seu link do Pix: https://pix.exemplo.com/12345"
                rows={4}
                error={errors.replyMessage}
              />
            ) : (
              <>
                <WhatsAppEditor
                  value={formData.replyMessage ?? ''}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, replyMessage: value }));
                    setErrors((prev) => ({ ...prev, replyMessage: '' }));
                  }}
                  placeholder="Digite a mensagem com formatação do WhatsApp..."
                  rows={5}
                  maxLength={4000}
                  error={errors.replyMessage}
                />
                <div className="flex justify-end mt-1.5">
                  <span className={`text-xs ${(formData.replyMessage?.length ?? 0) > 3600 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {formData.replyMessage?.length ?? 0}/4000
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {needsAudio && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Arquivo de áudio
            </label>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            {audioFileName ? (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <Mic size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{audioFileName}</span>
                <button
                  type="button"
                  onClick={removeAudio}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                <Upload size={18} />
                <span className="text-sm font-medium">Clique para enviar um áudio (máx. 5MB)</span>
              </button>
            )}
            {errors.replyAudio && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.replyAudio}
              </p>
            )}
          </div>
        )}

        {needsText && (
          <div>
            <label className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <ExternalLink size={14} className="text-indigo-500" />
              Botão de link <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="space-y-2">
              <Input
                type="url"
                value={formData.replyLinkUrl ?? ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, replyLinkUrl: e.target.value }));
                  setErrors((prev) => ({ ...prev, replyLinkUrl: '' }));
                }}
                placeholder="https://exemplo.com/link"
                error={errors.replyLinkUrl}
              />
              <Input
                type="text"
                value={formData.replyLinkLabel ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, replyLinkLabel: e.target.value }))}
                placeholder="Texto do botão (ex: Saiba mais)"
              />
              {isInstagram && hasLinkButton && (
                <Textarea
                  value={formData.replyLinkDescription ?? ''}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, replyLinkDescription: e.target.value }));
                    setErrors((prev) => ({ ...prev, replyLinkDescription: '' }));
                  }}
                  placeholder="Descrição do card no Instagram (opcional)"
                  rows={2}
                  error={errors.replyLinkDescription}
                />
              )}
            </div>
          </div>
        )}

        {formData.keyword && (formData.replyMessage || formData.replyAudioBase64) && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Preview
            </p>
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-2 rounded-xl rounded-tr-sm text-sm max-w-[80%]">
                  {formData.keyword}
                </div>
              </div>

              {needsText && formData.replyMessage && (
                isInstagram ? (
                  <div className="flex justify-start">
                    {hasLinkButton ? (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm text-sm max-w-[80%] overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Reply size={10} className="text-pink-500" />
                            <span className="text-[10px] font-semibold text-pink-500">Preview Instagram</span>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-white line-clamp-2">{formData.replyMessage}</p>
                          {formData.replyLinkDescription && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{formData.replyLinkDescription}</p>
                          )}
                        </div>
                        <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60">
                          <div className="w-full text-center rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-white font-semibold py-2">
                            {formData.replyLinkLabel || 'Saiba mais'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl rounded-tl-sm text-sm max-w-[80%] text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Reply size={10} className="text-pink-500" />
                          <span className="text-[10px] font-semibold text-pink-500">Auto-resposta Instagram</span>
                        </div>
                        <p className="whitespace-pre-wrap wrap-break-word">{formData.replyMessage}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl rounded-tl-sm text-sm max-w-[80%] text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Reply size={10} className="text-indigo-500" />
                        <span className="text-[10px] font-semibold text-indigo-500">Auto-resposta</span>
                      </div>
                      <p className="whitespace-pre-wrap wrap-break-word">{formData.replyMessage}</p>
                      {formData.replyLinkUrl && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                            <ExternalLink size={12} />
                            <span className="text-xs font-medium">{formData.replyLinkLabel || formData.replyLinkUrl}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {needsAudio && formData.replyAudioBase64 && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl rounded-tl-sm text-sm max-w-[80%] text-slate-700 dark:text-slate-300">
                    {!needsText && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Reply size={10} className="text-indigo-500" />
                        <span className="text-[10px] font-semibold text-indigo-500">Auto-resposta</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Mic size={14} />
                      <span className="text-xs font-medium">Mensagem de áudio</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ModalActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel="Salvar Alterações"
          confirmIcon={<Reply size={16} />}
          loading={loading}
          loadingText="Salvando..."
        />
      </div>
    </Modal>
  );
}
