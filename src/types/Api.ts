import type { ErrorReason } from './ErrorCode';

export type ApiError = {
  reason?: ErrorReason;
  statusCode: number;
};
