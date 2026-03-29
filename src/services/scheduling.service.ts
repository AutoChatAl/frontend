import type { Appointment, AvailabilityResponse, BusinessHours, DaySchedule, DateException } from '@/types/Scheduling';
import { apiClient } from '@/utils/ApiClient';

class SchedulingService {
  // ── Appointments ──────────────────────────────

  public async listAppointments(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    contactId?: string;
  }): Promise<Appointment[]> {
    const queryString = new URLSearchParams();
    if (params?.startDate) queryString.append('startDate', params.startDate);
    if (params?.endDate) queryString.append('endDate', params.endDate);
    if (params?.status) queryString.append('status', params.status);
    if (params?.contactId) queryString.append('contactId', params.contactId);

    const url = `/scheduling/appointments${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    const response = await apiClient.get<Appointment[]>(url);
    if (response.success && response.data) {
      return response.data as Appointment[];
    }
    return [];
  }

  public async getAppointment(id: string): Promise<Appointment> {
    const response = await apiClient.get<Appointment>(`/scheduling/appointments/${id}`);
    if (!response.success || !response.data) throw new Error('Falha ao buscar agendamento.');
    return response.data as Appointment;
  }

  public async createAppointment(data: {
    type?: string;
    contactId?: string;
    productId?: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    notes?: string;
  }): Promise<Appointment> {
    const response = await apiClient.post<Appointment>('/scheduling/appointments', data);
    if (!response.success || !response.data) {
      const errorData = response.data as unknown as { code?: string };
      if (errorData?.code === 'TIME_CONFLICT') {
        throw new Error('Já existe um agendamento neste horário.');
      }
      throw new Error('Falha ao criar agendamento.');
    }
    return response.data as Appointment;
  }

  public async updateAppointment(
    id: string,
    data: {
      type?: string;
      contactId?: string | null;
      productId?: string | null;
      title?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      status?: string;
      notes?: string;
    },
  ): Promise<Appointment> {
    const response = await apiClient.put<Appointment>(`/scheduling/appointments/${id}`, data);
    if (!response.success || !response.data) throw new Error('Falha ao atualizar agendamento.');
    return response.data as Appointment;
  }

  public async deleteAppointment(id: string): Promise<void> {
    await apiClient.delete(`/scheduling/appointments/${id}`);
  }

  // ── Business Hours ────────────────────────────

  public async getBusinessHours(): Promise<BusinessHours> {
    const response = await apiClient.get<BusinessHours>('/scheduling/business-hours');
    if (response.success && response.data) {
      return response.data as BusinessHours;
    }
    throw new Error('Falha ao buscar horários de funcionamento.');
  }

  public async updateBusinessHours(data: {
    weeklySchedule?: DaySchedule[];
    exceptions?: DateException[];
    slotDurationMinutes?: number;
  }): Promise<BusinessHours> {
    const response = await apiClient.put<BusinessHours>('/scheduling/business-hours', data);
    if (!response.success || !response.data) throw new Error('Falha ao atualizar horários.');
    return response.data as BusinessHours;
  }

  // ── Availability ──────────────────────────────

  public async getAvailability(date: string): Promise<AvailabilityResponse> {
    const response = await apiClient.get<AvailabilityResponse>(`/scheduling/availability?date=${date}`);
    if (response.success && response.data) {
      return response.data as AvailabilityResponse;
    }
    return { date, slots: [], slotDurationMinutes: 30 };
  }
}

export const schedulingService = new SchedulingService();
