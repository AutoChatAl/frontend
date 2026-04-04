'use client';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Repeat,
  Save,
  Search,
  Send,
  Smartphone,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import DatePicker from '@/components/DatePicker';
import Modal from '@/components/Modal';
import WhatsAppEditor from '@/components/WhatsAppEditor';
import WhatsAppPreview from '@/components/WhatsAppPreview';
import { campaignService } from '@/services/campaign.service';
import { channelsService } from '@/services/channels.service';
import { contactService } from '@/services/contact.service';
import { groupService } from '@/services/group.service';
import { planLimitsService, type PlanLimits } from '@/services/plan-limits.service';
import type { CreateCampaignInput } from '@/types/Campaign';
import type { WhatsAppInstance } from '@/types/Channel';
import type { Contact } from '@/types/Contact';
import type { Group } from '@/types/Group';

interface Channel {
  id: string;
  name: string;
  type: 'WHATSAPP' | 'INSTAGRAM';
  status: string;
}

interface DispatchResult {
  jobsCreated: number;
  sent: number;
  failed: number;
  skipped: number;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

function getContactIdentifier(contact: Contact): string {
  if (!contact.identities || contact.identities.length === 0) return 'Sem identificador';
  const [identity] = contact.identities;
  if (!identity) return 'Sem identificador';
  return identity.phoneE164 || identity.igUsername || 'N/A';
}

const EXECUTION_HOURS = [8, 10, 12, 14, 16, 18];

const INITIAL_FORM: CreateCampaignInput = {
  name: '',
  description: '',
  message: '',
  sourceType: 'CHANNEL',
  channelIds: [],
  contactIds: [],
  status: 'ACTIVE',
  messageType: 'TEXT',
};

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 ${hasError
    ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400'
  }`;
}

function FieldError({ msg }: { msg?: string | undefined }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
      <AlertCircle size={12} />
      {msg}
    </p>
  );
}

function SectionHeader({
  step,
  label,
  inline = false,
}: {
  step: number;
  label: string;
  inline?: boolean;
}) {
  const content = (
    <>
      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0">
        {step}
      </span>
      {label}
    </>
  );

  if (inline) {
    return (
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
        {content}
      </span>
    );
  }

  return (
    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
      {content}
    </h3>
  );
}

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'create' | 'dispatch' | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [contactFilter, setContactFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CreateCampaignInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limits, setLimits] = useState<PlanLimits | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      const fetchedLimits = await planLimitsService.getLimits();
      setLimits(fetchedLimits);
      const [whatsappChannels, groupsList] = await Promise.all([
        channelsService.getWhatsAppInstances().catch(() => []),
        groupService.listGroups().catch(() => []),
      ]);

      const allContacts: Contact[] = [];
      let skip = 0;
      const PAGE_SIZE = 100;
      for (; ;) {
        const page = await contactService.listContacts({ skip, limit: PAGE_SIZE });
        const normalized = page.data.map((c: Contact & { _id?: string }) => ({
          ...c,
          id: c.id || c._id || '',
        }));
        allContacts.push(...normalized);
        if (allContacts.length >= page.total || page.data.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
      }

      const allChannels: Channel[] = whatsappChannels.map((ch: WhatsAppInstance) => ({
        id: ch.id,
        name: ch.name || ch.whatsapp?.phoneNumber || 'WhatsApp',
        type: 'WHATSAPP' as const,
        status: ch.status,
      }));

      setChannels(allChannels);
      setContacts(allContacts);

      const waChannelIds = new Set(allChannels.map((ch) => ch.id));
      const normalizedGroups = (groupsList as (Group & { _id?: string })[])
        .map((g: Group & { _id?: string }) => ({
          ...g,
          id: g.id || g._id || '',
        }))
        .filter((g) => {
          if (g.type === 'DYNAMIC' && g.ruleJson?.channelIds?.length) {
            return g.ruleJson.channelIds.every((cId: string) => waChannelIds.has(cId));
          }
          return true;
        });
      setGroups(normalizedGroups);
    } catch {
      setError('Não foi possível carregar canais e contatos. Tente novamente.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, loadInitialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.length < 2)
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    if (!formData.message.trim() && !formData.messageMeta?.imageBase64)
      newErrors.message = 'Mensagem ou imagem é obrigatória';
    if (formData.message.length > 2000)
      newErrors.message = 'Mensagem não pode ter mais de 2000 caracteres';

    if (formData.sourceType === 'CHANNEL') {
      if (formData.channelIds.length === 0)
        newErrors.channels = 'Selecione pelo menos um canal';
    } else {
      if (!formData.groupId)
        newErrors.group = 'Selecione um grupo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: '' }));

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setLoadingType('create');
      setError(null);
      await campaignService.createCampaign(formData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleCreateAndDispatch = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setLoadingType('dispatch');
      setError(null);

      const campaign = await campaignService.createCampaign(formData);

      const hasRecipients = formData.sourceType === 'GROUP'
        ? !!formData.groupId
        : formData.contactIds.length > 0;

      if (hasRecipients) {
        const run = await campaignService.runCampaign(campaign.id);
        await campaignService.processJobs({ runId: run.id });
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar e disparar a campanha.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData(INITIAL_FORM);
    setErrors({});
    setContactFilter('');
    setError(null);
    setDispatchResult(null);
    setImageFileName('');
    if (imageInputRef.current) imageInputRef.current.value = '';
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, message: 'O arquivo precisa ser uma imagem válida.' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, message: 'A imagem deve ter no máximo 2MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] ?? '';
      setFormData((prev) => ({
        ...prev,
        messageMeta: {
          ...(prev.messageMeta ?? {}),
          imageBase64: base64,
          imageMimeType: file.type,
        },
      }));
      setImageFileName(file.name);
      clearFieldError('message');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => {
      const nextMeta = { ...(prev.messageMeta ?? {}) };
      delete nextMeta.imageBase64;
      delete nextMeta.imageMimeType;
      const next = { ...prev };
      if (Object.keys(nextMeta).length > 0) {
        next.messageMeta = nextMeta;
      } else {
        delete next.messageMeta;
      }
      return next;
    });
    setImageFileName('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSourceTypeChange = (newSourceType: 'CHANNEL' | 'GROUP') => {
    setFormData((prev) => {
      const next: CreateCampaignInput = {
        ...prev,
        sourceType: newSourceType,
        channelIds: [],
        contactIds: [],
      };
      delete next.groupId;
      return next;
    });
    setErrors({});
  };

  const toggleChannel = (channelId: string) => {
    const isRemoving = formData.channelIds.includes(channelId);
    setFormData((prev) => {
      const newChannelIds = isRemoving
        ? prev.channelIds.filter((id) => id !== channelId)
        : [...prev.channelIds, channelId];

      let newContactIds = prev.contactIds;
      if (isRemoving) {
        const channelContactIds = new Set(
          contacts
            .filter((c) => c.identities?.some((i) => i.channelId === channelId))
            .map((c) => c.id),
        );
        newContactIds = prev.contactIds.filter((id) => !channelContactIds.has(id));
      }

      return { ...prev, channelIds: newChannelIds, contactIds: newContactIds };
    });
    clearFieldError('channels');
  };

  const selectGroup = (gId: string) => {
    setFormData((prev) => {
      const next: CreateCampaignInput = { ...prev };
      if (prev.groupId === gId) {
        delete next.groupId;
      } else {
        next.groupId = gId;
      }
      return next;
    });
    clearFieldError('group');
  };

  const maxContacts = limits?.maxContactsPerCampaign ?? 250;

  const toggleContact = (contactId: string) => {
    setFormData((prev) => {
      const isRemoving = prev.contactIds.includes(contactId);
      if (!isRemoving && prev.contactIds.length >= maxContacts) {
        setError(`Limite de ${maxContacts} contatos por campanha atingido.`);
        return prev;
      }
      return {
        ...prev,
        contactIds: isRemoving
          ? prev.contactIds.filter((id) => id !== contactId)
          : [...prev.contactIds, contactId],
      };
    });
  };

  const channelContacts = useMemo(() => {
    if (formData.channelIds.length === 0) return [];
    const selectedChannelSet = new Set(formData.channelIds);
    return contacts.filter((c) =>
      c.identities?.some((i) => selectedChannelSet.has(i.channelId)),
    );
  }, [contacts, formData.channelIds]);

  const selectAllContacts = () => {
    const ids = channelContacts.map((c) => c.id).slice(0, maxContacts);
    if (channelContacts.length > maxContacts) {
      setError(`Limite de ${maxContacts} contatos. Apenas os ${maxContacts} primeiros foram selecionados.`);
    }
    setFormData((prev) => ({ ...prev, contactIds: ids }));
  };

  const deselectAllContacts = () =>
    setFormData((prev) => ({ ...prev, contactIds: [] }));

  const filteredContacts = useMemo(() => {
    let result = channelContacts;

    if (contactFilter.trim()) {
      const term = contactFilter.toLowerCase().trim();
      result = result.filter((c) => {
        const name = c.displayName?.toLowerCase().includes(term);
        const id = c.identities?.some(
          (i) => i.phoneE164?.includes(term) || i.igUsername?.toLowerCase().includes(term),
        );
        return name || id;
      });
    }

    const selectedSet = new Set(formData.contactIds);
    return [...result].sort((a, b) => {
      const aSelected = selectedSet.has(a.id) ? 0 : 1;
      const bSelected = selectedSet.has(b.id) ? 0 : 1;
      return aSelected - bSelected;
    });
  }, [channelContacts, contactFilter, formData.contactIds]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === formData.groupId),
    [groups, formData.groupId],
  );

  if (dispatchResult) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Campanha Disparada" size="sm">
        <div className="flex flex-col items-center gap-6 py-2">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="text-green-500" size={32} />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Mensagens disparadas!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A campanha foi criada e os disparos foram iniciados.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {dispatchResult.sent}
              </div>
              <div className="text-xs text-green-700 dark:text-green-400 mt-1">Enviadas</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {dispatchResult.skipped}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">Ignoradas</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {dispatchResult.failed}
              </div>
              <div className="text-xs text-red-700 dark:text-red-400 mt-1">Falhas</div>
            </div>
          </div>

          {dispatchResult.jobsCreated > 0 && (
            <p className="text-xs text-slate-400 text-center">
              {dispatchResult.jobsCreated} job{dispatchResult.jobsCreated !== 1 ? 's' : ''} gerado
              {dispatchResult.jobsCreated !== 1 ? 's' : ''} no total
            </p>
          )}

          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            Fechar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Campanha" size="lg">
      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando dados...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={15} />
              </button>
            </div>
          )}

          <section>
            <SectionHeader step={1} label="Informações" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Campanha <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    clearFieldError('name');
                  }}
                  className={inputCls(!!errors.name)}
                  placeholder="Ex: Promoção de Verão"
                />
                <FieldError msg={errors.name} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputCls(false)}
                  placeholder="Descreva o objetivo desta campanha"
                />
              </div>
            </div>
          </section>

          <section>
            <SectionHeader step={2} label="Mensagem" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Conteúdo <span className="text-red-500">*</span>
                </label>
                <WhatsAppEditor
                  value={formData.message}
                  onChange={(val) => {
                    setFormData({ ...formData, message: val });
                    clearFieldError('message');
                  }}
                  placeholder="Digite a mensagem que será enviada para os contatos..."
                  rows={5}
                  maxLength={2000}
                  error={errors.message}
                />
                <div className="flex justify-end mt-1.5">
                  <span
                    className={`text-xs ${formData.message.length > 1800
                      ? 'text-amber-500'
                      : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {formData.message.length}/2000
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ExternalLink size={14} className="text-indigo-500" />
                  Botão de link <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={formData.linkUrl ?? ''}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className={inputCls(false)}
                    placeholder="https://exemplo.com/link"
                  />
                  <input
                    type="text"
                    value={formData.linkLabel ?? ''}
                    onChange={(e) => setFormData({ ...formData, linkLabel: e.target.value })}
                    className={inputCls(false)}
                    placeholder="Texto do botão (ex: Saiba mais)"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-indigo-500" />
                  Imagem <span className="text-slate-400 font-normal">(opcional, até 2MB)</span>
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {imageFileName ? (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <ImageIcon size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{imageFileName}</span>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                  >
                    <Upload size={16} />
                    <span className="text-sm font-medium">Selecionar imagem da campanha</span>
                  </button>
                )}
              </div>

              {(formData.message.trim() || formData.messageMeta?.imageBase64) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Preview no WhatsApp
                  </label>
                  <WhatsAppPreview
                    message={formData.message}
                    linkUrl={formData.linkUrl}
                    linkLabel={formData.linkLabel}
                  />
                  {formData.messageMeta?.imageBase64 && (
                    <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <ImageIcon size={12} />
                      Imagem será enviada junto com a campanha.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section>
            <SectionHeader step={3} label="Origem dos Destinatários" />
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-5 w-full">
              {([
                { value: 'CHANNEL' as const, label: 'Canal', icon: MessageCircle },
                { value: 'GROUP' as const, label: 'Grupo', icon: Users },
              ]).map((opt) => {
                const isActive = formData.sourceType === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSourceTypeChange(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all select-none ${isActive
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon size={16} />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 -mt-3 mb-4">
              {formData.sourceType === 'CHANNEL'
                ? 'Selecione um canal e escolha os contatos para envio.'
                : 'Selecione um grupo existente — os contatos dele serão usados automaticamente.'}
            </p>

            {formData.sourceType === 'CHANNEL' && (
              <>
                {channels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl gap-2">
                    <MessageCircle size={24} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Nenhum canal disponível
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Configure seus canais primeiro nas configurações
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {channels.map((channel) => {
                      const isSelected = formData.channelIds.includes(channel.id);
                      const isWhatsApp = channel.type === 'WHATSAPP';
                      const channelContacts = contacts.filter((c) =>
                        c.identities?.some((i) => i.channelId === channel.id),
                      );

                      return (
                        <div
                          key={channel.id}
                          onClick={() => toggleChannel(channel.id)}
                          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isWhatsApp
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-pink-100 dark:bg-pink-900/30'
                            }`}
                          >
                            {isWhatsApp ? (
                              <MessageCircle size={18} className="text-green-600 dark:text-green-400" />
                            ) : (
                              <Smartphone size={18} className="text-pink-600 dark:text-pink-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {channel.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isWhatsApp
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                  : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400'
                                }`}
                              >
                                {isWhatsApp ? 'WhatsApp' : 'Instagram'}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {channelContacts.length} contato{channelContacts.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <FieldError msg={errors.channels} />
              </>
            )}

            {formData.sourceType === 'GROUP' && (
              <>
                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl gap-2">
                    <Users size={24} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Nenhum grupo disponível
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Crie um grupo de contatos primeiro
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groups.map((group) => {
                      const isSelected = formData.groupId === group.id;
                      const isManual = group.type === 'MANUAL';
                      const count = group.memberCount ?? group.memberContactIds?.length ?? 0;
                      return (
                        <div
                          key={group.id}
                          onClick={() => selectGroup(group.id)}
                          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${isSelected
                            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm shadow-indigo-500/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected
                            ? 'bg-indigo-500 dark:bg-indigo-600'
                            : isManual
                              ? 'bg-violet-100 dark:bg-violet-900/30'
                              : 'bg-cyan-100 dark:bg-cyan-900/30'
                          }`}>
                            <Users size={18} className={
                              isSelected
                                ? 'text-white'
                                : isManual
                                  ? 'text-violet-600 dark:text-violet-400'
                                  : 'text-cyan-600 dark:text-cyan-400'
                            } />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {group.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isManual
                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
                                : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400'
                              }`}>
                                {isManual ? 'Manual' : 'Dinâmico'}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Users size={11} className="opacity-60" />
                                {count} contato{count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <FieldError msg={errors.group} />

                {selectedGroup && (() => {
                  const count = selectedGroup.memberCount ?? selectedGroup.memberContactIds?.length ?? 0;
                  return (
                    <div className="mt-4 p-4 bg-linear-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {selectedGroup.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Os contatos deste grupo serão usados automaticamente
                          </p>
                        </div>
                        <div className="text-center shrink-0 px-3">
                          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                            {count}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-indigo-500/70 dark:text-indigo-400/60 font-semibold">
                            {count === 1 ? 'contato' : 'contatos'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </section>

          {formData.sourceType === 'CHANNEL' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SectionHeader step={4} label="Destinatários" inline />
                  {formData.contactIds.length > 0 && (
                    <span className="text-xs font-normal bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                      {formData.contactIds.length} selecionado
                      {formData.contactIds.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {channelContacts.length > 0 && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={selectAllContacts}
                      disabled={channelContacts.length === 0}
                      className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 disabled:opacity-40 font-medium transition-colors"
                    >
                      Selecionar todos
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllContacts}
                      disabled={formData.contactIds.length === 0}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>

              {formData.channelIds.length === 0 ? (
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <MessageCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Selecione um canal primeiro
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Os contatos serão exibidos de acordo com o canal selecionado.
                    </p>
                  </div>
                </div>
              ) : channelContacts.length === 0 ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Nenhum contato disponível
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Não há contatos vinculados aos canais selecionados.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={contactFilter}
                      onChange={(e) => setContactFilter(e.target.value)}
                      placeholder="Buscar por nome ou número..."
                      className="w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white dark:bg-slate-900 dark:text-white text-sm transition-colors placeholder:text-slate-400"
                    />
                    {contactFilter && (
                      <button
                        type="button"
                        onClick={() => setContactFilter('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredContacts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 gap-2 text-slate-400">
                        <Users size={20} className="opacity-50" />
                        <p className="text-sm">Nenhum contato encontrado</p>
                      </div>
                    ) : (
                      filteredContacts.map((contact) => {
                        const isChecked = formData.contactIds.includes(contact.id);
                        const initials = getInitials(contact.displayName || 'U');
                        return (
                          <label
                            key={contact.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isChecked
                              ? 'bg-indigo-50 dark:bg-indigo-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleContact(contact.id)}
                              className="sr-only"
                            />
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${isChecked
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {initials || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {contact.displayName || 'Sem nome'}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                {getContactIdentifier(contact)}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isChecked
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isChecked && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path
                                    d="M1 4L3.5 6.5L9 1"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {contactFilter && (
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {filteredContacts.length} de {channelContacts.length} contatos
                    </p>
                  )}

                  {formData.contactIds.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Sem destinatários — a campanha será criada mas não enviará mensagens.
                    </p>
                  )}
                </>
              )}
            </section>
          )}

          <section>
            <SectionHeader step={formData.sourceType === 'CHANNEL' ? 5 : 4} label="Agendamento" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Repeat size={14} className="inline mr-1.5 -mt-0.5" />
                  Frequencia
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'DAILY', label: 'Todo dia', desc: 'Executa diariamente' },
                    { value: 'ONCE', label: 'Dia especifico', desc: 'Executa uma unica vez' },
                  ] as const).map((opt) => {
                    const isSelected = formData.frequency === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            frequency: opt.value,
                            scheduledDate: opt.value === 'DAILY' ? undefined : prev.scheduledDate,
                          }));
                        }}
                        className={`flex flex-col gap-1 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{opt.label}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{opt.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {formData.frequency === 'ONCE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    <Calendar size={14} className="inline mr-1.5 -mt-0.5" />
                    Data de Execução <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.scheduledDate ?? ''}
                    onChange={(v) => setFormData({ ...formData, scheduledDate: v })}
                    placeholder="Selecione uma data"
                  />
                </div>
              )}

              {formData.frequency && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                    Hora de Execucao
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {EXECUTION_HOURS.map((hour) => {
                      const isSelected = formData.executionHour === hour;
                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => setFormData({ ...formData, executionHour: hour })}
                          className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          {String(hour).padStart(2, '0')}:00
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="sm:mr-auto px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingType === 'create' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loadingType === 'create' ? 'Salvando...' : 'Salvar Campanha'}
            </button>

            <button
              type="button"
              onClick={handleCreateAndDispatch}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/25"
            >
              {loadingType === 'dispatch' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {loadingType === 'dispatch' ? 'Disparando...' : 'Criar e Disparar'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
