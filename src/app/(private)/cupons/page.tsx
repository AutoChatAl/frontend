'use client';
import { Plus, TicketPercent, Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import { authService } from '@/services/auth.service';
import { couponService } from '@/services/coupon.service';
import type { Coupon, CouponRedemption, CouponDiscountType, CouponType } from '@/types/Coupon';

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}
function formatDate(value: string | null) {
  if (!value)
    return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}
function discountLabel(coupon: Coupon) {
  const amount = coupon.discountType === 'percent' ? `${coupon.value}%` : formatBRL(coupon.value);
  const period = coupon.type === 'recurring'
    ? 'todos os meses'
    : coupon.type === 'repeating'
      ? `primeiros ${coupon.durationInMonths ?? '?'} meses`
      : 'só o 1º mês';
  return `${amount} · ${period}`;
}

interface CreateCouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (coupon: Coupon) => void;
    addToast: (type: 'success' | 'error', message: string) => void;
}
function CreateCouponModal({ isOpen, onClose, onCreated, addToast }: CreateCouponModalProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('recurring');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percent');
  const [value, setValue] = useState('');
  const [durationInMonths, setDurationInMonths] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const reset = () => {
    setCode('');
    setType('recurring');
    setDiscountType('percent');
    setValue('');
    setDurationInMonths('');
    setMaxRedemptions('');
    setExpiresAt('');
    setNote('');
    setError('');
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length < 3) {
      setError('O código deve ter ao menos 3 caracteres.');
      return;
    }
    const numericValue = Number(value.replace(',', '.'));
    if (!numericValue || numericValue <= 0) {
      setError('Informe um valor de desconto válido.');
      return;
    }
    if (discountType === 'percent' && (numericValue < 1 || numericValue > 100)) {
      setError('O percentual deve estar entre 1 e 100.');
      return;
    }
    const months = Number(durationInMonths);
    if (type === 'repeating' && (!months || months < 1 || months > 36)) {
      setError('Informe a quantidade de meses (entre 1 e 36).');
      return;
    }
    setLoading(true);
    try {
      const coupon = await couponService.create({
        code: trimmedCode,
        type,
        discountType,
        // Percentual vai como inteiro; valor fixo em reais é convertido para centavos.
        value: discountType === 'percent' ? Math.round(numericValue) : Math.round(numericValue * 100),
        durationInMonths: type === 'repeating' ? months : null,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        note: note.trim() || null,
      });
      addToast('success', `Cupom ${coupon.code} criado com sucesso!`);
      onCreated(coupon);
      handleClose();
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cupom.');
    }
    finally {
      setLoading(false);
    }
  };
  return (<Modal isOpen={isOpen} onClose={handleClose} title="Novo cupom" size="md">
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Código" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex: SYNQ20" maxLength={32} required/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Dropdown label="Duração do desconto" value={type} onChange={(v) => setType(v as CouponType)} options={[
          { value: 'recurring', label: 'Todos os meses' },
          { value: 'first_month', label: 'Só o 1º mês' },
          { value: 'repeating', label: 'Primeiros X meses' },
        ]}/>
        <Dropdown label="Tipo de desconto" value={discountType} onChange={(v) => setDiscountType(v as CouponDiscountType)} options={[
          { value: 'percent', label: 'Percentual (%)' },
          { value: 'amount', label: 'Valor fixo (R$)' },
        ]}/>
      </div>
      {type === 'repeating' && (<Input label="Quantidade de meses" hint="O desconto vale nas primeiras X mensalidades" value={durationInMonths} onChange={(e) => setDurationInMonths(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 3" inputMode="numeric" required/>)}
      <Input label={discountType === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'} value={value} onChange={(e) => setValue(e.target.value)} placeholder={discountType === 'percent' ? 'Ex: 20' : 'Ex: 30,00'} inputMode="decimal" required/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Limite de usos" hint="Vazio = ilimitado" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 50" inputMode="numeric"/>
        <Input label="Validade" hint="Vazio = sem validade" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}/>
      </div>
      <Input label="Observação interna" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: Parceria com influencer X" maxLength={500}/>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
          O desconto vale apenas para a mensalidade do plano base — nunca para IA ou extras.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar cupom'}</Button>
      </div>
    </form>
  </Modal>);
}

interface RedemptionsModalProps {
    coupon: Coupon | null;
    onClose: () => void;
}
function RedemptionsModal({ coupon, onClose }: RedemptionsModalProps) {
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!coupon)
      return;
    setLoading(true);
    couponService.listRedemptions(coupon.id)
      .then(setRedemptions)
      .catch(() => setRedemptions([]))
      .finally(() => setLoading(false));
  }, [coupon]);
  return (<Modal isOpen={!!coupon} onClose={onClose} title={`Usos do cupom ${coupon?.code ?? ''}`} size="md">
    {loading ? (<p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">Carregando...</p>)
      : redemptions.length === 0 ? (<p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">Ninguém usou este cupom ainda.</p>)
        : (<div className="space-y-2 max-h-96 overflow-y-auto">
          {redemptions.map((r) => (<div key={r.id} className="flex items-center justify-between gap-3 p-3 border border-slate-100 dark:border-slate-700 rounded-xl">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{r.workspaceName ?? r.workspaceId}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {r.userName ?? '—'}{r.userEmail ? ` · ${r.userEmail}` : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Plano {r.planSlug}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(r.redeemedAt)}</p>
            </div>
          </div>))}
        </div>)}
  </Modal>);
}

export default function CouponsPage() {
  const [isRoleChecking, setIsRoleChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [redemptionsCoupon, setRedemptionsCoupon] = useState<Coupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  useEffect(() => {
    let mounted = true;
    const cachedUser = authService.getUser();
    setIsAdmin(cachedUser?.role === 'admin');
    authService.fetchMe()
      .then((user) => {
        if (mounted)
          setIsAdmin(user.role === 'admin');
      })
      .catch(() => {
        if (mounted)
          setIsAdmin(false);
      })
      .finally(() => {
        if (mounted)
          setIsRoleChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couponService.list();
      setCoupons(data);
    }
    catch {
      addToast('error', 'Erro ao carregar cupons.');
    }
    finally {
      setLoading(false);
    }
  }, [addToast]);
  useEffect(() => {
    if (isRoleChecking || !isAdmin)
      return;
    loadCoupons();
  }, [isRoleChecking, isAdmin, loadCoupons]);
  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon.id);
    try {
      const updated = await couponService.setActive(coupon.id, !coupon.isActive);
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      addToast('success', updated.isActive ? `Cupom ${updated.code} reativado.` : `Cupom ${updated.code} desativado.`);
    }
    catch {
      addToast('error', 'Erro ao atualizar cupom.');
    }
    finally {
      setTogglingId(null);
    }
  };
  if (isRoleChecking) {
    return <PageLoader message="Carregando..."/>;
  }
  if (!isAdmin) {
    notFound();
  }
  return (<div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cupons de Desconto</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
            Crie cupons para o plano base e acompanhe quem usou
        </p>
      </div>
      <Button onClick={() => setIsCreateOpen(true)} icon={<Plus size={16}/>}>Novo Cupom</Button>
    </div>

    {loading ? (<PageLoader message="Carregando cupons..."/>)
      : coupons.length === 0 ? (<EmptyState icon={<TicketPercent size={22}/>} title="Nenhum cupom criado ainda" description="Crie um cupom de desconto e compartilhe o código com seus clientes." action={{
        label: 'Criar primeiro cupom',
        icon: <Plus size={16}/>,
        onClick: () => setIsCreateOpen(true),
      }}/>)
        : (<div className="space-y-3">
          {coupons.map((coupon) => (<Card key={coupon.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <TicketPercent size={18}/>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 dark:text-white">{coupon.code}</p>
                    <Badge type={coupon.isActive ? 'success' : 'neutral'} text={coupon.isActive ? 'Ativo' : 'Inativo'}/>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {discountLabel(coupon)}
                    {coupon.expiresAt ? ` · válido até ${formatDate(coupon.expiresAt)}` : ''}
                  </p>
                  {coupon.note && (<p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{coupon.note}</p>)}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
                  {coupon.redemptionsCount}{coupon.maxRedemptions ? `/${coupon.maxRedemptions}` : ''} uso{coupon.redemptionsCount !== 1 ? 's' : ''}
                </span>
                <Button variant="secondary" size="sm" icon={<Users size={14}/>} onClick={() => setRedemptionsCoupon(coupon)}>Ver usos</Button>
                <Button variant={coupon.isActive ? 'danger' : 'primary'} size="sm" onClick={() => handleToggleActive(coupon)} disabled={togglingId === coupon.id}>
                  {togglingId === coupon.id ? '...' : coupon.isActive ? 'Desativar' : 'Reativar'}
                </Button>
              </div>
            </div>
          </Card>))}
        </div>)}

    <CreateCouponModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => loadCoupons()} addToast={addToast}/>
    <RedemptionsModal coupon={redemptionsCoupon} onClose={() => setRedemptionsCoupon(null)}/>
    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
