'use client';

interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <p className="text-slate-600 dark:text-slate-300 font-medium">{label}</p>
    </div>
  );
}
