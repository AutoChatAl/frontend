'use client';

import {
  AlertCircle,
  ExternalLink,
  Instagram,
  Loader2,
  MessageCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

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
    dmMessage: '',
    postFilter: 'ALL',
    oncePerUser: true,
    enabled: true,
  });

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
        dmMessage: '',
        postFilter: 'ALL',
        oncePerUser: true,
        enabled: true,
      });
      setErrors({});
    }
  }, [isOpen, loadChannels]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.channelId) newErrors.channelId = 'Selecione um canal Instagram';
    if (!formData.triggerOnAnyComment && !formData.keyword?.trim()) {
      newErrors.keyword = 'Informe a palavra-chave ou ative "Qualquer comentário"';
    }
    if (formData.commentReplyEnabled && !formData.commentReplyMessage?.trim()) {
      newErrors.commentReplyMessage = 'Informe a resposta ao comentário';
    }
    if (!formData.dmMessage?.trim()) {
      newErrors.dmMessage = 'Informe a mensagem da DM';
    }
    if (formData.dmLinkUrl && !/^https?:\/\/.+/.test(formData.dmLinkUrl)) {
      newErrors.dmLinkUrl = 'Informe uma URL válida (ex: https://exemplo.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
              <p className="text-xs text-slate-400 mt-1">
                Use <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{'{{username}}'}</code> para inserir o @ da pessoa
              </p>
            </div>
          )}
        </div>

        {/* DM Message */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-indigo-500" />
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mensagem no Direct <span className="text-red-400">*</span>
            </label>
          </div>

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
          <p className="text-xs text-slate-400">
            Use <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{'{{username}}'}</code> para inserir o @ da pessoa
          </p>

          {/* Optional link button */}
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
        {(formData.commentReplyMessage || formData.dmMessage) && (
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
              {formData.dmMessage && (
                <div>
                  <p className="text-[10px] font-medium text-indigo-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Send size={10} /> DM enviada automaticamente
                  </p>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-w-[85%]">
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
