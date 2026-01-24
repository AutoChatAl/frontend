export type ApiError = {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
};
