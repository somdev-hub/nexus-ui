import apiClient from '@/lib/api-client';
import axios from 'axios';
import { PaginatedResponse } from '@/types/paginated-response';
import type {
    FleetAsset,
    FleetAssetFilter,
    Driver,
    DriverFilter,
    DriverOnboardPayload,
    DriverOnboardResult,
    DriverOnboardDetails,
    MaintenanceRecord,
    MaintenanceFilter,
    ShipmentQuote,
    QuoteFilter,
    ShipmentIncident,
    IncidentFilter,
    ProofOfDelivery,
    ShipmentEta,
    ShipmentPosition,
    AssetShipment,
    AssetShipmentFilter,
    AssetDriverHistory,
    AssetCurrentShipment,
    ConsolidationGroup,
    ConsolidationFilter,
    CapacityForecast,
    CapacityFilter,
    LogisticsDashboard,
    LoadBoardShipment,
} from '@/types/logistics-ops';

const BASE = '/iam/core/logistics';

// ─────────────────────────────────────────────────────────────
// Capacity units. Mass/volume units describe bulk capacity
// directly; unitized units (pallets/containers) count load units
// and require per-unit specifications (L×W×H + volume).
// ─────────────────────────────────────────────────────────────

export const CAPACITY_UNITS = [
    'KG',
    'LBS',
    'TONNES',
    'LITRES',
    'GALLONS',
    'CUBIC_METERS',
    'CUBIC_FEET',
    'PALLETS',
    'SHIPPING_CONTAINER',
    'FREIGHT_CONTAINER',
] as const;

export type CapacityUnitOption = (typeof CAPACITY_UNITS)[number];

export const TRANSPORT_MODES = [
    'ROAD',
    'RAIL',
    'AIR',
    'SEA',
    'MULTIMODAL',
] as const;

const UNITIZED: ReadonlySet<string> = new Set([
    'PALLETS',
    'SHIPPING_CONTAINER',
    'FREIGHT_CONTAINER',
]);

export function isUnitizedCapacityUnit(unit?: string | null): boolean {
    return !!unit && UNITIZED.has(String(unit).toUpperCase());
}

const UNIT_LABELS: Record<string, string> = {
    KG: 'kg',
    LBS: 'lbs',
    TONNES: 'tonnes',
    LITRES: 'L',
    GALLONS: 'gal',
    CUBIC_METERS: 'CBM',
    CUBIC_FEET: 'CFT',
    PALLETS: 'pallets',
    SHIPPING_CONTAINER: 'shipping containers',
    FREIGHT_CONTAINER: 'freight containers',
};

export function capacityUnitLabel(unit?: string | null): string {
    if (!unit) return 'kg';
    return (
        UNIT_LABELS[String(unit).toUpperCase()] ?? String(unit).toLowerCase()
    );
}

export interface UnitSpecs {
    unitLength?: number | null;
    unitWidth?: number | null;
    unitHeight?: number | null;
    dimensionUom?: string | null;
    unitVolume?: number | null;
    volumeUom?: string | null;
}

