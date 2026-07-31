'use client';
import { BarChart3, Bot } from 'lucide-react';
import { notFound } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import { aiSpendService } from '@/services/ai-spend.service';
import { authService } from '@/services/auth.service';
import type { AiSpendRow } from '@/types/AiSpend';

import SpendPieChart, { type SpendSlice } from './components/SpendPieChart';

/**
 * Um gasto de IA fica na casa de centésimos de centavo, então duas casas decimais
 * mostrariam R$ 0,00 na maioria das linhas. Só valores acima de R$ 1 usam o formato
 * monetário curto.
 */
function formatBRL(cents: number): string {
  const reais = cents / 100;
  const decimals = reais >= 1 ? 2 : 4;
  return `R$ ${reais.toFixed(decimals).replace('.', ',')}`;
}

function buildSlices(row: AiSpendRow): SpendSlice[] {
  return [
    {
      key: 'reply',
      label: 'Resposta IA',
      cents: row.replyCents,
      fillClass: 'fill-indigo-500',
      swatchClass: 'bg-indigo-500',
    },
    {
      key: 'transcription',
      label: 'Transcrição de áudio',
      cents: row.transcriptionCents,
      fillClass: 'fill-amber-500 dark:fill-amber-600',
      swatchClass: 'bg-amber-500 dark:bg-amber-600',
    },
    {
      key: 'funnel',
      label: 'Funil',
      cents: row.funnelCents,
      fillClass: 'fill-emerald-500 dark:fill-emerald-600',
      swatchClass: 'bg-emerald-500 dark:bg-emerald-600',
    },
  ];
}

interface SpendDetailModalProps {
  row: AiSpendRow | null;
  onClose: () => void;
}
function SpendDetailModal({ row, onClose }: SpendDetailModalProps) {
  if (!row) return null;
  const slices = buildSlices(row);
  return (
    <Modal isOpen onClose={onClose} title="Distribuição dos gastos com IA" size="md">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-700">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {row.userName || 'Usuário sem nome'}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{row.userEmail || '—'}</p>
            <p className="mt-1 truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.userId}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatBRL(row.totalCents)}</p>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">US$ {row.totalUsd.toFixed(6)}</p>
          </div>
        </div>

        {row.totalCents > 0 ? (
          <SpendPieChart slices={slices} totalCents={row.totalCents} formatValue={formatBRL} />
        ) : (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Este usuário ainda não tem gasto registrado.
          </p>
        )}
      </div>
    </Modal>
  );
}

export default function AiSpendsPage() {
  const [isRoleChecking, setIsRoleChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<AiSpendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AiSpendRow | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    let mounted = true;
    const cachedUser = authService.getUser();
    setIsAdmin(cachedUser?.role === 'admin');
    authService.fetchMe()
      .then((user) => {
        if (mounted) setIsAdmin(user.role === 'admin');
      })
      .catch(() => {
        if (mounted) setIsAdmin(false);
      })
      .finally(() => {
        if (mounted) setIsRoleChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadSpends = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await aiSpendService.list());
    }
    catch {
      addToast('error', 'Erro ao carregar os gastos com IA.');
    }
    finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isRoleChecking || !isAdmin) return;
    loadSpends();
  }, [isRoleChecking, isAdmin, loadSpends]);

  const totals = useMemo(() => rows.reduce(
    (acc, row) => ({
      reply: acc.reply + row.replyCents,
      transcription: acc.transcription + row.transcriptionCents,
      funnel: acc.funnel + row.funnelCents,
      total: acc.total + row.totalCents,
    }),
    { reply: 0, transcription: 0, funnel: 0, total: 0 },
  ), [rows]);

  if (isRoleChecking) {
    return <PageLoader message="Verificando permissões" />;
  }
  if (!isAdmin) {
    notFound();
  }
  if (loading) {
    return <PageLoader message="Carregando gastos com IA" />;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <BarChart3 size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white sm:text-2xl">Gastos com IA</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consumo por usuário. Clique em uma linha para ver a distribuição.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Bot size={40} />}
          title="Nenhum gasto registrado"
          description="Os gastos aparecem aqui conforme os usuários consomem IA em respostas, transcrições e no funil."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/30">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Usuário</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">E-mail</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">userId</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Resposta IA</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Transcrição</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Funil</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.workspaceId}:${row.userId}`}
                    onClick={() => setSelected(row)}
                    className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {row.userName || 'Sem nome'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.userEmail || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">{row.userId}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                      {formatBRL(row.replyCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                      {formatBRL(row.transcriptionCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                      {formatBRL(row.funnelCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {formatBRL(row.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/30">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200" colSpan={3}>
                    {rows.length} {rows.length === 1 ? 'usuário' : 'usuários'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatBRL(totals.reply)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatBRL(totals.transcription)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatBRL(totals.funnel)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {formatBRL(totals.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <SpendDetailModal row={selected} onClose={() => setSelected(null)} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
