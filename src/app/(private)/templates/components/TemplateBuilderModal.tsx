'use client';
import { AlertCircle, ExternalLink, KeyRound, Megaphone, Phone, Plus, Reply, Trash2, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Textarea from '@/components/Textarea';
import WhatsAppPreview from '@/components/WhatsAppPreview';
import { templateService } from '@/services/template.service';
import type {
  WaTemplateButton,
  WaTemplateCategory,
  WaTemplateComponent,
  WhatsAppOfficialInstance,
  WhatsAppTemplate,
} from '@/types/WhatsAppOfficial';

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  channels: WhatsAppOfficialInstance[];
  defaultChannelId?: string;
  editing?: WhatsAppTemplate | null;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const LANGUAGES = [
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'en_US', label: 'Inglês (EUA)' },
  { value: 'es', label: 'Espanhol' },
];

const CATEGORY_OPTIONS: { value: WaTemplateCategory; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'MARKETING', label: 'Marketing', description: 'Promoções e novidades — sempre cobrado', icon: Megaphone },
  { value: 'UTILITY', label: 'Utilidade', description: 'Pedidos e avisos — grátis na janela de 24h', icon: Wrench },
  { value: 'AUTHENTICATION', label: 'Autenticação', description: 'Códigos de verificação — tarifa própria', icon: KeyRound },
];

const BUTTON_PREVIEW_ICON: Record<ButtonDraft['type'], React.ComponentType<{ size?: number; className?: string }>> = {
  QUICK_REPLY: Reply,
  URL: ExternalLink,
  PHONE_NUMBER: Phone,
};

type ButtonDraft = { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url: string; phoneNumber: string; trackUrl: boolean };

