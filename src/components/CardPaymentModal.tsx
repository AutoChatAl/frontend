'use client';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { useTheme } from '@/contexts/ThemeContext';
import { subscriptionService } from '@/services/subscription.service';

import Button from './Button';
import Modal from './Modal';
import { useToast, ToastContainer } from './Toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

/** Moldura igual à do Input do sistema em volta do iframe do Stripe. */
function StripeField({ label, children }: { label: string; children: ReactNode }) {
  return (<div className="space-y-1.5">
    <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900">
      {children}
    </div>
  </div>);
}
function CardForm({ onSuccess, onCancel, hasExistingCard }: {
  onSuccess: (result: { paymentRecovered: boolean }) => void;
    onCancel: () => void;
    hasExistingCard: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements)
      return;
    setLoading(true);
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setLoading(false);
      return;
    }
    const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber,
    });
    if (pmError) {
      addToast('error', pmError.message ?? 'Erro ao processar cartão.');
      setLoading(false);
      return;
    }
    const clientSecret = await subscriptionService.createSetupIntent();
    if (!clientSecret) {
      addToast('error', 'Erro ao criar setup intent. Tente novamente.');
      setLoading(false);
      return;
    }
    const { error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: paymentMethod.id,
    });
    if (confirmError) {
      addToast('error', confirmError.message ?? 'Erro ao confirmar cartão.');
      setLoading(false);
      return;
    }
    const saveResult = await subscriptionService.savePaymentMethod(paymentMethod.id);
    if (!saveResult) {
      addToast('error', 'Erro ao salvar cartão. Tente novamente.');
      setLoading(false);
      return;
    }
    setLoading(false);
    onSuccess({ paymentRecovered: !!saveResult.paymentRecovered });
  };
  // O texto do iframe não herda o tema: sem isto, no dark mode o número digitado
  // ficava cinza-escuro em cima de fundo escuro.
  const elementOptions = useMemo(() => ({
    style: {
      base: {
        fontSize: '14px',
        fontFamily: 'inherit',
        color: darkMode ? '#fafafa' : '#09090b',
        iconColor: darkMode ? '#a1a1aa' : '#71717a',
        '::placeholder': { color: darkMode ? '#71717a' : '#a1a1aa' },
      },
      invalid: { color: '#ef4444', iconColor: '#ef4444' },
    },
  }), [darkMode]);
  const handleFieldChange = (event: { error?: { message: string } | undefined }) => {
    setFieldError(event.error?.message ?? null);
  };
  return (<form onSubmit={handleSubmit} className="space-y-4">
    <StripeField label="Número do cartão">
      <CardNumberElement options={elementOptions} onChange={handleFieldChange}/>
    </StripeField>

    <div className="grid grid-cols-2 gap-3">
      <StripeField label="Validade">
        <CardExpiryElement options={elementOptions} onChange={handleFieldChange}/>
      </StripeField>
      <StripeField label="CVV">
        <CardCvcElement options={elementOptions} onChange={handleFieldChange}/>
      </StripeField>
    </div>

    {fieldError && (<p className="flex items-center gap-1.5 text-xs text-red-500">
      <AlertCircle size={12} className="shrink-0"/>
      {fieldError}
    </p>)}

    <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
      <Lock size={13} className="mt-0.5 shrink-0"/>
        Os dados vão criptografados direto para o Stripe. O número completo do cartão não passa nem fica guardado nos nossos servidores.
    </p>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end dark:border-slate-700">
      <Button type="button" variant="secondary" className="justify-center" onClick={onCancel} disabled={loading}>
          Cancelar
      </Button>
      <Button type="submit" className="justify-center" icon={<CreditCard size={16}/>} loading={loading} loadingText="Salvando..." disabled={!stripe}>
        {hasExistingCard ? 'Salvar alterações' : 'Salvar cartão'}
      </Button>
    </div>
  </form>);
}
interface CardPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (result: { paymentRecovered: boolean }) => void;
    hasExistingCard?: boolean;
}
export default function CardPaymentModal({ isOpen, onClose, onSuccess, hasExistingCard = false }: CardPaymentModalProps) {
  const handleSuccess = (result: { paymentRecovered: boolean }) => {
    onSuccess?.(result);
    onClose();
  };
  return (<Modal isOpen={isOpen} onClose={onClose} title={hasExistingCard ? 'Editar cartão' : 'Adicionar cartão'} size="sm">
    <Elements stripe={stripePromise}>
      <CardForm onSuccess={handleSuccess} onCancel={onClose} hasExistingCard={hasExistingCard}/>
    </Elements>
  </Modal>);
}
