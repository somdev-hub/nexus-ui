import { PaginatedResponse } from './paginated-response';

export type ShipmentStatus =
    | 'DRAFT'
    | 'CONFIRMED'
    | 'PICKUP_SCHEDULED'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'PARTIALLY_DELIVERED'
    | 'EXCEPTION'
    | 'CANCELLED'
    | 'RETURNED'
    | 'ON_HOLD'
    | 'CLOSED';

export type ShipmentMode = 'ROAD' | 'RAIL' | 'AIR' | 'SEA' | 'MULTIMODAL';

export type StopType =
    'PICKUP' | 'DELIVERY' | 'TRANSSHIPMENT' | 'CUSTOMS' | 'INSPECTION';

export type StopStatus =
    'PENDING' | 'ARRIVED' | 'DEPARTED' | 'COMPLETED' | 'SKIPPED' | 'EXCEPTION';

export type TrackingEventType =
    | 'CREATED'
    | 'CONFIRMED'
    | 'PICKUP_SCHEDULED'
    | 'PICKUP_ARRIVED'
    | 'PICKUP_COMPLETED'
    | 'DEPARTED'
    | 'IN_TRANSIT'
    | 'LOCATION_UPDATE'
    | 'ARRIVED_AT_HUB'
    | 'DEPARTED_FROM_HUB'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERY_ATTEMPTED'
    | 'DELIVERED'
    | 'EXCEPTION'
    | 'DELAYED'
    | 'REROUTED'
    | 'CUSTOMS_CLEARANCE'
    | 'CUSTOMS_CLEARED'
    | 'RETURNED'
    | 'CANCELLED'
    | 'ON_HOLD'
    | 'RELEASED';

export type ShipmentDocumentType =
    | 'BILL_OF_LADING'
    | 'COMMERCIAL_INVOICE'
    | 'PACKING_LIST'
    | 'CERTIFICATE_OF_ORIGIN'
    | 'INSURANCE_CERTIFICATE'
    | 'CUSTOMS_DECLARATION'
    | 'DELIVERY_RECEIPT'
    | 'PROOF_OF_DELIVERY'
    | 'INSPECTION_CERTIFICATE'
    | 'DANGEROUS_GOODS_DECLARATION'
    | 'WAYBILL'
    | 'OTHER';

export interface Shipment {
    shipmentId: number;
    shipmentNumber: string;
    referenceType?: string;
    referenceId?: number;
    retailerOrgId: number;
    retailerOrgName?: string;
    supplierOrgId: number;
    supplierOrgName?: string;
    supplierName?: string;
    logisticsOrgId?: number;
    logisticsOrgName?: string;
    partnershipId?: number;
    partnershipNumber?: string;
    status: ShipmentStatus;
    mode: ShipmentMode;
    incoterms?: string;
    pickupLocation?: string;
    pickupAddress?: string;
    pickupDate?: string;
    pickupTimeWindowStart?: string;
    pickupTimeWindowEnd?: string;
    deliveryLocation?: string;
    deliveryAddress?: string;
    deliveryDate?: string;
    scheduledDeliveryDate?: string;
    deliveryTimeWindowStart?: string;
    deliveryTimeWindowEnd?: string;
    totalWeight?: number;
    totalVolume?: number;
    totalPackages?: number;
    packageType?: string;
    hazardousMaterial?: boolean;
    temperatureControlled?: boolean;
    minTemperature?: number;
    maxTemperature?: number;
    freightCost?: number;
    actualFreightCost?: number;
    currency?: string;
    freightTerms?: string;
    trackingNumber?: string;
    carrierName?: string;
    carrierTrackingNumber?: string;
    carrierReference?: string;
    actualDeparture?: string;
    estimatedArrival?: string;
    actualArrival?: string;
    notes?: string;
    packageWeight?: number;
    packageLength?: number;
    packageWidth?: number;
    packageHeight?: number;
    packageDimensionUom?: string;
    purchaseOrderId?: number;
    purchaseOrderNumber?: string;
    orderedQuantity?: number;
    backorderedQuantity?: number;
    isPartialShipment?: boolean;
    shippedQuantity?: number;
    materialId?: number;
    materialName?: string;
    quantityUom?: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: number;
    updatedBy?: number;
    organizationId?: number;
    stops?: ShipmentStop[];
    trackingEvents?: TrackingEvent[];
    documents?: ShipmentDocument[];
}

