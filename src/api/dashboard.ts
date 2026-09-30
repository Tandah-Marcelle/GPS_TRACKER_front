import api from './axios';

export interface DashboardData {
    trackersByStatus: {
        IN_STOCK: number;
        INSTALLED: number;
        FAULTY: number;
        RETURNED: number;
    };
    interventionsThisWeekPerTechnician: {
        technicianId: string;
        fullName: string;
        count: number;
    }[];
    inStockCount: number;
    lowStockThreshold: number;
    lowStockAlert: boolean;
}

export const dashboardApi = {
    get: async (): Promise<DashboardData> => {
        const { data } = await api.get<DashboardData>('/dashboard');
        return data;
    },
};
