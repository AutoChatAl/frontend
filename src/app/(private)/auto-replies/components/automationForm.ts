import type { WorkspaceChannelType } from '@/hooks/WorkspaceChannelsHook';
import type { AutomationDraftSuggestion } from '@/types/AutomationInsights';
import type { AutoReply, CreateAutoReplyInput, ReplyType } from '@/types/AutoReply';
import type { CommentAutomation, CreateCommentAutomationInput } from '@/types/CommentAutomation';
import type { CreateLiveAutomationInput, LiveAutomation } from '@/types/LiveAutomation';

import { hasAudio, hasDocument, hasImage, hasText, isCommentLike, type AutomationKind } from './automationMeta';

export type MatchMode = 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
export type KeywordLogic = 'ANY' | 'ALL';

export const KEYWORDS_MAX = 20;

/**
 * Um rascunho só para os dois tipos de automação.
 *
 * A DM guarda os campos como `reply*` e o comentário como `dm*`, mas o
 * formulário é o mesmo — manter duas formas de estado era o que obrigava a
 * existir quatro modais quase idênticos. Aqui o estado é neutro e os
 * adaptadores no fim do arquivo traduzem para o formato de cada API.
 *
 * Tudo é string ou boolean, nunca `undefined`: com `exactOptionalPropertyTypes`
 * ligado, campo opcional dentro do estado vira ruído em cada `setState`.
 */
export interface AutomationDraft {
  channelId: string;
  channelType: WorkspaceChannelType;
  /**
   * Lista completa de palavras-chave. Uma só é o caso normal; a DM aceita
   * várias com `keywordLogic` decidindo se basta uma ou se exige todas.
   */
  keywords: string[];
  keywordLogic: KeywordLogic;
  matchMode: MatchMode;
  caseSensitive: boolean;
  /** Só comentário: dispara sem depender de palavra-chave. */
  triggerOnAnyComment: boolean;
  /** Só comentário: resposta pública embaixo do comentário. */
  commentReplyEnabled: boolean;
  commentReplyMessage: string;
  /** Só comentário e live: variações da resposta pública, sorteadas no envio. */
  commentReplyMessages: string[];
  replyType: ReplyType;
  message: string;
  audioBase64: string;
  audioMimeType: string;
  audioFileName: string;
  imageBase64: string;
  imageMimeType: string;
  imageFileName: string;
  documentBase64: string;
  documentMimeType: string;
  documentName: string;
  linkUrl: string;
  linkLabel: string;
  linkDescription: string;
  oncePerUser: boolean;
  postFilter: 'ALL' | 'SPECIFIC';
  /** Só comentário: posts em que a regra vale, quando `postFilter` é SPECIFIC. */
  postIds: string[];
  enabled: boolean;
}

export const LINK_LABEL_MAX = 100;
export const LINK_DESCRIPTION_MAX = 80;
export const MESSAGE_MAX: Record<AutomationKind, number> = { DM: 4000, COMMENT: 1000, LIVE: 1000 };
export const COMMENT_REPLY_MAX = 300;
/** Teto de variações da resposta pública. Acima disso a tela vira uma lista sem fim. */
export const COMMENT_REPLY_OPTIONS_MAX = 5;

export const DEFAULT_COMMENT_REPLIES = [
  'Oi, {{username}}! Te mandei tudo no Direct 💬',
  'Prontinho, {{username}}! Dá uma olhada no seu Direct 📩',
  'Acabei de te chamar no Direct, {{username}} 😉',
];

export function hasAdvancedMatching(draft: AutomationDraft): boolean {
  return draft.matchMode !== 'CONTAINS' || draft.caseSensitive || draft.keywordLogic === 'ALL';
}

