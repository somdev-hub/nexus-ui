import { getShipmentsByDateRange, getShipmentStops } from './shipment-service';
import { getDeliveryAppointments } from './delivery-appointment-service';
import {
    getMaintenanceRecords,
    getShipmentIncidents,
    getCapacityForecasts,
} from './logistics-ops-service';
import { getSupplierOrders, getQualityCerts } from './supplier-orders-service';
import { getCapacities } from './supplier-capacity-service';
import { getQuotations, getForecasts } from './supplier-commercial-service';
import { getPurchaseOrders } from './purchase-orders-service';
import { getGoodsReceipts, getInvoices } from './procurement-extended-service';

// ─────────────────────────────────────────────────────────────
// Suite calendar aggregation (shared by the logistics, supplier
// and retailer calendar pages).
//
// Each calendar is a read-only, aggregated view over existing
// domain data. No new backend entity is introduced: every
// activity shown originates from an already-owned domain.
// ─────────────────────────────────────────────────────────────

export interface CalendarActivity {
    id: string;
    /** Activity kind, e.g. 'pickup', 'order', 'purchase', 'invoice' */
    kind: string;
    title: string;
    /** ISO datetime string */
    start: string;
    /** ISO datetime string (optional, for ranged activities) */
    end?: string;
    allDay?: boolean;
    status?: string;
    shipmentId?: number;
    shipmentNumber?: string;
    description?: string;
    location?: string;
    /** Deep link to the owning portal page */
    href?: string;
}

export interface CalendarKindMeta {
    value: string;
    label: string;
}

function inRange(iso: string | undefined, start: number, end: number): boolean {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return !Number.isNaN(t) && t >= start && t <= end;
}

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function overlaps(
    periodStart: string | undefined,
    periodEnd: string | undefined,
    startMs: number,
    endMs: number
): boolean {
    if (!periodStart || !periodEnd) return false;
    const pStart = new Date(periodStart).getTime();
    const pEnd = new Date(periodEnd).getTime();
    if (Number.isNaN(pStart) || Number.isNaN(pEnd)) return false;
    return pEnd >= startMs && pStart <= endMs;
}

function byStart(a: CalendarActivity, b: CalendarActivity): number {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
}

// ─────────────────────────────────────────────────────────────
// Logistics — shipments, stops, appointments, maintenance,
// exceptions, capacity
// ─────────────────────────────────────────────────────────────

export const LOGISTICS_CALENDAR_KINDS: CalendarKindMeta[] = [
    { value: 'pickup', label: 'Pickups' },
    { value: 'delivery', label: 'Deliveries' },
    { value: 'eta', label: 'ETAs' },
    { value: 'stop', label: 'Route Stops' },
    { value: 'appointment', label: 'Appointments' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'incident', label: 'Exceptions' },
    { value: 'capacity', label: 'Capacity' },
];

/** Shared shipment pickup/delivery/ETA mapping (portal href differs). */
async function getShipmentActivities(
    rangeStart: Date,
    rangeEnd: Date,
    href: string,
    includeStops: boolean,
    stopsHref: string
): Promise<CalendarActivity[]> {
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    const activities: CalendarActivity[] = [];

    const shipmentsRes = await getShipmentsByDateRange(
        toISODate(rangeStart),
        toISODate(rangeEnd),
        0,
        100
    ).catch(() => null);
    const shipments = shipmentsRes?.content ?? [];

    for (const s of shipments) {
        const base = {
            shipmentId: s.shipmentId,
            shipmentNumber: s.shipmentNumber,
            status: s.status,
            href,
        };
        if (s.pickupDate && inRange(s.pickupDate, startMs, endMs)) {
            activities.push({
                ...base,
                id: `pickup-${s.shipmentId}`,
                kind: 'pickup',
                title: `Pickup ${s.shipmentNumber}`,
                start: s.pickupDate,
                location: s.pickupAddress ?? s.pickupLocation,
                description: `${s.pickupAddress ?? s.pickupLocation ?? ''} → ${s.deliveryAddress ?? s.deliveryLocation ?? ''}`.trim(),
            });
        }
        if (s.deliveryDate && inRange(s.deliveryDate, startMs, endMs)) {
            activities.push({
                ...base,
                id: `delivery-${s.shipmentId}`,
                kind: 'delivery',
                title: `Delivery ${s.shipmentNumber}`,
                start: s.deliveryDate,
                location: s.deliveryAddress ?? s.deliveryLocation,
                description: `${s.pickupAddress ?? s.pickupLocation ?? ''} → ${s.deliveryAddress ?? s.deliveryLocation ?? ''}`.trim(),
            });
        }
        if (
            s.estimatedArrival &&
            s.status !== 'DELIVERED' &&
            inRange(s.estimatedArrival, startMs, endMs)
        ) {
            activities.push({
                ...base,
                id: `eta-${s.shipmentId}`,
                kind: 'eta',
                title: `ETA ${s.shipmentNumber}`,
                start: s.estimatedArrival,
                location: s.deliveryAddress ?? s.deliveryLocation,
                description: `Carrier: ${s.carrierName ?? 'unassigned'}`,
            });
        }
    }

    if (includeStops) {
        const stopResults = await Promise.allSettled(
            shipments.slice(0, 30).map((s) => getShipmentStops(s.shipmentId))
        );
        stopResults.forEach((r, i) => {
            if (r.status !== 'fulfilled') return;
            const shipment = shipments[i];
            for (const stop of r.value ?? []) {
                if (!stop.scheduledDate || !inRange(stop.scheduledDate, startMs, endMs))
                    continue;
                activities.push({
                    id: `stop-${stop.stopId}`,
                    kind: 'stop',
                    title: `${stop.stopType} · ${shipment.shipmentNumber}`,
                    start: stop.scheduledDate,
                    status: stop.status,
                    shipmentId: shipment.shipmentId,
                    shipmentNumber: shipment.shipmentNumber,
                    location: stop.address ?? stop.location,
                    description: stop.notes ?? undefined,
                    href: stopsHref,
                });
            }
        });
    }

    return activities;
}

