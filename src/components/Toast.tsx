'use client';

import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

export interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto max-w-sm animate-in slide-in-from-right-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-800'
              : 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          )}
          <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
