'use client';
import { AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AudioPicker from '@/components/AudioPicker';
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
  emptyDraft,
  draftFromAutoReply,
  draftFromCommentAutomation,
  KEYWORDS_MAX,
  LINK_DESCRIPTION_MAX,
  LINK_LABEL_MAX,
  MATCH_MODE_OPTIONS,
  MESSAGE_MAX,
  replyTypeOptions,
  toAutoReplyInput,
  toCommentAutomationInput,
  validateDraft,
  type AutomationDraft,
  type KeywordLogic,
} from './automationForm';
import { hasAudio, hasDocument, hasImage, hasText, type AutomationKind, type AutomationRow } from './automationMeta';
import AutomationPreview from './AutomationPreview';

interface AutomationModalProps {
  isOpen: boolean;
  /** Tipo a criar. Ignorado quando `automation` vem preenchido. */
  kind: AutomationKind;
  /** Preenchido = edição; ausente = criação. */
  automation?: AutomationRow | null;
  channels: WorkspaceChannel[];
  channelsLoading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const TITLES: Record<AutomationKind, { create: string; edit: string }> = {
  DM: { create: 'Nova auto-resposta', edit: 'Editar auto-resposta' },
  COMMENT: { create: 'Nova automação de comentário', edit: 'Editar automação de comentário' },
};

function readAsBase64(file: File, onDone: (base64: string) => void): void {
  const reader = new FileReader();
  reader.onload = () => {
    onDone((reader.result as string).split(',')[1] ?? '');
  };
  reader.readAsDataURL(file);
}

/**
 * Um único modal para as quatro combinações (DM/comentário × criar/editar).
 *
 * Antes eram quatro arquivos com o mesmo formulário copiado, o que fazia
 * qualquer ajuste de estilo precisar ser feito quatro vezes — e, na prática,
 * eles já tinham divergido entre si. O que muda entre os casos está isolado em
 * `kind`, `editing` e nos adaptadores de `automationForm.ts`.
 */
export default function AutomationModal({
  isOpen,
  kind: kindProp,
  automation,
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

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setPostsFor('');
    if (editing?.kind === 'DM') setDraft(draftFromAutoReply(editing.rule));
    else if (editing?.kind === 'COMMENT') setDraft(draftFromCommentAutomation(editing.rule));
    else setDraft(emptyDraft(kind));
  }, [isOpen, editing, kind]);

  // Comentário só existe no Instagram — a lista nem deve oferecer o resto.
  const pickableChannels = useMemo(
    () => (kind === 'COMMENT' ? channels.filter((channel) => channel.type === 'INSTAGRAM') : channels),
    [channels, kind],
  );

  const isInstagram = draft.channelType === 'INSTAGRAM';
  const messageMax = MESSAGE_MAX[kind];
  const typeOptions = replyTypeOptions(draft.channelType);

  // Publicações da conta, para o seletor de post. Só carrega quando a seção
  // aparece: é uma chamada à Graph API que a maioria das automações não precisa.
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

