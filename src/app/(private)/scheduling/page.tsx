'use client';

import { CalendarDays } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import PageLoader from '@/components/PageLoader';
import { ToastContainer } from '@/components/Toast';
import { aiService } from '@/services/ai.service';
import type { Product } from '@/services/ai.service';
import { contactService } from '@/services/contact.service';
import { schedulingService } from '@/services/scheduling.service';
import type { Contact } from '@/types/Contact';
import type { Appointment, BusinessHours } from '@/types/Scheduling';

import AppointmentModal from './components/AppointmentModal';
import BusinessHoursConfig from './components/BusinessHoursConfig';
import CalendarView from './components/CalendarView';
import SchedulingTabs from './components/SchedulingTabs';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 42); // load 6 weeks for monthly view

      const [appointmentsData, businessHoursData, firstContactPage, aiData] = await Promise.all([
        schedulingService.listAppointments({
          startDate: new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: weekEnd.toISOString(),
        }),
        schedulingService.getBusinessHours(),
        contactService.listContacts({ limit: 100, skip: 0 }),
        aiService.getConfig(),
      ]);

      // Load all contacts with pagination (max 100 per page)
      let allContacts = firstContactPage.data || [];
      const totalContacts = firstContactPage.total || 0;
      if (totalContacts > 100) {
        const pages = Math.ceil(totalContacts / 100);
        const additionalPages = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            contactService.listContacts({ limit: 100, skip: (i + 1) * 100 }),
          ),
        );
        for (const page of additionalPages) {
          allContacts = [...allContacts, ...(page.data || [])];
        }
      }

      setAppointments(appointmentsData);
      setBusinessHours(businessHoursData);
      setContacts(allContacts);
      setProducts(aiData.products || []);
    } catch {
      addToast('error', 'Erro ao carregar dados de agendamento.');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAppointment = (date?: string, time?: string) => {
    setEditingAppointment(null);
    setSelectedDate(date || null);
    setSelectedTime(time || null);
    setModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedDate(null);
    setSelectedTime(null);
    setModalOpen(true);
  };

  const handleSaveAppointment = async (data: {
    type?: string;
    contactId?: string;
    productId?: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    notes?: string;
    status?: string;
  }) => {
    try {
      if (editingAppointment) {
        await schedulingService.updateAppointment(editingAppointment.id, data);
        addToast('success', 'Agendamento atualizado com sucesso!');
      } else {
        await schedulingService.createAppointment(data);
        addToast('success', 'Agendamento criado com sucesso!');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao salvar agendamento.');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await schedulingService.deleteAppointment(id);
      addToast('success', 'Agendamento excluído.');
      setModalOpen(false);
      loadData();
    } catch {
      addToast('error', 'Erro ao excluir agendamento.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await schedulingService.updateAppointment(id, { status });
      addToast('success', 'Status atualizado!');
      loadData();
    } catch {
      addToast('error', 'Erro ao atualizar status.');
    }
  };

  const handleSaveBusinessHours = async (data: Partial<BusinessHours>) => {
    try {
      const updated = await schedulingService.updateBusinessHours(data);
      setBusinessHours(updated);
      addToast('success', 'Horários de trabalho atualizados!');
    } catch {
      addToast('error', 'Erro ao salvar horários.');
    }
  };

  if (loading) {
    return <PageLoader message="Carregando agendamentos" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Agendamentos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie seus horários e compromissos</p>
        </div>
        <button
          onClick={() => handleCreateAppointment()}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <CalendarDays size={18} />
          Novo Agendamento
        </button>
      </div>

      <SchedulingTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'calendar' && (
        <CalendarView
          appointments={appointments}
          businessHours={businessHours}
          contacts={contacts}
          products={products}
          currentWeekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          onCreateAppointment={handleCreateAppointment}
          onEditAppointment={handleEditAppointment}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {activeTab === 'business-hours' && businessHours && (
        <BusinessHoursConfig
          businessHours={businessHours}
          onSave={handleSaveBusinessHours}
        />
      )}

      {modalOpen && (
        <AppointmentModal
          appointment={editingAppointment}
          contacts={contacts}
          products={products}
          initialDate={selectedDate}
          initialTime={selectedTime}
          slotDuration={businessHours?.slotDurationMinutes || 30}
          onSave={handleSaveAppointment}
          {...(editingAppointment && { onDelete: () => { void handleDeleteAppointment(editingAppointment.id); } })}
          onClose={() => setModalOpen(false)}
          onProductCreated={(product) => setProducts((prev) => [...prev, product])}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
