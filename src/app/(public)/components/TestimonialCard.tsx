'use client';

import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  content: string;
}

export default function TestimonialCard({ name, role, company, avatar, rating, content }: TestimonialCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
          {avatar}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white">{name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {role} • {company}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
        ))}
      </div>

      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">&ldquo;{content}&rdquo;</p>
    </div>
  );
}
