'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { subscriptionService } from '@/services/subscription.service';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

// Inner form (must be inside <Elements>)
function CardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) { setLoading(false); return; }

    // Create payment method
    const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber,
    });

    if (pmError) {
      setError(pmError.message ?? 'Erro ao processar cartão.');
      setLoading(false);
      return;
    }

    // Confirm with SetupIntent
    const clientSecret = await subscriptionService.createSetupIntent();
    if (!clientSecret) {
      setError('Erro ao criar setup intent. Tente novamente.');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: paymentMethod.id,
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Erro ao confirmar cartão.');
      setLoading(false);
      return;
    }

    // Save payment method to our backend
    await subscriptionService.savePaymentMethod(paymentMethod.id);

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
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
        <Lock size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Seus dados são criptografados e processados com segurança pelo Stripe. Nunca armazenamos os dados completos do cartão.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Número do Cartão
        </label>
        <div className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <CardNumberElement options={elementOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Validade
          </label>
          <div className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            CVV
          </label>
          <div className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 justify-center" disabled={loading || !stripe}>
          <CreditCard size={16} className="mr-1" />
          {loading ? 'Salvando...' : 'Salvar Cartão'}
        </Button>
      </div>
    </form>
  );
}

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CardPaymentModal({ isOpen, onClose, onSuccess }: CardPaymentModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Cartão" size="sm">
      <Elements stripe={stripePromise}>
        <CardForm onSuccess={handleSuccess} onCancel={onClose} />
      </Elements>
    </Modal>
  );
}
