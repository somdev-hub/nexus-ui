import { PaginatedResponse } from "./paginated-response";

export interface Supplier {
  supplierId: number;
  accountId: number;
  businessName: string;
  category: string;
  location: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  certifications: string;
  rating: number;
  totalOrders: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCreateRequest {
  accountId: number;
  businessName: string;
  category: string;
  location: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  certifications: string;
}

export interface SupplierUpdateRequest {
  businessName?: string;
  category?: string;
  location?: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  certifications?: string;
}

export interface SupplierDiscoveryRequest {
  category?: string;
  location?: string;
  minRating?: number;
  certifications?: string;
  certificationList?: string[];
}

export interface SupplierFilter {
  category?: string;
  location?: string;
  minRating?: number;
  certification?: string;
  status?: string;
  pageNo?: number;
  pageOffset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export type SupplierPaginatedResponse = PaginatedResponse<Supplier>;
