import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

function toApiError(err: unknown): ApiError | null {
  const e = err as AxiosError<ApiError>;
  return e?.response?.data ?? null;
}

/** Human readable message for any API failure. */
export function serverMessage(err: unknown, fallback = 'Something went wrong'): string {
  const data = toApiError(err);
  const msg = data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.length) return msg;
  return fallback;
}

/**
 * Maps a NestJS validation message array onto form fields.
 * e.g. "IMEI must be exactly 15 digits" -> { imei: "IMEI must be exactly 15 digits" }
 */
export function serverFieldErrors(err: unknown): Record<string, string> {
  const data = toApiError(err);
  if (!data || !Array.isArray(data.message)) return {};

  const fields: Record<string, string> = {};
  for (const raw of data.message) {
    const msg = String(raw);
    const key =
      msg.toLowerCase().startsWith('imei') || msg.toLowerCase().includes('imei')
        ? 'imei'
        : msg.toLowerCase().includes('sim')
          ? 'simNumber'
          : msg.toLowerCase().includes('model')
            ? 'model'
            : msg.toLowerCase().includes('status')
              ? 'status'
              : null;
    if (key && !fields[key]) fields[key] = msg;
  }
  return fields;
}
