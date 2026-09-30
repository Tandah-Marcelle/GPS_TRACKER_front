import type { TrackerStatus } from '../types';

/**
 * Mirror of the backend transition map (src/trackers/trackers.constants.ts).
 * The UI only ever offers these targets, so a technician-style manual
 * "mark as installed" action can never be triggered from the frontend.
 */
export const TRACKER_TRANSITIONS: Record<TrackerStatus, TrackerStatus[]> = {
  IN_STOCK: ['FAULTY'],
  INSTALLED: ['RETURNED', 'FAULTY'],
  FAULTY: ['RETURNED'],
  RETURNED: ['IN_STOCK'],
};

export const STATUS_LABELS: Record<TrackerStatus, string> = {
  IN_STOCK: 'In stock',
  INSTALLED: 'Installed',
  FAULTY: 'Faulty',
  RETURNED: 'Returned',
};

export const STATUS_COLORS: Record<TrackerStatus, string> = {
  IN_STOCK: 'teal',
  INSTALLED: 'blue',
  FAULTY: 'red',
  RETURNED: 'orange',
};

export function allowedTransitionsFrom(status: TrackerStatus): TrackerStatus[] {
  return TRACKER_TRANSITIONS[status] ?? [];
}

export function hasManualTransition(status: TrackerStatus): boolean {
  return allowedTransitionsFrom(status).length > 0;
}
