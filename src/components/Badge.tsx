export default function Badge({ type, text, icon: Icon, pill = false }: { type: string; text: string; icon?: React.ComponentType<{ size: number }>; pill?: boolean }) {
  const styles = {
    whatsapp: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    instagram: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20',
    mixed: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    processing: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    tag: 'bg-slate-100 text-slate-600 border-slate-200 font-normal dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600',
    admin: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    collaborator: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    error: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };

  return (
    <span className={`text-xs font-semibold flex items-center gap-1 w-fit transition-colors duration-200 ${pill ? 'px-2 py-0.5 rounded-full' : 'px-2.5 py-1 rounded-md border'} ${styles[type as keyof typeof styles] || styles.neutral}`}>
      {Icon && <Icon size={12} />}
      {text}
    </span>
  );
};
