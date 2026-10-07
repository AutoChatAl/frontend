'use client';
import { Bot, RotateCcw, Send } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import SectionHeader from '@/components/SectionHeader';
import { aiService } from '@/services/ai.service';
import {
  AI_SIMULATION_MAX_ASSISTANT_CHARS,
  AI_SIMULATION_MAX_CHARS,
  AI_SIMULATION_MAX_MESSAGES,
  type AiSimulationMessage,
} from '@/types/AI';

interface AISimulatorProps {
    profileId?: string;
    className?: string;
    onReply?: () => void;
}

interface ChatBubble extends AiSimulationMessage {
    id: number;
}

const SUGGESTIONS = [
  'Oi, tudo bem?',
  'Quanto custa?',
  'Qual o horário de atendimento?',
  'Como faço para comprar?',
];

function limitText({ role, text }: AiSimulationMessage): AiSimulationMessage {
  return { role, text: text.slice(0, role === 'assistant' ? AI_SIMULATION_MAX_ASSISTANT_CHARS : AI_SIMULATION_MAX_CHARS) };
}

export default function AISimulator({ profileId, className = '', onReply }: AISimulatorProps) {
  const onReplyRef = useRef(onReply);
  useEffect(() => {
    onReplyRef.current = onReply;
  });
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef(0);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const restart = useCallback(() => {
    conversationRef.current += 1;
    setMessages([]);
    setDraft('');
    setTyping(false);
    setError(null);
  }, []);

  useEffect(() => {
    restart();
  }, [profileId, restart]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, typing, error]);

  const requestReply = useCallback(async (history: ChatBubble[]) => {
    const conversation = conversationRef.current;
    setTyping(true);
    setError(null);
    try {
      const reply = await aiService.simulate({
        ...(profileId ? { profileId } : {}),
        messages: history.slice(-AI_SIMULATION_MAX_MESSAGES).map(limitText),
      });
      if (conversation !== conversationRef.current) {
        return;
      }
      idRef.current += 1;
      const answer: ChatBubble = { id: idRef.current, role: 'assistant', text: reply };
      setMessages((prev) => [...prev, answer]);
      onReplyRef.current?.();
    }
    catch (err) {
      if (conversation !== conversationRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Não foi possível testar a IA agora. Tente de novo em instantes.');
    }
    finally {
      if (conversation === conversationRef.current) {
        setTyping(false);
      }
    }
  }, [profileId]);

  const send = useCallback((text: string) => {
    const content = text.trim().slice(0, AI_SIMULATION_MAX_CHARS);
    if (!content || typing) {
      return;
    }
    idRef.current += 1;
    const question: ChatBubble = { id: idRef.current, role: 'user', text: content };
    const history = [...messages, question];
    setMessages(history);
    setDraft('');
    void requestReply(history);
    inputRef.current?.focus();
  }, [messages, typing, requestReply]);

  const retry = useCallback(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user' || typing) {
      return;
    }
    void requestReply(messages);
  }, [messages, typing, requestReply]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(draft);
  };

  const lastIsCustomer = messages[messages.length - 1]?.role === 'user';

  return (
    <Card className={`p-4 ${className}`}>
      <SectionHeader
        title="Teste sua IA"
        hint="Converse como se você fosse um cliente. Nada é enviado de verdade para ninguém."
        action={messages.length > 0
          ? (<Button variant="ghost" size="sm" icon={<RotateCcw size={14}/>} onClick={restart}>
            Recomeçar
          </Button>)
          : undefined}
      />

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversa de teste com a IA"
        className="flex h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 sm:h-96 dark:border-slate-700 dark:bg-slate-900"
      >
        {messages.length === 0 && !typing ? (
          <CardEmptyState
            message="Mande uma mensagem como se fosse um cliente e veja como a IA responde."
            action={
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            }
          />
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex animate-bubble-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <span className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                  <Bot size={14} className="text-violet-600 dark:text-violet-400"/>
                </span>
              )}
              <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm shadow-xs dark:shadow-none ${
                message.role === 'user'
                  ? 'rounded-tr-none bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'rounded-tl-none border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
              }`}>
                {message.text}
              </p>
            </div>
          ))
        )}

        {typing && (
          <div className="flex animate-bubble-in justify-start" aria-label="A IA está digitando">
            <span className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
              <Bot size={14} className="text-violet-600 dark:text-violet-400"/>
            </span>
            <span className="flex items-center gap-1 rounded-lg rounded-tl-none border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
              <span className="h-1.5 w-1.5 animate-typing rounded-full bg-slate-400 dark:bg-slate-500"/>
              <span className="h-1.5 w-1.5 animate-typing rounded-full bg-slate-400 [animation-delay:170ms] dark:bg-slate-500"/>
              <span className="h-1.5 w-1.5 animate-typing rounded-full bg-slate-400 [animation-delay:340ms] dark:bg-slate-500"/>
            </span>
          </div>
        )}
      </div>

      {error && (
        <Callout tone="warning" className="mt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            {lastIsCustomer && (
              <Button variant="secondary" size="sm" icon={<RotateCcw size={14}/>} onClick={retry} className="w-full justify-center sm:w-auto">
                Tentar de novo
              </Button>
            )}
          </div>
        </Callout>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <label htmlFor="ai-simulator-input" className="sr-only">Mensagem do cliente</label>
        <input
          id="ai-simulator-input"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={AI_SIMULATION_MAX_CHARS}
          placeholder="Escreva como se fosse o cliente..."
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!draft.trim() || typing}
          aria-label="Enviar mensagem de teste"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Send size={16}/>
        </button>
      </form>
    </Card>
  );
}
