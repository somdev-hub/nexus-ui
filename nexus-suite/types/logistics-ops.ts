export interface FleetAsset {
    assetId: number;
    assetNumber: string;
    assetType: 'TRUCK' | 'TRAILER' | 'CONTAINER' | 'VAN' | 'OTHER';
    make?: string;
    model?: string;
    manufactureYear?: number;
    licensePlate?: string;
    vin?: string;
    capacityWeight?: number;
    capacityVolume?: number;
    status:
        | 'AVAILABLE'
        | 'ASSIGNED'
        | 'IN_MAINTENANCE'
        | 'OUT_OF_SERVICE'
        | 'RETIRED';
    currentMileage?: number;
    currentHours?: number;
    lastMaintenanceDate?: string;
    nextMaintenanceDueMileage?: number;
    nextMaintenanceDueDate?: string;
    insuranceExpiry?: string;
    permitExpiry?: string;
    dmsDocumentId?: string;
    notes?: string;
    currentLatitude?: number;
    currentLongitude?: number;
}

export interface FleetAssetFilter {
    page?: number;
    size?: number;
    sort?: string;
    status?: string;
    assetType?: string;
    search?: string;
}

export interface Driver {
    driverId: number;
    driverCode: string;
    fullName: string;
    phone?: string;
    email?: string;
    licenseNumber: string;
    licenseClass?: string;
    licenseExpiry?: string;
    status: 'AVAILABLE' | 'ASSIGNED' | 'ON_LEAVE' | 'SUSPENDED' | 'INACTIVE';
    hrEmployeeId?: string;
    onTimeRate?: number;
    safetyScore?: number;
    totalTrips?: number;
    notes?: string;
}

export interface DriverFilter {
    page?: number;
    size?: number;
    sort?: string;
    status?: string;
    search?: string;
}

export interface MaintenanceRecord {
    maintenanceId: number;
    maintenanceNumber: string;
    assetId: number;
    maintenanceType: string;
    description?: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
    scheduledDate?: string;
    completedDate?: string;
    odometerReading?: number;
    cost?: number;
    serviceProvider?: string;
    isBreakdown?: boolean;
    notes?: string;
}

export interface MaintenanceFilter {
    page?: number;
    size?: number;
    sort?: string;
    assetId?: number;
    status?: string;
    isBreakdown?: boolean;
    search?: string;
}

export interface ShipmentQuote {
    quoteId: number;
    quoteNumber: string;
    shipmentId?: number;
    status:
        | 'DRAFT'
        | 'SUBMITTED'
        | 'ACCEPTED'
        | 'REJECTED'
        | 'EXPIRED'
        | 'BOOKED'
        | 'CANCELLED';
    baseRate: number;
    fuelSurcharge?: number;
    accessorialCharges?: number;
    accessorialDetails?: string;
    totalAmount?: number;
    currency?: string;
    validUntil?: string;
    notes?: string;
}

export interface QuoteFilter {
    page?: number;
    size?: number;
    sort?: string;
    shipmentId?: number;
    status?: string;
    search?: string;
}

export interface FreightRate {
    rateId: number;
    rateCode: string;
    rateType: 'CONTRACT' | 'SPOT';
    originLane?: string;
    destinationLane?: string;
    equipmentType?: string;
    shipmentMode?: string;
    baseRate?: number;
    fuelSurchargeFormula?: string;
    fuelSurchargePct?: number;
    accessorialTable?: string;
    currency?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isActiveRate?: boolean;
    notes?: string;
}

export interface FreightRateFilter {
    page?: number;
    size?: number;
    sort?: string;
    rateType?: string;
    equipmentType?: string;
    search?: string;
}

export interface ShipmentIncident {
    incidentId: number;
    incidentNumber: string;
    shipmentId: number;
    incidentType: 'DELAY' | 'REROUTE' | 'DAMAGE' | 'LOSS' | 'CLAIM';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    description?: string;
    reportedAt?: string;
    resolvedAt?: string;
    claimAmount?: number;
    dmsDocumentId?: string;
    notes?: string;
}

export interface IncidentFilter {
    page?: number;
    size?: number;
    sort?: string;
    shipmentId?: number;
    incidentType?: string;
    status?: string;
    search?: string;
}

