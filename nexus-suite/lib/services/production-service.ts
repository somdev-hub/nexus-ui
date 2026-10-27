import apiClient from '@/lib/api-client';
import type { ProductionOrder } from '@/types/production';

const BASE = '/iam/core/retailer/production-orders';

export async function getProductionOrders(page = 0, size = 20): Promise<{ content: ProductionOrder[]; totalPages: number; number: number }> {
    const res = await apiClient.get<any>(`${BASE}?page=${page}&size=${size}`);
    return res.data;
}

export async function createProductionOrder(productId: number, quantity: number, notes?: string, deadline?: string): Promise<ProductionOrder> {
    const params = new URLSearchParams();
    params.set('productId', String(productId));
    params.set('quantity', String(quantity));
    if (notes) params.set('notes', notes);
    if (deadline) params.set('deadline', deadline);
    const res = await apiClient.post<ProductionOrder>(`${BASE}?${params.toString()}`, {});
    return res.data;
}

export async function getProductionOrder(id: number): Promise<ProductionOrder> {
    const res = await apiClient.get<ProductionOrder>(`${BASE}/${id}`);
    return res.data;
}

export async function allocateProductionOrder(id: number): Promise<ProductionOrder> {
    const res = await apiClient.post<ProductionOrder>(`${BASE}/${id}/allocate`, {});
    return res.data;
}

export async function startProduction(id: number): Promise<ProductionOrder> {
    const res = await apiClient.post<ProductionOrder>(`${BASE}/${id}/start`, {});
    return res.data;
}

export async function completeProduction(id: number): Promise<ProductionOrder> {
    const res = await apiClient.post<ProductionOrder>(`${BASE}/${id}/complete`, {});
    return res.data;
}

export async function cancelProduction(id: number): Promise<ProductionOrder> {
    const res = await apiClient.post<ProductionOrder>(`${BASE}/${id}/cancel`, {});
    return res.data;
}

export async function releaseBatch(stockId: number): Promise<string> {
    const res = await apiClient.post<string>(`${BASE}/release-batch/${stockId}`, {});
    return res.data;
}