export function emptyDraft(kind: AutomationKind): AutomationDraft {
  return {
    channelId: '',
    // Comentário só existe no Instagram; a DM começa no WhatsApp e muda com a
    // escolha do canal.
    channelType: isCommentLike(kind) ? 'INSTAGRAM' : 'WHATSAPP',
    keywords: [],
    keywordLogic: 'ANY',
    matchMode: 'CONTAINS',
    caseSensitive: false,
    triggerOnAnyComment: false,
    // A resposta pública nasce ligada no post e desligada na live: na transmissão o
    // chat corre rápido e responder cada comentário polui a tela de quem assiste.
    commentReplyEnabled: kind === 'COMMENT',
    commentReplyMessage: '',
    commentReplyMessages: isCommentLike(kind) ? [...DEFAULT_COMMENT_REPLIES] : [''],
    replyType: 'TEXT',
    message: '',
    audioBase64: '',
    audioMimeType: '',
    audioFileName: '',
    imageBase64: '',
    imageMimeType: '',
    imageFileName: '',
    documentBase64: '',
    documentMimeType: '',
    documentName: '',
    linkUrl: '',
    linkLabel: '',
    linkDescription: '',
    oncePerUser: true,
    postFilter: 'ALL',
    postIds: [],
    enabled: true,
  };
}

export function draftFromAutoReply(rule: AutoReply): AutomationDraft {
  return {
    ...emptyDraft('DM'),
    channelId: rule.channelId,
    channelType: rule.channelType,
    // Regra antiga não tem `keywords`: cair para o `keyword` singular é o que
    // impede a lista de abrir vazia e apagar o gatilho ao salvar.
    keywords: rule.keywords?.length ? rule.keywords : [rule.keyword].filter(Boolean),
    keywordLogic: rule.keywordLogic ?? 'ANY',
    matchMode: rule.matchMode,
    caseSensitive: rule.caseSensitive,
    replyType: rule.replyType,
    message: rule.replyMessage ?? '',
    audioBase64: rule.replyAudioBase64 ?? '',
    audioMimeType: rule.replyAudioMimeType ?? '',
    audioFileName: rule.replyAudioBase64 ? 'Áudio salvo' : '',
    imageBase64: rule.replyImageBase64 ?? '',
    imageMimeType: rule.replyImageMimeType ?? '',
    imageFileName: rule.replyImageBase64 ? 'Imagem salva' : '',
    documentBase64: rule.replyDocumentBase64 ?? '',
    documentMimeType: rule.replyDocumentMimeType ?? '',
    documentName: rule.replyDocumentName ?? (rule.replyDocumentBase64 ? 'Documento salvo' : ''),
    linkUrl: rule.replyLinkUrl ?? '',
    linkLabel: rule.replyLinkLabel ?? '',
    linkDescription: rule.replyLinkDescription ?? '',
    enabled: rule.enabled,
  };
}

/** A regra de live tem os mesmos campos da de comentário, menos o filtro de post. */
export function draftFromLiveAutomation(rule: LiveAutomation): AutomationDraft {
  return {
    ...emptyDraft('LIVE'),
    channelId: rule.channelId,
    channelType: 'INSTAGRAM',
    keywords: rule.keywords?.length ? rule.keywords : (rule.keyword ? [rule.keyword] : []),
    keywordLogic: rule.keywordLogic ?? 'ANY',
    matchMode: rule.matchMode,
    caseSensitive: rule.caseSensitive,
    triggerOnAnyComment: rule.triggerOnAnyComment,
    commentReplyEnabled: rule.commentReplyEnabled,
    commentReplyMessage: rule.commentReplyMessage ?? '',
    commentReplyMessages: rule.commentReplyMessages?.length
      ? rule.commentReplyMessages
      : [rule.commentReplyMessage ?? ''],
    replyType: rule.dmReplyType,
    message: rule.dmMessage ?? '',
    imageBase64: rule.dmImageBase64 ?? '',
    imageMimeType: rule.dmImageMimeType ?? '',
    imageFileName: rule.dmImageBase64 ? 'Imagem salva' : '',
    documentBase64: rule.dmDocumentBase64 ?? '',
    documentMimeType: rule.dmDocumentMimeType ?? '',
    documentName: rule.dmDocumentName ?? (rule.dmDocumentBase64 ? 'Documento salvo' : ''),
    linkUrl: rule.dmLinkUrl ?? '',
    linkLabel: rule.dmLinkLabel ?? '',
    linkDescription: rule.dmLinkDescription ?? '',
    oncePerUser: rule.oncePerUser,
    enabled: rule.enabled,
  };
}

