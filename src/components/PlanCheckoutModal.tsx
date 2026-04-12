'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Lock,
  QrCode,
  RefreshCw,
  User,
} from 'lucide-react';

import Modal from './Modal';
import Button from './Button';
import { subscriptionService } from '@/services/subscription.service';
import type { Plan } from '@/types/Subscription';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

type Step = 'personal' | 'card' | 'pix' | 'success';

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

function formatPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// ── Personal data step ────────────────────────────────────────────────

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
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) e.cpf = 'CPF inválido';
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
  onPixFallback: () => void;
  onBack: () => void;
}

function CardForm({ plan, personal, onSuccess, onPixFallback, onBack }: CardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardDeclined, setCardDeclined] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    setCardDeclined(false);

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) { setLoading(false); return; }

    // Create payment method
    const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber,
      billing_details: { name: personal.name, phone: personal.phone },
    });

    if (pmError) {
      setError(pmError.message ?? 'Erro ao processar cartão.');
      setLoading(false);
      return;
    }

    // Call backend subscribe endpoint
    let result: { success: boolean; requiresAction?: boolean; clientSecret?: string } | null = null;
    try {
      result = await subscriptionService.subscribe(plan.slug, paymentMethod.id, personal);
    } catch (err: any) {
      const msg = err?.message ?? 'Pagamento recusado.';
      setError(msg);
      setCardDeclined(true);
      setLoading(false);
      return;
    }

    if (!result) {
      setError('Erro ao processar pagamento. Tente novamente.');
      setCardDeclined(true);
      setLoading(false);
      return;
    }

    if (result.requiresAction && result.clientSecret) {
      // Handle 3D Secure
      const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret);
      if (confirmError) {
        setError(confirmError.message ?? 'Autenticação do cartão falhou.');
        setCardDeclined(true);
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

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full justify-center" disabled={loading || !stripe}>
        <CreditCard size={16} className="mr-1" />
        {loading ? 'Processando...' : `Pagar ${formatBRL(plan.priceCents)}/mês`}
      </Button>

      {cardDeclined && (
        <button
          type="button"
          onClick={onPixFallback}
          className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
        >
          Pagar com PIX em vez disso
        </button>
      )}
    </form>
  );
}

// ── PIX payment step ──────────────────────────────────────────────────

interface PixStepProps {
  plan: Plan;
  onDone: () => void;
}

function PixStep({ plan, onDone }: PixStepProps) {
  const [pixData, setPixData] = useState<{
    qrCodeImageUrl: string | null;
    qrCodeString: string | null;
    expiresAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const loadPixData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await subscriptionService.createPixIntent(plan.slug);
    if (data) {
      setPixData({ qrCodeImageUrl: data.qrCodeImageUrl, qrCodeString: data.qrCodeString, expiresAt: data.expiresAt });
    } else {
      setError('Não foi possível gerar o QR Code PIX.');
    }
    setLoading(false);
  }, [plan.slug]);

  useEffect(() => { loadPixData(); }, [loadPixData]);

  useEffect(() => {
    if (!pixData?.expiresAt) return;
    const tick = () => {
      const diff = new Date(pixData.expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expirado'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pixData?.expiresAt]);

  const handleCopy = async () => {
    if (!pixData?.qrCodeString) return;
    await navigator.clipboard.writeText(pixData.qrCodeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide">Pagar via PIX</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{plan.name}</p>
        </div>
        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {formatBRL(plan.priceCents)}<span className="text-xs font-normal text-slate-500">/mês</span>
        </span>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerando QR Code...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button size="sm" variant="secondary" onClick={loadPixData}>
            <RefreshCw size={14} className="mr-1" /> Tentar novamente
          </Button>
        </div>
      )}

      {pixData && !loading && (
        <>
          <div className="flex flex-col items-center gap-3">
            {pixData.qrCodeImageUrl ? (
              <div className="p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pixData.qrCodeImageUrl} alt="QR Code PIX" className="w-44 h-44 object-contain" />
              </div>
            ) : (
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
                <QrCode size={72} className="text-slate-400" />
                <p className="text-xs text-slate-500">Use o código copia e cola abaixo</p>
              </div>
            )}

            {timeLeft && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Clock size={12} />
                <span>Expira em: <strong>{timeLeft}</strong></span>
              </div>
            )}
          </div>

          {pixData.qrCodeString && (
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Código PIX copia e cola:</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={pixData.qrCodeString}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 truncate font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 shrink-0"
                  title="Copiar código"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Como pagar:</p>
            <ol className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-none">
              <li>1. Abra o app do seu banco</li>
              <li>2. Escolha pagar com PIX</li>
              <li>3. Escaneie o QR Code ou use o código copia e cola</li>
              <li>4. Confirme o pagamento — ativação é automática</li>
            </ol>
          </div>
        </>
      )}

      <Button className="w-full justify-center" onClick={onDone}>
        <CheckCircle2 size={16} className="mr-1" /> Já paguei
      </Button>
    </div>
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
    pix: 'Pagar com PIX',
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
      ) : step === 'card' ? (
        <Elements stripe={stripePromise}>
          <CardForm
            plan={plan}
            personal={personal}
            onSuccess={handleSuccess}
            onPixFallback={() => setStep('pix')}
            onBack={() => setStep('personal')}
          />
        </Elements>
      ) : (
        <PixStep plan={plan} onDone={handleSuccess} />
      )}
    </Modal>
  );
}