export async function getLogisticsCalendarActivities(
    rangeStart: Date,
    rangeEnd: Date
): Promise<CalendarActivity[]> {
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    const startDate = toISODate(rangeStart);
    const endDate = toISODate(rangeEnd);

    const [shipmentActs, appointmentsRes, maintenanceRes, incidentsRes, capacityRes] =
        await Promise.all([
            getShipmentActivities(rangeStart, rangeEnd, '/logistics/shipments', true, '/logistics/routing'),
            getDeliveryAppointments({
                fromDate: startDate,
                toDate: endDate,
                pageNo: 0,
                pageOffset: 100,
            }).catch(() => null),
            getMaintenanceRecords({ page: 0, size: 100 }).catch(() => null),
            getShipmentIncidents({ page: 0, size: 100 }).catch(() => null),
            getCapacityForecasts({ page: 0, size: 100 }).catch(() => null),
        ]);

    const activities: CalendarActivity[] = [...shipmentActs];

    for (const a of appointmentsRes?.content ?? []) {
        activities.push({
            id: `appt-${a.appointmentId}`,
            kind: 'appointment',
            title: `Dock ${a.dockNumber ?? a.appointmentNumber}`,
            start: a.scheduledStart,
            end: a.scheduledEnd,
            status: a.status,
            shipmentId: a.shipmentId,
            shipmentNumber: a.shipmentNumber,
            location: a.warehouseCode,
            description: a.specialInstructions ?? a.notes ?? undefined,
            href: '/logistics/shipments',
        });
    }

    for (const m of maintenanceRes?.content ?? []) {
        if (!m.scheduledDate || !inRange(m.scheduledDate, startMs, endMs)) continue;
        activities.push({
            id: `maint-${m.maintenanceId}`,
            kind: 'maintenance',
            title: `${m.maintenanceType} · Asset #${m.assetId}`,
            start: m.scheduledDate,
            status: m.status,
            location: m.serviceProvider,
            description: m.description ?? m.notes ?? undefined,
            href: '/logistics/fleet',
        });
    }

    for (const inc of incidentsRes?.content ?? []) {
        if (!inc.reportedAt || !inRange(inc.reportedAt, startMs, endMs)) continue;
        activities.push({
            id: `incident-${inc.incidentId}`,
            kind: 'incident',
            title: `${inc.incidentType} · ${inc.incidentNumber}`,
            start: inc.reportedAt,
            status: inc.status,
            shipmentId: inc.shipmentId,
            description: inc.description ?? inc.notes ?? undefined,
            href: '/logistics/shipments',
        });
    }

    for (const c of capacityRes?.content ?? []) {
        if (!overlaps(c.periodStart, c.periodEnd, startMs, endMs)) continue;
        activities.push({
            id: `capacity-${c.forecastId}`,
            kind: 'capacity',
            title: `Capacity ${c.originLane ?? ''} → ${c.destinationLane ?? ''}`.trim(),
            start: c.periodStart!,
            end: c.periodEnd!,
            allDay: true,
            location: c.equipmentType,
            description:
                c.availableCapacity != null
                    ? `Available ${c.availableCapacity}, booked ${c.bookedCapacity ?? 0}`
                    : (c.notes ?? undefined),
            href: '/logistics/routing',
        });
    }

    return activities.sort(byStart);
}