export function draftFromCommentAutomation(rule: CommentAutomation): AutomationDraft {
  return {
    ...emptyDraft('COMMENT'),
    channelId: rule.channelId,
    channelType: 'INSTAGRAM',
    keywords: rule.keywords?.length ? rule.keywords : (rule.keyword ? [rule.keyword] : []),
    keywordLogic: rule.keywordLogic ?? 'ANY',
    matchMode: rule.matchMode,
    caseSensitive: rule.caseSensitive,
    triggerOnAnyComment: rule.triggerOnAnyComment,
    commentReplyEnabled: rule.commentReplyEnabled,
    commentReplyMessage: rule.commentReplyMessage ?? '',
    commentReplyMessages: rule.commentReplyMessages?.length
      ? rule.commentReplyMessages
      : [rule.commentReplyMessage ?? ''],
    replyType: rule.dmReplyType,
    message: rule.dmMessage ?? '',
    imageBase64: rule.dmImageBase64 ?? '',
    imageMimeType: rule.dmImageMimeType ?? '',
    imageFileName: rule.dmImageBase64 ? 'Imagem salva' : '',
    documentBase64: rule.dmDocumentBase64 ?? '',
    documentMimeType: rule.dmDocumentMimeType ?? '',
    documentName: rule.dmDocumentName ?? (rule.dmDocumentBase64 ? 'Documento salvo' : ''),
    linkUrl: rule.dmLinkUrl ?? '',
    linkLabel: rule.dmLinkLabel ?? '',
    linkDescription: rule.dmLinkDescription ?? '',
    oncePerUser: rule.oncePerUser,
    postFilter: rule.postFilter,
    postIds: rule.postIds ?? [],
    enabled: rule.enabled,
  };
}

export function draftFromSuggestion(suggestion: AutomationDraftSuggestion): Partial<AutomationDraft> {
  const commentLike = isCommentLike(suggestion.kind);
  const replies = suggestion.commentReplyMessages.map((entry) => entry.trim()).filter(Boolean);
  const draft: Partial<AutomationDraft> = {
    keywords: addKeywords([], suggestion.keywords.join(',')),
    triggerOnAnyComment: commentLike && suggestion.triggerOnAnyComment,
    message: suggestion.message,
    linkUrl: suggestion.linkUrl,
    linkLabel: suggestion.linkLabel.slice(0, LINK_LABEL_MAX),
  };
  if (commentLike && replies.length > 0) {
    draft.commentReplyEnabled = true;
    draft.commentReplyMessages = replies.slice(0, COMMENT_REPLY_OPTIONS_MAX).map((entry) => entry.slice(0, COMMENT_REPLY_MAX));
  }
  return draft;
}

/**
 * Os campos do botão de link vão sempre, mesmo vazios. Omitir um campo faz o
 * backend manter o valor antigo — seria impossível apagar um botão já salvo.
 * O schema aceita `''` explicitamente (`.url().optional().or(z.literal(''))`).
 */
export function toAutoReplyInput(draft: AutomationDraft): CreateAutoReplyInput {
  const input: CreateAutoReplyInput = {
    channelId: draft.channelId,
    channelType: draft.channelType,
    // `keyword` continua indo junto: o backend usa como rótulo e as regras
    // antigas só têm ele.
    keyword: draft.keywords[0] ?? '',
    keywords: draft.keywords,
    keywordLogic: draft.keywordLogic,
    matchMode: draft.matchMode,
    caseSensitive: draft.caseSensitive,
    replyType: draft.replyType,
    replyMessage: draft.message,
    replyLinkUrl: draft.linkUrl.trim(),
    replyLinkLabel: draft.linkLabel.trim(),
    replyLinkDescription: draft.linkDescription.trim(),
    enabled: draft.enabled,
  };
  if (draft.audioBase64) {
    input.replyAudioBase64 = draft.audioBase64;
    input.replyAudioMimeType = draft.audioMimeType;
  }
  if (draft.imageBase64) {
    input.replyImageBase64 = draft.imageBase64;
    input.replyImageMimeType = draft.imageMimeType;
  }
  if (draft.documentBase64) {
    input.replyDocumentBase64 = draft.documentBase64;
    input.replyDocumentMimeType = draft.documentMimeType;
    input.replyDocumentName = draft.documentName;
  }
  return input;
}

