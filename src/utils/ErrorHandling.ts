import { getErrorMessage, ERROR_MESSAGES, type ErrorReason } from '@/types/ErrorCode';

import type { ApiResponse } from './ApiClient';

export function getErrorFromResponse(response: ApiResponse<unknown>): string {
  if (response.success) {
    return '';
  }
  const errorData = response.data as {
        reason?: string;
    } | undefined;
  const reason = errorData?.reason as ErrorReason | undefined;
  return getErrorMessage(reason);
}
const INTERNAL_ERROR_PATTERN = /stripe|no such|contact support|customer not found/i;
export function extractSubscriptionError(response: ApiResponse<unknown>): string {
  if (response.success)
    return '';
  const errorData = response.data as {
        reason?: string;
    } | undefined;
  const reason = errorData?.reason ?? '';
  if (response.statusCode >= 500 || reason === 'INTERNAL_ERROR') {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }
  if (ERROR_MESSAGES[reason as ErrorReason]) {
    return ERROR_MESSAGES[reason as ErrorReason];
  }
  if (INTERNAL_ERROR_PATTERN.test(reason)) {
    return 'Erro ao processar assinatura. Entre em contato com o suporte.';
  }
  if (reason)
    return reason;
  return 'Erro desconhecido. Tente novamente.';
}
export function getErrorMessageFromCatch(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}
