import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type {
    Product,
    ProductCreateRequest,
    ProductFilter,
    ProductUpdateRequest,
} from '@/types/products';

// ─────────────────────────────────────────────────────────────
// Products API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = '/iam/core/retailer/products';

// ─────────────────────────────────────────────────────────────
// Backend (Core ProductDto) uses: name, code, description, price,
// sellingPrice, productCategory, productStatus, taxPercentage.
// UI uses: productName, productCode, category, unitPrice, isActive, taxRate.
// Translate at the boundary so the UI stays unchanged.
// ─────────────────────────────────────────────────────────────

function toBackendCreatePayload(
    data: ProductCreateRequest
): Record<string, unknown> {
    return {
        name: data.productName,
        code: data.productCode,
        description: data.description,
        price: data.unitPrice,
        sellingPrice: data.unitPrice,
        cost: data.unitPrice,
        productCategory: data.category,
        productStatus: data.isActive ? 'ACTIVE' : 'INACTIVE',
        taxPercentage: data.taxRate,
        taxCharged: data.taxRate > 0,
        subCategory: data.subCategory,
        brand: data.brand,
        unitOfMeasure: data.unitOfMeasure,
        currency: data.currency,
        minOrderQuantity: data.minOrderQuantity,
        maxOrderQuantity: data.maxOrderQuantity,
        leadTimeDays: data.leadTimeDays,
        weight: data.weight,
        dimensions: data.dimensions,
        barcode: data.barcode,
        sku: data.sku,
        tags: data.tags,
    };
}

function toBackendUpdatePayload(
    data: ProductUpdateRequest
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (data.productName !== undefined) out.name = data.productName;
    if (data.description !== undefined) out.description = data.description;
    if (data.category !== undefined) out.productCategory = data.category;
    if (data.unitPrice !== undefined) {
        out.price = data.unitPrice;
        out.sellingPrice = data.unitPrice;
    }
    if (data.taxRate !== undefined) {
        out.taxPercentage = data.taxRate;
        out.taxCharged = data.taxRate > 0;
    }
    if (data.isActive !== undefined)
        out.productStatus = data.isActive ? 'ACTIVE' : 'INACTIVE';
    if (data.subCategory !== undefined) out.subCategory = data.subCategory;
    if (data.brand !== undefined) out.brand = data.brand;
    if (data.unitOfMeasure !== undefined)
        out.unitOfMeasure = data.unitOfMeasure;
    if (data.currency !== undefined) out.currency = data.currency;
    if (data.minOrderQuantity !== undefined)
        out.minOrderQuantity = data.minOrderQuantity;
    if (data.maxOrderQuantity !== undefined)
        out.maxOrderQuantity = data.maxOrderQuantity;
    if (data.leadTimeDays !== undefined) out.leadTimeDays = data.leadTimeDays;
    if (data.weight !== undefined) out.weight = data.weight;
    if (data.dimensions !== undefined) out.dimensions = data.dimensions;
    if (data.barcode !== undefined) out.barcode = data.barcode;
    if (data.sku !== undefined) out.sku = data.sku;
    if (data.tags !== undefined) out.tags = data.tags;
    return out;
}

function toFrontendProduct(raw: any): Product {
    return {
        productId: raw.productId ?? raw.id ?? 0,
        productCode: raw.productCode ?? raw.code ?? '',
        productName: raw.productName ?? raw.name ?? '',
        description: raw.description ?? '',
        category: raw.category ?? raw.productCategory ?? '',
        subCategory: raw.subCategory ?? '',
        brand: raw.brand ?? '',
        unitOfMeasure: raw.unitOfMeasure ?? 'PCS',
        unitPrice: raw.unitPrice ?? raw.price ?? raw.sellingPrice ?? 0,
        currency: raw.currency ?? 'USD',
        taxRate: raw.taxRate ?? raw.taxPercentage ?? 0,
        isActive:
            raw.isActive ??
            (raw.productStatus ? raw.productStatus === 'ACTIVE' : true),
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

export async function getProducts(
    filter: ProductFilter = {}
): Promise<PaginatedResponse<Product>> {
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
    const content = (page.content ?? []).map(toFrontendProduct);
    if (
        typeof window !== 'undefined' &&
        content.length > 0 &&
        content.every(
            (p: Product) => !p.productId || (p as any).productId === 0
        )
    ) {
        // Backend is not returning IDs (stale Core build?) — table actions
        // need real IDs, so surface it loudly instead of routing to /0/edit.
        console.warn(
            '[products-service] list response contains no productId. ' +
                'Ensure Core was recompiled/restarted after ProductDto gained productId.'
        );
    }
    return {
        ...page,
        content,
    } as PaginatedResponse<Product>;
}

export async function getProductById(productId: number): Promise<Product> {
    const response = await apiClient.get<any>(`${BASE_PATH}/${productId}`);
    return toFrontendProduct(response.data);
}

export async function createProduct(
    data: ProductCreateRequest
): Promise<Product> {
    const response = await apiClient.post<any>(
        `${BASE_PATH}/add`,
        toBackendCreatePayload(data)
    );
    return toFrontendProduct(response.data);
}

export async function updateProduct(
    productId: number,
    data: ProductUpdateRequest
): Promise<Product> {
    const response = await apiClient.put<any>(
        `${BASE_PATH}/${productId}/update`,
        toBackendUpdatePayload(data)
    );
    return toFrontendProduct(response.data);
}

export async function deleteProduct(productId: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${productId}/delete`);
}

// Categories/brands are now client-side constants derived from ProductCategory enum — no backend call required.
// See: nexus/core/src/main/java/com/nexus/core/entities/ProductCategory.java
export async function getProductCategories(): Promise<string[]> {
    // Fallback static list matching ProductCategory enum; avoids 404 on /core/products/categories
    return [
        'ELECTRONICS',
        'FURNITURE',
        'CLOTHING',
        'FOOD',
        'BOOKS',
        'TOYS',
        'BEAUTY',
        'SPORTS',
        'AUTOMOTIVE',
        'HEALTH',
        'JEWELRY',
        'MUSIC',
        'GARDEN',
        'OFFICE_SUPPLIES',
        'PET_SUPPLIES',
        'ART',
        'TRAVEL',
        'OTHER',
    ];
}

export async function getProductBrands(): Promise<string[]> {
    // Brands are free-form; return empty to allow user input. No dedicated backend requirement (SRS-01/02).
    return [];
}
