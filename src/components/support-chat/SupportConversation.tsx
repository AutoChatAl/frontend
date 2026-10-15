'use client';
import { Clock, ImagePlus, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import Textarea from '@/components/Textarea';
import { useSupportChat } from '@/contexts/SupportChatContext';
import { MAX_SUPPORT_CHAT_IMAGE_BYTES } from '@/utils/supportChat';

interface SupportConversationProps {
  draft: string;
  onDraftChange: (value: string) => void;
  focusOnMount: boolean;
  whatsappLink: string | null;
  onOpenHelp: () => void;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] ?? '' : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SupportConversation({ draft, onDraftChange, focusOnMount, whatsappLink, onOpenHelp }: SupportConversationProps) {
  const { isOpen, loading, sending, messages, error, closedConversationMessage, workspaceConfigured, startNewConversation, sendMessage } = useSupportChat();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToLatestMessage = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    scrollToLatestMessage();
  }, [isOpen, messages, closedConversationMessage, scrollToLatestMessage]);

  const clearImage = () => {
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setImageFile(null);
      setUploadError('');
      return;
    }
    if (nextFile.size > MAX_SUPPORT_CHAT_IMAGE_BYTES) {
      clearImage();
      setUploadError('Não são permitidas imagens acima de 2 MB.');
      return;
    }
    setImageFile(nextFile);
    setUploadError('');
  };

  const handleSubmit = async () => {
    if (!workspaceConfigured) return;
    const payload: { body?: string; imageBase64?: string; imageMimeType?: string } = {};
    if (draft.trim()) {
      payload.body = draft.trim();
    }
    if (imageFile) {
      payload.imageBase64 = await fileToBase64(imageFile);
      payload.imageMimeType = imageFile.type;
    }
    await sendMessage(payload);
    onDraftChange('');
    setUploadError('');
    clearImage();
  };

  const canWrite = workspaceConfigured && !closedConversationMessage;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-2 border-b border-slate-100 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
        <Clock size={14} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400"/>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Uma pessoa da nossa equipe responde por aqui em até 24 horas. Para resolver agora, veja os{' '}
          <button type="button" onClick={onOpenHelp} className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            artigos de ajuda
          </button>
          {whatsappLink ? (
            <>
              {' '}ou{' '}
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
                chame no WhatsApp
              </a>
              .
            </>
          ) : '.'}
        </p>
      </div>

      <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900">
        {!workspaceConfigured && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            O chat com a nossa equipe está indisponível no momento. Os artigos de ajuda continuam disponíveis.
          </div>
        )}

        {closedConversationMessage ? (
          <div className="flex min-h-full items-center justify-center py-6">
            <div className="w-full rounded-lg border border-slate-200 bg-white px-5 py-6 text-center shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Conversa encerrada</h4>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{closedConversationMessage}</p>
              <Button size="sm" onClick={startNewConversation} className="mx-auto mt-4">
                Iniciar nova conversa
              </Button>
            </div>
          </div>
        ) : workspaceConfigured && messages.length === 0 && !loading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Como podemos ajudar?</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Conte o que você estava tentando fazer e onde parou. Se puder, mande uma foto da tela: isso ajuda a gente a responder mais rápido.
            </p>
          </div>
        ) : null}

        {!closedConversationMessage && messages.map((message, index) => {
          const isVisitor = message.senderType === 'VISITOR';
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const currentDay = new Date(message.createdAt).toDateString();
          const previousDay = previousMessage ? new Date(previousMessage.createdAt).toDateString() : null;
          const showDateSeparator = !previousDay || previousDay !== currentDay;
          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="mb-2 flex justify-center">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-lg border px-3 py-2.5 text-sm shadow-xs dark:shadow-none ${isVisitor
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'}`}
                >
                  {message.body && <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>}
                  {message.imageBase64 && (
                    <img
                      src={`data:${message.imageMimeType || 'image/png'};base64,${message.imageBase64}`}
                      alt="Imagem enviada no suporte"
                      className="mt-2 max-h-56 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className={`mt-1.5 text-[11px] ${isVisitor ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {canWrite && (
        <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <Textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={3}
            autoFocus={focusOnMount}
            placeholder="Escreva sua mensagem..."
            aria-label="Mensagem para a equipe de suporte"
          />

          {imageFile && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <span className="truncate">{imageFile.name}</span>
              <button type="button" onClick={clearImage} aria-label="Remover imagem" className="flex shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400">
                <X size={14}/>
              </button>
            </div>
          )}

          {(uploadError || error) && (
            <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              {uploadError || error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
            />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} icon={<ImagePlus size={14}/>}>
              Imagem
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={sending || (!draft.trim() && !imageFile)}
              loading={sending}
              loadingText="Enviando..."
              icon={<Send size={14}/>}
            >
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
