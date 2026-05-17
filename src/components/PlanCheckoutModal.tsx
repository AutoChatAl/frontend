'use client';

import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  User,
} from 'lucide-react';
import { useState } from 'react';

import { subscriptionService } from '@/services/subscription.service';
import type { Plan } from '@/types/Subscription';

import Button from './Button';
import Modal from './Modal';
import { useToast, ToastContainer } from './Toast';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (process.env.NODE_ENV !== 'production' && !stripePublicKey) {
  console.error('[PlanCheckoutModal] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured — card payments will fail.');
}
const stripePromise = loadStripe(stripePublicKey ?? '');

type Step = 'personal' | 'card' | 'success';

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function formatCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(digits[10]);
}

function formatPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

interface PersonalFormProps {
  onNext: (data: { name: string; cpf: string; phone: string }) => void;
  plan: Plan;
  initialName?: string;
  initialCpf?: string;
  initialPhone?: string;
}

function PersonalForm({ onNext, plan, initialName = '', initialCpf = '', initialPhone = '' }: PersonalFormProps) {
  const [name, setName] = useState(initialName);
  const [cpf, setCpf] = useState(initialCpf ? formatCPF(initialCpf) : '');
  const [phone, setPhone] = useState(initialPhone ? formatPhone(initialPhone) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome obrigatório';
    if (!isValidCPF(cpf)) e.cpf = 'CPF inválido';
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length < 10) e.phone = 'Telefone inválido';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext({ name: name.trim(), cpf: cpf.replace(/\D/g, ''), phone: phone.replace(/\D/g, '') });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg mb-2">
        <div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide">Plano selecionado</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{plan.name}</p>
        </div>
        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {formatBRL(plan.priceCents)}<span className="text-xs font-normal text-slate-500">/mês</span>
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
          placeholder="Seu nome completo"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          CPF <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => { setCpf(formatCPF(e.target.value)); setErrors((prev) => ({ ...prev, cpf: '' })); }}
          placeholder="000.000.000-00"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Telefone <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => { setPhone(formatPhone(e.target.value)); setErrors((prev) => ({ ...prev, phone: '' })); }}
          placeholder="(00) 00000-0000"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <Button type="submit" className="w-full justify-center mt-2">
        <User size={16} className="mr-1" /> Continuar
      </Button>
    </form>
  );
}

// ── Card payment step ─────────────────────────────────────────────────

interface CardFormProps {
  plan: Plan;
  personal: { name: string; cpf: string; phone: string };
  onSuccess: () => void;
  onBack: () => void;
}

function CardForm({ plan, personal, onSuccess, onBack }: CardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) { setLoading(false); return; }

    // Create payment method
    const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber,
      billing_details: { name: personal.name, phone: personal.phone },
    });

    if (pmError) {
      addToast('error', pmError.message ?? 'Erro ao processar cartão.');
      setLoading(false);
      return;
    }

    // Call backend subscribe endpoint
    let result: { success: boolean; requiresAction?: boolean; clientSecret?: string } | null = null;
    try {
      result = await subscriptionService.subscribe(plan.slug, paymentMethod.id, personal);
    } catch (err: any) {
      addToast('error', err?.message ?? 'Pagamento recusado.');
      setLoading(false);
      return;
    }

    if (!result) {
      addToast('error', 'Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
      return;
    }

    if (result.requiresAction && result.clientSecret) {
      // Handle 3D Secure
      const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret);
      if (confirmError) {
        addToast('error', confirmError.message ?? 'Autenticação do cartão falhou.');
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onSuccess();
  };

  const elementOptions = {
    style: {
      base: {
        fontSize: '14px',
        color: '#374151',
        fontFamily: 'inherit',
        '::placeholder': { color: '#9ca3af' },
      },
      invalid: { color: '#ef4444' },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-1"
      >
        <ArrowLeft size={13} /> Voltar aos dados pessoais
      </button>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
        <Lock size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Seus dados são criptografados e processados com segurança pelo Stripe. Nunca armazenamos os dados completos do cartão.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Número do Cartão</label>
        <div className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <CardNumberElement options={elementOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Validade</label>
          <div className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CVV</label>
          <div className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full justify-center" disabled={loading || !stripe}>
        <CreditCard size={16} className="mr-1" />
        {loading ? 'Processando...' : `Pagar ${formatBRL(plan.priceCents)}/mês`}
      </Button>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </form>
  );
}

// ── Main modal ────────────────────────────────────────────────────────

interface PlanCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onSuccess: () => void;
  initialPersonal?: { name?: string; cpf?: string; phone?: string };
}

export default function PlanCheckoutModal({ isOpen, onClose, plan, onSuccess, initialPersonal }: PlanCheckoutModalProps) {
  const [step, setStep] = useState<Step>('personal');
  const [personal, setPersonal] = useState({
    name: initialPersonal?.name ?? '',
    cpf: initialPersonal?.cpf ?? '',
    phone: initialPersonal?.phone ?? '',
  });

  const handleClose = () => {
    setStep('personal');
    setPersonal({ name: initialPersonal?.name ?? '', cpf: initialPersonal?.cpf ?? '', phone: initialPersonal?.phone ?? '' });
    onClose();
  };

  const handleSuccess = () => {
    setStep('success');
    onSuccess();
    setTimeout(handleClose, 2000);
  };

  const stepTitle: Record<Step, string> = {
    personal: 'Seus dados',
    card: 'Pagamento com cartão',
    success: 'Pagamento confirmado!',
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={stepTitle[step]} size="sm">
      {step === 'success' ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <CheckCircle2 size={48} className="text-emerald-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
            Assinatura ativada com sucesso!
          </p>
        </div>
      ) : step === 'personal' ? (
        <PersonalForm
          plan={plan}
          initialName={personal.name}
          initialCpf={personal.cpf}
          initialPhone={personal.phone}
          onNext={(data) => { setPersonal(data); setStep('card'); }}
        />
      ) : (
        <Elements stripe={stripePromise}>
          <CardForm
            plan={plan}
            personal={personal}
            onSuccess={handleSuccess}
            onBack={() => setStep('personal')}
          />
        </Elements>
      )}
    </Modal>
  );
}
