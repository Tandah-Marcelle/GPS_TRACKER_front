import api from './axios';
import type { Vehicle, VehiclePayload } from '../types';

export const vehiclesApi = {
  list: async (clientId?: string): Promise<Vehicle[]> => {
    const { data } = await api.get<Vehicle[]>('/vehicles', {
      params: clientId ? { clientId } : undefined,
    });
    return data;
  },

  get: async (id: string): Promise<Vehicle> => {
    const { data } = await api.get<Vehicle>(`/vehicles/${id}`);
    return data;
  },

  create: async (payload: VehiclePayload): Promise<Vehicle> => {
    const { data } = await api.post<Vehicle>('/vehicles', payload);
    return data;
  },

  update: async (id: string, payload: Partial<VehiclePayload>): Promise<Vehicle> => {
    const { data } = await api.patch<Vehicle>(`/vehicles/${id}`, payload);
    return data;
  },

  /** Rejects with 409 when trackers or interventions still reference the vehicle. */
  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const { data } = await api.delete<{ deleted: boolean; id: string }>(`/vehicles/${id}`);
    return data;
  },
};
