import apiClient from "@/lib/api-client";
import { PaginatedResponse } from "@/types/paginated-response";
import type {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductFilter,
  ProductPaginatedResponse,
} from "@/types/products";

// ─────────────────────────────────────────────────────────────
// Products API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = "/core/products";

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
  const url = query ? `${BASE_PATH}?${query}` : BASE_PATH;

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
  const response = await apiClient.post<Product>(BASE_PATH, data);
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

export async function getProductCategories(): Promise<string[]> {
  const response = await apiClient.get<string[]>(`${BASE_PATH}/categories`);
  return response.data;
}

export async function getProductBrands(): Promise<string[]> {
  const response = await apiClient.get<string[]>(`${BASE_PATH}/brands`);
  return response.data;
}
