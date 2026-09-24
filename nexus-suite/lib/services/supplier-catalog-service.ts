import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  SupplierCatalog,
  ProductVariant,
  SupplierPriceTier,
  SupplierDigitalAsset,
  SupplierCatalogFilter,
  VariantFilter,
  PriceTierFilter,
  DigitalAssetFilter,
  CatalogSummary,
  CatalogTransitionParams,
} from "@/types/supplier";

const CATALOG_BASE = "/iam/core/supplier/catalog";
const VARIANT_BASE = "/iam/core/supplier/variants";
const PRICE_BASE = "/iam/core/supplier/price-tiers";
const ASSET_BASE = "/iam/core/supplier/digital-assets";

export async function getSupplierCatalogs(
  filter: SupplierCatalogFilter = {},
): Promise<PaginatedResponse<SupplierCatalog>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${CATALOG_BASE}/all?${q}` : `${CATALOG_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<SupplierCatalog>>(url);
  return res.data;
}
export async function getSupplierCatalogById(
  id: number,
): Promise<SupplierCatalog> {
  const res = await apiClient.get<SupplierCatalog>(`${CATALOG_BASE}/${id}`);
  return res.data;
}
export async function createSupplierCatalog(
  data: Partial<SupplierCatalog>,
): Promise<SupplierCatalog> {
  const res = await apiClient.post<SupplierCatalog>(
    `${CATALOG_BASE}/create`,
    data,
  );
  return res.data;
}
export async function updateSupplierCatalog(
  id: number,
  data: Partial<SupplierCatalog>,
): Promise<SupplierCatalog> {
  const res = await apiClient.put<SupplierCatalog>(
    `${CATALOG_BASE}/${id}/update`,
    data,
  );
  return res.data;
}
export async function transitionCatalogStatus(
  id: number,
  newStatus: string,
  params?: CatalogTransitionParams,
): Promise<SupplierCatalog> {
  const res = await apiClient.put<SupplierCatalog>(
    `${CATALOG_BASE}/${id}/status?newStatus=${newStatus}`,
    params || {},
  );
  return res.data;
}
export async function deleteSupplierCatalog(id: number): Promise<void> {
  await apiClient.delete(`${CATALOG_BASE}/${id}`);
}
export async function getCatalogSummary(): Promise<CatalogSummary> {
  const res = await apiClient.get<CatalogSummary>(`${CATALOG_BASE}/summary`);
  return res.data;
}

// Variants
export async function getVariants(
  filter: VariantFilter = {},
): Promise<PaginatedResponse<ProductVariant>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${VARIANT_BASE}/all?${q}` : `${VARIANT_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<ProductVariant>>(url);
  return res.data;
}
export async function createVariant(
  data: Partial<ProductVariant>,
): Promise<ProductVariant> {
  const res = await apiClient.post<ProductVariant>(
    `${VARIANT_BASE}/create`,
    data,
  );
  return res.data;
}
export async function deleteVariant(id: number): Promise<void> {
  await apiClient.delete(`${VARIANT_BASE}/${id}`);
}

// Price Tiers
export async function getPriceTiers(
  filter: PriceTierFilter = {},
): Promise<PaginatedResponse<SupplierPriceTier>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${PRICE_BASE}/all?${q}` : `${PRICE_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<SupplierPriceTier>>(url);
  return res.data;
}
export async function createPriceTier(
  data: Partial<SupplierPriceTier>,
): Promise<SupplierPriceTier> {
  const res = await apiClient.post<SupplierPriceTier>(
    `${PRICE_BASE}/create`,
    data,
  );
  return res.data;
}
export async function deletePriceTier(id: number): Promise<void> {
  await apiClient.delete(`${PRICE_BASE}/${id}`);
}
export async function getPriceForQuantity(
  catalogId: number,
  quantity: number,
  customerSegment?: string,
): Promise<SupplierPriceTier> {
  const p = new URLSearchParams({
    catalogId: String(catalogId),
    quantity: String(quantity),
  });
  if (customerSegment) p.append("customerSegment", customerSegment);
  const res = await apiClient.get<SupplierPriceTier>(
    `${PRICE_BASE}/price-for-quantity?${p.toString()}`,
  );
  return res.data;
}

// Digital Assets
export async function getDigitalAssets(
  filter: DigitalAssetFilter = {},
): Promise<PaginatedResponse<SupplierDigitalAsset>> {
  const p = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  });
  const q = p.toString();
  const url = q ? `${ASSET_BASE}/all?${q}` : `${ASSET_BASE}/all`;
  const res = await apiClient.get<PaginatedResponse<SupplierDigitalAsset>>(url);
  return res.data;
}
export async function createDigitalAsset(
  data: Partial<SupplierDigitalAsset>,
): Promise<SupplierDigitalAsset> {
  const res = await apiClient.post<SupplierDigitalAsset>(
    `${ASSET_BASE}/create`,
    data,
  );
  return res.data;
}
export async function deleteDigitalAsset(id: number): Promise<void> {
  await apiClient.delete(`${ASSET_BASE}/${id}`);
}
