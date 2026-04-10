'use client';

import {
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Instagram,
  Loader2,
  MessageCircle,
  MessageSquare,
  Mic,
  Send,
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
import { channelsService } from '@/services/channels.service';
import { commentAutomationService } from '@/services/comment-automation.service';
import type { InstagramAccount } from '@/types/Channel';
import type { CreateCommentAutomationInput } from '@/types/CommentAutomation';

interface Channel {
  id: string;
  name: string;
  status: string;
}

interface CreateCommentAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MATCH_MODES = [
  { value: 'CONTAINS', label: 'Contém', description: 'O comentário contém a palavra-chave' },
  { value: 'EXACT', label: 'Exata', description: 'O comentário é exatamente a palavra-chave' },
  { value: 'STARTS_WITH', label: 'Começa com', description: 'O comentário começa com a palavra-chave' },
] as const;

const REPLY_TYPES = [
  { value: 'TEXT' as const, label: 'Texto', icon: Type },
  { value: 'AUDIO' as const, label: 'Áudio', icon: Mic },
  { value: 'TEXT_AND_AUDIO' as const, label: 'Texto + Áudio', icon: MessageCircle },
  { value: 'IMAGE' as const, label: 'Imagem', icon: ImageIcon },
  { value: 'TEXT_AND_IMAGE' as const, label: 'Texto + Imagem', icon: MessageCircle },
  { value: 'IMAGE_AND_AUDIO' as const, label: 'Imagem + Áudio', icon: Mic },
] as const;

export default function CreateCommentAutomationModal({ isOpen, onClose, onSuccess }: CreateCommentAutomationModalProps) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateCommentAutomationInput>({
    channelId: '',
    keyword: '',
    matchMode: 'CONTAINS',
    caseSensitive: false,
    triggerOnAnyComment: false,
    commentReplyEnabled: true,
    commentReplyMessage: '',
    dmReplyType: 'TEXT',
    dmMessage: '',
    postFilter: 'ALL',
    oncePerUser: true,
    enabled: true,
  });

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');

  const loadChannels = useCallback(async () => {
    try {
      setLoadingData(true);
      const igChannels = await channelsService.getInstagramAccounts().catch(() => []);
      const allChannels: Channel[] = igChannels.map((ch: InstagramAccount) => ({
        id: ch.id,
        name: ch.instagram?.username || ch.name || 'Instagram',
        status: ch.status,
      }));
      setChannels(allChannels);
    } catch {
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadChannels();
      setFormData({
        channelId: '',
        keyword: '',
        matchMode: 'CONTAINS',
        caseSensitive: false,
        triggerOnAnyComment: false,
        commentReplyEnabled: true,
        commentReplyMessage: '',
        dmReplyType: 'TEXT',
        dmMessage: '',
        postFilter: 'ALL',
        oncePerUser: true,
        enabled: true,
      });
      setErrors({});
      setAudioFileName('');
      setImageFileName('');
    }
  }, [isOpen, loadChannels]);

  const dmReplyType = formData.dmReplyType ?? 'TEXT';
  const needsText = ['TEXT', 'TEXT_AND_AUDIO', 'TEXT_AND_IMAGE'].includes(dmReplyType);
  const needsAudio = ['AUDIO', 'TEXT_AND_AUDIO', 'IMAGE_AND_AUDIO'].includes(dmReplyType);
  const needsImage = ['IMAGE', 'TEXT_AND_IMAGE', 'IMAGE_AND_AUDIO'].includes(dmReplyType);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.channelId) newErrors.channelId = 'Selecione um canal Instagram';
    if (!formData.triggerOnAnyComment && !formData.keyword?.trim()) {
      newErrors.keyword = 'Informe a palavra-chave ou ative "Qualquer comentário"';
    }
    if (formData.commentReplyEnabled && !formData.commentReplyMessage?.trim()) {
      newErrors.commentReplyMessage = 'Informe a resposta ao comentário';
    }
    if (needsText && !formData.dmMessage?.trim()) {
      newErrors.dmMessage = 'Informe a mensagem da DM';
    }
    if (needsAudio && !formData.dmAudioBase64) {
      newErrors.dmAudio = 'Envie um arquivo de áudio';
    }
    if (needsImage && !formData.dmImageBase64) {
      newErrors.dmImage = 'Envie uma imagem';
    }
    if (formData.dmLinkUrl && !/^https?:\/\/.+/.test(formData.dmLinkUrl)) {
      newErrors.dmLinkUrl = 'Informe uma URL válida (ex: https://exemplo.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrors((prev) => ({ ...prev, dmAudio: 'O arquivo deve ser um áudio.' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, dmAudio: 'O áudio deve ter no máximo 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] ?? '';
      setFormData((prev) => ({
        ...prev,
        dmAudioBase64: base64,
        dmAudioMimeType: file.type,
      }));
      setAudioFileName(file.name);
      setErrors((prev) => ({ ...prev, dmAudio: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeAudio = () => {
    setFormData((prev) => {
      const next = { ...prev };
      delete next.dmAudioBase64;
      delete next.dmAudioMimeType;
      return next;
    });
    setAudioFileName('');
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, dmImage: 'O arquivo deve ser uma imagem.' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, dmImage: 'A imagem deve ter no máximo 2MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] ?? '';
      setFormData((prev) => ({
        ...prev,
        dmImageBase64: base64,
        dmImageMimeType: file.type,
      }));
      setImageFileName(file.name);
      setErrors((prev) => ({ ...prev, dmImage: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => {
      const next = { ...prev };
      delete next.dmImageBase64;
      delete next.dmImageMimeType;
      return next;
    });
    setImageFileName('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await commentAutomationService.create(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Erro ao criar automação' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Automação de Comentário" size="md">
      <div className="space-y-5">
        {errors.general && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{errors.general}</p>
          </div>
        )}

        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl">
          <Instagram size={18} className="text-pink-500 shrink-0 mt-0.5" />
          <div className="text-sm text-pink-700 dark:text-pink-300">
            <p className="font-medium mb-1">Como funciona</p>
            <p className="text-xs text-pink-600 dark:text-pink-400">
              Quando alguém comentar na sua publicação com a palavra-chave, o sistema responde o comentário
              publicamente e envia uma DM automática para a pessoa.
            </p>
          </div>
        </div>

        {/* Channel selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Canal Instagram
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
                return (
                  <label
                    key={channel.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={channel.id}
                      checked={isSelected}
                      onChange={() => {
                        setFormData((prev) => ({ ...prev, channelId: channel.id }));
                        setErrors((prev) => ({ ...prev, channelId: '' }));
                      }}
                      className="sr-only"
                    />
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-pink-100 dark:bg-pink-900/30">
                      <Instagram size={16} className="text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        @{channel.name}
                      </p>
                      <p className="text-xs text-slate-400">Instagram</p>
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
                <p className="text-sm text-slate-400 p-3">Nenhum canal Instagram conectado.</p>
              )}
            </div>
          )}
          {errors.channelId && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.channelId}
            </p>
          )}
        </div>

        {/* Trigger */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Gatilho
          </label>

          <Checkbox
            checked={formData.triggerOnAnyComment ?? false}
            onChange={(checked) => setFormData((prev) => ({ ...prev, triggerOnAnyComment: checked }))}
            label="Qualquer comentário"
            description="Dispara para todos os comentários, independente do conteúdo"
          />

          {!formData.triggerOnAnyComment && (
            <>
              <Input
                label="Palavra-chave"
                type="text"
                value={formData.keyword ?? ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, keyword: e.target.value }));
                  setErrors((prev) => ({ ...prev, keyword: '' }));
                }}
                placeholder="Ex: quero, eu quero, link, preço..."
                error={errors.keyword}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Modo de correspondência
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MATCH_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, matchMode: mode.value }))}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        formData.matchMode === mode.value
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{mode.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Comment Reply */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-pink-500" />
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Resposta ao comentário <span className="text-slate-400 font-normal">(pública)</span>
            </label>
          </div>

          <Checkbox
            checked={formData.commentReplyEnabled ?? true}
            onChange={(checked) => setFormData((prev) => ({ ...prev, commentReplyEnabled: checked }))}
            label="Responder o comentário publicamente"
            description="Envia uma resposta visível abaixo do comentário da pessoa"
          />

          {formData.commentReplyEnabled && (
            <div>
              <Textarea
                value={formData.commentReplyMessage ?? ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, commentReplyMessage: e.target.value }));
                  setErrors((prev) => ({ ...prev, commentReplyMessage: '' }));
                }}
                placeholder="Ex: Obrigado pelo comentário! Enviamos as informações no seu direct {{username}}"
                rows={3}
                error={errors.commentReplyMessage}
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      commentReplyMessage: (prev.commentReplyMessage ?? '') + '{{username}}',
                    }));
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
                >
                  <span>@</span> Inserir {'{{username}}'}
                </button>
                <p className="text-xs text-slate-400">
                  Será substituído pelo @ da pessoa
                </p>
              </div>
            </div>
          )}
        </div>

        {/* DM Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-indigo-500" />
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mensagem no Direct <span className="text-red-400">*</span>
            </label>
          </div>

          {/* Reply type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tipo de resposta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REPLY_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, dmReplyType: opt.value }))}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-center transition-all ${
                    dmReplyType === opt.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <opt.icon size={16} />
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Text message */}
          {needsText && (
            <div>
              <Textarea
                value={formData.dmMessage ?? ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dmMessage: e.target.value }));
                  setErrors((prev) => ({ ...prev, dmMessage: '' }));
                }}
                placeholder="Ex: Oi {{username}}! Vi que você se interessou pelo nosso produto. Aqui está o link exclusivo..."
                rows={4}
                error={errors.dmMessage}
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      dmMessage: (prev.dmMessage ?? '') + '{{username}}',
                    }));
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
                >
                  <span>@</span> Inserir {'{{username}}'}
                </button>
                <p className="text-xs text-slate-400">
                  Será substituído pelo @ da pessoa
                </p>
              </div>
            </div>
          )}

          {/* Audio upload */}
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
              {errors.dmAudio && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.dmAudio}
                </p>
              )}
            </div>
          )}

          {/* Image upload */}
          {needsImage && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Imagem
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imageFileName ? (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                  <ImageIcon size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{imageFileName}</span>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  <Upload size={18} />
                  <span className="text-sm font-medium">Clique para enviar uma imagem (máx. 2MB)</span>
                </button>
              )}
              {errors.dmImage && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.dmImage}
                </p>
              )}
            </div>
          )}

          {needsText && (
            <div>
              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <ExternalLink size={14} className="text-indigo-500" />
                Botão de link na DM <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="space-y-2">
                <Input
                  type="url"
                  value={formData.dmLinkUrl ?? ''}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, dmLinkUrl: e.target.value }));
                    setErrors((prev) => ({ ...prev, dmLinkUrl: '' }));
                  }}
                  placeholder="https://exemplo.com/oferta"
                  error={errors.dmLinkUrl}
                />
                {formData.dmLinkUrl && (
                  <>
                    <Input
                      type="text"
                      value={formData.dmLinkLabel ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dmLinkLabel: e.target.value }))}
                      placeholder="Texto do botão (ex: Ver oferta)"
                    />
                    <Textarea
                      value={formData.dmLinkDescription ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dmLinkDescription: e.target.value }))}
                      placeholder="Descrição do card (opcional, máx 80 caracteres)"
                      rows={2}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Opções
          </label>

          <Checkbox
            checked={formData.oncePerUser ?? true}
            onChange={(checked) => setFormData((prev) => ({ ...prev, oncePerUser: checked }))}
            label="Enviar DM apenas uma vez por pessoa"
            description="Evita enviar a mesma DM várias vezes para quem comentar mais de uma vez"
          />
        </div>

        {/* Preview */}
        {(formData.commentReplyMessage || formData.dmMessage || formData.dmAudioBase64 || formData.dmImageBase64) && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Preview
            </p>
            <div className="space-y-4">
              {/* Comment trigger */}
              {!formData.triggerOnAnyComment && formData.keyword && (
                <div>
                  <p className="text-[10px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Comentário do usuário</p>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                      {formData.keyword}
                    </div>
                  </div>
                </div>
              )}

              {/* Comment reply */}
              {formData.commentReplyEnabled && formData.commentReplyMessage && (
                <div>
                  <p className="text-[10px] font-medium text-pink-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare size={10} /> Resposta ao comentário
                  </p>
                  <div className="flex items-start gap-2 ml-8">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shrink-0" />
                    <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                      {formData.commentReplyMessage.replace(/\{\{username\}\}/gi, '@usuario')}
                    </div>
                  </div>
                </div>
              )}

              {/* DM preview */}
              {(formData.dmMessage || formData.dmAudioBase64 || formData.dmImageBase64) && (
                <div>
                  <p className="text-[10px] font-medium text-indigo-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Send size={10} /> DM enviada automaticamente
                  </p>
                  <div className="space-y-2 max-w-[85%]">
                    {/* Text message */}
                    {needsText && formData.dmMessage && (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                        <div className="px-3 py-2">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {formData.dmMessage.replace(/\{\{username\}\}/gi, '@usuario')}
                          </p>
                        </div>
                        {formData.dmLinkUrl && (
                          <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700">
                            <div className="w-full text-center rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-white font-semibold py-2 text-sm">
                              {formData.dmLinkLabel || 'Saiba mais'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Audio preview */}
                    {needsAudio && formData.dmAudioBase64 && (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <Mic size={14} />
                          <span className="text-xs font-medium">Mensagem de áudio</span>
                        </div>
                      </div>
                    )}

                    {/* Image preview */}
                    {needsImage && formData.dmImageBase64 && (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <ImageIcon size={14} />
                          <span className="text-xs font-medium">Imagem anexada</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ModalActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel="Criar Automação"
          confirmIcon={<MessageCircle size={16} />}
          loading={loading}
          loadingText="Criando..."
        />
      </div>
    </Modal>
  );
}