// ─────────────────────────────────────────────────────────────
// Supplier — fulfillment orders, quotations, capacity,
// forecasts, quality certificates
// ─────────────────────────────────────────────────────────────

export const SUPPLIER_CALENDAR_KINDS: CalendarKindMeta[] = [
    { value: 'order', label: 'Order Deliveries' },
    { value: 'quotation', label: 'Quote Validity' },
    { value: 'capacity', label: 'Capacity' },
    { value: 'forecast', label: 'Forecasts' },
    { value: 'cert', label: 'Cert Expiry' },
];

export async function getSupplierCalendarActivities(
    rangeStart: Date,
    rangeEnd: Date
): Promise<CalendarActivity[]> {
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    const startDate = toISODate(rangeStart);
    const endDate = toISODate(rangeEnd);

    const [ordersRes, quotesRes, capacityRes, forecastsRes, certsRes] =
        await Promise.all([
            getSupplierOrders({ page: 0, size: 100 }).catch(() => null),
            getQuotations({ validFrom: startDate, validTo: endDate, page: 0, size: 100 }).catch(
                () => getQuotations({ page: 0, size: 100 }).catch(() => null)
            ),
            getCapacities({ periodStart: startDate, periodEnd: endDate, page: 0, size: 100 }).catch(
                () => getCapacities({ page: 0, size: 100 }).catch(() => null)
            ),
            getForecasts({ periodStart: startDate, periodEnd: endDate, page: 0, size: 100 }).catch(
                () => getForecasts({ page: 0, size: 100 }).catch(() => null)
            ),
            getQualityCerts({ page: 0, size: 100 }).catch(() => null),
        ]);

    const activities: CalendarActivity[] = [];

    for (const o of ordersRes?.content ?? []) {
        const dates: [string, string][] = [
            [o.requestedDeliveryDate ?? '', 'Requested'],
            [o.expectedDeliveryDate ?? '', 'Expected'],
            [o.confirmedDeliveryDate ?? '', 'Confirmed'],
        ];
        for (const [iso, label] of dates) {
            if (!iso || !inRange(iso, startMs, endMs)) continue;
            activities.push({
                id: `order-${o.purchaseOrderId}-${label}`,
                kind: 'order',
                title: `${label} delivery ${o.poNumber}`,
                start: iso,
                status: o.status,
                location: o.buyerOrg?.name,
                description: o.supplierNotes ?? undefined,
                href: '/supplier/orders',
            });
        }
    }

    for (const q of quotesRes?.content ?? []) {
        if (q.validFrom && inRange(q.validFrom, startMs, endMs)) {
            activities.push({
                id: `quote-from-${q.quotationId}`,
                kind: 'quotation',
                title: `Quote ${q.quotationNumber} valid from`,
                start: q.validFrom,
                status: q.status,
                location: q.buyerOrgName,
                href: '/supplier/quotations',
            });
        }
        if (q.validTo && inRange(q.validTo, startMs, endMs)) {
            activities.push({
                id: `quote-to-${q.quotationId}`,
                kind: 'quotation',
                title: `Quote ${q.quotationNumber} expires`,
                start: q.validTo,
                status: q.status,
                location: q.buyerOrgName,
                description: q.totalAmount != null ? `Total ${q.totalAmount} ${q.currency ?? ''}`.trim() : undefined,
                href: '/supplier/quotations',
            });
        }
    }

    for (const c of capacityRes?.content ?? []) {
        if (!overlaps(c.periodStart, c.periodEnd, startMs, endMs)) continue;
        activities.push({
            id: `sup-cap-${c.capacityId}`,
            kind: 'capacity',
            title: `Capacity ${c.productLine ?? ''} ${c.shift ?? ''}`.trim() || 'Production capacity',
            start: c.periodStart,
            end: c.periodEnd,
            allDay: true,
            description:
                c.availableCapacity != null
                    ? `Available ${c.availableCapacity}, allocated ${c.allocatedCapacity ?? 0} ${c.unit ?? ''}`.trim()
                    : (c.notes ?? undefined),
            href: '/supplier/capacity',
        });
    }

    for (const f of forecastsRes?.content ?? []) {
        if (!overlaps(f.periodStart, f.periodEnd, startMs, endMs)) continue;
        activities.push({
            id: `forecast-${f.forecastId}`,
            kind: 'forecast',
            title: `Forecast ${f.catalogName ?? ''} ×${f.forecastQuantity}`.trim(),
            start: f.periodStart,
            end: f.periodEnd,
            allDay: true,
            status: f.status,
            location: f.retailerOrgName,
            description: f.notes ?? undefined,
            href: '/supplier/forecasts',
        });
    }

    for (const cert of certsRes?.content ?? []) {
        if (!cert.expiryDate || !inRange(cert.expiryDate, startMs, endMs)) continue;
        activities.push({
            id: `cert-${cert.certificateId}`,
            kind: 'cert',
            title: `${cert.certificateType} expires · ${cert.certificateNumber ?? cert.catalogName ?? ''}`.trim(),
            start: cert.expiryDate,
            location: cert.poNumber ?? cert.shipmentNumber,
            description: cert.notes ?? undefined,
            href: '/supplier/quality-certificates',
        });
    }

    return activities.sort(byStart);
}

