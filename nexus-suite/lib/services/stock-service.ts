import apiClient from "@/lib/api-client";
import type { Stock, StockFilter, AbcAnalysis, StockMovement, StockPaginatedResponse, StockMovementPaginatedResponse } from "@/types/stock";

const BASE = "/iam/core/retailer";
const STOCK_BASE = `${BASE}/stock`;
const MOVEMENT_BASE = `${BASE}/stock-movements`;

function q(filter: Record<string, unknown>) {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, String(v)); });
  return p.toString();
}

export async function getStocks(filter: StockFilter = {}): Promise<StockPaginatedResponse> {
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
  // IAM maps to /iam/core/retailer/stocks/abc-analysis (plural) via StockController /core/stocks/abc-analysis
  const base = `${BASE}/stocks`;
  const url = category ? `${base}/abc-analysis?category=${category}` : `${base}/abc-analysis`;
  const res = await apiClient.get<AbcAnalysis>(url);
  return res.data;
}

export async function getInventoryValuation(warehouseId?: number): Promise<{ totalValue: number; stocks: Stock[] }> {
  const url = warehouseId ? `${STOCK_BASE}/valuation?warehouseId=${warehouseId}` : `${STOCK_BASE}/valuation`;
  const res = await apiClient.get<{ totalValue: number; stocks: Stock[] }>(url);
  return res.data;
}

export async function getReorderSuggestions(): Promise<Stock[]> {
  const res = await apiClient.get<Stock[]>(`${STOCK_BASE}/reorder-suggestions`);
  return res.data;
}

export async function getStockMovements(filter: Record<string, unknown> = {}): Promise<StockMovementPaginatedResponse> {
  const query = q(filter);
  const url = query ? `${MOVEMENT_BASE}/all?${query}` : `${MOVEMENT_BASE}/all`;
  const res = await apiClient.get<StockMovementPaginatedResponse>(url);
  return res.data;
}

export async function adjustStock(stockId: number, data: { quantity: number; reason: string; referenceType: string; referenceId: number }) {
  const res = await apiClient.post(`${STOCK_BASE}/${stockId}/adjust?quantity=${data.quantity}&reason=${encodeURIComponent(data.reason)}&referenceType=${data.referenceType}&referenceId=${data.referenceId}`, {});
  return res.data;
}
