import apiClient from '@/lib/api-client';

const BASE = '/iam/core/retailer/warehouses';

export interface Warehouse {
    warehouseId: number;
    code: string;
    location: string;
    storageCapacity?: number;
    currentUtilization?: number;
    warehouseType?: string;
    capacityMultiplier?: number;
    capacity?: number;
    fillOrder?: number;
}

export async function getWarehouses(): Promise<Warehouse[]> {
    const res = await apiClient.get<any>(`${BASE}/all?size=100`);
    const page = res.data;
    return Array.isArray(page) ? page : (page.content ?? []);
}

export async function createWarehouse(data: Partial<Warehouse>) {
    const res = await apiClient.post<any>(`${BASE}/add`, data);
    return res.data;
}

export async function setProductionCapacity(capacity: number) {
    const res = await apiClient.post<any>(`${BASE}/capacity?capacity=${capacity}`, {});
    return res.data;
}