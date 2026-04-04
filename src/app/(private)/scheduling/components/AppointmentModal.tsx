'use client';

import { X, Search, Clock, User, Package, FileText, Trash2, CheckCircle, Plus, Loader2, Ban, CalendarDays } from 'lucide-react';
import { useState, useMemo } from 'react';

import { aiService } from '@/services/ai.service';
import type { Product } from '@/services/ai.service';
import type { Contact } from '@/types/Contact';
import { STATUS_LABELS, STATUS_COLORS, type AppointmentStatus, type Appointment, type AppointmentType } from '@/types/Scheduling';

interface AppointmentModalProps {
  appointment: Appointment | null;
  contacts: Contact[];
  products: Product[];
  initialDate: string | null;
  initialTime: string | null;
  slotDuration: number;
  onSave: (data: {
    type?: string;
    contactId?: string;
    productId?: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    notes?: string;
    status?: string;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
  onProductCreated?: (product: Product) => void;
}

export default function AppointmentModal({
  appointment,
  contacts,
  products,
  initialDate,
  initialTime,
  slotDuration,
  onSave,
  onDelete,
  onClose,
  onProductCreated,
}: AppointmentModalProps) {
  const isEditing = !!appointment;

  const toLocalDateInput = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getInitialDate = () => {
    if (appointment) return new Date(appointment.startAt).toISOString().slice(0, 10);
    if (initialDate) return initialDate;
    return new Date().toISOString().slice(0, 10);
  };

  const getInitialStartTime = () => {
    if (appointment) {
      const d = new Date(appointment.startAt);
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    }
    if (initialTime) return initialTime;
    return '09:00';
  };

  const getInitialEndTime = () => {
    if (appointment) {
      const d = new Date(appointment.endAt);
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    }
    if (initialTime) {
      const [h = 0, m = 0] = initialTime.split(':').map(Number);
      const endMinutes = h * 60 + m + slotDuration;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
    return '09:30';
  };

  const [type, setType] = useState<AppointmentType>(appointment?.type || 'APPOINTMENT');
  const [title, setTitle] = useState(appointment?.title || '');
  const [description, setDescription] = useState(appointment?.description || '');
  const [contactId, setContactId] = useState(appointment?.contactId || '');
  const [productId, setProductId] = useState(appointment?.productId || '');
  const [date, setDate] = useState(getInitialDate());
  const [startTime, setStartTime] = useState(getInitialStartTime());
  const [endTime, setEndTime] = useState(getInitialEndTime());
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status || 'SCHEDULED');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [submitError, setSubmitError] = useState('');

  const minAllowedDate = useMemo(() => {
    const todayStr = toLocalDateInput(new Date());
    if (!appointment) return todayStr;
    const appointmentDate = appointment.startAt.slice(0, 10);
    return appointmentDate < todayStr ? appointmentDate : todayStr;
  }, [appointment]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contacts.slice(0, 10);
    const lower = contactSearch.toLowerCase();
    return contacts.filter((c) =>
      c.displayName?.toLowerCase().includes(lower) ||
      c.identities?.some((i) => i.phoneE164?.includes(contactSearch)),
    ).slice(0, 10);
  }, [contacts, contactSearch]);

  const selectedContact = contacts.find((c) => c.id === contactId);

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    setSavingProduct(true);
    try {
      const priceCents = newProductPrice ? Math.round(parseFloat(newProductPrice.replace(',', '.')) * 100) : 0;
      const created = await aiService.createProduct({
        name: newProductName.trim(),
        priceCents: isNaN(priceCents) ? 0 : priceCents,
      });
      setLocalProducts((prev) => [...prev, created]);
      setProductId(created.id);
      setShowNewProduct(false);
      setNewProductName('');
      setNewProductPrice('');
      onProductCreated?.(created);
    } catch {
      // silently fail
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date || !startTime || !endTime) return;
    setSubmitError('');

    const startAt = `${date}T${startTime}:00.000Z`;
    const endAt = `${date}T${endTime}:00.000Z`;
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const now = new Date();
    const hasStartChanged = !appointment || new Date(appointment.startAt).getTime() !== startDate.getTime();

    if (endDate <= startDate) {
      setSubmitError('O horário final deve ser após o horário inicial.');
      return;
    }

    if (hasStartChanged && startDate <= now) {
      setSubmitError('Não é permitido agendar em datas ou horários passados.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        type,
        title: title.trim(),
        startAt,
        endAt,
        ...(contactId ? { contactId } : {}),
        ...(productId && type === 'APPOINTMENT' ? { productId } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(isEditing ? { status } : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  const statuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEditing
              ? (type === 'BLOCK' ? 'Editar Bloqueio' : 'Editar Agendamento')
              : (type === 'BLOCK' ? 'Novo Bloqueio' : 'Novo Agendamento')
            }
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Type Selector */}
          {!isEditing && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Tipo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setType('APPOINTMENT'); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    type === 'APPOINTMENT'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/30'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <CalendarDays size={16} />
                  Agendamento
                </button>
                <button
                  type="button"
                  onClick={() => { setType('BLOCK'); setTitle(title || 'Bloqueio'); setContactId(''); setProductId(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    type === 'BLOCK'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 ring-2 ring-red-400/30'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <Ban size={16} />
                  Bloqueio
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'BLOCK' ? 'Ex: Almoço, Intervalo, Folga...' : 'Ex: Consulta, Reunião, Corte...'}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Contact Search (optional - hidden for blocks) */}
          {type === 'APPOINTMENT' && (
            <div className="relative">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User size={14} /> Contato
              </label>
              {selectedContact ? (
                <div className="flex items-center justify-between px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {selectedContact.displayName || 'Sem nome'}
                  </span>
                  <button onClick={() => { setContactId(''); setContactSearch(''); }} className="text-indigo-400 hover:text-indigo-600">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => { setContactSearch(e.target.value); setShowContactDropdown(true); }}
                    onFocus={() => setShowContactDropdown(true)}
                    placeholder="Buscar contato..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  {showContactDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredContacts.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-400">Nenhum contato encontrado</div>
                      ) : (
                        filteredContacts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setContactId(c.id); setContactSearch(''); setShowContactDropdown(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            <div className="font-medium">{c.displayName || 'Sem nome'}</div>
                            {c.identities?.[0]?.phoneE164 && (
                              <div className="text-xs text-slate-400">{c.identities[0].phoneE164}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          )}

          {/* Product */}
          {type === 'APPOINTMENT' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package size={14} /> Produto / Serviço
                </label>
                {!showNewProduct && (
                  <button
                    type="button"
                    onClick={() => setShowNewProduct(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Novo
                  </button>
                )}
              </div>

              {showNewProduct ? (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/40 rounded-lg space-y-2.5">
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Nome do produto ou serviço"
                    autoFocus
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="text"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="Preço (opcional) ex: 50,00"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowNewProduct(false); setNewProductName(''); setNewProductPrice(''); }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateProduct}
                      disabled={!newProductName.trim() || savingProduct}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                    >
                      {savingProduct ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Nenhum produto selecionado</option>
                  {localProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.priceCents > 0 ? `- R$ ${(p.priceCents / 100).toFixed(2)}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Data *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minAllowedDate}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} /> Início *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Fim *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {submitError && (
            <div className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
              {submitError}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText size={14} /> Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Detalhes do agendamento..."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas internas..."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Status (only when editing) */}
          {isEditing && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      status === s
                        ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-indigo-400 dark:ring-offset-slate-800'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 p-4 sm:p-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !title.trim()}
              className={`px-6 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                type === 'BLOCK'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {isEditing
                ? 'Salvar Alterações'
                : type === 'BLOCK' ? 'Criar Bloqueio' : 'Criar Agendamento'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