/** Mesmo payload da automação de comentário, sem o filtro de post. */
export function toLiveAutomationInput(draft: AutomationDraft): CreateLiveAutomationInput {
  const { postFilter: _postFilter, postIds: _postIds, ...rest } = toCommentAutomationInput(draft);
  return rest;
}

export function toCommentAutomationInput(draft: AutomationDraft): CreateCommentAutomationInput {
  const input: CreateCommentAutomationInput = {
    channelId: draft.channelId,
    // `keyword` continua indo como a primeira da lista: é o que as regras antigas e o
    // log leem. A lista completa é quem manda no casamento.
    keyword: draft.keywords[0] ?? '',
    keywords: draft.keywords,
    keywordLogic: draft.keywordLogic,
    matchMode: draft.matchMode,
    caseSensitive: draft.caseSensitive,
    triggerOnAnyComment: draft.triggerOnAnyComment,
    commentReplyEnabled: draft.commentReplyEnabled,
    commentReplyMessage: draft.commentReplyMessages.map((m) => m.trim()).find(Boolean) ?? '',
    commentReplyMessages: draft.commentReplyMessages.map((m) => m.trim()).filter(Boolean),
    dmReplyType: draft.replyType,
    dmMessage: draft.message,
    dmLinkUrl: draft.linkUrl.trim(),
    dmLinkLabel: draft.linkLabel.trim(),
    dmLinkDescription: draft.linkDescription.trim(),
    postFilter: draft.postFilter,
    postIds: draft.postFilter === 'SPECIFIC' ? draft.postIds : [],
    oncePerUser: draft.oncePerUser,
    enabled: draft.enabled,
  };
  if (draft.imageBase64) {
    input.dmImageBase64 = draft.imageBase64;
    input.dmImageMimeType = draft.imageMimeType;
  }
  if (draft.documentBase64) {
    input.dmDocumentBase64 = draft.documentBase64;
    input.dmDocumentMimeType = draft.documentMimeType;
    input.dmDocumentName = draft.documentName;
  }
  return input;
}

export const MATCH_MODE_OPTIONS: { value: MatchMode; label: string; description: Record<AutomationKind, string> }[] = [
  {
    value: 'CONTAINS',
    label: 'Tem a palavra',
    description: { DM: 'Responde se a palavra aparecer em qualquer parte da mensagem. É o mais indicado.', COMMENT: 'Responde se a palavra aparecer em qualquer parte do comentário. É o mais indicado.', LIVE: 'Responde se a palavra aparecer em qualquer parte do comentário da live. É o mais indicado.' },
  },
  {
    value: 'EXACT',
    label: 'Só a palavra',
    description: { DM: 'Responde só se a pessoa mandar exatamente a palavra, sem mais nada.', COMMENT: 'Responde só se o comentário for exatamente a palavra, sem mais nada.', LIVE: 'Responde só se o comentário da live for exatamente a palavra, sem mais nada.' },
  },
  {
    value: 'STARTS_WITH',
    label: 'Começa com',
    description: { DM: 'Responde se a mensagem começar com a palavra.', COMMENT: 'Responde se o comentário começar com a palavra.', LIVE: 'Responde se o comentário da live começar com a palavra.' },
  },
];

const ALL_REPLY_TYPES: { value: ReplyType; label: string }[] = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'AUDIO', label: 'Áudio' },
  { value: 'IMAGE', label: 'Imagem' },
  { value: 'DOCUMENT', label: 'Documento' },
  { value: 'TEXT_AND_AUDIO', label: 'Texto + áudio' },
  { value: 'TEXT_AND_IMAGE', label: 'Texto + imagem' },
  { value: 'TEXT_AND_DOCUMENT', label: 'Texto + documento' },
  { value: 'IMAGE_AND_AUDIO', label: 'Imagem + áudio' },
  { value: 'DOCUMENT_AND_AUDIO', label: 'Documento + áudio' },
];

