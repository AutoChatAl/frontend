'use client';

import { Sparkles } from 'lucide-react';

export default function DashboardPreview() {
  return (
    <section className="pb-20 px-4 -mt-20 relative z-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-900 p-2 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-white/5 relative aspect-video group">
            <div className="absolute inset-0 bg-linear-to-t from-indigo-900/50 to-transparent z-10 pointer-events-none"></div>
            <div className="bg-slate-50 w-full h-full flex flex-col p-6 overflow-hidden">
              <div className="flex gap-6 h-full">
                <div className="w-64 bg-white border border-slate-100 rounded-xl hidden md:flex flex-col p-4 gap-4 shadow-sm">
                  <div className="h-8 bg-indigo-50 rounded-lg w-3/4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-10 bg-slate-50 rounded-lg w-full"></div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-white border border-slate-100 rounded-xl shadow-lg flex flex-col overflow-hidden relative">
                  <div className="h-16 border-b border-slate-100 flex items-center px-6 justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100"></div>
                      <div className="space-y-1">
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                        <div className="h-2 bg-slate-100 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-50/50 p-6 space-y-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-bounce">
                        <Sparkles size={18} /> IA Gerando Resposta...
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-md h-20 w-full"></div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-indigo-600 opacity-90 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-md h-24 w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