  const handleChannel = (channel: WorkspaceChannel) => {
    setDraft((prev) => {
      const next: AutomationDraft = { ...prev, channelId: channel.id, channelType: channel.type };
      if (channel.type === 'INSTAGRAM') {
        // O Instagram mostra `*asterisco*` literal e não entrega documento.
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
    clearError('channelId');
  };

  /**
   * "Todas as palavras" só existe com CONTAINS: exigir que a mensagem seja
   * *exatamente* duas palavras diferentes nunca casaria. Em vez de deixar criar
   * uma regra morta, o modo é corrigido junto — o backend faz o mesmo ao gravar.
   */
  const handleKeywordLogic = (logic: KeywordLogic) => {
    patch(logic === 'ALL' ? { keywordLogic: logic, matchMode: 'CONTAINS' } : { keywordLogic: logic });
  };

  const handleImage = (file: File) => {
    const mime = (file.type || '').toLowerCase();
    const acceptedMimes = kind === 'COMMENT'
      ? ['image/png', 'image/jpeg', 'image/jpg']
      : ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const acceptedExt = kind === 'COMMENT' ? /\.(png|jpe?g)$/i : /\.(png|jpe?g|webp)$/i;
    if (!acceptedMimes.includes(mime) && !acceptedExt.test(file.name)) {
      setErrors((prev) => ({
        ...prev,
        image: kind === 'COMMENT' ? 'A imagem deve ser PNG ou JPEG.' : 'A imagem deve ser PNG, JPEG ou WEBP.',
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
    const found = validateDraft(draft, kind);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      if (kind === 'DM') {
        const input = toAutoReplyInput(draft);
        if (editing) await autoReplyService.update(editing.id, input);
        else await autoReplyService.create(input);
      } else {
        const input = toCommentAutomationInput(draft);
        if (editing) await commentAutomationService.update(editing.id, input);
        else await commentAutomationService.create(input);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Não foi possível salvar a automação' });
    } finally {
      setSaving(false);
    }
  };

  const matchMode = MATCH_MODE_OPTIONS.find((option) => option.value === draft.matchMode);
  const needKeyword = !(kind === 'COMMENT' && draft.triggerOnAnyComment);
  // Só a auto-resposta de DM aceita várias palavras hoje.
  const multiKeyword = kind === 'DM';
  const lockedToContains = multiKeyword && draft.keywords.length > 1 && draft.keywordLogic === 'ALL';
  const answerTitle = kind === 'COMMENT' ? 'Mensagem na DM' : 'Resposta';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? TITLES[kind].edit : TITLES[kind].create}
      size="md"
    >
      <div className="space-y-5">
        {errors.general && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            <p className="flex-1 text-sm text-red-700 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        <FormSection
          title="Canal"
          description={kind === 'COMMENT'
            ? 'Automação de comentário funciona apenas em contas do Instagram.'
            : 'Onde a automação fica escutando as mensagens recebidas.'}
        >
          <ChannelPicker
            channels={pickableChannels}
            loading={channelsLoading}
            value={draft.channelId}
            onChange={handleChannel}
            emptyMessage={kind === 'COMMENT'
              ? 'Nenhuma conta do Instagram conectada.'
              : 'Nenhum canal disponível. Conecte um canal primeiro.'}
            error={errors.channelId}
          />
        </FormSection>

        <FormSection title="Gatilho" description="O que precisa acontecer para a automação disparar.">
          {kind === 'COMMENT' && (
            <Checkbox
              checked={draft.triggerOnAnyComment}
              onChange={(checked) => {
                patch({ triggerOnAnyComment: checked });
                clearError('keyword');
              }}
              label="Qualquer comentário"
              description="Dispara para todos os comentários, sem depender do conteúdo"
            />
          )}

          {needKeyword && (
            <>
              <div>
                <FieldLabel required>{multiKeyword ? 'Palavras-chave' : 'Palavra-chave'}</FieldLabel>
                <KeywordsInput
                  values={draft.keywords}
                  max={multiKeyword ? KEYWORDS_MAX : 1}
                  onChange={(values) => {
                    patch({ keywords: values });
                    clearError('keywords');
                  }}
                  onAdd={(raw) => {
                    setDraft((prev) => ({
                      ...prev,
                      keywords: addKeywords(multiKeyword ? prev.keywords : [], raw).slice(0, multiKeyword ? KEYWORDS_MAX : 1),
                    }));
                    clearError('keywords');
                  }}
                  placeholder={kind === 'COMMENT' ? 'Ex.: quero' : 'Ex.: quero comprar'}
                  error={errors.keywords}
                />
              </div>

              {multiKeyword && draft.keywords.length > 1 && (
                <div>
                  <FieldLabel>Quando disparar</FieldLabel>
                  <SegmentedControl
                    options={[
                      { value: 'ANY' as KeywordLogic, label: 'Alguma delas' },
                      { value: 'ALL' as KeywordLogic, label: 'Todas elas' },
                    ]}
                    value={draft.keywordLogic}
                    onChange={handleKeywordLogic}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {draft.keywordLogic === 'ALL'
                      ? 'A mensagem precisa conter todas as palavras da lista, em qualquer ordem.'
                      : 'Basta uma das palavras aparecer na mensagem.'}
                  </p>
                </div>
              )}

              <div>
                <FieldLabel>Modo de correspondência</FieldLabel>
                <SegmentedControl
                  options={MATCH_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                  value={draft.matchMode}
                  onChange={(value) => patch({ matchMode: value })}
                  {...(lockedToContains ? { disabled: true } : {})}
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {lockedToContains
                    ? 'Com "todas elas" o modo é sempre "Contém" — uma mensagem não pode ser exatamente duas palavras diferentes.'
                    : matchMode?.description[kind]}
                </p>
              </div>

              <Checkbox
                checked={draft.caseSensitive}
                onChange={(checked) => patch({ caseSensitive: checked })}
                label="Diferenciar maiúsculas e minúsculas"
                description='Com isso ligado, "Quero" e "quero" são tratados como palavras diferentes'
              />
            </>
          )}
        </FormSection>

        {kind === 'COMMENT' && (
          <FormSection title="Resposta pública" description="O que a automação escreve embaixo do comentário, visível para todo mundo.">
            <Checkbox
              checked={draft.commentReplyEnabled}
              onChange={(checked) => {
                patch({ commentReplyEnabled: checked });
                clearError('commentReplyMessage');
              }}
              label="Responder o comentário publicamente"
            />

            {draft.commentReplyEnabled && (
              <div>
                <Textarea
                  value={draft.commentReplyMessage}
                  onChange={(event) => {
                    patch({ commentReplyMessage: event.target.value });
                    clearError('commentReplyMessage');
                  }}
                  placeholder="Ex.: Obrigado pelo comentário {{username}}! Já mandei tudo no seu direct."
                  rows={3}
                  maxLength={COMMENT_REPLY_MAX}
                  error={errors.commentReplyMessage}
                />
                <div className="flex items-start justify-between gap-3">
                  <UsernameInserter
                    onInsert={() => patch({ commentReplyMessage: `${draft.commentReplyMessage}{{username}}` })}
                  />
                  <span className="mt-1.5 shrink-0">
                    <CharCounter value={draft.commentReplyMessage.length} max={COMMENT_REPLY_MAX} />
                  </span>
                </div>
              </div>
            )}
          </FormSection>
        )}

        <FormSection
          title={answerTitle}
          description={kind === 'COMMENT'
            ? 'Enviada no direct de quem comentou.'
            : 'Enviada automaticamente para quem mandou a palavra-chave.'}
        >
          <div>
            <FieldLabel>Tipo de conteúdo</FieldLabel>
            <TileGroup
              options={typeOptions}
              value={draft.replyType}
              onChange={(value) => {
                patch({ replyType: value });
                setErrors((prev) => ({ ...prev, message: '', audio: '', image: '', document: '' }));
              }}
            />
            {kind === 'COMMENT' && !hasText(draft.replyType) && (
              <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                A mídia é entregue via <strong>Private Reply</strong> do Instagram, pelo ID do comentário: funciona mesmo
                se a pessoa nunca te mandou DM nem te segue, desde que tenha comentado nos últimos 7 dias.
              </p>
            )}
          </div>

          {hasText(draft.replyType) && (
            <div>
              <FieldLabel required>Mensagem</FieldLabel>
              {isInstagram ? (
                <Textarea
                  value={draft.message}
                  onChange={(event) => {
                    patch({ message: event.target.value });
                    clearError('message');
                  }}
                  placeholder={kind === 'COMMENT'
                    ? 'Ex.: Oi {{username}}! Aqui está o link que você pediu.'
                    : 'Ex.: Aqui está o seu link: https://exemplo.com'}
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
                  placeholder="Digite a mensagem com formatação do WhatsApp..."
                  rows={5}
                  maxLength={messageMax}
                  error={errors.message}
                />
              )}
              <div className="flex items-start justify-between gap-3">
                {kind === 'COMMENT'
                  ? <UsernameInserter onInsert={() => patch({ message: `${draft.message}{{username}}` })} />
                  : <span />}
                <span className="mt-1.5 shrink-0">
                  <CharCounter value={draft.message.length} max={messageMax} />
                </span>
              </div>
            </div>
          )}

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
              maxBytes={kind === 'COMMENT' ? AUDIO_UPLOAD.comment.maxBytes : AUDIO_UPLOAD.autoReply.maxBytes}
              accept={kind === 'COMMENT' ? AUDIO_UPLOAD.comment.accept : AUDIO_UPLOAD.autoReply.accept}
              validateUpload={kind === 'COMMENT' ? validateCommentAudioFile : validateAudioFile}
              error={errors.audio}
            />
          )}

          {hasImage(draft.replyType) && (
            <FileField
              label="Imagem"
              accept={kind === 'COMMENT' ? '.png,.jpg,.jpeg,image/png,image/jpeg' : 'image/png,image/jpeg,image/webp'}
              hint={kind === 'COMMENT'
                ? 'Clique para enviar uma imagem (PNG ou JPEG, máx. 10MB)'
                : 'Clique para enviar uma imagem (máx. 10MB)'}
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
              hint="Clique para enviar um documento (máx. 10MB)"
              fileName={draft.documentName}
              onPick={handleDocument}
              onRemove={() => patch({ documentBase64: '', documentMimeType: '', documentName: '' })}
              error={errors.document}
            />
          )}

          {hasText(draft.replyType) && (
            <div className="space-y-3">
              <div>
                <FieldLabel optional htmlFor="automation-link-url">Link do botão</FieldLabel>
                <Input
                  id="automation-link-url"
                  type="url"
                  value={draft.linkUrl}
                  onChange={(event) => {
                    patch({ linkUrl: event.target.value });
                    clearError('linkUrl');
                  }}
                  placeholder="https://exemplo.com/oferta"
                  error={errors.linkUrl}
                />
              </div>

              {draft.linkUrl.trim() && (
                <>
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

                  {isInstagram && (
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
                        placeholder="Aparece acima do botão, no card do Instagram"
                        rows={2}
                        error={errors.linkDescription}
                      />
                      <div className="mt-1 flex justify-end">
                        <CharCounter value={draft.linkDescription.length} max={LINK_DESCRIPTION_MAX} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </FormSection>

        {kind === 'COMMENT' && (
          <FormSection title="Onde vale" description="Em quais publicações a automação fica escutando os comentários.">
            <SegmentedControl
              options={[
                { value: 'ALL' as const, label: 'Todos os posts' },
                { value: 'SPECIFIC' as const, label: 'Posts específicos' },
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
          </FormSection>
        )}

        {kind === 'COMMENT' && (
          <FormSection title="Opções">
            <Checkbox
              checked={draft.oncePerUser}
              onChange={(checked) => patch({ oncePerUser: checked })}
              label="Enviar a DM apenas uma vez por pessoa"
              description="Evita repetir a mesma DM para quem comentar várias vezes"
            />
          </FormSection>
        )}

        <AutomationPreview kind={kind} draft={draft} />

        <ModalActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={editing ? 'Salvar alterações' : 'Criar automação'}
          loading={saving}
          loadingText={editing ? 'Salvando...' : 'Criando...'}
        />
      </div>
    </Modal>
  );
}