/**
 * O Instagram não entrega documento nem por DM nem por private reply.
 *
 * E, no comentário e na live, também não entrega áudio: a DM sai por private reply
 * para quem só comentou, e o Instagram recusa anexo de áudio para quem nunca abriu
 * conversa. A opção existia e falhava no envio.
 */
export function replyTypeOptions(channelType: WorkspaceChannelType, kind: AutomationKind): { value: ReplyType; label: string }[] {
  const allowed = isCommentLike(kind)
    ? ALL_REPLY_TYPES.filter((option) => !hasAudio(option.value))
    : ALL_REPLY_TYPES;
  if (channelType !== 'INSTAGRAM') return allowed;
  return allowed.filter((option) => !hasDocument(option.value));
}

export interface ValidateDraftOptions {
  requireLink?: boolean;
}

export function validateDraft(draft: AutomationDraft, kind: AutomationKind, options: ValidateDraftOptions = {}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.channelId) {
    errors.channelId = isCommentLike(kind) ? 'Escolha a conta do Instagram' : 'Escolha onde a automação vai funcionar';
  }

  if (isCommentLike(kind) && draft.triggerOnAnyComment) {
    // Sem palavra-chave por definição.
  } else if (draft.keywords.length === 0) {
    errors.keywords = isCommentLike(kind)
      ? 'Escreva ao menos uma palavra ou escolha "Qualquer comentário"'
      : 'Escreva ao menos uma palavra';
  }

  if (options.requireLink && hasText(draft.replyType) && !draft.linkUrl.trim()) {
    errors.linkUrl = 'Cole aqui o link que a pessoa vai receber';
  }

  if (kind === 'COMMENT' && draft.postFilter === 'SPECIFIC' && draft.postIds.length === 0) {
    // O backend ignora a regra nessa situação — avisar aqui evita salvar uma
    // automação que nunca dispara.
    errors.postIds = 'Escolha ao menos um post ou volte para "Todos os posts"';
  }

  if (isCommentLike(kind) && draft.commentReplyEnabled && !draft.commentReplyMessages.some((m) => m.trim())) {
    errors.commentReplyMessage = 'Escreva a resposta que vai aparecer no comentário';
  }

  if (hasText(draft.replyType) && !draft.message.trim()) {
    errors.message = isCommentLike(kind) ? 'Escreva a mensagem que vai no Direct' : 'Escreva a mensagem de resposta';
  }
  if (!isCommentLike(kind) && hasAudio(draft.replyType) && !draft.audioBase64) {
    errors.audio = 'Envie um arquivo de áudio';
  }
  if (hasImage(draft.replyType) && !draft.imageBase64) {
    errors.image = 'Envie uma imagem';
  }
  if (hasDocument(draft.replyType) && !draft.documentBase64) {
    errors.document = 'Envie um documento';
  }

  const linkUrl = draft.linkUrl.trim();
  if (linkUrl && !/^https?:\/\/.+/.test(linkUrl)) {
    errors.linkUrl = 'Confira o link: ele precisa começar com https:// (ex.: https://minhaloja.com)';
  }
  if (draft.linkLabel.trim().length > LINK_LABEL_MAX) {
    errors.linkLabel = `O texto do botão deve ter no máximo ${LINK_LABEL_MAX} caracteres`;
  }
  if (draft.linkDescription.trim().length > LINK_DESCRIPTION_MAX) {
    errors.linkDescription = `A descrição deve ter no máximo ${LINK_DESCRIPTION_MAX} caracteres`;
  }

  return errors;
}

/**
 * Aceita a palavra digitada e devolve a lista já limpa.
 *
 * Vírgula e Enter separam, porque colar "quero, comprar, preço" é o jeito mais
 * natural de preencher isso. Duplicata sai: com ALL ela apertaria o filtro sem
 * motivo e com ANY não muda nada.
 */
export function addKeywords(current: string[], raw: string): string[] {
  const seen = new Set(current.map((entry) => entry.toLowerCase()));
  const next = [...current];
  for (const piece of raw.split(',')) {
    const value = piece.trim();
    if (!value || seen.has(value.toLowerCase()) || next.length >= KEYWORDS_MAX) continue;
    seen.add(value.toLowerCase());
    next.push(value);
  }
  return next;
}
