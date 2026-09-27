import apiClient from '@/lib/api-client';
import { PaginatedResponse } from '@/types/paginated-response';
import type {
    FleetAsset,
    FleetAssetFilter,
    Driver,
    DriverFilter,
    MaintenanceRecord,
    MaintenanceFilter,
    ShipmentQuote,
    QuoteFilter,
    FreightRate,
    FreightRateFilter,
    ShipmentIncident,
    IncidentFilter,
    ProofOfDelivery,
    ShipmentEta,
    ShipmentPosition,
    ConsolidationGroup,
    ConsolidationFilter,
    CapacityForecast,
    CapacityFilter,
    CarrierPayable,
    PayableFilter,
    LogisticsDashboard,
    LoadBoardShipment,
} from '@/types/logistics-ops';

const BASE = '/iam/core/logistics';

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
export async function getFreightRates(
    filter: FreightRateFilter = {}
): Promise<PaginatedResponse<FreightRate>> {
    const res = await apiClient.get<PaginatedResponse<FreightRate>>(
        `${BASE}/quoting/rates/all${toQuery(filter)}`
    );
    return res.data;
}
export async function createFreightRate(
    data: Partial<FreightRate>
): Promise<FreightRate> {
    const res = await apiClient.post<FreightRate>(
        `${BASE}/quoting/rates/create`,
        data
    );
    return res.data;
}
export async function updateFreightRate(
    id: number,
    data: Partial<FreightRate>
): Promise<FreightRate> {
    const res = await apiClient.put<FreightRate>(
        `${BASE}/quoting/rates/${id}/update`,
        data
    );
    return res.data;
}
export async function deleteFreightRate(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/quoting/rates/${id}`);
}

// Execution
export async function assignBooking(
    shipmentId: number,
    body: { driverId?: number; assetId?: number; bolDocumentId?: string }
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
export async function getCarrierPayables(
    filter: PayableFilter = {}
): Promise<PaginatedResponse<CarrierPayable>> {
    const res = await apiClient.get<PaginatedResponse<CarrierPayable>>(
        `${BASE}/operations/payables/all${toQuery(filter)}`
    );
    return res.data;
}
export async function createCarrierPayable(
    data: Partial<CarrierPayable>
): Promise<CarrierPayable> {
    const res = await apiClient.post<CarrierPayable>(
        `${BASE}/operations/payables/create`,
        data
    );
    return res.data;
}
export async function transitionPayableStatus(
    id: number,
    newStatus: string,
    params?: Record<string, unknown>
): Promise<CarrierPayable> {
    const res = await apiClient.put<CarrierPayable>(
        `${BASE}/operations/payables/${id}/status?newStatus=${newStatus}`,
        params || {}
    );
    return res.data;
}
export async function getLogisticsDashboard(): Promise<LogisticsDashboard> {
    const res = await apiClient.get<LogisticsDashboard>(
        `${BASE}/operations/analytics/dashboard`
    );
    return res.data;
}
