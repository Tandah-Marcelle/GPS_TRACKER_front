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
 *
 * Nest phrases messages as "<property> <rule>", so the leading word of the
 * message names the offending field. Explicit aliases cover the cases where
 * the label differs from the DTO property (simNumber -> "sim", clientId -> "client").
 */
const FIELD_ALIASES: Record<string, string> = {
  simnumber: 'simNumber',
  sim: 'simNumber',
  clientid: 'clientId',
  client: 'clientId',
};

export function serverFieldErrors(
  err: unknown,
  knownFields: readonly string[] = [],
): Record<string, string> {
  const data = toApiError(err);
  if (!data || !Array.isArray(data.message)) return {};

  const allowed = new Set(knownFields.map((f) => f.toLowerCase()));
  const fields: Record<string, string> = {};

  for (const raw of data.message) {
    const msg = String(raw);
    const head = msg.split(/\s+/)[0]?.toLowerCase() ?? '';
    let key: string | null = null;

    if (allowed.has(head)) key = head;
    else if (FIELD_ALIASES[head] && allowed.has(FIELD_ALIASES[head].toLowerCase()))
      key = FIELD_ALIASES[head].toLowerCase();
    else {
      // Fall back to a substring scan when the message does not start with the field
      // name, e.g. "property id should not exist".
      const found = knownFields.find((f) => msg.toLowerCase().includes(f.toLowerCase()));
      if (found) key = found.toLowerCase();
    }

    if (key && !fields[key]) fields[key] = msg;
  }

  return fields;
}
