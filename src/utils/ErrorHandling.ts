import { getErrorMessage, type ErrorReason } from '@/types/ErrorCode';

import type { ApiResponse } from './ApiClient';

export function getErrorFromResponse(response: ApiResponse<unknown>): string {
  if (response.success) {
    return '';
  }

  const errorData = response.data as { reason?: string } | undefined;
  const reason = errorData?.reason as ErrorReason | undefined;
  return getErrorMessage(reason);
}

export function getErrorMessageFromCatch(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}
