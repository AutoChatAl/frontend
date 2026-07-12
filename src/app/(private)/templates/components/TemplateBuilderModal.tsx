'use client';
import { Plus, Trash2, Megaphone, Wrench, KeyRound } from 'lucide-react';
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
  /** Template em edição (aprovado/reprovado/pausado) — null para criação. */
  editing?: WhatsAppTemplate | null;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const LANGUAGES = [
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'en_US', label: 'Inglês (EUA)' },
  { value: 'es', label: 'Espanhol' },
];

const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing — promoções e novidades (sempre cobrado)' },
  { value: 'UTILITY', label: 'Utilidade — pedidos, avisos e pós-venda (grátis na janela de 24h)' },
  { value: 'AUTHENTICATION', label: 'Autenticação — códigos de verificação' },
];

const CATEGORY_ICON: Record<WaTemplateCategory, React.ReactNode> = {
  MARKETING: <Megaphone size={14} />,
  UTILITY: <Wrench size={14} />,
  AUTHENTICATION: <KeyRound size={14} />,
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
  const lockIdentity = isEditing; // nome/idioma nunca mudam; categoria só se não aprovado

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
            // Rastreio de vendas: variável dinâmica no fim da URL, preenchida por contato no envio.
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editar template: ${editing?.name}` : 'Novo template'} size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {!isEditing && (
            <Dropdown
              label="Canal oficial"
              options={channels.map((c) => ({
                value: c.id,
                label: c.whatsappOfficial.verifiedName || c.whatsappOfficial.displayPhoneNumber || c.name,
              }))}
              value={channelId}
              onChange={setChannelId}
            />
          )}

          <Input
            label="Nome do template"
            placeholder="ex.: promo_primeira_compra"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            disabled={lockIdentity}
            hint={lockIdentity ? 'O nome não pode ser alterado após o envio.' : 'Apenas letras minúsculas, números e underscore.'}
          />

          <div className="grid grid-cols-2 gap-4">
            <Dropdown label="Idioma" options={LANGUAGES} value={language} onChange={setLanguage} disabled={lockIdentity} />
            <Dropdown
              label="Categoria"
              options={CATEGORIES}
              value={category}
              onChange={(v) => setCategory(v as WaTemplateCategory)}
              disabled={isEditing && editing?.status === 'APPROVED'}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {CATEGORY_ICON[category]}
            {category === 'MARKETING' && <span>Mensagens de marketing são cobradas por mensagem entregue pela Meta.</span>}
            {category === 'UTILITY' && <span>Gratuito quando a janela de atendimento de 24h do contato está aberta.</span>}
            {category === 'AUTHENTICATION' && <span>Para envio de códigos — tarifa própria da Meta.</span>}
          </div>

          <Input
            label="Cabeçalho (opcional)"
            placeholder="ex.: Olá, {{1}}!"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value.slice(0, 60))}
            hint="Máx. 60 caracteres."
          />

          <div>
            <Textarea
              label="Corpo da mensagem"
              placeholder="ex.: Olá {{1}}! Temos uma oferta especial para você..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value.slice(0, 1024))}
              rows={5}
              hint={`${bodyText.length}/1024 · Use {{1}}, {{2}}... para variáveis.`}
            />
            <button
              type="button"
              onClick={insertVariable}
              className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Adicionar variável
            </button>
          </div>

          {variables.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Exemplos das variáveis (exigido pela Meta)</p>
              {variables.map((variable) => (
                <Input
                  key={variable}
                  label={`Exemplo para {{${variable}}}`}
                  placeholder="ex.: Maria"
                  value={variableExamples[variable] ?? ''}
                  onChange={(e) => setVariableExamples((prev) => ({ ...prev, [variable]: e.target.value }))}
                />
              ))}
            </div>
          )}

          <Input
            label="Rodapé (opcional)"
            placeholder="ex.: Responda SAIR para não receber mais ofertas"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value.slice(0, 60))}
            hint={category === 'MARKETING' ? 'Recomendado: instrução de descadastro reduz denúncias e protege a qualidade do número.' : 'Máx. 60 caracteres.'}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Botões (opcional)</p>
              <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addButton} disabled={buttons.length >= 10}>
                Adicionar
              </Button>
            </div>
            {buttons.map((button, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 items-start p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
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
                          <span className="font-medium text-slate-700 dark:text-slate-300">Rastrear vendas deste link</span> — no envio, cada contato recebe o link com rastreio próprio (sck/UTM), permitindo atribuir compras e recuperação de carrinho, como no canal não oficial.
                        </span>
                      </label>
                    </>
                  )}
                  {button.type === 'PHONE_NUMBER' && (
                    <Input placeholder="+5511999999999" value={button.phoneNumber} onChange={(e) => updateButton(index, { phoneNumber: e.target.value })} />
                  )}
                </div>
                <button type="button" onClick={() => removeButton(index)} className="p-2 text-rose-500 hover:text-rose-600 dark:text-rose-400" aria-label="Remover botão">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Pré-visualização</p>
          <WhatsAppPreview message={previewMessage} />
          {buttons.filter((b) => b.text.trim()).length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
              {buttons.filter((b) => b.text.trim()).map((b, i) => (
                <div key={i} className="py-2.5 text-center text-sm font-medium text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800">
                  {b.text}
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>• A Meta analisa o template automaticamente (minutos a 24h na maioria dos casos).</p>
            <p>• Evite conteúdo promocional em templates de utilidade — causa reprovação por categoria incorreta.</p>
            <p>• Templates aprovados podem ser editados até 10x por mês (1x a cada 24h).</p>
          </div>
        </div>
      </div>

      {formError && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{formError}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} loading={saving} loadingText="Enviando...">
          {isEditing ? 'Salvar e reenviar para análise' : 'Enviar para aprovação'}
        </Button>
      </div>
    </Modal>
  );
}
