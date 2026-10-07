import { ArrowRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface DashboardEmptyHintProps {
  icon: LucideIcon;
  message: string;
  actionLabel: string;
  href: string;
  compact?: boolean;
  className?: string;
}

export default function DashboardEmptyHint({ icon: Icon, message, actionLabel, href, compact = false, className = '' }: DashboardEmptyHintProps) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-2 text-center ${compact ? 'py-2' : 'min-h-24 py-4'} ${className}`}>
      {!compact && (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
          <Icon size={18} />
        </span>
      )}
      <p className="max-w-sm text-[13px] text-slate-500 dark:text-slate-400">{message}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-all hover:scale-105 hover:bg-indigo-100 active:scale-95 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
      >
        {actionLabel} <ArrowRight size={12} />
      </Link>
    </div>
  );
}