function extractVariables(text: string): string[] {
  const names: string[] = [];
  for (const match of text.matchAll(/\{\{\s*([\w]+)\s*\}\}/g)) {
    const [, name] = match;
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{children}</p>;
}

export default function TemplateBuilderModal({
  isOpen,
  onClose,
  onSaved,
  channels,
  defaultChannelId,
  editing,
  onError,
  onSuccess,
}: TemplateBuilderModalProps) {
  const [channelId, setChannelId] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('pt_BR');
  const [category, setCategory] = useState<WaTemplateCategory>('MARKETING');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<ButtonDraft[]>([]);
  const [variableExamples, setVariableExamples] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isEditing = !!editing;
  const lockIdentity = isEditing;
  const categoryLocked = isEditing && editing?.status === 'APPROVED';

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setChannelId(editing.channelId);
      setName(editing.name);
      setLanguage(editing.language);
      setCategory(editing.category);
      const header = editing.components.find((c) => c.type === 'HEADER');
      const body = editing.components.find((c) => c.type === 'BODY');
      const footer = editing.components.find((c) => c.type === 'FOOTER');
      const buttonsComponent = editing.components.find((c) => c.type === 'BUTTONS');
      setHeaderText(header?.format === 'TEXT' ? (header.text ?? '') : '');
      setBodyText(body?.text ?? '');
      setFooterText(footer?.text ?? '');
      const hasUrlVar = (url: string) => /\{\{\s*[\w]+\s*\}\}\s*$/.test(url);
      setButtons((buttonsComponent?.buttons ?? [])
        .filter((b): b is WaTemplateButton => b.type !== 'COPY_CODE')
        .map((b) => ({
          type: b.type as ButtonDraft['type'],
          text: b.text ?? '',
          url: (b.url ?? '').replace(/\{\{\s*[\w]+\s*\}\}\s*$/, ''),
          phoneNumber: b.phone_number ?? '',
          trackUrl: hasUrlVar(b.url ?? ''),
        })));
      setVariableExamples({});
    } else {
      setChannelId(defaultChannelId ?? channels[0]?.id ?? '');
      setName('');
      setLanguage('pt_BR');
      setCategory('MARKETING');
      setHeaderText('');
      setBodyText('');
      setFooterText('');
      setButtons([]);
      setVariableExamples({});
    }
    setFormError('');
  }, [isOpen, editing, defaultChannelId, channels]);

  const variables = useMemo(
    () => [...new Set([...extractVariables(headerText), ...extractVariables(bodyText)])],
    [headerText, bodyText],
  );

  const previewMessage = useMemo(() => {
    const applyVars = (text: string) => text.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_m, key: string) => variableExamples[key] || `[${key}]`);
    const parts: string[] = [];
    if (headerText.trim()) parts.push(`*${applyVars(headerText.trim())}*`);
    if (bodyText.trim()) parts.push(applyVars(bodyText.trim()));
    if (footerText.trim()) parts.push(`_${footerText.trim()}_`);
    return parts.join('\n\n') || 'Seu template aparecerá aqui...';
  }, [headerText, bodyText, footerText, variableExamples]);

  const insertVariable = () => {
    const nextIndex = extractVariables(bodyText).length + 1;
    setBodyText((prev) => `${prev}${prev.endsWith(' ') || prev.length === 0 ? '' : ' '}{{${nextIndex}}}`);
  };

  const addButton = () => {
    if (buttons.length >= 10) return;
    setButtons((prev) => [...prev, { type: 'QUICK_REPLY', text: '', url: '', phoneNumber: '', trackUrl: false }]);
  };

  const updateButton = (index: number, patch: Partial<ButtonDraft>) => {
    setButtons((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const removeButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const buildComponents = (): WaTemplateComponent[] => {
    const components: WaTemplateComponent[] = [];
    if (headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    }
    components.push({ type: 'BODY', text: bodyText.trim() });
    if (footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText.trim() });
    }
    const validButtons = buttons.filter((b) => b.text.trim());
    if (validButtons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: validButtons.map((b) => {
          if (b.type === 'URL') {
            let url = b.url.trim();
            if (b.trackUrl && !/\{\{\s*[\w]+\s*\}\}/.test(url)) url = `${url}{{1}}`;
            return { type: 'URL' as const, text: b.text.trim(), url };
          }
          if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER' as const, text: b.text.trim(), phone_number: b.phoneNumber.trim() };
          return { type: 'QUICK_REPLY' as const, text: b.text.trim() };
        }),
      });
    }
    return components;
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!isEditing) {
      if (!channelId) {
        setFormError('Selecione o canal oficial.');
        return;
      }
      if (!/^[a-z0-9_]{1,512}$/.test(name.trim())) {
        setFormError('Nome inválido: use apenas letras minúsculas, números e underscore (ex.: promo_natal).');
        return;
      }
    }
    if (!bodyText.trim()) {
      setFormError('O corpo da mensagem é obrigatório.');
      return;
    }
    const missingExamples = variables.filter((v) => !variableExamples[v]?.trim());
    if (missingExamples.length > 0) {
      setFormError(`Informe um exemplo para as variáveis: ${missingExamples.map((v) => `{{${v}}}`).join(', ')}. A Meta exige exemplos na aprovação.`);
      return;
    }
    for (const button of buttons) {
      if (!button.text.trim()) continue;
      if (button.type === 'URL' && !/^https?:\/\//.test(button.url.trim())) {
        setFormError('Botões de URL precisam de um link válido (https://...).');
        return;
      }
      if (button.type === 'PHONE_NUMBER' && button.phoneNumber.trim().length < 8) {
        setFormError('Botões de telefone precisam de um número válido.');
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditing && editing) {
        await templateService.update(editing.id, {
          components: buildComponents(),
          variableExamples,
          ...(editing.status !== 'APPROVED' ? { category } : {}),
        });
        onSuccess('Template atualizado e reenviado para análise da Meta.');
      } else {
        await templateService.create({
          channelId,
          name: name.trim(),
          language,
          category,
          allowCategoryChange: true,
          components: buildComponents(),
          variableExamples,
        });
        onSuccess('Template enviado para aprovação da Meta. Você será notificado quando for analisado.');
      }
      onSaved();
      onClose();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao salvar o template.');
    } finally {
      setSaving(false);
    }
  };

  const previewButtons = buttons.filter((b) => b.text.trim());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editar template: ${editing?.name}` : 'Novo template'} size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="space-y-3">
            <SectionLabel>Identificação</SectionLabel>
            {!isEditing && (
              <Dropdown
                label="Canal oficial"
                required
                options={channels.map((c) => ({
                  value: c.id,
                  label: c.whatsappOfficial.verifiedName || c.whatsappOfficial.displayPhoneNumber || c.name,
                }))}
                value={channelId}
                onChange={setChannelId}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nome do template"
                required
                placeholder="ex.: promo_primeira_compra"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                disabled={lockIdentity}
                hint={lockIdentity ? 'Não pode ser alterado após o envio.' : 'Minúsculas, números e underscore.'}
              />
              <Dropdown label="Idioma" required options={LANGUAGES} value={language} onChange={setLanguage} disabled={lockIdentity} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria<span className="text-red-500 ml-0.5" aria-hidden>*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Categoria do template">
                {CATEGORY_OPTIONS.map((option) => {
                  const selected = category === option.value;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={categoryLocked}
                      onClick={() => setCategory(option.value)}
                      className={`rounded-lg border p-2.5 text-left transition-colors ${selected
                        ? 'border-indigo-400 dark:border-indigo-500/60 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'} ${categoryLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`flex items-center gap-1.5 text-[13px] font-medium ${selected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        <Icon size={14} className="shrink-0" /> {option.label}
                      </span>
                      <span className="block mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{option.description}</span>
                    </button>
                  );
                })}
              </div>
              {categoryLocked && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">A categoria de um template aprovado não pode mudar.</p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <SectionLabel>Conteúdo da mensagem</SectionLabel>
            <div>
              <Input
                label="Cabeçalho (opcional)"
                placeholder="ex.: Olá, {{1}}!"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value.slice(0, 60))}
              />
              <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{headerText.length}/60</p>
            </div>

            <div>
              <Textarea
                label="Corpo da mensagem"
                required
                placeholder="ex.: Olá {{1}}! Temos uma oferta especial para você..."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value.slice(0, 1024))}
                rows={5}
                hint="Use {{1}}, {{2}}... para variáveis preenchidas no envio."
              />
              <div className="mt-1 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={insertVariable}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  <Plus size={12} /> Adicionar variável
                </button>
                <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{bodyText.length}/1024</span>
              </div>
            </div>

            {variables.length > 0 && (
              <div className="rounded-lg border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-3 space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Exemplos das variáveis · exigido pela Meta
                </p>
                {variables.map((variable) => (
                  <Input
                    key={variable}
                    label={`Exemplo para {{${variable}}}`}
                    required
                    placeholder="ex.: Maria"
                    value={variableExamples[variable] ?? ''}
                    onChange={(e) => setVariableExamples((prev) => ({ ...prev, [variable]: e.target.value }))}
                  />
                ))}
              </div>
            )}

            <div>
              <Input
                label="Rodapé (opcional)"
                placeholder="ex.: Responda SAIR para não receber mais ofertas"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value.slice(0, 60))}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                {category === 'MARKETING'
                  ? (<span className="text-xs text-slate-400 dark:text-slate-500">Instrução de descadastro reduz denúncias e protege a qualidade do número.</span>)
                  : <span/>}
                <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{footerText.length}/60</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <SectionLabel>Botões (opcional)</SectionLabel>
              <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addButton} disabled={buttons.length >= 10}>
                Adicionar
              </Button>
            </div>
            {buttons.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">Respostas rápidas, links rastreáveis ou botão de ligação — até 10 por template.</p>
            )}
            {buttons.map((button, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 items-start p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                <div className="w-full sm:w-40">
                  <Dropdown
                    options={[
                      { value: 'QUICK_REPLY', label: 'Resposta rápida' },
                      { value: 'URL', label: 'Abrir link' },
                      { value: 'PHONE_NUMBER', label: 'Ligar' },
                    ]}
                    value={button.type}
                    onChange={(v) => updateButton(index, { type: v as ButtonDraft['type'] })}
                  />
                </div>
                <div className="flex-1 w-full space-y-2">
                  <Input placeholder="Texto do botão (máx. 25)" value={button.text} onChange={(e) => updateButton(index, { text: e.target.value.slice(0, 25) })} />
                  {button.type === 'URL' && (
                    <>
                      <Input placeholder="https://exemplo.com/oferta" value={button.url} onChange={(e) => updateButton(index, { url: e.target.value })} />
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={button.trackUrl}
                          onChange={(e) => updateButton(index, { trackUrl: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Rastrear vendas deste link</span> — cada contato recebe o link com rastreio próprio (sck/UTM) para atribuir compras.
                        </span>
                      </label>
                    </>
                  )}
                  {button.type === 'PHONE_NUMBER' && (
                    <Input placeholder="+5511999999999" value={button.phoneNumber} onChange={(e) => updateButton(index, { phoneNumber: e.target.value })} />
                  )}
                </div>
                <button type="button" onClick={() => removeButton(index)} className="p-1.5 text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors" aria-label="Remover botão">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-0 self-start space-y-3">
          <SectionLabel>Pré-visualização</SectionLabel>
          <WhatsAppPreview message={previewMessage} />
          {previewButtons.length > 0 && (
            <div className="flex justify-end">
              <div className="w-[85%] rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden bg-white dark:bg-slate-800">
                {previewButtons.map((b, i) => {
                  const Icon = BUTTON_PREVIEW_ICON[b.type];
                  return (
                    <div key={i} className="py-2 px-3 flex items-center justify-center gap-1.5 text-[13px] font-medium text-sky-600 dark:text-sky-400">
                      <Icon size={13} className="shrink-0" /> {b.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 p-3 space-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            <p>• A Meta analisa o template automaticamente (minutos a 24h na maioria dos casos).</p>
            <p>• Evite conteúdo promocional em templates de utilidade — causa reprovação por categoria incorreta.</p>
            <p>• Templates aprovados podem ser editados até 10x por mês (1x a cada 24h).</p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="mt-4 flex items-start gap-2 text-[13px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {formError}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Enviando, o template vai direto para a análise automática da Meta.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving} loadingText="Enviando...">
            {isEditing ? 'Salvar e reenviar para análise' : 'Enviar para aprovação'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
