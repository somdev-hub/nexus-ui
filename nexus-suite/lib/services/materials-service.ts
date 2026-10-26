import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type {
    Material,
    MaterialCreateRequest,
    MaterialUpdateRequest,
    MaterialFilter,
    MaterialPaginatedResponse,
} from '@/types/materials';

// ─────────────────────────────────────────────────────────────
// Materials API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = '/iam/core/retailer/materials';

function toFrontendMaterial(raw: any): Material {
    return {
        materialId: raw.materialId ?? 0,
        materialCode: raw.code ?? raw.materialCode ?? '',
        materialName: raw.name ?? raw.materialName ?? '',
        description: raw.description ?? '',
        category: raw.category ?? '',
        subCategory: raw.subCategory ?? '',
        unitOfMeasure: raw.unit ?? raw.unitOfMeasure ?? 'PCS',
        unitPrice: raw.pricePerUnit ?? raw.unitPrice ?? 0,
        currency: raw.currency ?? 'USD',
        taxRate: raw.taxRate ?? 0,
        isActive: raw.isActive ?? true,
        minOrderQuantity: raw.minOrderQuantity ?? 1,
        maxOrderQuantity: raw.maxOrderQuantity,
        leadTimeDays: raw.leadTimeDays ?? 0,
        weight: raw.weight,
        dimensions: raw.dimensions ?? '',
        barcode: raw.barcode ?? '',
        sku: raw.sku ?? '',
        tags: raw.tags ?? [],
        createdAt: raw.createdAt ?? '',
        updatedAt: raw.updatedAt ?? '',
        createdBy: raw.createdBy ?? '',
        updatedBy: raw.updatedBy ?? '',
    };
}

export async function getMaterials(
    filter: MaterialFilter = {}
): Promise<PaginatedResponse<Material>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    });

    const query = params.toString();
    const url = query ? `${BASE_PATH}/all?${query}` : `${BASE_PATH}/all`;

    const response = await apiClient.get<any>(url);
    const page = response.data;
    const content = (page.content ?? []).map(toFrontendMaterial);
    return { ...page, content } as PaginatedResponse<Material>;
}

export async function getMaterialById(materialId: number): Promise<Material> {
    const response = await apiClient.get<any>(
        `${BASE_PATH}/${materialId}`
    );
    return toFrontendMaterial(response.data);
}

export async function createMaterial(
    data: MaterialCreateRequest
): Promise<Material> {
    const response = await apiClient.post<Material>(`${BASE_PATH}/add`, data);
    return response.data;
}

export async function updateMaterial(
    materialId: number,
    data: MaterialUpdateRequest
): Promise<Material> {
    const response = await apiClient.put<Material>(
        `${BASE_PATH}/${materialId}`,
        data
    );
    return response.data;
}

export async function deleteMaterial(materialId: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${materialId}`);
}

export async function getMaterialCategories(): Promise<string[]> {
    const response = await apiClient.get<string[]>(`${BASE_PATH}/categories`);
    return response.data;
}