export interface ProofOfDelivery {
    podId: number;
    shipmentId: number;
    receivedBy?: string;
    signature?: string;
    photoUrls?: string;
    deliveredAt?: string;
    latitude?: number;
    longitude?: number;
    dmsDocumentId?: string;
    conditionNotes?: string;
    notes?: string;
}

export interface ShipmentEta {
    shipmentId: number;
    status: string;
    estimatedArrival?: string;
    latestEvent?: {
        eventType?: string;
        eventTimestamp?: string;
        location?: string;
        description?: string;
    } | null;
    totalMilestones: number;
    delayed: boolean;
}

export interface ConsolidationGroup {
    groupId: number;
    groupNumber: string;
    status: 'OPEN' | 'LOCKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    shipmentIds: number[];
    totalWeight?: number;
    totalVolume?: number;
    utilizationPct?: number;
    notes?: string;
}

export interface ConsolidationFilter {
    page?: number;
    size?: number;
    sort?: string;
    status?: string;
    search?: string;
}

export type CapacityUnit =
    | 'KG'
    | 'LBS'
    | 'TONNES'
    | 'LITRES'
    | 'GALLONS'
    | 'CUBIC_METERS'
    | 'CUBIC_FEET'
    | 'PALLETS'
    | 'SHIPPING_CONTAINER'
    | 'FREIGHT_CONTAINER';

export interface CapacityForecast {
    forecastId: number;
    originLane?: string;
    destinationLane?: string;
    equipmentType?: string;
    periodStart?: string;
    periodEnd?: string;
    availableCapacity?: number;
    bookedCapacity?: number;
    capacityUnit?: CapacityUnit | string;
    unitPrice?: number;
    currency?: string;
    partnershipId?: number;
    unitLength?: number;
    unitWidth?: number;
    unitHeight?: number;
    dimensionUom?: string;
    unitVolume?: number;
    volumeUom?: string;
    notes?: string;
}

export interface CapacityFilter {
    page?: number;
    size?: number;
    sort?: string;
    equipmentType?: string;
    search?: string;
}

export interface CarrierPayable {
    payableId: number;
    payableNumber: string;
    shipmentId?: number;
    carrierName?: string;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'DISPUTED' | 'CANCELLED';
    payableAmount?: number;
    paidAmount?: number;
    currency?: string;
    dueDate?: string;
    pmsReferenceId?: string;
    notes?: string;
}

export interface PayableFilter {
    page?: number;
    size?: number;
    sort?: string;
    shipmentId?: number;
    status?: string;
    search?: string;
}

export interface LogisticsDashboard {
    totalShipments: number;
    deliveredShipments: number;
    totalRevenue: number;
    revenuePerLane: Record<string, number>;
    revenuePerCustomer: Record<string, number>;
    totalAssets: number;
    availableAssets: number;
    equipmentUtilization: number;
    openPayables: number;
}

export interface ShipmentPosition {
    shipmentId: number;
    status: string;
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    assetId?: number | null;
    assetNumber?: string | null;
    position?: {
        latitude: number;
        longitude: number;
        at: string;
        simulated: boolean;
    } | null;
    progressPct: number;
    arrived: boolean;
    simulated: boolean;
}

export interface AssetShipment {
    shipmentId: number;
    shipmentNumber: string;
    status: string;
    pickupDate?: string;
    deliveryDate?: string;
    actualDeparture?: string;
    actualArrival?: string;
    driverId?: number | null;
    driverName?: string | null;
    freightCost?: number | null;
}

export interface AssetShipmentFilter {
    page?: number;
    size?: number;
    sort?: string;
    status?: string;
    from?: string;
    to?: string;
}

export interface AssetDriverHistory {
    driverId: number;
    driverName: string;
    trips: number;
    firstTripAt?: string;
    lastTripAt?: string;
}

export interface AssetCurrentShipment {
    shipmentId: number | null;
}

export interface LoadBoardShipment {
    shipmentId: number;
    shipmentNumber: string;
    status: string;
    mode?: string;
    pickupAddress?: string;
    deliveryAddress?: string;
    totalWeight?: number;
    totalVolume?: number;
    totalPackages?: number;
    freightCost?: number;
    carrierName?: string;
}