// ─────────────────────────────────────────────────────────────
// Retailer — purchase orders, invoices, goods receipts.
// Delivery is supplier-owned, so the retailer calendar no longer
// aggregates retailer-managed shipments or dock appointments.
// ─────────────────────────────────────────────────────────────

export const RETAILER_CALENDAR_KINDS: CalendarKindMeta[] = [
    { value: 'purchase', label: 'Purchase Orders' },
    { value: 'invoice', label: 'Invoices Due' },
    { value: 'receipt', label: 'Goods Receipts' },
];

export async function getRetailerCalendarActivities(
    rangeStart: Date,
    rangeEnd: Date
): Promise<CalendarActivity[]> {
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    const startDate = toISODate(rangeStart);
    const endDate = toISODate(rangeEnd);

    const [posRes, invoicesRes, receiptsRes] =
        await Promise.all([
            getPurchaseOrders({
                orderDateFrom: startDate,
                orderDateTo: endDate,
                pageNo: 0,
                pageOffset: 100,
            }).catch(() => getPurchaseOrders({ pageNo: 0, pageOffset: 100 }).catch(() => null)),
            getInvoices({ pageNo: 0, pageOffset: 100 }).catch(() => null),
            getGoodsReceipts({ pageNo: 0, pageOffset: 100 }).catch(() => null),
        ]);

    const activities: CalendarActivity[] = [];

    for (const po of posRes?.content ?? []) {
        if (po.orderDate && inRange(po.orderDate, startMs, endMs)) {
            activities.push({
                id: `po-${po.purchaseOrderId}`,
                kind: 'purchase',
                title: `PO ${po.purchaseOrderNumber} placed`,
                start: po.orderDate,
                status: po.status,
                location: po.supplierOrgName,
                href: '/retailer/purchase-orders',
            });
        }
        if (po.expectedDeliveryDate && inRange(po.expectedDeliveryDate, startMs, endMs)) {
            activities.push({
                id: `po-exp-${po.purchaseOrderId}`,
                kind: 'purchase',
                title: `PO ${po.purchaseOrderNumber} expected`,
                start: po.expectedDeliveryDate,
                status: po.status,
                location: po.supplierOrgName,
                description: po.shippingAddress ?? undefined,
                href: '/retailer/purchase-orders',
            });
        }
    }

    for (const inv of invoicesRes?.content ?? []) {
        if (inv.dueDate && inRange(inv.dueDate, startMs, endMs)) {
            activities.push({
                id: `inv-due-${inv.invoiceId}`,
                kind: 'invoice',
                title: `Invoice ${inv.invoiceNumber} due`,
                start: inv.dueDate,
                status: inv.status,
                location: inv.supplierName,
                description: `${inv.totalAmount} ${inv.currency}`,
                href: '/retailer/procurement/invoices',
            });
        }
        if (inv.invoiceDate && inRange(inv.invoiceDate, startMs, endMs)) {
            activities.push({
                id: `inv-issued-${inv.invoiceId}`,
                kind: 'invoice',
                title: `Invoice ${inv.invoiceNumber} issued`,
                start: inv.invoiceDate,
                status: inv.status,
                location: inv.supplierName,
                href: '/retailer/procurement/invoices',
            });
        }
    }

    for (const gr of receiptsRes?.content ?? []) {
        if (!gr.receivedDate || !inRange(gr.receivedDate, startMs, endMs)) continue;
        activities.push({
            id: `gr-${gr.goodsReceiptId}`,
            kind: 'receipt',
            title: `Receipt ${gr.grNumber}`,
            start: gr.receivedDate,
            status: gr.status,
            location: gr.supplierName,
            description: gr.poNumber ? `PO ${gr.poNumber}` : undefined,
            href: '/retailer/procurement/goods-receipts',
        });
    }

    return activities.sort(byStart);
}
