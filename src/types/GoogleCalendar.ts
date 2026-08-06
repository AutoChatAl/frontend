export interface GoogleCalendarStatus {
    connected: boolean;
    googleEmail?: string;
    calendarId?: string;
    syncEnabled?: boolean;
    lastSyncedAt?: string | null;
    lastSyncError?: string | null;
}
