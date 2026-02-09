/* eslint-disable no-console */
'use client';

import { Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import Modal from '@/components/Modal';
import { campaignService } from '@/services/campaign.service';
import { channelsService } from '@/services/channels.service';
import { contactService } from '@/services/contact.service';
import type { CreateCampaignInput } from '@/types/Campaign';
import type { Contact } from '@/types/Contact';

interface Channel {
  id: string;
  name: string;
  type: 'WHATSAPP' | 'INSTAGRAM';
  status: string;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: '',
    description: '',
    message: '',
    channelIds: [],
    contactIds: [],
    status: 'ACTIVE',
    messageType: 'TEXT',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [whatsappChannels, instagramChannels, contactsList] = await Promise.all([
        channelsService.getWhatsAppInstances().catch(() => []),
        channelsService.getInstagramAccounts().catch(() => []),
        contactService.listContacts().catch(() => []),
      ]);

      const allChannels: Channel[] = [
        ...whatsappChannels.map((ch: { id: string; name: string; whatsapp?: { phoneNumber?: string }; status: string }) => ({
          id: ch.id,
          name: ch.name || ch.whatsapp?.phoneNumber || 'WhatsApp',
          type: 'WHATSAPP' as const,
          status: ch.status,
        })),
        ...instagramChannels.map((ch: { id: string; name: string; instagram?: { username?: string | null }; status: string }) => ({
          id: ch.id,
          name: ch.instagram?.username || ch.name || 'Instagram',
          type: 'INSTAGRAM' as const,
          status: ch.status,
        })),
      ];

      setChannels(allChannels);
      setContacts(contactsList);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.message.trim() || formData.message.length < 1) {
      newErrors.message = 'Mensagem é obrigatória';
    }

    if (formData.message.length > 2000) {
      newErrors.message = 'Mensagem não pode ter mais de 2000 caracteres';
    }

    if (formData.channelIds.length === 0) {
      newErrors.channels = 'Selecione pelo menos um canal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      await campaignService.createCampaign(formData);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Erro ao criar campanha:', err);
      alert(err instanceof Error ? err.message : 'Erro ao criar campanha');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      message: '',
      channelIds: [],
      contactIds: [],
      status: 'ACTIVE',
      messageType: 'TEXT',
    });
    setErrors({});
    onClose();
  };

  const toggleChannel = (channelId: string) => {
    setFormData((prev) => ({
      ...prev,
      channelIds: prev.channelIds.includes(channelId)
        ? prev.channelIds.filter((id) => id !== channelId)
        : [...prev.channelIds, channelId],
    }));
  };

  const toggleContact = (contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      contactIds: prev.contactIds.includes(contactId)
        ? prev.contactIds.filter((id) => id !== contactId)
        : [...prev.contactIds, contactId],
    }));
  };

  const selectAllContacts = () => {
    setFormData((prev) => ({
      ...prev,
      contactIds: contacts.map((c) => c.id),
    }));
  };

  const deselectAllContacts = () => {
    setFormData((prev) => ({
      ...prev,
      contactIds: [],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Campanha" size="lg">
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">Carregando dados...</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nome da Campanha *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500'
              }`}
              placeholder="Ex: Promoção de Verão"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="Descreva o objetivo desta campanha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mensagem *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white ${
                errors.message
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500'
              }`}
              placeholder="Digite a mensagem que será enviada..."
            />
            <div className="flex justify-between mt-1">
              {errors.message ? (
                <p className="text-sm text-red-500">{errors.message}</p>
              ) : (
                <p className="text-sm text-slate-500">{formData.message.length}/2000 caracteres</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Canais de Envio *
            </label>
            {channels.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum canal disponível. Configure seus canais primeiro.</p>
            ) : (
              <div className="space-y-2">
                {channels.map((channel) => (
                  <label
                    key={channel.id}
                    className="flex items-center gap-3 p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.channelIds.includes(channel.id)}
                      onChange={() => toggleChannel(channel.id)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{channel.name}</div>
                      <div className="text-sm text-slate-500">
                        {channel.type} • {channel.status}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {errors.channels && <p className="mt-1 text-sm text-red-500">{errors.channels}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Destinatários ({formData.contactIds.length} selecionados)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllContacts}
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Selecionar todos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllContacts}
                  className="text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400"
                >
                  Limpar
                </button>
              </div>
            </div>
            {contacts.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum contato disponível.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg">
                {contacts.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.contactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {contact.displayName || 'Sem nome'}
                      </div>
                      {contact.identities && contact.identities.length > 0 && (
                        <div className="text-sm text-slate-500">
                          {contact.identities[0]?.phoneE164 || contact.identities[0]?.igUsername || 'N/A'}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'PAUSED' | 'COMPLETED' })
              }
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="ACTIVE">Ativa</option>
              <option value="PAUSED">Pausada</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={16} className="inline mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <Save size={16} className="inline mr-2" />
                  Criar Campanha
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
