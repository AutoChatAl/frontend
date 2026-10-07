'use client';
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import InstagramProfessionalSteps from '@/app/(private)/channels/components/InstagramProfessionalSteps';
import Button from '@/components/Button';
import Callout from '@/components/Callout';
import { channelsService } from '@/services/channels.service';

export const dynamic = 'force-dynamic';

type Status = 'loading' | 'success' | 'error';
type Provider = 'instagram' | 'google';
type InstagramFailure =
  | 'subscription_inactive'
  | 'missing_params'
  | 'access_denied'
  | 'session_expired'
  | 'instance_limit'
  | 'personal_account'
  | 'connect_failed';

interface FailureCopy {
    title: string;
    description: string;
    showProfessionalSteps: boolean;
}

const INSTAGRAM_FAILURES: Record<InstagramFailure, FailureCopy> = {
  subscription_inactive: {
    title: 'Sua assinatura está inativa',
    description: 'Reative o seu plano em Configurações > Faturamento e depois tente conectar de novo.',
    showProfessionalSteps: false,
  },
  missing_params: {
    title: 'A conexão foi interrompida',
    description: 'Parece que a janela do Instagram foi fechada ou o acesso não foi permitido. Tente de novo e, no fim, toque em permitir.',
    showProfessionalSteps: false,
  },
  access_denied: {
    title: 'A conexão foi cancelada',
    description: 'O acesso não foi permitido no Instagram. Para conectar, tente de novo e, no fim, toque em permitir.',
    showProfessionalSteps: false,
  },
  session_expired: {
    title: 'O tempo para conectar acabou',
    description: 'A tela de login do Instagram ficou aberta por muito tempo. Tente de novo e conclua o login sem fechar a janela.',
    showProfessionalSteps: false,
  },
  instance_limit: {
    title: 'Você já usou todos os canais do seu plano',
    description: 'O limite soma WhatsApp e Instagram. Remova um canal que não usa mais ou contrate uma conexão extra para conectar este.',
    showProfessionalSteps: false,
  },
  personal_account: {
    title: 'Sua conta do Instagram ainda é pessoal',
    description: 'O Instagram só deixa conectar contas do tipo Comercial ou Criador de conteúdo. Mude em 3 passos e tente de novo:',
    showProfessionalSteps: true,
  },
  connect_failed: {
    title: 'Não conseguimos conectar o seu Instagram',
    description: 'Tente de novo em alguns minutos. Se continuar, confira se a conta é do tipo Comercial ou Criador de conteúdo.',
    showProfessionalSteps: false,
  },
};

const GOOGLE_FAILURE: FailureCopy = {
  title: 'Não conseguimos conectar o seu Google Agenda',
  description: 'A conexão foi interrompida ou o acesso não foi permitido. Tente de novo e, no fim, toque em permitir.',
  showProfessionalSteps: false,
};

function isInstagramFailure(code: string): code is InstagramFailure {
  return Object.prototype.hasOwnProperty.call(INSTAGRAM_FAILURES, code);
}

function toInstagramFailure(code: string): InstagramFailure {
  return isInstagramFailure(code) ? code : 'connect_failed';
}

function hasOpener(): boolean {
  try {
    return !!window.opener && !window.opener.closed;
  }
  catch {
    return false;
  }
}

function IconCircle({ tone, children }: { tone: 'success' | 'error'; children: ReactNode }) {
  const classes = tone === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400';
  return (<div className="flex justify-center">
    <div className={`flex h-16 w-16 items-center justify-center rounded-full ${classes}`}>
      {children}
    </div>
  </div>);
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [provider, setProvider] = useState<Provider>('instagram');
  const [failure, setFailure] = useState<FailureCopy>(INSTAGRAM_FAILURES.connect_failed);
  const [isPopup, setIsPopup] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  useEffect(() => {
    setIsPopup(hasOpener());
    const params = new URLSearchParams(window.location.search);
    const igError = params.get('ig_error');
    const gcalError = params.get('gcal_error');
    const isGoogle = params.get('gcal_connected') === 'true' || !!gcalError;
    setProvider(isGoogle ? 'google' : 'instagram');
    if (params.get('ig_connected') === 'true' || params.get('gcal_connected') === 'true') {
      setStatus('success');
      return;
    }
    setStatus('error');
    if (isGoogle) {
      setFailure(GOOGLE_FAILURE);
      return;
    }
    setFailure(INSTAGRAM_FAILURES[toInstagramFailure(igError ?? '')]);
  }, []);

  useEffect(() => {
    if (status !== 'success' || !isPopup) {
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, isPopup]);

  const backPath = provider === 'google' ? '/scheduling' : '/channels';
  const backLabel = provider === 'google' ? 'Voltar para a agenda' : 'Voltar aos canais';

  const goBack = () => {
    if (isPopup) {
      window.close();
      return;
    }
    router.push(backPath);
  };

  const retryInstagram = async () => {
    setRetrying(true);
    setRetryError('');
    try {
      const { url } = await channelsService.getInstagramOAuthUrl();
      window.location.href = url;
    }
    catch {
      setRetryError('Não foi possível abrir o login do Instagram. Volte aos canais e tente por lá.');
      setRetrying(false);
    }
  };

  return (<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
    <div className="w-full max-w-md space-y-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 text-center shadow-xl dark:shadow-none">
      {status === 'loading' && (<>
        <div className="flex justify-center">
          <Loader2 size={48} className="text-indigo-500 dark:text-indigo-400 animate-spin"/>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Conectando...</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Aguarde só um instante.</p>
      </>)}

      {status === 'success' && (<>
        <IconCircle tone="success"><CheckCircle2 size={36}/></IconCircle>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Conta conectada!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {provider === 'google'
            ? 'Seu Google Agenda foi conectado ao Synq.'
            : 'Sua conta do Instagram foi conectada ao Synq. Já dá para criar respostas automáticas para ela.'}
        </p>
        {isPopup && (<p className="text-xs text-slate-400 dark:text-slate-500">
          Esta janela fecha sozinha em {countdown}s.
        </p>)}
        <Button variant="primary" onClick={goBack} className="w-full justify-center">
          {isPopup ? 'Fechar esta janela' : (provider === 'google' ? 'Ir para a agenda' : 'Ir para os canais')}
        </Button>
      </>)}

      {status === 'error' && (<>
        <IconCircle tone="error"><XCircle size={36}/></IconCircle>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{failure.title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{failure.description}</p>
        {failure.showProfessionalSteps && (<div className="text-left">
          <InstagramProfessionalSteps/>
        </div>)}
        {retryError && (<Callout tone="warning" className="text-left">{retryError}</Callout>)}
        <div className="flex flex-col gap-2 pt-1">
          {provider === 'instagram' && (<Button variant="primary" onClick={() => void retryInstagram()} loading={retrying} loadingText="Abrindo o Instagram..." icon={<RotateCcw size={16}/>} className="w-full justify-center">
            Tentar de novo
          </Button>)}
          <Button variant="secondary" onClick={goBack} icon={<ArrowLeft size={16}/>} className="w-full justify-center">
            {backLabel}
          </Button>
        </div>
      </>)}
    </div>
  </div>);
}
