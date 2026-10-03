import apiClient from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/paginated-response';

// ─────────────────────────────────────────────────────────────
// Supplier Discovery (retailer view) API Service
//
// Contracts (backend stream owns these paths — do not invent others):
// - Directory: GET /iam/organizations/directory?orgType=SUPPLIER&search=
//   → array { id, orgName, orgType, city, country, trustScore } (cap 200, unpaged)
// - Browse:    GET /iam/core/retailer/catalog/browse
//              ?search=&category=&family=&supplierOrgId=&page=&size=
//   → paginated { content: [{ catalogId, name, code, sku, category, family,
//              description, basePrice, currency, status, accessLevel,
//              supplierOrgId, supplierOrgName, updatedAt, ... }], totalElements }
//
// Every field is read defensively (?? fallbacks) — a field absent at runtime
// must render a fallback, never crash.
// ─────────────────────────────────────────────────────────────

export interface SupplierDirectoryEntry {
    id: number;
    orgName: string;
    orgType?: string;
    city?: string;
    country?: string;
    trustScore?: number;
    [key: string]: unknown;
}

export interface SupplierBrowseItem {
    catalogId?: number;
    id?: number;
    name?: string;
    code?: string;
    sku?: string;
    category?: string;
    family?: string;
    description?: string;
    basePrice?: number;
    unitOfMeasure?: string;
    currency?: string;
    status?: string;
    accessLevel?: string;
    supplierOrgId?: number;
    supplierOrgName?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface BrowseCatalogFilter {
    search?: string;
    category?: string;
    family?: string;
    supplierOrgId?: number | string;
    pageNo?: number;
    pageOffset?: number;
}

function toArray<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.content)) return obj.content as T[];
        if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
}

export async function getOrganizationDirectory(
    orgType: 'SUPPLIER' | 'LOGISTICS' | 'RETAILER',
    search?: string
): Promise<SupplierDirectoryEntry[]> {
    const params = new URLSearchParams({ orgType });
    if (search !== undefined && search !== null)
        params.append('search', search);
    const response = await apiClient.get<unknown>(
        `/iam/organizations/directory?${params.toString()}`
    );
    return toArray<SupplierDirectoryEntry>(response.data);
}

export async function getSupplierDirectory(
    search?: string
): Promise<SupplierDirectoryEntry[]> {
    return getOrganizationDirectory('SUPPLIER', search);
}

export async function browseSupplierCatalog(
    filter: BrowseCatalogFilter = {}
): Promise<PaginatedResponse<SupplierBrowseItem>> {
    const params = new URLSearchParams();
    // Spring pageable dialect is page/size; the UI filter uses pageNo/pageOffset.
    const { pageNo, pageOffset, ...rest } = filter;
    Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    });
    if (pageNo !== undefined && pageNo !== null)
        params.append('page', String(pageNo));
    if (pageOffset !== undefined && pageOffset !== null)
        params.append('size', String(pageOffset));
    const query = params.toString();
    const url = query
        ? `/iam/core/retailer/catalog/browse?${query}`
        : '/iam/core/retailer/catalog/browse';
    const response = await apiClient.get<unknown>(url);
    const data = response.data as Partial<
        PaginatedResponse<SupplierBrowseItem>
    > & { data?: unknown };
    const content = toArray<SupplierBrowseItem>(data);
    return {
        content,
        pageNo: data?.pageNo ?? 0,
        pageOffset: data?.pageOffset ?? content.length,
        totalElements: data?.totalElements ?? content.length,
        totalPages: data?.totalPages ?? 1,
        last: data?.last ?? true,
        first: data?.first ?? true,
        empty: data?.empty ?? content.length === 0,
        numberOfElements: data?.numberOfElements ?? content.length,
        size: data?.size ?? content.length,
        sort: data?.sort ?? { sorted: false, unsorted: true, empty: true },
    };
}
