import api from './axios';
import type { Paginated, Tracker, TrackerHistoryEntry, TrackerQuery, TrackerStatus } from '../types';

export const trackersApi = {
  list: async (query: TrackerQuery = {}): Promise<Paginated<Tracker>> => {
    const { data } = await api.get<Paginated<Tracker>>('/trackers', { params: query });
    return data;
  },

  available: async (search?: string): Promise<Tracker[]> => {
    const { data } = await api.get<Tracker[]>('/trackers/available', {
      params: search ? { search } : undefined,
    });
    return data;
  },

  get: async (id: string): Promise<Tracker> => {
    const { data } = await api.get<Tracker>(`/trackers/${id}`);
    return data;
  },

  create: async (payload: { imei: string; model: string; simNumber: string }): Promise<Tracker> => {
    const { data } = await api.post<Tracker>('/trackers', payload);
    return data;
  },

  update: async (
    id: string,
    payload: { model?: string; simNumber?: string },
  ): Promise<Tracker> => {
    const { data } = await api.patch<Tracker>(`/trackers/${id}`, payload);
    return data;
  },

  updateStatus: async (
    id: string,
    payload: { status: TrackerStatus; comment?: string },
  ): Promise<Tracker> => {
    const { data } = await api.patch<Tracker>(`/trackers/${id}/status`, payload);
    return data;
  },

  history: async (id: string): Promise<TrackerHistoryEntry[]> => {
    const { data } = await api.get<TrackerHistoryEntry[]>(`/trackers/${id}/history`);
    return data;
  },

  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const { data } = await api.delete<{ deleted: boolean; id: string }>(`/trackers/${id}`);
    return data;
  },
};
