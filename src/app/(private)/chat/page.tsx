import { MessagesSquare } from 'lucide-react';

import EmptyState from '@/components/EmptyState';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Chat</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          Todas as conversas de WhatsApp e Instagram em um só lugar. O histórico fica disponível por 24 horas
          a partir da última mensagem.
        </p>
      </div>

      <EmptyState
        icon={<MessagesSquare size={20} />}
        title="Tela em construção"
        description="A API do chat já está pronta — a interface de conversas chega em breve."
      />
    </div>
  );
}
