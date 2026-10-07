'use client';
import { AlertCircle, ChevronDown, FlaskConical, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AudioPicker from '@/components/AudioPicker';
import Callout from '@/components/Callout';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import ModalActions from '@/components/ModalActions';
import Textarea from '@/components/Textarea';
import WhatsAppEditor from '@/components/WhatsAppEditor';
import type { WorkspaceChannel } from '@/hooks/WorkspaceChannelsHook';
import { autoReplyService } from '@/services/auto-reply.service';
import { channelsService } from '@/services/channels.service';
import { commentAutomationService } from '@/services/comment-automation.service';
import { liveAutomationService } from '@/services/live-automation.service';
import type { ReplyType } from '@/types/AutoReply';
import type { InstagramMedia } from '@/types/Channel';
import { AUDIO_UPLOAD, validateAudioFile, validateCommentAudioFile } from '@/utils/audio';
import { stripWhatsAppFormatting } from '@/utils/whatsappFormat';

import {
  CharCounter,
  ChannelPicker,
  FieldLabel,
  FileField,
  FormSection,
  KeywordsInput,
  PostPicker,
  SegmentedControl,
  TileGroup,
  UsernameInserter,
} from './AutomationFields';
import {
  addKeywords,
  COMMENT_REPLY_MAX,
  COMMENT_REPLY_OPTIONS_MAX,
  emptyDraft,
  draftFromAutoReply,
  draftFromCommentAutomation,
  draftFromLiveAutomation,
  hasAdvancedMatching,
  KEYWORDS_MAX,
  LINK_DESCRIPTION_MAX,
  LINK_LABEL_MAX,
  MATCH_MODE_OPTIONS,
  MESSAGE_MAX,
  replyTypeOptions,
  toAutoReplyInput,
  toCommentAutomationInput,
  toLiveAutomationInput,
  validateDraft,
  type AutomationDraft,
  type KeywordLogic,
} from './automationForm';
import { simulateTrigger, triggerSummary } from './automationMatcher';
import { hasAudio, hasDocument, hasImage, hasText, isCommentLike, type AutomationKind, type AutomationRow } from './automationMeta';
import AutomationPreview from './AutomationPreview';

interface AutomationModalProps {
  isOpen: boolean;
  kind: AutomationKind;
  automation?: AutomationRow | null;
  initialDraft?: Partial<AutomationDraft> | undefined;
  requireLink?: boolean | undefined;
  messagePlaceholder?: string | undefined;
  intro?: string | undefined;
  title?: string | undefined;
  channels: WorkspaceChannel[];
  channelsLoading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const TITLES: Record<AutomationKind, { create: string; edit: string }> = {
  DM: { create: 'Nova resposta automática', edit: 'Editar resposta automática' },
  COMMENT: { create: 'Nova automação de comentário', edit: 'Editar automação de comentário' },
  LIVE: { create: 'Nova automação de live', edit: 'Editar automação de live' },
};

type Attachment = 'NONE' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';

const SIMPLE_REPLY_TYPES: { value: Attachment; type: ReplyType; label: string }[] = [
  { value: 'NONE', type: 'TEXT', label: 'Só texto' },
  { value: 'IMAGE', type: 'TEXT_AND_IMAGE', label: 'Com imagem' },
  { value: 'AUDIO', type: 'TEXT_AND_AUDIO', label: 'Com áudio' },
  { value: 'DOCUMENT', type: 'TEXT_AND_DOCUMENT', label: 'Com documento' },
];

const ADVANCED_ERROR_FIELDS = ['linkDescription'];

function readAsBase64(file: File, onDone: (base64: string) => void): void {
  const reader = new FileReader();
  reader.onload = () => {
    onDone((reader.result as string).split(',')[1] ?? '');
  };
  reader.readAsDataURL(file);
}

function isSimpleReplyType(replyType: ReplyType): boolean {
  return SIMPLE_REPLY_TYPES.some((option) => option.type === replyType);
}

export default function AutomationModal({
  isOpen,
  kind: kindProp,
  automation,
  initialDraft,
  requireLink = false,
  messagePlaceholder,
  intro,
  title,
  channels,
  channelsLoading,
  onClose,
  onSuccess,
}: AutomationModalProps) {
  const editing = automation ?? null;
  const kind: AutomationKind = editing?.kind ?? kindProp;

  const [draft, setDraft] = useState<AutomationDraft>(() => emptyDraft(kind));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [testText, setTestText] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setPostsFor('');
    setTestText('');
    let next: AutomationDraft;
    if (editing?.kind === 'DM') next = draftFromAutoReply(editing.rule);
    else if (editing?.kind === 'COMMENT') next = draftFromCommentAutomation(editing.rule);
    else if (editing?.kind === 'LIVE') next = draftFromLiveAutomation(editing.rule);
    else next = { ...emptyDraft(kind), ...initialDraft };
    setDraft(next);
    setMoreOpen(!!editing && (hasAdvancedMatching(next) || !isSimpleReplyType(next.replyType)));
  }, [isOpen, editing, kind, initialDraft]);

  const pickableChannels = useMemo(
    () => (isCommentLike(kind) ? channels.filter((channel) => channel.type === 'INSTAGRAM') : channels),
    [channels, kind],
  );

  const isInstagram = draft.channelType === 'INSTAGRAM';
  const messageMax = MESSAGE_MAX[kind];
  const typeOptions = replyTypeOptions(draft.channelType, kind);
  const commentLike = isCommentLike(kind);

  const [posts, setPosts] = useState<InstagramMedia[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsFailed, setPostsFailed] = useState(false);
  const [postsFor, setPostsFor] = useState('');

  const loadPosts = useCallback(async (channelId: string) => {
    setPostsLoading(true);
    setPostsFailed(false);
    try {
      setPosts(await channelsService.getInstagramMedia(channelId));
    } catch {
      setPosts([]);
      setPostsFailed(true);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const wantsPosts = kind === 'COMMENT' && draft.postFilter === 'SPECIFIC' && !!draft.channelId;
  useEffect(() => {
    if (!isOpen || !wantsPosts || postsFor === draft.channelId) return;
    setPostsFor(draft.channelId);
    void loadPosts(draft.channelId);
  }, [isOpen, wantsPosts, draft.channelId, postsFor, loadPosts]);

  const patch = (values: Partial<AutomationDraft>) => setDraft((prev) => ({ ...prev, ...values }));
  const clearError = (field: string) => setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));

  const handleChannel = useCallback((channel: WorkspaceChannel) => {
    setDraft((prev) => {
      const next: AutomationDraft = { ...prev, channelId: channel.id, channelType: channel.type };
      if (channel.type === 'INSTAGRAM') {
        if (prev.channelType !== 'INSTAGRAM' && next.message) next.message = stripWhatsAppFormatting(next.message);
        if (hasDocument(next.replyType)) {
          next.replyType = 'TEXT';
          next.documentBase64 = '';
          next.documentMimeType = '';
          next.documentName = '';
        }
      }
      return next;
    });
    setErrors((prev) => (prev.channelId ? { ...prev, channelId: '' } : prev));
  }, []);

  const onlyChannel = pickableChannels.length === 1 ? pickableChannels[0] : undefined;
  useEffect(() => {
    if (!isOpen || editing || draft.channelId || !onlyChannel) return;
    handleChannel(onlyChannel);
  }, [isOpen, editing, draft.channelId, onlyChannel, handleChannel]);

  const handleKeywordLogic = (logic: KeywordLogic) => {
    patch(logic === 'ALL' ? { keywordLogic: logic, matchMode: 'CONTAINS' } : { keywordLogic: logic });
  };

  const handleReplyType = (value: ReplyType) => {
    patch({ replyType: value });
    setErrors((prev) => ({ ...prev, message: '', audio: '', image: '', document: '' }));
  };

  const handleImage = (file: File) => {
    const mime = (file.type || '').toLowerCase();
    const acceptedMimes = commentLike
      ? ['image/png', 'image/jpeg', 'image/jpg']
      : ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const acceptedExt = commentLike ? /\.(png|jpe?g)$/i : /\.(png|jpe?g|webp)$/i;
    if (!acceptedMimes.includes(mime) && !acceptedExt.test(file.name)) {
      setErrors((prev) => ({
        ...prev,
        image: commentLike ? 'A imagem deve ser PNG ou JPEG.' : 'A imagem deve ser PNG, JPEG ou WEBP.',
      }));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((prev) => ({ ...prev, image: 'A imagem deve ter no máximo 10MB.' }));
      return;
    }
    readAsBase64(file, (base64) => {
      patch({
        imageBase64: base64,
        imageMimeType: acceptedMimes.includes(mime) ? mime : 'image/jpeg',
        imageFileName: file.name,
      });
      clearError('image');
    });
  };

  const handleDocument = (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((prev) => ({ ...prev, document: 'O documento deve ter no máximo 10MB.' }));
      return;
    }
    readAsBase64(file, (base64) => {
      patch({ documentBase64: base64, documentMimeType: file.type, documentName: file.name });
      clearError('document');
    });
  };

  const handleSubmit = async () => {
    const found = validateDraft(draft, kind, { requireLink });
    if (Object.keys(found).length > 0) {
      setErrors(found);
      if (ADVANCED_ERROR_FIELDS.some((field) => found[field])) setMoreOpen(true);
      return;
    }
    setSaving(true);
    try {
      if (kind === 'DM') {
        const input = toAutoReplyInput(draft);
        if (editing) await autoReplyService.update(editing.id, input);
        else await autoReplyService.create(input);
      } else if (kind === 'LIVE') {
        const input = toLiveAutomationInput(draft);
        if (editing) await liveAutomationService.update(editing.id, input);
        else await liveAutomationService.create(input);
      } else {
        const input = toCommentAutomationInput(draft);
        if (editing) await commentAutomationService.update(editing.id, input);
        else await commentAutomationService.create(input);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Não foi possível salvar a automação. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const matchMode = MATCH_MODE_OPTIONS.find((option) => option.value === draft.matchMode);
  const needKeyword = !(commentLike && draft.triggerOnAnyComment);
  const lockedToContains = draft.keywords.length > 1 && draft.keywordLogic === 'ALL';
  const simpleOptions = SIMPLE_REPLY_TYPES.filter((option) => typeOptions.some((entry) => entry.value === option.type));
  const simpleValue = SIMPLE_REPLY_TYPES.find((option) => option.type === draft.replyType)?.value;
  const extraReplies = draft.commentReplyMessages.slice(1);
  const summary = triggerSummary(draft, kind);
  const simulation = simulateTrigger(draft, kind, testText);
  const messageLabel = commentLike ? 'Mensagem no Direct' : 'Mensagem de resposta';
  const defaultPlaceholder = commentLike
    ? 'Ex.: Oi {{username}}! Aqui está o link que você pediu.'
    : 'Ex.: Oi! Aqui está o link que você pediu.';

  const updateReply = (index: number, value: string) => {
    const next = [...draft.commentReplyMessages];
    next[index] = value;
    patch({ commentReplyMessages: next });
    clearError('commentReplyMessage');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? (editing ? TITLES[kind].edit : TITLES[kind].create)}
      size="md"
    >
      <div className="space-y-5">
        {intro && (
          <Callout tone="info" className="flex items-start gap-2">
            <Sparkles size={14} className="mt-0.5 shrink-0" />
            <span>{intro}</span>
          </Callout>
        )}

        {errors.general && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            <p className="flex-1 text-sm text-red-700 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        <FormSection
          title="1. Quando responder?"
          description={commentLike
            ? 'Escolha se a automação responde a todo comentário ou só quando aparecer uma palavra.'
            : 'Quando alguém mandar uma destas palavras, a automação responde sozinha.'}
        >
          {commentLike && (
            <SegmentedControl
              options={[
                { value: 'WORD' as const, label: 'Quando tiver a palavra' },
                { value: 'ANY' as const, label: 'Qualquer comentário' },
              ]}
              value={draft.triggerOnAnyComment ? 'ANY' : 'WORD'}
              onChange={(value) => {
                patch({ triggerOnAnyComment: value === 'ANY' });
                clearError('keywords');
              }}
            />
          )}

          {needKeyword && (
            <div>
              <FieldLabel required>Palavras</FieldLabel>
              <KeywordsInput
                values={draft.keywords}
                max={KEYWORDS_MAX}
                onChange={(values) => {
                  patch(values.length > 1 ? { keywords: values } : { keywords: values, keywordLogic: 'ANY' });
                  clearError('keywords');
                }}
                onAdd={(raw) => {
                  setDraft((prev) => ({ ...prev, keywords: addKeywords(prev.keywords, raw).slice(0, KEYWORDS_MAX) }));
                  clearError('keywords');
                }}
                placeholder={commentLike ? 'Ex.: quero' : 'Ex.: preço'}
                error={errors.keywords}
              />
            </div>
          )}

          {summary && <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{summary}</p>}
        </FormSection>

        <FormSection
          title="2. O que responder?"
          description={commentLike
            ? 'A pessoa recebe a mensagem no Direct. Se quiser, a automação também responde no comentário.'
            : 'A mensagem que a pessoa recebe na hora.'}
        >
          {commentLike && (
            <div className="space-y-2">
              <Checkbox
                checked={draft.commentReplyEnabled}
                onChange={(checked) => {
                  patch({ commentReplyEnabled: checked });
                  clearError('commentReplyMessage');
                }}
                label={kind === 'LIVE' ? 'Responder também no chat da live' : 'Responder também no comentário'}
                description="Todo mundo vê. Assim quem comentou sabe que precisa olhar o Direct."
              />

              {draft.commentReplyEnabled && (
                <div>
                  <Textarea
                    value={draft.commentReplyMessages[0] ?? ''}
                    onChange={(event) => updateReply(0, event.target.value)}
                    placeholder="Ex.: Oi {{username}}! Te mandei tudo no Direct."
                    rows={2}
                    maxLength={COMMENT_REPLY_MAX}
                    error={errors.commentReplyMessage}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <UsernameInserter onInsert={() => updateReply(0, `${draft.commentReplyMessages[0] ?? ''}{{username}}`)} />
                    <span className="mt-1.5 shrink-0">
                      <CharCounter value={(draft.commentReplyMessages[0] ?? '').length} max={COMMENT_REPLY_MAX} />
                    </span>
                  </div>
                  {extraReplies.length > 0 && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {extraReplies.length === 1
                        ? 'Tem mais 1 forma de responder, sorteada a cada comentário. Veja em Mais opções.'
                        : `Tem mais ${extraReplies.length} formas de responder, sorteadas a cada comentário. Veja em Mais opções.`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {hasText(draft.replyType) && (
            <div>
              <FieldLabel required>{messageLabel}</FieldLabel>
              {isInstagram ? (
                <Textarea
                  value={draft.message}
                  onChange={(event) => {
                    patch({ message: event.target.value });
                    clearError('message');
                  }}
                  placeholder={messagePlaceholder ?? defaultPlaceholder}
                  rows={4}
                  maxLength={messageMax}
                  error={errors.message}
                />
              ) : (
                <WhatsAppEditor
                  value={draft.message}
                  onChange={(value) => {
                    patch({ message: value });
                    clearError('message');
                  }}
                  placeholder={messagePlaceholder ?? 'Escreva a mensagem de resposta...'}
                  rows={5}
                  maxLength={messageMax}
                  error={errors.message}
                />
              )}
              <div className="flex items-start justify-between gap-3">
                {commentLike
                  ? <UsernameInserter onInsert={() => patch({ message: `${draft.message}{{username}}` })} />
                  : <span />}
                <span className="mt-1.5 shrink-0">
                  <CharCounter value={draft.message.length} max={messageMax} />
                </span>
              </div>
            </div>
          )}

          {hasText(draft.replyType) && (
            <div className="space-y-3">
              <div>
                <FieldLabel htmlFor="automation-link-url" {...(requireLink ? { required: true } : { optional: true })}>
                  Link
                </FieldLabel>
                <Input
                  id="automation-link-url"
                  type="url"
                  value={draft.linkUrl}
                  onChange={(event) => {
                    patch({ linkUrl: event.target.value });
                    clearError('linkUrl');
                  }}
                  placeholder="https://minhaloja.com/oferta"
                  hint="Vira um botão na mensagem. Contamos quantas pessoas clicaram."
                  error={errors.linkUrl}
                />
              </div>

              {draft.linkUrl.trim() && (
                <div>
                  <FieldLabel htmlFor="automation-link-label">Texto do botão</FieldLabel>
                  <Input
                    id="automation-link-label"
                    type="text"
                    value={draft.linkLabel}
                    maxLength={LINK_LABEL_MAX}
                    onChange={(event) => {
                      patch({ linkLabel: event.target.value });
                      clearError('linkLabel');
                    }}
                    placeholder="Ex.: Ver oferta"
                    error={errors.linkLabel}
                  />
                </div>
              )}
            </div>
          )}

          {simpleValue && simpleOptions.length > 1 ? (
            <div>
              <FieldLabel>Anexo</FieldLabel>
              <TileGroup
                columns={2}
                options={simpleOptions.map((option) => ({ value: option.value, label: option.label }))}
                value={simpleValue}
                onChange={(value) => {
                  const picked = SIMPLE_REPLY_TYPES.find((option) => option.value === value);
                  if (picked) handleReplyType(picked.type);
                }}
              />
            </div>
          ) : !simpleValue ? (
            <Callout tone="info">
              Esta resposta usa um formato especial (sem texto ou com mais de um anexo). Para mudar, abra Mais opções.
            </Callout>
          ) : null}

          {hasAudio(draft.replyType) && (
            <AudioPicker
              value={draft.audioBase64
                ? { base64: draft.audioBase64, mimeType: draft.audioMimeType || 'audio/wav', fileName: draft.audioFileName || 'audio' }
                : null}
              onChange={(value) => {
                if (!value) {
                  patch({ audioBase64: '', audioMimeType: '', audioFileName: '' });
                  return;
                }
                patch({ audioBase64: value.base64, audioMimeType: value.mimeType, audioFileName: value.fileName });
                clearError('audio');
              }}
              maxBytes={commentLike ? AUDIO_UPLOAD.comment.maxBytes : AUDIO_UPLOAD.autoReply.maxBytes}
              accept={commentLike ? AUDIO_UPLOAD.comment.accept : AUDIO_UPLOAD.autoReply.accept}
              validateUpload={commentLike ? validateCommentAudioFile : validateAudioFile}
              error={errors.audio}
            />
          )}

          {hasImage(draft.replyType) && (
            <FileField
              label="Imagem"
              accept={commentLike ? '.png,.jpg,.jpeg,image/png,image/jpeg' : 'image/png,image/jpeg,image/webp'}
              hint={commentLike
                ? 'Toque para enviar uma imagem (PNG ou JPEG, até 10MB)'
                : 'Toque para enviar uma imagem (até 10MB)'}
              fileName={draft.imageFileName}
              onPick={handleImage}
              onRemove={() => patch({ imageBase64: '', imageMimeType: '', imageFileName: '' })}
              error={errors.image}
            />
          )}

          {hasDocument(draft.replyType) && (
            <FileField
              label="Documento"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
              hint="Toque para enviar um documento (até 10MB)"
              fileName={draft.documentName}
              onPick={handleDocument}
              onRemove={() => patch({ documentBase64: '', documentMimeType: '', documentName: '' })}
              error={errors.document}
            />
          )}
        </FormSection>

        <FormSection
          title="3. Onde vale?"
          description={commentLike
            ? 'A conta do Instagram em que a automação fica de olho.'
            : 'O número de WhatsApp ou a conta do Instagram em que a automação responde.'}
        >
          <ChannelPicker
            channels={pickableChannels}
            loading={channelsLoading}
            value={draft.channelId}
            onChange={handleChannel}
            emptyMessage={commentLike
              ? 'Nenhuma conta do Instagram conectada. Conecte uma em Canais.'
              : 'Nenhum número ou conta conectada. Conecte um em Canais.'}
            error={errors.channelId}
          />

          {kind === 'COMMENT' && (
            <>
              <SegmentedControl
                options={[
                  { value: 'ALL' as const, label: 'Todos os posts' },
                  { value: 'SPECIFIC' as const, label: 'Só alguns posts' },
                ]}
                value={draft.postFilter}
                onChange={(value) => {
                  patch({ postFilter: value });
                  clearError('postIds');
                }}
              />

              {draft.postFilter === 'SPECIFIC' && (
                <PostPicker
                  posts={posts}
                  loading={postsLoading}
                  failed={postsFailed}
                  selected={draft.postIds}
                  onChange={(postIds) => {
                    patch({ postIds });
                    clearError('postIds');
                  }}
                  error={errors.postIds}
                />
              )}
            </>
          )}
        </FormSection>

        <section className="border-t border-slate-100 pt-5 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">Mais opções</span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                Já vem configurado do jeito que funciona melhor. Só mexa se precisar.
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${moreOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {moreOpen && (
            <div className="mt-4 space-y-4">
              {needKeyword && (
                <>
                  <div>
                    <FieldLabel>Como comparar as palavras</FieldLabel>
                    <SegmentedControl
                      options={MATCH_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                      value={draft.matchMode}
                      onChange={(value) => patch({ matchMode: value })}
                      {...(lockedToContains ? { disabled: true } : {})}
                    />
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {lockedToContains
                        ? 'Quando a mensagem precisa ter todas as palavras, a comparação é sempre "Tem a palavra".'
                        : matchMode?.description[kind]}
                    </p>
                  </div>

                  {draft.keywords.length > 1 && (
                    <div>
                      <FieldLabel>Quantas palavras precisam aparecer</FieldLabel>
                      <SegmentedControl
                        options={[
                          { value: 'ANY' as KeywordLogic, label: 'Basta uma' },
                          { value: 'ALL' as KeywordLogic, label: 'Todas' },
                        ]}
                        value={draft.keywordLogic}
                        onChange={handleKeywordLogic}
                      />
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {draft.keywordLogic === 'ALL'
                          ? 'Só responde se todas as palavras aparecerem, em qualquer ordem.'
                          : 'Responde se qualquer uma das palavras aparecer. É o mais indicado.'}
                      </p>
                    </div>
                  )}

                  <Checkbox
                    checked={draft.caseSensitive}
                    onChange={(checked) => patch({ caseSensitive: checked })}
                    label="Diferenciar maiúsculas de minúsculas"
                    description='Ligado, "Quero" e "quero" contam como palavras diferentes. Recomendamos deixar desligado.'
                  />
                </>
              )}

              {commentLike && draft.commentReplyEnabled && (
                <div className="space-y-2">
                  <FieldLabel optional>Outras formas de responder no comentário</FieldLabel>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A cada comentário sorteamos uma das frases, para o perfil não repetir sempre a mesma.
                  </p>
                  {extraReplies.map((message, offset) => {
                    const index = offset + 1;
                    return (
                      <div key={index}>
                        <div className="flex items-start gap-2">
                          <Textarea
                            wrapperClassName="flex-1"
                            value={message}
                            onChange={(event) => updateReply(index, event.target.value)}
                            placeholder="Outra forma de dizer a mesma coisa"
                            rows={2}
                            maxLength={COMMENT_REPLY_MAX}
                          />
                          <button
                            type="button"
                            onClick={() => patch({
                              commentReplyMessages: draft.commentReplyMessages.filter((_, i) => i !== index),
                            })}
                            aria-label="Remover esta frase"
                            className="mt-1 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="flex justify-end">
                          <span className="mt-1.5 shrink-0">
                            <CharCounter value={message.length} max={COMMENT_REPLY_MAX} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {draft.commentReplyMessages.length < COMMENT_REPLY_OPTIONS_MAX && (
                    <button
                      type="button"
                      onClick={() => patch({ commentReplyMessages: [...draft.commentReplyMessages, ''] })}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Plus size={14} />
                      Adicionar outra frase
                    </button>
                  )}
                </div>
              )}

              <div>
                <FieldLabel>Formato da resposta</FieldLabel>
                <TileGroup options={typeOptions} value={draft.replyType} onChange={handleReplyType} />
                {commentLike && !hasText(draft.replyType) && (
                  <Callout tone="success" className="mt-2">
                    A mídia chega no Direct de quem comentou, mesmo que a pessoa não siga você, desde que o comentário
                    seja dos últimos 7 dias.
                  </Callout>
                )}
              </div>

              {isInstagram && hasText(draft.replyType) && draft.linkUrl.trim() && (
                <div>
                  <FieldLabel optional htmlFor="automation-link-description">Descrição do link</FieldLabel>
                  <Textarea
                    id="automation-link-description"
                    value={draft.linkDescription}
                    maxLength={LINK_DESCRIPTION_MAX}
                    onChange={(event) => {
                      patch({ linkDescription: event.target.value });
                      clearError('linkDescription');
                    }}
                    placeholder="Aparece acima do botão, no Instagram"
                    rows={2}
                    error={errors.linkDescription}
                  />
                  <div className="mt-1 flex justify-end">
                    <CharCounter value={draft.linkDescription.length} max={LINK_DESCRIPTION_MAX} />
                  </div>
                </div>
              )}

              {commentLike && (
                <Checkbox
                  checked={draft.oncePerUser}
                  onChange={(checked) => patch({ oncePerUser: checked })}
                  label="Mandar o Direct só uma vez por pessoa"
                  description="Quem comentar várias vezes não recebe a mesma mensagem de novo. Recomendamos deixar ligado."
                />
              )}
            </div>
          )}
        </section>

        <FormSection
          title="Testar antes de ativar"
          description={commentLike
            ? 'Escreva um comentário como se fosse um cliente e veja se a automação responderia.'
            : 'Escreva uma mensagem como se fosse um cliente e veja se a automação responderia.'}
        >
          <Input
            value={testText}
            onChange={(event) => setTestText(event.target.value)}
            placeholder={commentLike ? 'Ex.: quero saber mais!' : 'Ex.: qual o preço?'}
            leftIcon={<FlaskConical size={16} />}
            aria-label={commentLike ? 'Comentário de teste' : 'Mensagem de teste'}
          />

          {simulation && (
            <Callout tone={simulation.tone}>
              <span className="block font-semibold">{simulation.title}</span>
              <span className="block">{simulation.detail}</span>
              {simulation.fires && kind === 'COMMENT' && draft.postFilter === 'SPECIFIC' && (
                <span className="mt-1 block">Lembre: só vale nos posts escolhidos.</span>
              )}
              {simulation.fires && commentLike && draft.oncePerUser && (
                <span className="mt-1 block">Se a mesma pessoa comentar de novo, ela não recebe o Direct outra vez.</span>
              )}
            </Callout>
          )}

          <AutomationPreview kind={kind} draft={draft} sampleText={testText} fires={simulation?.fires ?? true} />
        </FormSection>

        <ModalActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={editing ? 'Salvar alterações' : 'Salvar e ativar'}
          loading={saving}
          loadingText="Salvando..."
        />
      </div>
    </Modal>
  );
}
