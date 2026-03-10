/* eslint-disable no-console */
'use client';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Repeat,
  Save,
  Search,
  Send,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';

import Modal from '@/components/Modal';
import { campaignService } from '@/services/campaign.service';
import { channelsService } from '@/services/channels.service';
import { contactService } from '@/services/contact.service';
import { groupService } from '@/services/group.service';
import type { CreateCampaignInput } from '@/types/Campaign';
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
  return `w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
    hasError
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
  const [formData, setFormData] = useState<CreateCampaignInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadInitialData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      const [whatsappChannels, instagramChannels, groupsList] = await Promise.all([
        channelsService.getWhatsAppInstances().catch(() => []),
        channelsService.getInstagramAccounts().catch(() => []),
        groupService.listGroups().catch(() => []),
      ]);

      const allContacts: Contact[] = [];
      let skip = 0;
      const PAGE_SIZE = 100;
      for (;;) {
        const page = await contactService.listContacts({ skip, limit: PAGE_SIZE });
        const normalized = page.data.map((c: Contact & { _id?: string }) => ({
          ...c,
          id: c.id || c._id || '',
        }));
        allContacts.push(...normalized);
        if (allContacts.length >= page.total || page.data.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
      }

      const allChannels: Channel[] = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...whatsappChannels.map((ch: any) => ({
          id: ch.id,
          name: ch.name || ch.whatsapp?.phoneNumber || 'WhatsApp',
          type: 'WHATSAPP' as const,
          status: ch.status,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...instagramChannels.map((ch: any) => ({
          id: ch.id,
          name: ch.instagram?.username || ch.name || 'Instagram',
          type: 'INSTAGRAM' as const,
          status: ch.status,
        })),
      ];

      setChannels(allChannels);
      setContacts(allContacts);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizedGroups = (groupsList as any[]).map((g: any) => ({
        ...g,
        id: g.id || g._id || '',
      }));
      setGroups(normalizedGroups);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
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
    if (!formData.message.trim())
      newErrors.message = 'Mensagem é obrigatória';
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
      console.error('Erro ao criar campanha:', err);
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
        await campaignService.runCampaign(campaign.id);
        await campaignService.processJobs();
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Erro ao disparar campanha:', err);
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
    onClose();
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

      const channelContactIds = new Set(
        contacts
          .filter((c) => c.identities?.some((i) => i.channelId === channelId))
          .map((c) => c.id),
      );
      let newContactIds: string[];
      if (isRemoving) {
        newContactIds = prev.contactIds.filter((id) => !channelContactIds.has(id));
      } else {
        newContactIds = Array.from(new Set([...prev.contactIds, ...channelContactIds]));
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

  const toggleContact = (contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      contactIds: prev.contactIds.includes(contactId)
        ? prev.contactIds.filter((id) => id !== contactId)
        : [...prev.contactIds, contactId],
    }));
  };

  const selectAllContacts = () =>
    setFormData((prev) => ({ ...prev, contactIds: contacts.map((c) => c.id) }));

  const deselectAllContacts = () =>
    setFormData((prev) => ({ ...prev, contactIds: [] }));

  const filteredContacts = useMemo(() => {
    if (!contactFilter.trim()) return contacts;
    const term = contactFilter.toLowerCase().trim();
    return contacts.filter((c) => {
      const name = c.displayName?.toLowerCase().includes(term);
      const id = c.identities?.some(
        (i) => i.phoneE164?.includes(term) || i.igUsername?.toLowerCase().includes(term),
      );
      return name || id;
    });
  }, [contacts, contactFilter]);

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
          {/* Error banner */}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Conteúdo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  clearFieldError('message');
                }}
                rows={5}
                className={`${inputCls(!!errors.message)} resize-none`}
                placeholder="Digite a mensagem que será enviada para os contatos..."
              />
              <div className="flex justify-between mt-1.5">
                <FieldError msg={errors.message} />
                <span
                  className={`text-xs ml-auto ${
                    formData.message.length > 1800
                      ? 'text-amber-500'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {formData.message.length}/2000
                </span>
              </div>
            </div>
          </section>

          {/* Step 3: Source type toggle */}
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
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all select-none ${
                      isActive
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

            {/* CHANNEL mode: channel selection */}
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
                          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isWhatsApp
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
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                  isWhatsApp
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
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
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

            {/* GROUP mode: group selection */}
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
                          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm shadow-indigo-500/10'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
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
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                isManual
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
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
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

          {/* Step 4: Contact selection (only for CHANNEL mode) */}
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
                {contacts.length > 0 && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={selectAllContacts}
                      disabled={contacts.length === 0}
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

              {contacts.length === 0 ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Nenhum contato disponível
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Adicione contatos antes de criar uma campanha.
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
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              isChecked
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
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                                isChecked
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
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                isChecked
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
                      {filteredContacts.length} de {contacts.length} contatos
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
              {/* Frequencia */}
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
                        className={`flex flex-col gap-1 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          isSelected
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
                    Data de Execucao <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={
                      formData.scheduledDate
                        ? formData.scheduledDate.split('-').reverse().join('/')
                        : ''
                    }
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
                      if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
                      else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;

                      const parts = v.split('/');
                      if (parts.length === 3 && parts[2]?.length === 4) {
                        setFormData({ ...formData, scheduledDate: `${parts[2]}-${parts[1]}-${parts[0]}` });
                      } else {
                        setFormData({ ...formData, scheduledDate: '' });
                      }
                    }}
                    className={inputCls(false)}
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
                          className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            isSelected
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
