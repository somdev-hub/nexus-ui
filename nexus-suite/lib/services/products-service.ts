import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
    Product,
    ProductCreateRequest,
    ProductFilter,
    ProductUpdateRequest
} from "@/types/products";

// ─────────────────────────────────────────────────────────────
// Products API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/iam/core/retailer/products";

export async function getProducts(
  filter: ProductFilter = {},
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  const url = query ? `${BASE_PATH}/all?${query}` : `${BASE_PATH}/all`;

  const response = await apiClient.get<PaginatedResponse<Product>>(url);
  return response.data;
}

export async function getProductById(productId: number): Promise<Product> {
  const response = await apiClient.get<Product>(`${BASE_PATH}/${productId}`);
  return response.data;
}

export async function createProduct(
  data: ProductCreateRequest,
): Promise<Product> {
  const response = await apiClient.post<Product>(`${BASE_PATH}/add`, data);
  return response.data;
}

export async function updateProduct(
  productId: number,
  data: ProductUpdateRequest,
): Promise<Product> {
  const response = await apiClient.put<Product>(
    `${BASE_PATH}/${productId}`,
    data,
  );
  return response.data;
}

export async function deleteProduct(productId: number): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${productId}`);
}

// Categories/brands are now client-side constants derived from ProductCategory enum — no backend call required.
// See: nexus/core/src/main/java/com/nexus/core/entities/ProductCategory.java
export async function getProductCategories(): Promise<string[]> {
  // Fallback static list matching ProductCategory enum; avoids 404 on /core/products/categories
  return [
    "ELECTRONICS",
    "FURNITURE",
    "CLOTHING",
    "FOOD",
    "BOOKS",
    "TOYS",
    "BEAUTY",
    "SPORTS",
    "AUTOMOTIVE",
    "HEALTH",
    "JEWELRY",
    "MUSIC",
    "GARDEN",
    "OFFICE_SUPPLIES",
    "PET_SUPPLIES",
    "ART",
    "TRAVEL",
    "OTHER"
  ];
}

export async function getProductBrands(): Promise<string[]> {
  // Brands are free-form; return empty to allow user input. No dedicated backend requirement (SRS-01/02).
  return [];
}
