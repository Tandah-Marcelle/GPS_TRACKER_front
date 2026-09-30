import api from './axios';
import type { Intervention, InterventionPayload, Paginated } from '../types';

export const interventionsApi = {
    list: async (filters?: { status?: string; technicianId?: string; date?: string; all?: boolean }) => {
        const { data } = await api.get<Paginated<Intervention>>('/interventions', {
            params: { ...filters, all: true }, // We're doing client-side pagination for now
        });
        return data.data;
    },

    create: async (payload: InterventionPayload) => {
        const { data } = await api.post<Intervention>('/interventions', payload);
        return data;
    },

    cancel: async (id: string) => {
        const { data } = await api.patch<Intervention>(`/interventions/${id}/cancel`);
        return data;
    },

    complete: async (id: string, trackerId: string) => {
        const { data } = await api.post<Intervention>(`/interventions/${id}/complete`, { trackerId });
        return data;
    }
};
