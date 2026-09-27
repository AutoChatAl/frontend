'use client';
import { Check, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { ChatMessage } from '../types';
import RichText from './RichText';

type Side = 'bot' | 'me';

// Um atraso por pontinho do "digitando…". Classes escritas por extenso para o Tailwind encontrá-las.
const TYPING_DOTS = ['[animation-delay:0ms]', '[animation-delay:170ms]', '[animation-delay:340ms]'];

const ANALYZING_STEP_MS = 420;

const sideOf = (message: ChatMessage): Side => (message.from === 'me' ? 'me' : 'bot');

/** A pontinha do balão, como no WhatsApp: só no primeiro balão de uma sequência. */
function BubbleTail({ side }: { side: Side }) {
  return side === 'bot' ? (
    <svg viewBox="0 0 8 12" aria-hidden="true" className="absolute -left-2 top-0 h-3 w-2 fill-white dark:fill-slate-800">
      <path d="M0 0h8v12z" />
    </svg>
  ) : (
    <svg viewBox="0 0 8 12" aria-hidden="true" className="absolute -right-2 top-0 h-3 w-2 fill-emerald-100 dark:fill-emerald-800">
      <path d="M8 0H0v12z" />
    </svg>
  );
}

interface BubbleProps {
  side: Side;
  continued: boolean;
  className?: string;
  children: ReactNode;
}

function Bubble({ side, continued, className = '', children }: BubbleProps) {
  const tone = side === 'bot'
    ? 'self-start bg-white text-slate-900 dark:bg-slate-800 dark:text-white'
    : 'self-end bg-emerald-100 text-slate-900 dark:bg-emerald-800 dark:text-white';
  const corner = side === 'bot' ? 'rounded-tl-none' : 'rounded-tr-none';
  return (
    <div className={`relative max-w-[85%] animate-bubble-in rounded-lg shadow-xs lg:max-w-[70%] ${tone} ${continued ? 'mt-1' : `mt-3 ${corner}`} ${className}`}>
      {!continued && <BubbleTail side={side} />}
      {children}
    </div>
  );
}

function MessageTime({ time, read = false }: { time: string; read?: boolean }) {
  return (
    <span className="float-right -mb-1 ml-3 mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
      {time}
      {read && <CheckCheck size={14} className="text-blue-500 dark:text-blue-400" aria-label="Lida" />}
    </span>
  );
}

function AnalyzingBubble({ items, continued }: { items: string[]; continued: boolean }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= items.length) return;
    const timer = setTimeout(() => setVisible((count) => count + 1), ANALYZING_STEP_MS);
    return () => clearTimeout(timer);
  }, [visible, items.length]);

  return (
    <Bubble side="bot" continued={continued} className="px-4 py-3">
      <p className="text-sm font-semibold">Analisando sua operação...</p>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, visible).map((item) => (
          <li key={item} className="flex animate-bubble-in items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Check size={14} className="shrink-0 text-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
    </Bubble>
  );
}

function TypingBubble({ continued }: { continued: boolean }) {
  return (
    <Bubble side="bot" continued={continued} className="px-4 py-3.5">
      <span className="sr-only">Synq está digitando</span>
      <span className="flex gap-1" aria-hidden="true">
        {TYPING_DOTS.map((delay) => (
          <span key={delay} className={`h-2 w-2 animate-typing rounded-full bg-slate-400 dark:bg-slate-500 ${delay}`} />
        ))}
      </span>
    </Bubble>
  );
}

interface ChatThreadProps {
  messages: ChatMessage[];
  typing: boolean;
}

export default function ChatThread({ messages, typing }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Segue o fim da conversa sempre que algo muda de tamanho: balão novo, o "analisando"
  // crescendo item a item, ou a área encolhendo quando o painel de respostas abre.
  useEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const stickToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    const observer = new ResizeObserver(stickToBottom);
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const last = messages[messages.length - 1];

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
      <div ref={contentRef} className="mx-auto flex max-w-4xl flex-col" aria-live="polite" aria-relevant="additions">
        <span className="self-center rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-xs dark:bg-slate-800 dark:text-slate-400">
          HOJE
        </span>

        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const continued = previous !== undefined && sideOf(previous) === sideOf(message);

          if (message.from === 'analyzing') {
            return <AnalyzingBubble key={message.id} items={message.items} continued={continued} />;
          }
          if (message.from === 'me') {
            return (
              <Bubble key={message.id} side="me" continued={continued} className="px-3 pb-1.5 pt-2 text-base leading-snug">
                {message.text}
                <MessageTime time={message.time} read />
              </Bubble>
            );
          }
          return (
            <Bubble key={message.id} side="bot" continued={continued} className="px-3 pb-1.5 pt-2 text-base leading-snug">
              <RichText text={message.text} />
              <MessageTime time={message.time} />
            </Bubble>
          );
        })}

        {typing && <TypingBubble continued={last !== undefined && sideOf(last) === 'bot'} />}
      </div>
    </div>
  );
}
