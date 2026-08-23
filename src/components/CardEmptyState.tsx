interface CardEmptyStateProps {
    message: string;
    /** Ação opcional (ex.: um Link) exibida abaixo da mensagem. */
    action?: React.ReactNode;
    className?: string;
}

/**
 * Estado vazio PARA DENTRO de cards: mensagem centralizada (horizontal e
 * vertical) com ação opcional. Para páginas inteiras, use o EmptyState.
 */
export default function CardEmptyState({ message, action, className }: CardEmptyStateProps) {
  return (<div className={`flex-1 min-h-24 flex flex-col items-center justify-center gap-1 text-center py-4 ${className ?? ''}`}>
    <p className="text-[13px] text-slate-400 dark:text-slate-500">{message}</p>
    {action}
  </div>);
}
