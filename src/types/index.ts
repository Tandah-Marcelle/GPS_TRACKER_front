export type Role = 'STOCK_MANAGER' | 'TECHNICIAN';

export type TrackerStatus = 'IN_STOCK' | 'INSTALLED' | 'FAULTY' | 'RETURNED';

export type InterventionStatus = 'PLANNED' | 'DONE' | 'CANCELLED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  email?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface VehicleRef {
  id: string;
  plate: string;
  brand?: string;
  model?: string;
}

export interface Tracker {
  id: string;
  imei: string;
  model: string;
  simNumber: string;
  status: TrackerStatus;
  vehicleId: string | null;
  createdAt: string;
  vehicle?: VehicleRef | null;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TrackerHistoryEntry {
  id: string;
  trackerId: string;
  oldStatus: TrackerStatus | null;
  newStatus: TrackerStatus;
  action: string;
  userId: string;
  vehicleId: string | null;
  interventionId: string | null;
  comment: string | null;
  createdAt: string;
  user: { id: string; username: string; fullName: string; role: Role };
  vehicle: VehicleRef | null;
  intervention: { id: string; status: InterventionStatus; scheduledAt: string } | null;
}

export interface TrackerQuery {
  status?: TrackerStatus;
  search?: string;
  page?: number;
  limit?: number;
}
