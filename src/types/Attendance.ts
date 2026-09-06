export interface AttendanceSettings {
  id: string;
  workspaceId: string;
  outsideHoursEnabled: boolean;
  outsideHoursMessage: string;
  outsideHoursCooldownHours: number;
  outsideHoursAnnounceReturn: boolean;
}

export interface UpdateAttendanceSettingsPayload {
  outsideHoursEnabled?: boolean;
  outsideHoursMessage?: string;
  outsideHoursCooldownHours?: number;
  outsideHoursAnnounceReturn?: boolean;
}

/**
 * Estado do expediente agora. A tela usa para explicar por que o aviso de fora
 * do horário pode não estar disparando.
 */
export interface AttendanceStatus {
  open: boolean;
  timezone: string;
  /** Falso quando não há expediente cadastrado — aí o negócio conta como 24h. */
  hasBusinessHours: boolean;
  /** Preenchido só quando está fechado. */
  nextOpeningAt: string | null;
}
