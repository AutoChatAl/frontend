'use client';
import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { SkeletonCards, SkeletonPage } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { authService } from '@/services/auth.service';
import { referralService } from '@/services/referral.service';
import type { AdminReferral, ReferralStatus } from '@/types/Referral';

const STATUS_FILTERS: { value: ReferralStatus | 'all'; label: string }[] = [
  { value: 'on_hold', label: 'Em análise' },
  { value: 'in_grace', label: 'Em carência' },
  { value: 'registered', label: 'Cadastradas' },
  { value: 'qualified', label: 'Confirmadas' },
  { value: 'disqualified', label: 'Não confirmadas' },
  { value: 'revoked', label: 'Revogadas' },
  { value: 'all', label: 'Todas' },
];
const STATUS_BADGE: Record<ReferralStatus, { type: string; text: string }> = {
  registered: { type: 'neutral', text: 'Cadastrou-se' },
  in_grace: { type: 'processing', text: 'Em carência' },
  qualified: { type: 'success', text: 'Confirmada' },
  on_hold: { type: 'warning', text: 'Em análise' },
  disqualified: { type: 'neutral', text: 'Não confirmada' },
  revoked: { type: 'error', text: 'Revogada' },
};
const SIGNAL_LABEL: Record<string, string> = {
  VELOCITY: 'muitas confirmações em 24h',
  SHARED_CARD: 'cartão repetido entre indicados',
  SHARED_CPF: 'CPF repetido entre indicados',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '—';
}

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
  addToast: (type: 'success' | 'error', message: string) => void;
}
function AttributeModal({ isOpen, onClose, onDone, addToast }: AttributeModalProps) {
  const [workspaceId, setWorkspaceId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const close = () => {
    setWorkspaceId('');
    setCode('');
    setError('');
    onClose();
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId.trim() || code.trim().length < 3) {
      setError('Informe o ID do workspace indicado e o código de quem indicou.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await referralService.adminAttribute(workspaceId.trim(), code.trim());
      addToast('success', 'Indicação atribuída.');
      onDone();
      close();
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atribuir a indicação.');
    }
    finally {
      setLoading(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={close} title="Atribuir indicação manualmente" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Para quem pagou por PIX, foi liberado à mão ou esqueceu o código. Só funciona antes da primeira fatura paga do indicado.
        </p>
        <Input label="ID do workspace indicado" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} required/>
        <Input label="Código de quem indicou" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required/>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close} disabled={loading}>Cancelar</Button>
          <Button type="submit" loading={loading} loadingText="Atribuindo...">Atribuir</Button>
        </div>
      </form>
    </Modal>
  );
}

interface RevokeModalProps {
  referral: AdminReferral | null;
  onClose: () => void;
  onDone: () => void;
  addToast: (type: 'success' | 'error', message: string) => void;
}
function RevokeModal({ referral, onClose, onDone, addToast }: RevokeModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!referral) return;
    setLoading(true);
    try {
      await referralService.adminRevoke(referral.id, reason.trim());
      addToast('success', 'Indicação revogada.');
      setReason('');
      onDone();
      onClose();
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Falha ao revogar.');
    }
    finally {
      setLoading(false);
    }
  };
  return (
    <Modal isOpen={!!referral} onClose={onClose} title="Revogar indicação" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          O crédito ainda não usado de {referral?.referrerWorkspaceName ?? 'quem indicou'} é cancelado e os 5% do indicado deixam de valer. Isso não pode ser desfeito.
        </p>
        <Input label="Motivo (interno)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500}/>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={submit} loading={loading} loadingText="Revogando...">Revogar</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Painel interno do programa de indicação — só para a equipe Synq (role 'admin'). */
export default function ReferralsAdminPage() {
  const [isRoleChecking, setIsRoleChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<ReferralStatus | 'all'>('on_hold');
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<AdminReferral | null>(null);
  const [isAttributeOpen, setIsAttributeOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  useEffect(() => {
    let mounted = true;
    setIsAdmin(authService.getUser()?.role === 'admin');
    authService.fetchMe()
      .then((user) => mounted && setIsAdmin(user.role === 'admin'))
      .catch(() => mounted && setIsAdmin(false))
      .finally(() => mounted && setIsRoleChecking(false));
    return () => {
      mounted = false;
    };
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReferrals(await referralService.adminList(filter === 'all' ? undefined : filter));
    }
    catch {
      addToast('error', 'Erro ao carregar indicações.');
    }
    finally {
      setLoading(false);
    }
  }, [filter, addToast]);
  useEffect(() => {
    if (isRoleChecking || !isAdmin) return;
    load();
  }, [isRoleChecking, isAdmin, load]);
  const approve = async (referral: AdminReferral) => {
    setBusyId(referral.id);
    try {
      await referralService.adminApprove(referral.id);
      addToast('success', 'Indicação aprovada e crédito liberado.');
      await load();
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Falha ao aprovar.');
    }
    finally {
      setBusyId(null);
    }
  };
  if (isRoleChecking) {
    return <SkeletonPage><SkeletonCards count={4}/></SkeletonPage>;
  }
  if (!isAdmin) {
    notFound();
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Indicações</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Revise as indicações retidas e corrija atribuições.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <Dropdown value={filter} onChange={(value) => setFilter(value as ReferralStatus | 'all')} options={STATUS_FILTERS} wrapperClassName="sm:w-48"/>
          <Button onClick={() => setIsAttributeOpen(true)} icon={<Plus size={16}/>}>Atribuir</Button>
        </div>
      </div>

      {loading ? (<SkeletonCards count={4}/>)
        : referrals.length === 0 ? (<EmptyState title="Nenhuma indicação neste filtro" description="Troque o filtro para ver outras indicações."/>)
          : (
            <div className="space-y-3">
              {referrals.map((referral) => {
                const badge = STATUS_BADGE[referral.status];
                const canRevoke = referral.status !== 'revoked';
                return (
                  <Card key={referral.id} className="p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-800 dark:text-white">
                            {referral.refereeWorkspaceName ?? referral.refereeWorkspaceId}
                          </p>
                          <Badge type={badge.type} text={badge.text}/>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Indicado por {referral.referrerWorkspaceName ?? referral.referrerWorkspaceId} · código {referral.code} · cadastro {formatDate(referral.createdAt)}
                          {referral.firstPaidAt ? ` · 1ª fatura ${formatDate(referral.firstPaidAt)}` : ''}
                        </p>
                        {referral.fraudSignals.length > 0 && (
                          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                            Retida por: {referral.fraudSignals.map((signal) => SIGNAL_LABEL[signal] ?? signal).join(', ')}
                          </p>
                        )}
                        {referral.disqualifiedReason && (
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Motivo: {referral.disqualifiedReason}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                        {referral.status === 'on_hold' && (
                          <Button size="sm" onClick={() => approve(referral)} loading={busyId === referral.id}>Aprovar</Button>
                        )}
                        {canRevoke && (
                          <Button size="sm" variant="ghost" onClick={() => setRevoking(referral)} disabled={busyId === referral.id}>Revogar</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

      <AttributeModal isOpen={isAttributeOpen} onClose={() => setIsAttributeOpen(false)} onDone={load} addToast={addToast}/>
      <RevokeModal referral={revoking} onClose={() => setRevoking(null)} onDone={load} addToast={addToast}/>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </div>
  );
}