/** "12 × 2.4 × 2.6 M · 76 CBM each" or null when no specs present. */
export function formatUnitSpecs(specs?: UnitSpecs | null): string | null {
    if (!specs) return null;
    const parts: string[] = [];
    if (
        specs.unitLength !== undefined &&
        specs.unitLength !== null &&
        specs.unitWidth !== undefined &&
        specs.unitWidth !== null &&
        specs.unitHeight !== undefined &&
        specs.unitHeight !== null
    ) {
        parts.push(
            `${specs.unitLength} × ${specs.unitWidth} × ${specs.unitHeight} ${specs.dimensionUom ?? 'M'}`
        );
    }
    if (specs.unitVolume !== undefined && specs.unitVolume !== null) {
        parts.push(`${specs.unitVolume} ${specs.volumeUom ?? 'CBM'} each`);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
}

function toQuery(filter: object = {}): string {
    const p = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const q = p.toString();
    return q ? `?${q}` : '';
}

// Fleet assets
export async function getFleetAssets(
    filter: FleetAssetFilter = {}
): Promise<PaginatedResponse<FleetAsset>> {
    const res = await apiClient.get<PaginatedResponse<FleetAsset>>(
        `${BASE}/fleet/assets/all${toQuery(filter)}`
    );
    return res.data;
}
export async function createFleetAsset(
    data: Partial<FleetAsset>
): Promise<FleetAsset> {
    const res = await apiClient.post<FleetAsset>(
        `${BASE}/fleet/assets/create`,
        data
    );
    return res.data;
}
export async function updateFleetAsset(
    id: number,
    data: Partial<FleetAsset>
): Promise<FleetAsset> {
    const res = await apiClient.put<FleetAsset>(
        `${BASE}/fleet/assets/${id}/update`,
        data
    );
    return res.data;
}
export async function transitionAssetStatus(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<FleetAsset> {
    const res = await apiClient.put<FleetAsset>(
        `${BASE}/fleet/assets/${id}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}
export async function deleteFleetAsset(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/fleet/assets/${id}`);
}
export async function getFleetAssetSummary(): Promise<Record<string, number>> {
    const res = await apiClient.get<Record<string, number>>(
        `${BASE}/fleet/assets/summary`
    );
    return res.data;
}
export async function getFleetAssetById(id: number): Promise<FleetAsset> {
    const res = await apiClient.get<FleetAsset>(`${BASE}/fleet/assets/${id}`);
    return res.data;
}
export async function getAssetShipments(
    assetId: number,
    filter: AssetShipmentFilter = {}
): Promise<PaginatedResponse<AssetShipment>> {
    const res = await apiClient.get<PaginatedResponse<AssetShipment>>(
        `${BASE}/fleet/assets/${assetId}/shipments${toQuery(filter)}`
    );
    return res.data;
}
export async function getAssetDrivers(
    assetId: number
): Promise<AssetDriverHistory[]> {
    const res = await apiClient.get<AssetDriverHistory[]>(
        `${BASE}/fleet/assets/${assetId}/drivers`
    );
    return res.data;
}
export async function getAssetCurrentShipment(
    assetId: number
): Promise<AssetCurrentShipment> {
    const res = await apiClient.get<AssetCurrentShipment>(
        `${BASE}/fleet/assets/${assetId}/current-shipment`
    );
    return res.data;
}

// Drivers
export async function getDrivers(
    filter: DriverFilter = {}
): Promise<PaginatedResponse<Driver>> {
    const res = await apiClient.get<PaginatedResponse<Driver>>(
        `${BASE}/fleet/drivers/all${toQuery(filter)}`
    );
    return res.data;
}
export async function createDriver(data: Partial<Driver>): Promise<Driver> {
    const res = await apiClient.post<Driver>(
        `${BASE}/fleet/drivers/create`,
        data
    );
    return res.data;
}
export async function updateDriver(
    id: number,
    data: Partial<Driver>
): Promise<Driver> {
    const res = await apiClient.put<Driver>(
        `${BASE}/fleet/drivers/${id}/update`,
        data
    );
    return res.data;
}
export async function transitionDriverStatus(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<Driver> {
    const res = await apiClient.put<Driver>(
        `${BASE}/fleet/drivers/${id}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}
export async function deleteDriver(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/fleet/drivers/${id}`);
}

// Driver employee-onboarding (IAM user + HR record + linked core driver)

/** Rethrows axios errors with the server's `error` message when present. */
function onboardError(e: unknown, fallback: string): never {
    if (axios.isAxiosError(e)) {
        const body = e.response?.data as { error?: string } | undefined;
        throw new Error(body?.error || e.message || fallback);
    }
    throw e instanceof Error ? e : new Error(fallback);
}

export async function onboardDriver(
    data: DriverOnboardPayload
): Promise<DriverOnboardResult> {
    try {
        const res = await apiClient.post<DriverOnboardResult>(
            `${BASE}/fleet/drivers/onboard`,
            data
        );
        return res.data;
    } catch (e) {
        onboardError(e, 'Driver onboarding failed');
    }
}

export async function syncDriverOnboard(
    id: number,
    data: Partial<DriverOnboardPayload>
): Promise<DriverOnboardResult> {
    try {
        const res = await apiClient.put<DriverOnboardResult>(
            `${BASE}/fleet/drivers/${id}/onboard-sync`,
            data
        );
        return res.data;
    } catch (e) {
        onboardError(e, 'Driver update failed');
    }
}

/** Lazy full employee view (IAM profile + HR bank records) of a driver. */
export async function getDriverOnboardDetails(
    id: number
): Promise<DriverOnboardDetails> {
    try {
        const res = await apiClient.get<DriverOnboardDetails>(
            `${BASE}/fleet/drivers/${id}/onboard-details`
        );
        return res.data;
    } catch (e) {
        onboardError(e, 'Failed to load driver employee details');
    }
}

// Maintenance
export async function getMaintenanceRecords(
    filter: MaintenanceFilter = {}
): Promise<PaginatedResponse<MaintenanceRecord>> {
    const res = await apiClient.get<PaginatedResponse<MaintenanceRecord>>(
        `${BASE}/fleet/maintenance/all${toQuery(filter)}`
    );
    return res.data;
}
export async function createMaintenanceRecord(
    data: Partial<MaintenanceRecord>
): Promise<MaintenanceRecord> {
    const res = await apiClient.post<MaintenanceRecord>(
        `${BASE}/fleet/maintenance/create`,
        data
    );
    return res.data;
}
export async function transitionMaintenanceStatus(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<MaintenanceRecord> {
    const res = await apiClient.put<MaintenanceRecord>(
        `${BASE}/fleet/maintenance/${id}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}
export async function updateMaintenanceRecord(
    id: number,
    data: Partial<MaintenanceRecord>
): Promise<MaintenanceRecord> {
    const res = await apiClient.put<MaintenanceRecord>(
        `${BASE}/fleet/maintenance/${id}/update`,
        data
    );
    return res.data;
}
export async function deleteMaintenanceRecord(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/fleet/maintenance/${id}`);
}

// Load board + quotes + rates
export async function getLoadBoard(
    filter: {
        page?: number;
        size?: number;
        mode?: string;
        search?: string;
    } = {}
): Promise<PaginatedResponse<LoadBoardShipment>> {
    const res = await apiClient.get<PaginatedResponse<LoadBoardShipment>>(
        `${BASE}/quoting/load-board${toQuery(filter)}`
    );
    return res.data;
}
export async function getPickedUpLoads(
    filter: {
        page?: number;
        size?: number;
    } = {}
): Promise<PaginatedResponse<LoadBoardShipment>> {
    const res = await apiClient.get<PaginatedResponse<LoadBoardShipment>>(
        `${BASE}/quoting/picked-up${toQuery(filter)}`
    );
    return res.data;
}
export async function getDeliveredLoads(
    filter: {
        page?: number;
        size?: number;
    } = {}
): Promise<PaginatedResponse<LoadBoardShipment>> {
    const res = await apiClient.get<PaginatedResponse<LoadBoardShipment>>(
        `${BASE}/quoting/delivered${toQuery(filter)}`
    );
    return res.data;
}
export async function getMyShipmentBoard(
    filter: {
        page?: number;
        size?: number;
        search?: string;
    } = {}
): Promise<PaginatedResponse<LoadBoardShipment>> {
    const res = await apiClient.get<PaginatedResponse<LoadBoardShipment>>(
        `${BASE}/quoting/my-shipments${toQuery(filter)}`
    );
    return res.data;
}
export async function getShipmentQuotes(
    filter: QuoteFilter = {}
): Promise<PaginatedResponse<ShipmentQuote>> {
    const res = await apiClient.get<PaginatedResponse<ShipmentQuote>>(
        `${BASE}/quoting/quotes/all${toQuery(filter)}`
    );
    return res.data;
}
export async function createShipmentQuote(
    data: Partial<ShipmentQuote>
): Promise<ShipmentQuote> {
    const res = await apiClient.post<ShipmentQuote>(
        `${BASE}/quoting/quotes/create`,
        data
    );
    return res.data;
}
export async function transitionQuoteStatus(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<ShipmentQuote> {
    const res = await apiClient.put<ShipmentQuote>(
        `${BASE}/quoting/quotes/${id}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}
export async function deleteShipmentQuote(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/quoting/quotes/${id}`);
}

// Execution
export async function assignBooking(
    shipmentId: number,
    body: {
        driverId?: number;
        assetId?: number;
        bolDocumentId?: string;
        startPickup?: boolean;
    }
): Promise<unknown> {
    const res = await apiClient.put(
        `${BASE}/execution/shipments/${shipmentId}/assign`,
        body
    );
    return res.data;
}
export async function getShipmentEta(shipmentId: number): Promise<ShipmentEta> {
    const res = await apiClient.get<ShipmentEta>(
        `${BASE}/execution/shipments/${shipmentId}/eta`
    );
    return res.data;
}
export async function getShipmentPosition(
    shipmentId: number
): Promise<ShipmentPosition> {
    const res = await apiClient.get<ShipmentPosition>(
        `${BASE}/execution/shipments/${shipmentId}/position`
    );
    return res.data;
}
export async function updateShipmentRoute(
    shipmentId: number,
    route: {
        originLatitude?: number;
        originLongitude?: number;
        destinationLatitude?: number;
        destinationLongitude?: number;
    }
): Promise<ShipmentPosition> {
    const res = await apiClient.put<ShipmentPosition>(
        `${BASE}/execution/shipments/${shipmentId}/route`,
        route
    );
    return res.data;
}
export async function transitionShipmentStatus(
    shipmentId: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<unknown> {
    const res = await apiClient.put(
        `${BASE}/execution/shipments/${shipmentId}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}
export async function capturePod(
    data: Partial<ProofOfDelivery>
): Promise<ProofOfDelivery> {
    const res = await apiClient.post<ProofOfDelivery>(
        `${BASE}/execution/pod/capture`,
        data
    );
    return res.data;
}
export async function getPodByShipment(
    shipmentId: number
): Promise<ProofOfDelivery> {
    const res = await apiClient.get<ProofOfDelivery>(
        `${BASE}/execution/pod/shipment/${shipmentId}`
    );
    return res.data;
}
export async function reportIncident(
    data: Partial<ShipmentIncident>
): Promise<ShipmentIncident> {
    const res = await apiClient.post<ShipmentIncident>(
        `${BASE}/execution/incidents/report`,
        data
    );
    return res.data;
}
export async function getShipmentIncidents(
    filter: IncidentFilter = {}
): Promise<PaginatedResponse<ShipmentIncident>> {
    const res = await apiClient.get<PaginatedResponse<ShipmentIncident>>(
        `${BASE}/execution/incidents/all${toQuery(filter)}`
    );
    return res.data;
}
export async function transitionIncidentStatus(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<ShipmentIncident> {
    const res = await apiClient.put<ShipmentIncident>(
        `${BASE}/execution/incidents/${id}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}

// Operations
export async function getConsolidationGroups(
    filter: ConsolidationFilter = {}
): Promise<PaginatedResponse<ConsolidationGroup>> {
    const res = await apiClient.get<PaginatedResponse<ConsolidationGroup>>(
        `${BASE}/operations/consolidation/all${toQuery(filter)}`
    );
    return res.data;
}
export async function createConsolidationGroup(
    data: Partial<ConsolidationGroup>
): Promise<ConsolidationGroup> {
    const res = await apiClient.post<ConsolidationGroup>(
        `${BASE}/operations/consolidation/create`,
        data
    );
    return res.data;
}
export async function transitionGroupStatus(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<ConsolidationGroup> {
    const res = await apiClient.put<ConsolidationGroup>(
        `${BASE}/operations/consolidation/${id}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}
export async function addShipmentsToGroup(
    id: number,
    shipmentIds: number[]
): Promise<ConsolidationGroup> {
    const res = await apiClient.post<ConsolidationGroup>(
        `${BASE}/operations/consolidation/${id}/shipments`,
        { shipmentIds }
    );
    return res.data;
}
export async function deleteConsolidationGroup(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/operations/consolidation/${id}`);
}
export async function getCapacityForecasts(
    filter: CapacityFilter = {}
): Promise<PaginatedResponse<CapacityForecast>> {
    const res = await apiClient.get<PaginatedResponse<CapacityForecast>>(
        `${BASE}/operations/capacity/all${toQuery(filter)}`
    );
    return res.data;
}
export async function getCapacityForecast(
    id: number
): Promise<CapacityForecast> {
    const res = await apiClient.get<CapacityForecast>(
        `${BASE}/operations/capacity/${id}`
    );
    return res.data;
}
export async function createCapacityForecast(
    data: Partial<CapacityForecast>
): Promise<CapacityForecast> {
    const res = await apiClient.post<CapacityForecast>(
        `${BASE}/operations/capacity/create`,
        data
    );
    return res.data;
}
export async function deleteCapacityForecast(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/operations/capacity/${id}`);
}
export async function getLogisticsDashboard(): Promise<LogisticsDashboard> {
    const res = await apiClient.get<LogisticsDashboard>(
        `${BASE}/operations/analytics/dashboard`
    );
    return res.data;
}

// Updates (edit dialogs)
export async function updateQuote(
    id: number,
    data: Partial<ShipmentQuote>
): Promise<ShipmentQuote> {
    const res = await apiClient.put<ShipmentQuote>(
        `${BASE}/quoting/quotes/${id}/update`,
        data
    );
    return res.data;
}
export async function updatePod(
    id: number,
    data: Partial<ProofOfDelivery>
): Promise<ProofOfDelivery> {
    const res = await apiClient.put<ProofOfDelivery>(
        `${BASE}/execution/pod/${id}/update`,
        data
    );
    return res.data;
}
export async function updateIncident(
    id: number,
    data: Partial<ShipmentIncident>
): Promise<ShipmentIncident> {
    const res = await apiClient.put<ShipmentIncident>(
        `${BASE}/execution/incidents/${id}/update`,
        data
    );
    return res.data;
}
export async function updateGroup(
    id: number,
    data: Partial<ConsolidationGroup>
): Promise<ConsolidationGroup> {
    const res = await apiClient.put<ConsolidationGroup>(
        `${BASE}/operations/consolidation/${id}/update`,
        data
    );
    return res.data;
}
export async function updateCapacity(
    id: number,
    data: Partial<CapacityForecast>
): Promise<CapacityForecast> {
    const res = await apiClient.put<CapacityForecast>(
        `${BASE}/operations/capacity/${id}/update`,
        data
    );
    return res.data;
}
export async function extendCapacityForPartnership(
    id: number,
    data: {
        partnershipId: number;
        newPeriodEnd: string;
        availableCapacity?: number;
    }
): Promise<CapacityForecast> {
    const res = await apiClient.put<CapacityForecast>(
        `${BASE}/operations/capacity/${id}/extend-for-partnership`,
        data
    );
    return res.data;
}
