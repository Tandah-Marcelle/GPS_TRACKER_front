import api from './axios';
import type { Client, ClientPayload } from '../types';

export const clientsApi = {
  list: async (search?: string): Promise<Client[]> => {
    const { data } = await api.get<Client[]>('/clients', {
      params: search ? { search } : undefined,
    });
    return data;
  },

  get: async (id: string): Promise<Client> => {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },

  create: async (payload: ClientPayload): Promise<Client> => {
    const { data } = await api.post<Client>('/clients', payload);
    return data;
  },

  update: async (id: string, payload: Partial<ClientPayload>): Promise<Client> => {
    const { data } = await api.patch<Client>(`/clients/${id}`, payload);
    return data;
  },

  /** Rejects with 409 when vehicles or interventions still reference the client. */
  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const { data } = await api.delete<{ deleted: boolean; id: string }>(`/clients/${id}`);
    return data;
  },
};
