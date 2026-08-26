'use client';
import { CalendarDays } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import Button from '@/components/Button';
import PageLoader from '@/components/PageLoader';
import { ToastContainer } from '@/components/Toast';
import { aiService } from '@/services/ai.service';
import type { Product } from '@/services/ai.service';
import { contactService } from '@/services/contact.service';
import { schedulingService } from '@/services/scheduling.service';
import type { Contact } from '@/types/Contact';
import type { Appointment, BusinessHours } from '@/types/Scheduling';
import { apiClient } from '@/utils/ApiClient';

import AppointmentModal from './components/AppointmentModal';
import BusinessHoursConfig from './components/BusinessHoursConfig';
import CalendarView from './components/CalendarView';
import GoogleCalendarIntegration from './components/GoogleCalendarIntegration';
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
  const [schedulingReminderEnabled, setSchedulingReminderEnabled] = useState(false);
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
      weekEnd.setDate(weekEnd.getDate() + 42);
      const [appointmentsData, businessHoursData, firstContactPage, aiData, notificationsData] = await Promise.all([
        schedulingService.listAppointments({
          startDate: new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: weekEnd.toISOString(),
        }),
        schedulingService.getBusinessHours(),
        contactService.listContacts({ limit: 100, skip: 0 }),
        aiService.getConfig(),
        apiClient.get<{
                    schedulingReminder?: boolean;
                }>('/auth/workspace/notifications'),
      ]);
      let allContacts = firstContactPage.data || [];
      const totalContacts = firstContactPage.total || 0;
      if (totalContacts > 100) {
        const pages = Math.ceil(totalContacts / 100);
        const additionalPages = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => contactService.listContacts({ limit: 100, skip: (i + 1) * 100 })));
        for (const page of additionalPages) {
          allContacts = [...allContacts, ...(page.data || [])];
        }
      }
      setAppointments(appointmentsData);
      setBusinessHours(businessHoursData);
      setContacts(allContacts);
      setProducts(aiData.products || []);
      if (notificationsData.success && notificationsData.data) {
        const notif = notificationsData.data as {
                    schedulingReminder?: boolean;
                };
        setSchedulingReminderEnabled(notif.schedulingReminder ?? false);
      }
    }
    catch {
      addToast('error', 'Erro ao carregar dados de agendamento.');
    }
    finally {
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
      }
      else {
        await schedulingService.createAppointment(data);
        addToast('success', 'Agendamento criado com sucesso!');
      }
      setModalOpen(false);
      loadData();
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao salvar agendamento.');
    }
  };
  const handleDeleteAppointment = async (id: string) => {
    try {
      await schedulingService.deleteAppointment(id);
      addToast('success', 'Agendamento excluído.');
      setModalOpen(false);
      loadData();
    }
    catch {
      addToast('error', 'Erro ao excluir agendamento.');
    }
  };
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await schedulingService.updateAppointment(id, { status });
      addToast('success', 'Status atualizado!');
      loadData();
    }
    catch {
      addToast('error', 'Erro ao atualizar status.');
    }
  };
  const handleSaveBusinessHours = async (data: Partial<BusinessHours>) => {
    try {
      const updated = await schedulingService.updateBusinessHours(data);
      setBusinessHours(updated);
      addToast('success', 'Horários de trabalho atualizados!');
    }
    catch {
      addToast('error', 'Erro ao salvar horários.');
    }
  };
  const handleSchedulingReminderChange = async (value: boolean) => {
    setSchedulingReminderEnabled(value);
    try {
      await apiClient.put('/auth/workspace/notifications', { schedulingReminder: value });
    }
    catch {
      addToast('error', 'Erro ao salvar configuração de lembrete.');
      setSchedulingReminderEnabled(!value);
    }
  };
  if (loading) {
    return <PageLoader message="Carregando agendamentos"/>;
  }
  return (<div className="w-full max-w-full space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Agendamentos</h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Sua agenda, os horários de atendimento e a integração com o Google
        </p>
      </div>
      <Button onClick={() => handleCreateAppointment()} icon={<CalendarDays size={16}/>} className="justify-center">
        Novo agendamento
      </Button>
    </div>

    {/* Nav à esquerda e conteúdo ao lado; no mobile a nav vira uma fila rolável em cima. */}
    <div className="flex flex-col gap-4 lg:flex-row">
      <div data-tour="scheduling-tabs" className="lg:w-52 lg:shrink-0">
        <SchedulingTabs activeTab={activeTab} onTabChange={setActiveTab}/>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {activeTab === 'calendar' && (<CalendarView appointments={appointments} businessHours={businessHours} contacts={contacts} products={products} currentWeekStart={currentWeekStart} onWeekChange={setCurrentWeekStart} onCreateAppointment={handleCreateAppointment} onEditAppointment={handleEditAppointment} onUpdateStatus={handleUpdateStatus}/>)}

        {activeTab === 'business-hours' && businessHours && (<BusinessHoursConfig businessHours={businessHours} onSave={handleSaveBusinessHours} schedulingReminderEnabled={schedulingReminderEnabled} onSchedulingReminderChange={handleSchedulingReminderChange}/>)}

        {activeTab === 'integrations' && (<GoogleCalendarIntegration onToast={addToast}/>)}
      </div>
    </div>

    {modalOpen && (<AppointmentModal appointment={editingAppointment} contacts={contacts} products={products} initialDate={selectedDate} initialTime={selectedTime} slotDuration={businessHours?.slotDurationMinutes || 30} businessHours={businessHours} onSave={handleSaveAppointment} {...(editingAppointment && { onDelete: () => { void handleDeleteAppointment(editingAppointment.id); } })} onClose={() => setModalOpen(false)} onProductCreated={(product) => setProducts((prev) => [...prev, product])}/>)}

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
