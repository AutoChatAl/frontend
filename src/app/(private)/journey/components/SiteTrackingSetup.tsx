'use client';
import { Check, Copy, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useTrackingSite } from '@/app/(private)/journey/hooks';
import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import Input from '@/components/Input';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonForm } from '@/components/Skeleton';
import { journeyService } from '@/services/journey.service';
import { formatRelativeTime } from '@/utils/relativeTime';

import { formatCount } from './meta';

const MAX_DOMAINS = 10;
const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const COPY_FEEDBACK_MS = 2000;
const CUSTOM_EVENT_SNIPPET = 'window.synq.track(\'lead\');';
const CLICK_EVENT_SNIPPET = '<button data-synq-event="Comprar agora">Comprar</button>';

interface SiteTrackingSetupProps {
  onToast: (type: 'success' | 'error', message: string) => void;
}

function cleanDomainInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#:]/)[0] ?? '';
}

function CodeBlock({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 pr-12 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copiar código"
        className="absolute right-2 top-2 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function SiteTrackingSetup({ onToast }: SiteTrackingSetupProps) {
  const { site, loading, error, saving, saveDomains, reload } = useTrackingSite();
  const [domains, setDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (site) setDomains(site.allowedDomains);
  }, [site]);

  useEffect(() => {
    if (!copiedCode) return;
    const timer = setTimeout(() => setCopiedCode(null), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copiedCode]);

  const snippet = useMemo(() => (site ? journeyService.buildScriptTag(site.publicKey) : ''), [site]);
  const dirty = !!site && domains.join(',') !== site.allowedDomains.join(',');
  const receiving = !!site?.lastEventAt && Date.now() - new Date(site.lastEventAt).getTime() < ACTIVE_WINDOW_MS;

  const handleAddDomain = () => {
    const domain = cleanDomainInput(domainInput);
    if (!domain || (!domain.includes('.') && domain !== 'localhost')) {
      setInputError('Digite só o endereço do site, por exemplo: minhaloja.com.br.');
      return;
    }
    if (domains.includes(domain)) {
      setInputError('Este domínio já está na lista.');
      return;
    }
    if (domains.length >= MAX_DOMAINS) {
      setInputError(`Você pode cadastrar até ${MAX_DOMAINS} domínios.`);
      return;
    }
    setDomains((prev) => [...prev, domain]);
    setDomainInput('');
    setInputError('');
  };

  const handleSave = async () => {
    try {
      await saveDomains(domains);
      onToast('success', 'Domínios salvos.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Não foi possível salvar os domínios.');
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      onToast('success', 'Código copiado.');
    } catch {
      onToast('error', 'Não foi possível copiar. Selecione o código e copie manualmente.');
    }
  };

  if (loading && !site) return <SkeletonForm fields={3} />;

  if (error || !site) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <p className="text-sm font-medium text-red-500">{error ?? 'Erro ao carregar o rastreamento do site.'}</p>
        <Button size="sm" onClick={reload}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <Card className="p-4">
          <SectionHeader
            title="1. Domínios do seu site"
            hint="O script só aceita eventos destes endereços. Subdomínios entram junto: loja.com.br cobre checkout.loja.com.br."
          />
          <div className="flex gap-2">
            <Input
              value={domainInput}
              onChange={(event) => {
                setDomainInput(event.target.value);
                setInputError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddDomain();
                }
              }}
              placeholder="minhaloja.com.br"
              aria-label="Domínio do site"
              error={inputError}
              wrapperClassName="flex-1"
            />
            <Button variant="secondary" icon={<Plus size={16} />} onClick={handleAddDomain} className="h-10.5 shrink-0 self-start">
              Adicionar
            </Button>
          </div>
          {domains.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {domains.map((domain) => (
                <li
                  key={domain}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1.5 text-[13px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {domain}
                  <button
                    type="button"
                    onClick={() => setDomains((prev) => prev.filter((item) => item !== domain))}
                    aria-label={`Remover ${domain}`}
                    className="cursor-pointer rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-slate-400 dark:text-slate-500">Nenhum domínio cadastrado. Sem ele, o script não registra nada.</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={!dirty} loading={saving} loadingText="Salvando...">
              Salvar domínios
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader
            title="2. Cole o código no seu site"
            hint="Coloque antes do </head> em todas as páginas. No Google Tag Manager, crie uma tag de HTML personalizado com o mesmo código."
          />
          <CodeBlock code={snippet} copied={copiedCode === snippet} onCopy={() => handleCopy(snippet)} />
        </Card>

        <Card className="p-4">
          <SectionHeader
            title="3. Eventos importantes (opcional)"
            hint="Cliques em links e botões já são registrados. Para dar nome a um botão ou marcar uma conversão, use:"
          />
          <div className="space-y-2">
            <CodeBlock code={CLICK_EVENT_SNIPPET} copied={copiedCode === CLICK_EVENT_SNIPPET} onCopy={() => handleCopy(CLICK_EVENT_SNIPPET)} />
            <CodeBlock code={CUSTOM_EVENT_SNIPPET} copied={copiedCode === CUSTOM_EVENT_SNIPPET} onCopy={() => handleCopy(CUSTOM_EVENT_SNIPPET)} />
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <Card className="p-4">
          <SectionHeader title="Situação" />
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${receiving ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <span className="text-[13px] font-medium text-slate-900 dark:text-white">
              {receiving ? 'Recebendo eventos' : 'Aguardando o primeiro evento'}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
            {site.lastEventAt
              ? `Último evento ${formatRelativeTime(site.lastEventAt).toLowerCase()} · ${formatCount(site.eventsLastWeek)} nos últimos 7 dias.`
              : 'Assim que alguém chegar ao site por um link enviado pelo Synq, os eventos aparecem aqui.'}
          </p>
        </Card>

        <Card className="space-y-2 p-4">
          <SectionHeader title="Como funciona" />
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            O script só acompanha quem entrou no site por um link enviado pelo Synq. Visitantes vindos de outros lugares são ignorados.
          </p>
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            Ficam guardados o caminho de cada página, o título e os cliques — nunca o que a pessoa digita em formulários. Ações repetidas na mesma visita contam uma vez só.
          </p>
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            A jornada mostra os últimos 7 dias. Depois de 14 dias, os eventos são apagados.
          </p>
          <Callout tone="warning">
            Avise na política de privacidade do seu site que você usa esse rastreamento. Se tiver banner de cookies, carregue o script só depois do consentimento.
          </Callout>
        </Card>
      </div>
    </div>
  );
}
