import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = 'Carregando...' }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
        <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  );
}
