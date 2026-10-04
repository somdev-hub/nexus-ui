import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type { SupplierContract } from '@/types/supplier-contracts';

const BASE_PATH = '/iam/core/supplier/contracts';

export async function getSupplierContractsForSupplier(
    pageNo = 0,
    pageOffset = 20
): Promise<PaginatedResponse<SupplierContract>> {
    const response = await apiClient.get<PaginatedResponse<SupplierContract>>(
        `${BASE_PATH}/all?pageNo=${pageNo}&pageOffset=${pageOffset}`
    );
    return response.data;
}

export async function getSupplierContractByIdForSupplier(
    contractId: number
): Promise<SupplierContract> {
    const response = await apiClient.get<SupplierContract>(
        `${BASE_PATH}/${contractId}`
    );
    return response.data;
}

export async function approveSupplierContractAsSupplier(
    contractId: number,
    decidedBy?: string
): Promise<SupplierContract> {
    const params = new URLSearchParams();
    if (decidedBy) params.append('decidedBy', decidedBy);
    const query = params.toString();
    const response = await apiClient.post<SupplierContract>(
        query
            ? `${BASE_PATH}/${contractId}/approve?${query}`
            : `${BASE_PATH}/${contractId}/approve`,
        null
    );
    return response.data;
}

export async function rejectSupplierContractAsSupplier(
    contractId: number,
    comments: string,
    decidedBy?: string
): Promise<SupplierContract> {
    const params = new URLSearchParams({ comments });
    if (decidedBy) params.append('decidedBy', decidedBy);
    const response = await apiClient.post<SupplierContract>(
        `${BASE_PATH}/${contractId}/reject?${params.toString()}`,
        null
    );
    return response.data;
}

export async function requestContractAmendmentsAsSupplier(
    contractId: number,
    comments: string,
    decidedBy?: string
): Promise<SupplierContract> {
    const params = new URLSearchParams({ comments });
    if (decidedBy) params.append('decidedBy', decidedBy);
    const response = await apiClient.post<SupplierContract>(
        `${BASE_PATH}/${contractId}/request-amendments?${params.toString()}`,
        null
    );
    return response.data;
}

export async function getSupplierContractDocumentContent(
    contractId: number
): Promise<{ fileName?: string; content?: string }> {
    const response = await apiClient.get<{
        fileName?: string;
        content?: string;
    }>(`${BASE_PATH}/${contractId}/document-content`);
    return response.data;
}
