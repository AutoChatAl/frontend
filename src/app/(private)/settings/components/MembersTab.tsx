'use client';

import { Loader2, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import { authService, type AuthUser } from '@/services/auth.service';

export default function MembersTab() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUnavailable, setShowUnavailable] = useState(false);

  useEffect(() => {
    const cached = authService.getUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    authService
      .fetchMe()
      .then((u) => setUser(u))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const userName = user?.name || user?.email?.split('@')[0] || '';
  const userEmail = user?.email || '';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'A';

  return (
    <>
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
              Equipe
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Gerencie quem tem acesso ao painel.</p>
          </div>
          <Button size="sm" icon={<Plus size={14} />} className="self-start sm:self-auto" onClick={() => setShowUnavailable(true)}>
            Convidar Membro
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-3 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
                </div>
              </div>
              <Badge type="admin" text="Administrador" />
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showUnavailable} onClose={() => setShowUnavailable(false)} title="Funcionalidade Indisponível" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            O convite de membros ainda não está disponível.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setShowUnavailable(false)} size="md">Entendi</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