export interface ShipmentCreateRequest {
    supplierOrgId: number;
    logisticsOrgId?: number;
    partnershipId?: number;
    mode: ShipmentMode;
    incoterms?: string;
    pickupLocation?: string;
    pickupAddress?: string;
    pickupDate?: string;
    pickupTimeWindowStart?: string;
    pickupTimeWindowEnd?: string;
    deliveryLocation?: string;
    deliveryAddress?: string;
    deliveryDate?: string;
    scheduledDeliveryDate?: string;
    deliveryTimeWindowStart?: string;
    deliveryTimeWindowEnd?: string;
    totalWeight?: number;
    totalVolume?: number;
    totalPackages?: number;
    packageType?: string;
    hazardousMaterial?: boolean;
    temperatureControlled?: boolean;
    minTemperature?: number;
    maxTemperature?: number;
    freightCost?: number;
    currency?: string;
    freightTerms?: string;
    carrierName?: string;
    carrierTrackingNumber?: string;
    carrierReference?: string;
    actualDeparture?: string;
    estimatedArrival?: string;
    notes?: string;
}

export interface ShipmentUpdateRequest {
    supplierOrgId?: number;
    logisticsOrgId?: number;
    partnershipId?: number;
    mode?: ShipmentMode;
    incoterms?: string;
    pickupLocation?: string;
    pickupAddress?: string;
    pickupDate?: string;
    pickupTimeWindowStart?: string;
    pickupTimeWindowEnd?: string;
    deliveryLocation?: string;
    deliveryAddress?: string;
    deliveryDate?: string;
    scheduledDeliveryDate?: string;
    deliveryTimeWindowStart?: string;
    deliveryTimeWindowEnd?: string;
    totalWeight?: number;
    totalVolume?: number;
    totalPackages?: number;
    packageType?: string;
    hazardousMaterial?: boolean;
    temperatureControlled?: boolean;
    minTemperature?: number;
    maxTemperature?: number;
    freightCost?: number;
    currency?: string;
    freightTerms?: string;
    carrierName?: string;
    carrierTrackingNumber?: string;
    carrierReference?: string;
    actualDeparture?: string;
    estimatedArrival?: string;
    notes?: string;
}

export interface ShipmentFilter {
    status?: string;
    mode?: string;
    supplierOrgId?: number;
    logisticsOrgId?: number;
    partnershipId?: number;
    startDate?: string;
    endDate?: string;
    pageNo?: number;
    pageOffset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface ShipmentStop {
    stopId: number;
    shipmentId: number;
    sequenceNumber: number;
    stopType: StopType;
    location?: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    scheduledDate?: string;
    scheduledTimeWindowStart?: string;
    scheduledTimeWindowEnd?: string;
    actualDate?: string;
    actualTime?: string;
    status: StopStatus;
    notes?: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: number;
    updatedBy?: number;
}

export interface ShipmentStopCreateRequest {
    sequenceNumber: number;
    stopType: StopType;
    location?: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    scheduledDate?: string;
    scheduledTimeWindowStart?: string;
    scheduledTimeWindowEnd?: string;
    notes?: string;
}

export interface ShipmentStopUpdateRequest {
    sequenceNumber?: number;
    stopType?: StopType;
    location?: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    scheduledDate?: string;
    scheduledTimeWindowStart?: string;
    scheduledTimeWindowEnd?: string;
    notes?: string;
}

export interface TrackingEvent {
    eventId: number;
    shipmentId: number;
    eventType: TrackingEventType;
    eventTimestamp: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    carrierStatusCode?: string;
    carrierStatusDescription?: string;
    isMilestone: boolean;
    version: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: number;
    updatedBy?: number;
}

export interface TrackingEventCreateRequest {
    eventType: TrackingEventType;
    eventTimestamp: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    carrierStatusCode?: string;
    carrierStatusDescription?: string;
    isMilestone?: boolean;
}

export interface ShipmentDocument {
    documentId: number;
    shipmentId: number;
    documentType: ShipmentDocumentType;
    documentName: string;
    documentUrl: string;
    dmsDocumentId?: string;
    fileSize?: number;
    mimeType?: string;
    remarks?: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: number;
    updatedBy?: number;
}

export interface ShipmentDocumentCreateRequest {
    documentType: ShipmentDocumentType;
    documentName: string;
    documentUrl: string;
    dmsDocumentId?: string;
    fileSize?: number;
    mimeType?: string;
    remarks?: string;
}

export interface FreightCostUpdateRequest {
    estimatedCost?: number;
    actualCost?: number;
    currency: string;
}

export type ShipmentPaginatedResponse = PaginatedResponse<Shipment>;

export interface ShipmentReview {
    reviewId: number;
    shipmentId: number;
    shipmentNumber?: string;
    supplierName?: string;
    rating?: number;
    qualityScore?: number;
    expectedDelivery?: string;
    actualDelivery?: string;
    expectedQuantity?: number;
    actualQuantity?: number;
    comments?: string;
    createdAt?: string;
}

export interface SupplierReviewSummary {
    supplierOrgId: number;
    supplierName?: string;
    avgRating?: number;
    reviewCount?: number;
    avgQuality?: number;
}
export type ShipmentStopPaginatedResponse = PaginatedResponse<ShipmentStop>;
export type TrackingEventPaginatedResponse = PaginatedResponse<TrackingEvent>;
export type ShipmentDocumentPaginatedResponse =
    PaginatedResponse<ShipmentDocument>;
