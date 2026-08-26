export default function Card({ children, className }: {
    children: React.ReactNode;
    className?: string;
}) {
  return (<div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs dark:shadow-none ${className}`}>
    {children}
  </div>);
}
