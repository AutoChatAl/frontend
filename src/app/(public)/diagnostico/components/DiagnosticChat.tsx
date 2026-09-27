'use client';
import { useDiagnosticChat } from '../useDiagnosticChat';
import AnswerPanel from './AnswerPanel';
import ChatHeader from './ChatHeader';
import ChatThread from './ChatThread';
import DiagnosisResult from './DiagnosisResult';

/**
 * Pensada primeiro para o celular. No computador a página ocupa a janela toda,
 * como o WhatsApp Web: cabeçalho, conversa e painel vão de ponta a ponta, e o
 * conteúdo de cada um fica numa coluna larga no centro (`max-w-4xl`).
 */
export default function DiagnosticChat() {
  const { messages, typing, step, progress, outcome, answerChoice, answerInput } = useDiagnosticChat();

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-100 dark:bg-slate-900">
      <ChatHeader progress={progress} />
      <ChatThread messages={messages} typing={typing} />
      {step && <AnswerPanel key={step.key} step={step} onChoose={answerChoice} onSubmit={answerInput} />}
      {outcome && <DiagnosisResult outcome={outcome} />}
    </div>
  );
}
