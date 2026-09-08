import type { AttendanceSettings, AttendanceStatus, UpdateAttendanceSettingsPayload } from '@/types/Attendance';
import { apiClient } from '@/utils/ApiClient';

class AttendanceService {
  public async getSettings(): Promise<AttendanceSettings> {
    const response = await apiClient.get<AttendanceSettings>('/inbox/attendance/settings');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar as regras de atendimento.');
    }
    return response.data;
  }

  public async updateSettings(payload: UpdateAttendanceSettingsPayload): Promise<AttendanceSettings> {
    const response = await apiClient.patch<AttendanceSettings>('/inbox/attendance/settings', payload);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível salvar as regras de atendimento.');
    }
    return response.data;
  }

  public async getStatus(): Promise<AttendanceStatus> {
    const response = await apiClient.get<AttendanceStatus>('/inbox/attendance/status');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível verificar o horário de atendimento.');
    }
    return response.data;
  }

}

export const attendanceService = new AttendanceService();
