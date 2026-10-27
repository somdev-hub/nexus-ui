export type ProductionStatus =
    | 'PLANNED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export interface ProductionMaterial {
    productionOrderMaterialId: number;
    material: {
        materialId: number;
        code: string;
        name: string;
    };
    requiredQty: number;
    allocatedQty: number;
    warehouseId?: number;
}

export interface ProductionProduct {
    productId: number;
    productName?: string;
    name?: string;
    sellingPrice?: number;
}

export interface ProductionOrder {
    productionOrderId: number;
    product?: ProductionProduct | null;
    quantity: number;
    status: ProductionStatus;
    deadline?: string | null;
    notes?: string | null;
    revenueAmount?: number | null;
    materials?: ProductionMaterial[];
}