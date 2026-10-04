import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type {
    SupplierContract,
    SupplierContractCreateRequest,
    SupplierContractDocumentResponse,
    SupplierContractFilter,
    SupplierContractStatusUpdateRequest,
    SupplierContractSummary,
    SupplierContractUpdateRequest,
} from '@/types/supplier-contracts';

// ─────────────────────────────────────────────────────────────
// Supplier Contracts API Service
// ─────────────────────────────────────────────────────────────

const BASE_PATH = '/iam/core/retailer/supplier-contracts';

export async function getSupplierContracts(
    filter: SupplierContractFilter = {}
): Promise<PaginatedResponse<SupplierContract>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    });

    const query = params.toString();
    const url = query ? `${BASE_PATH}/all?${query}` : `${BASE_PATH}/all`;

    const response =
        await apiClient.get<PaginatedResponse<SupplierContract>>(url);
    return response.data;
}

export async function getSupplierContractById(
    contractId: number
): Promise<SupplierContract> {
    const response = await apiClient.get<SupplierContract>(
        `${BASE_PATH}/${contractId}`
    );
    return response.data;
}

export async function getSupplierContractByNumber(
    contractNumber: string
): Promise<SupplierContract> {
    const response = await apiClient.get<SupplierContract>(
        `${BASE_PATH}/number/${contractNumber}`
    );
    return response.data;
}

export async function createSupplierContract(
    data: SupplierContractCreateRequest
): Promise<SupplierContract> {
    const response = await apiClient.post<SupplierContract>(
        `${BASE_PATH}/create`,
        data
    );
    return response.data;
}

export async function updateSupplierContract(
    contractId: number,
    data: SupplierContractUpdateRequest
): Promise<SupplierContract> {
    const response = await apiClient.put<SupplierContract>(
        `${BASE_PATH}/${contractId}/update`,
        data
    );
    return response.data;
}

export async function updateSupplierContractStatus(
    contractId: number,
    data: SupplierContractStatusUpdateRequest & { reason?: string }
): Promise<SupplierContract> {
    // IAM contract: status (+optional reason) are request params, not a body.
    const params = new URLSearchParams({ status: data.status });
    if (data.reason) params.append('reason', data.reason);
    const response = await apiClient.put<SupplierContract>(
        `${BASE_PATH}/${contractId}/status?${params.toString()}`,
        null
    );
    return response.data;
}

export async function approveSupplierContract(
    contractId: number,
    approvedBy: string
): Promise<SupplierContract> {
    // IAM contract: approvedBy is a request param, not a body.
    const params = new URLSearchParams({ approvedBy });
    const response = await apiClient.post<SupplierContract>(
        `${BASE_PATH}/${contractId}/approve?${params.toString()}`,
        null
    );
    return response.data;
}

export async function rejectSupplierContract(
    contractId: number,
    rejectionReason: string
): Promise<SupplierContract> {
    // IAM contract: rejectionReason is a request param, not a body.
    const params = new URLSearchParams({ rejectionReason });
    const response = await apiClient.post<SupplierContract>(
        `${BASE_PATH}/${contractId}/reject?${params.toString()}`,
        null
    );
    return response.data;
}

export async function getExpiringContracts(
    days: number = 30
): Promise<SupplierContract[]> {
    const before = new Date();
    before.setDate(before.getDate() + days);
    const beforeDate = before.toISOString().slice(0, 10);
    const response = await apiClient.get<SupplierContract[]>(
        `${BASE_PATH}/expiring?beforeDate=${beforeDate}`
    );
    return response.data;
}

export async function getAutoRenewalContracts(
    days: number = 30
): Promise<SupplierContract[]> {
    const before = new Date();
    before.setDate(before.getDate() + days);
    const beforeDate = before.toISOString().slice(0, 10);
    const response = await apiClient.get<SupplierContract[]>(
        `${BASE_PATH}/auto-renewal?beforeDate=${beforeDate}`
    );
    return response.data;
}

export async function getActiveContractsBySupplier(
    supplierId: number,
    date?: string
): Promise<SupplierContract[]> {
    const onDate = date ?? new Date().toISOString().slice(0, 10);
    const response = await apiClient.get<SupplierContract[]>(
        `${BASE_PATH}/supplier/${supplierId}/active?date=${onDate}`
    );
    return response.data;
}

export async function getSupplierContractSummary(): Promise<SupplierContractSummary> {
    const response = await apiClient.get<SupplierContractSummary>(
        `${BASE_PATH}/summary`
    );
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Contract document (encrypted .md in DMS via Core)
// ─────────────────────────────────────────────────────────────

export interface ContractDocumentContent {
    fileName?: string;
    content?: string;
}

export async function uploadContractTextDocument(
    contractId: number,
    data: { fileName?: string; content: string }
): Promise<{ message?: string; dmsId?: string; documentUrl?: string }> {
    const response = await apiClient.post<{
        message?: string;
        dmsId?: string;
        documentUrl?: string;
    }>(`${BASE_PATH}/${contractId}/document-text`, data);
    return response.data;
}

export async function getContractDocumentContent(
    contractId: number
): Promise<ContractDocumentContent> {
    const response = await apiClient.get<ContractDocumentContent>(
        `${BASE_PATH}/${contractId}/document-content`
    );
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Document Management (binary uploads)
// ─────────────────────────────────────────────────────────────

export async function uploadContractDocument(
    contractId: number,
    file: File
): Promise<SupplierContractDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<SupplierContractDocumentResponse>(
        `${BASE_PATH}/${contractId}/documents`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return response.data;
}

export async function getContractDocuments(
    contractId: number
): Promise<SupplierContractDocumentResponse[]> {
    const response = await apiClient.get<SupplierContractDocumentResponse[]>(
        `${BASE_PATH}/${contractId}/documents`
    );
    return response.data;
}

export async function deleteContractDocument(
    contractId: number,
    documentId: number
): Promise<void> {
    await apiClient.delete(
        `${BASE_PATH}/${contractId}/documents/${documentId}`
    );
}
