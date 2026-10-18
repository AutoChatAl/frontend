export type AuthErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_2FA_CODE'
  | 'NETWORK_ERROR'
  | 'MIXED_CONTENT_BLOCKED';

export interface AuthErrorBody {
  reason?: string;
}
