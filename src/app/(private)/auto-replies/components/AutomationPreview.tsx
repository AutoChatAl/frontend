'use client';
import { FileText, Image as ImageIcon, Mic } from 'lucide-react';

import { whatsAppToHtml } from '@/utils/whatsappFormat';

import type { AutomationDraft } from './automationForm';
import { hasAudio, hasDocument, hasImage, hasText, isCommentLike, type AutomationKind } from './automationMeta';

const BUBBLE = 'rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';

function withUsername(text: string): string {
  return text.replace(/\{\{username\}\}/gi, '@usuario');
}

/**
 * O WhatsApp interpreta `*negrito*` e companhia; o Instagram não. A prévia
 * mostra exatamente o que cada plataforma vai renderizar, senão ela mente.
 */
function MessageBody({ text, formatted, bold }: { text: string; formatted: boolean; bold?: boolean }) {
  const tone = bold ? 'font-semibold text-slate-900 dark:text-white' : '';
  if (formatted) {
    return (
      <div
        className={`wrap-break-word ${tone}`}
        dangerouslySetInnerHTML={{ __html: whatsAppToHtml(text, { codeClassName: 'rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-700/60' }) }}
      />
    );
  }
  return <p className={`whitespace-pre-wrap wrap-break-word ${tone}`}>{text}</p>;
}

/**
 * Mesma ordem do card que o Instagram monta e do que a listagem mostra:
 * título, descrição, botão, destino. A descrição fica junto do título porque as
 * duas são o corpo do card; a linha separa só a área do botão.
 */
function LinkCard({ label, url }: { label: string; url: string }) {
  return (
    <div className="border-t border-slate-100 px-3 py-2.5 dark:border-slate-700">
      <div className="rounded-xl bg-indigo-600 py-2 text-center text-sm font-semibold text-white">
        {label || 'Saiba mais'}
      </div>
      <p className="mt-1.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{url}</p>
    </div>
  );
}

function Attachment({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className={`${BUBBLE} flex items-center gap-2 text-indigo-600 dark:text-indigo-400`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function Caption({ children }: { children: string }) {
  return <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{children}</p>;
}

export default function AutomationPreview({ kind, draft }: { kind: AutomationKind; draft: AutomationDraft }) {
  const formatted = draft.channelType !== 'INSTAGRAM';
  const showText = hasText(draft.replyType) && draft.message.trim().length > 0;
  const showLink = draft.linkUrl.trim().length > 0;
  const commentReply = isCommentLike(kind) && draft.commentReplyEnabled && draft.commentReplyMessage.trim().length > 0;
  // No Instagram com botão a mensagem vira o `title` do generic template, e o
  // Instagram renderiza esse campo em negrito por conta própria.
  const isInstagramCard = draft.channelType === 'INSTAGRAM' && showLink;

  const hasAnything = showText
    || commentReply
    || (hasAudio(draft.replyType) && draft.audioBase64)
    || (hasImage(draft.replyType) && draft.imageBase64)
    || (hasDocument(draft.replyType) && draft.documentBase64);

  if (!hasAnything) return null;

  const triggerLabel = isCommentLike(kind)
    ? (draft.triggerOnAnyComment
      ? (kind === 'LIVE' ? 'Qualquer comentário na live' : 'Qualquer comentário')
      : (kind === 'LIVE' ? 'Comentário na live' : 'Comentário'))
    : 'Mensagem recebida';
  const answerLabel = isCommentLike(kind) ? 'DM enviada' : 'Resposta automática';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Prévia</p>

      <div className="space-y-4">
        {(draft.keywords.length > 0 || draft.triggerOnAnyComment) && (
          <div>
            <Caption>{triggerLabel}</Caption>
            {draft.triggerOnAnyComment ? (
              <div className={`${BUBBLE} inline-block max-w-[85%]`}>
                <span className="italic text-slate-400 dark:text-slate-500">qualquer texto no comentário</span>
              </div>
            ) : (
              <>
                {/* Com ALL a mensagem real traz as palavras juntas; com ANY cada
                    uma dispara sozinha. A prévia mostra os dois casos como são. */}
                {draft.keywordLogic === 'ALL' && draft.keywords.length > 1 ? (
                  <div className={`${BUBBLE} inline-block max-w-[85%]`}>
                    {draft.keywords.join(' ... ')}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.keywords.map((keyword) => (
                      <span key={keyword} className={`${BUBBLE} inline-block max-w-full truncate`}>{keyword}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {commentReply && (
          <div>
            <Caption>Resposta pública no comentário</Caption>
            <div className={`${BUBBLE} ml-6 inline-block max-w-[85%]`}>
              <MessageBody text={withUsername(draft.commentReplyMessage)} formatted={false} />
            </div>
          </div>
        )}

        <div>
          <Caption>{answerLabel}</Caption>
          <div className="max-w-[85%] space-y-2">
            {showText && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <div className="px-3 py-2">
                  <MessageBody
                    text={withUsername(draft.message)}
                    formatted={formatted}
                    {...(isInstagramCard ? { bold: true } : {})}
                  />
                  {showLink && draft.linkDescription && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{draft.linkDescription}</p>
                  )}
                </div>
                {showLink && <LinkCard label={draft.linkLabel} url={draft.linkUrl} />}
              </div>
            )}
            {hasAudio(draft.replyType) && draft.audioBase64 && (
              <Attachment icon={<Mic size={14} />} label="Mensagem de áudio" />
            )}
            {hasImage(draft.replyType) && draft.imageBase64 && (
              <Attachment icon={<ImageIcon size={14} />} label={draft.imageFileName || 'Imagem anexada'} />
            )}
            {hasDocument(draft.replyType) && draft.documentBase64 && (
              <Attachment icon={<FileText size={14} />} label={draft.documentName || 'Documento anexado'} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
