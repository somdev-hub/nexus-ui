import apiClient from '@/lib/api-client';
import type {
    Stock,
    StockFilter,
    AbcAnalysis,
    StockMovement,
    StockPaginatedResponse,
    StockMovementPaginatedResponse,
} from '@/types/stock';
import type { ConsignmentStock, VmiConfig } from '@/types/supplier';

const BASE = '/iam/core/retailer';
const STOCK_BASE = `${BASE}/stock`;
const MOVEMENT_BASE = `${BASE}/stock-movements`;
const WAREHOUSE_BASE = `${BASE}/warehouses`;

export interface Warehouse {
    warehouseId: number;
    code?: string;
    location?: string;
    storageCapacity?: number;
    currentUtilization?: number;
    [key: string]: unknown;
}

export async function getWarehouses(): Promise<Warehouse[]> {
    const res = await apiClient.get<unknown>(`${WAREHOUSE_BASE}/all`);
    const data = res.data as
        Warehouse[] | { content?: Warehouse[] } | undefined;
    if (Array.isArray(data)) return data;
    return data?.content ?? [];
}

function q(filter: Record<string, unknown>) {
    const p = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return p.toString();
}

export async function getStocks(
    filter: StockFilter = {}
): Promise<StockPaginatedResponse> {
    const query = q(filter as Record<string, unknown>);
    const url = query ? `${STOCK_BASE}/all?${query}` : `${STOCK_BASE}/all`;
    const res = await apiClient.get<StockPaginatedResponse>(url);
    return res.data;
}

export async function getStockById(id: number): Promise<Stock> {
    const res = await apiClient.get<Stock>(`${STOCK_BASE}/${id}`);
    return res.data;
}

export async function getAbcAnalysis(category?: string): Promise<AbcAnalysis> {
    const base = `${BASE}/stocks`;
    const url = category
        ? `${base}/abc-analysis?category=${category}`
        : `${base}/abc-analysis`;
    const res = await apiClient.get<AbcAnalysis>(url);
    return res.data;
}

export async function getInventoryValuation(
    warehouseId?: number
): Promise<{ totalValue: number; stocks: Stock[] }> {
    const url = warehouseId
        ? `${STOCK_BASE}/valuation?warehouseId=${warehouseId}`
        : `${STOCK_BASE}/valuation`;
    const res = await apiClient.get<{ totalValue: number; stocks: Stock[] }>(
        url
    );
    return res.data;
}

export async function getReorderSuggestions(
    pageNo = 0,
    pageOffset = 20
): Promise<{ content: Stock[]; totalPages: number; number: number }> {
    const res = await apiClient.get<any>(
        `${STOCK_BASE}/reorder-suggestions?page=${pageNo}&size=${pageOffset}`
    );
    return res.data;
}

export async function getStockMovements(
    filter: Record<string, unknown> = {}
): Promise<StockMovementPaginatedResponse> {
    const query = q(filter);
    const url = query
        ? `${MOVEMENT_BASE}/all?${query}`
        : `${MOVEMENT_BASE}/all`;
    const res = await apiClient.get<StockMovementPaginatedResponse>(url);
    return res.data;
}

export async function adjustStock(
    stockId: number,
    data: {
        quantity: number;
        reason: string;
        referenceType: string;
        referenceId: number;
    }
) {
    const res = await apiClient.post(
        `${STOCK_BASE}/${stockId}/adjust?quantity=${data.quantity}&reason=${encodeURIComponent(data.reason)}&referenceType=${data.referenceType}&referenceId=${data.referenceId}`,
        {}
    );
    return res.data;
}

export async function getRetailerConsignments(): Promise<ConsignmentStock[]> {
    const res = await apiClient.get<any>('/iam/core/retailer/consignment/all');
    const data = res.data;
    return Array.isArray(data) ? data : (data.content ?? []);
}

export async function consumeConsignment(id: number, quantity: number) {
    const res = await apiClient.post<any>(`/iam/core/retailer/consignment/${id}/consume?quantity=${quantity}`, {});
    return res.data;
}

export async function returnConsignment(id: number, quantity: number) {
    const res = await apiClient.post<any>(`/iam/core/retailer/consignment/${id}/return?quantity=${quantity}`, {});
    return res.data;
}

export async function receiveConsignment(id: number, quantity: number) {
    const res = await apiClient.post<any>(`/iam/core/retailer/consignment/${id}/receive?quantity=${quantity}`, {});
    return res.data;
}

export async function getRetailerVmis(): Promise<VmiConfig[]> {
    const res = await apiClient.get<any>('/iam/core/retailer/vmi/all');
    const data = res.data;
    return Array.isArray(data) ? data : (data.content ?? []);
}