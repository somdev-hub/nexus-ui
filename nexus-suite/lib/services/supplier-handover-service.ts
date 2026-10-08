import type { SupplierOrder } from '@/types/supplier';
import {
    formatOrgAddress,
    getOrgAddresses,
    type OrgAddress,
} from '@/lib/services/org-profile-service';
import {
    getAvailableLogisticsCapacities,
    getMyPrivateRoutes,
    getSupplierLogisticsPartnerships,
    type LogisticsCapacityRow,
    type PrivateRouteRow,
    type SupplierLogisticsPartnership,
} from '@/lib/services/supplier-logistics-service';

// ─────────────────────────────────────────────────────────────
// Supplier handover options for the Partial-Ship dialog.
//
// For an acknowledged order this assembles:
// - supplier pickup addresses (HR org addresses) with the
//   auto-vs-dropdown rule,
// - the retailer's delivery address (from the PO) resolved to a city,
// - logistics partnerships grouped SHORT_TERM / LONG_TERM, each gated
//   on city coverage (route cities for short-term, the supplier's
//   wanted-route list for long-term).
// ─────────────────────────────────────────────────────────────

export interface HandoverOption {
    partnershipId: number;
    logisticsOrgId?: number;
    logisticsName: string;
    termType: 'SHORT_TERM' | 'LONG_TERM';
    routeLabel: string;
    coveredCities: string[];
    matches: boolean;
    reason?: string;
}

export interface HandoverOptionsData {
    supplierAddresses: OrgAddress[];
    /** Auto-considered pickup when the rule resolves to one address. */
    autoSupplierAddress?: OrgAddress;
    /** True when the supplier must pick from a dropdown. */
    needsSupplierChoice: boolean;
    supplierCity?: string;
    retailerAddress?: OrgAddress;
    retailerAddressText: string;
    retailerCity?: string;
    shortTerm: HandoverOption[];
    longTerm: HandoverOption[];
}

function normCity(v?: string | null): string {
    return (v ?? '').trim().toLowerCase();
}

function cityCovered(covered: string[], city: string): boolean {
    const want = normCity(city);
    if (!want) return false;
    return covered.some((c) => {
        const have = normCity(c);
        return have === want || have.includes(want) || want.includes(have);
    });
}

export interface DesiredRoute {
    from?: string;
    to?: string;
    capacity?: number;
}

export function parseDesiredRoutes(json?: string | null): DesiredRoute[] {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json) as DesiredRoute[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function partnershipCounterparty(
    p: SupplierLogisticsPartnership,
    ownOrgId?: number | string | null
): number | undefined {
    const own = Number(ownOrgId);
    if (Number.isFinite(own)) {
        if (
            p.primaryOrgId !== undefined &&
            Number(p.primaryOrgId) !== own &&
            (p.secondaryOrgId === undefined ||
                Number(p.secondaryOrgId) === own)
        )
            return Number(p.primaryOrgId);
        if (
            p.secondaryOrgId !== undefined &&
            Number(p.secondaryOrgId) !== own
        )
            return Number(p.secondaryOrgId);
    }
    return p.secondaryOrgId ?? p.primaryOrgId ?? undefined;
}

/**
 * Resolve the supplier pickup address per the business rule:
 * - exactly one address → use it,
 * - two addresses with exactly one default-shipping → use the default,
 * - otherwise the supplier must choose from a dropdown.
 * Throws when the supplier has no addresses at all.
 */
export function resolveSupplierPickup(
    addresses: OrgAddress[]
): Pick<HandoverOptionsData, 'autoSupplierAddress' | 'needsSupplierChoice'> {
    const active = (addresses ?? []).filter((a) => a.isActive !== false);
    if (active.length === 0) {
        throw new Error(
            'No pickup address found for your organization. Please add a shipping address in your organization profile before handing over shipments.'
        );
    }
    if (active.length === 1) {
        return { autoSupplierAddress: active[0], needsSupplierChoice: false };
    }
    const defaults = active.filter((a) => a.isDefaultShipping === true);
    if (active.length === 2 && defaults.length === 1) {
        return { autoSupplierAddress: defaults[0], needsSupplierChoice: false };
    }
    return { autoSupplierAddress: undefined, needsSupplierChoice: true };
}

/**
 * Resolve the retailer's delivery address: the PO's shipping address
 * matched against the retailer's address book (falling back to default
 * shipping, then first). Throws when the retailer has no addresses.
 */
export function resolveRetailerDelivery(
    poShippingAddress: string | undefined,
    addresses: OrgAddress[]
): { address?: OrgAddress; addressText: string } {
    const active = (addresses ?? []).filter((a) => a.isActive !== false);
    if (active.length === 0) {
        throw new Error(
            'No delivery address found for the retailer. The purchase order has no usable delivery address — please ask the retailer to maintain one.'
        );
    }
    const poText = (poShippingAddress ?? '').trim();
    const exact = poText
        ? active.find((a) => formatOrgAddress(a) === poText)
        : undefined;
    const fallback =
        exact ??
        active.find((a) => a.isDefaultShipping === true) ??
        active[0];
    return {
        address: fallback,
        addressText: poText || formatOrgAddress(fallback),
    };
}

export async function loadHandoverOptions(
    order: SupplierOrder,
    ownOrgId?: number | string | null
): Promise<HandoverOptionsData> {
    const buyerOrgId = order.buyerOrgId;
    if (buyerOrgId === undefined || buyerOrgId === null) {
        throw new Error(
            'This order has no buyer organization — cannot determine the delivery address.'
        );
    }
    const [partnershipsRes, capacitiesRes, privateRes, supplierAddresses, retailerAddresses] =
        await Promise.all([
            getSupplierLogisticsPartnerships(),
            getAvailableLogisticsCapacities({ pageNo: 0, pageOffset: 100 }),
            getMyPrivateRoutes().catch(
                () => ({ content: [] }) as { content: PrivateRouteRow[] }
            ),
            getOrgAddresses(String(ownOrgId ?? '')).catch(() => [] as OrgAddress[]),
            getOrgAddresses(buyerOrgId).catch(() => {
                throw new Error(
                    'Could not load the retailer delivery addresses. Please try again.'
                );
            }),
        ]);

    const pickup = resolveSupplierPickup(supplierAddresses);
    const delivery = resolveRetailerDelivery(
        order.shippingAddress,
        retailerAddresses
    );
    const supplierCity = pickup.autoSupplierAddress?.city;
    const retailerCity = delivery.address?.city;

    const capacitiesById = new Map<number, LogisticsCapacityRow>();
    for (const c of capacitiesRes.content ?? []) {
        capacitiesById.set(c.forecastId, c);
    }
    // Private partnership lanes (long-term): only this supplier sees them.
    const privateByPartnership = new Map<number, PrivateRouteRow[]>();
    for (const r of privateRes.content ?? []) {
        if (r.partnershipId === undefined || r.partnershipId === null) continue;
        const list = privateByPartnership.get(Number(r.partnershipId)) ?? [];
        list.push(r);
        privateByPartnership.set(Number(r.partnershipId), list);
    }

    const shortTerm: HandoverOption[] = [];
    const longTerm: HandoverOption[] = [];
    for (const p of partnershipsRes.content ?? []) {
        if (String(p.status ?? '').toUpperCase() !== 'ACTIVE') continue;
        const term = String(p.partnershipTermType ?? '').toUpperCase();
        if (term !== 'SHORT_TERM' && term !== 'LONG_TERM') continue;
        const logisticsOrgId = partnershipCounterparty(p, ownOrgId);
        const logisticsName =
            (Number.isFinite(Number(ownOrgId)) &&
            Number(p.primaryOrgId) === Number(ownOrgId)
                ? p.secondaryOrgName
                : Number.isFinite(Number(ownOrgId)) &&
                    Number(p.secondaryOrgId) === Number(ownOrgId)
                  ? p.primaryOrgName
                  : (p.secondaryOrgName ?? p.primaryOrgName)) ??
            (logisticsOrgId ? `Org #${logisticsOrgId}` : '—');

        let routeLabel = '';
        let coveredCities: string[] = [];
        let reason: string | undefined;
        if (term === 'SHORT_TERM') {
            const route = p.linkedCapacityForecastId
                ? capacitiesById.get(p.linkedCapacityForecastId)
                : undefined;
            if (!route) {
                reason =
                    'Linked route is no longer published by the logistics partner.';
            } else {
                routeLabel = `${route.originLane ?? '—'} → ${route.destinationLane ?? '—'}`;
                coveredCities = [route.originLane ?? '', route.destinationLane ?? ''].filter(
                    (c) => c.trim() !== ''
                );
            }
        } else {
            // Long-term: dedicated private lanes published for this
            // partnership (fall back to the wanted list until published).
            const privates = privateByPartnership.get(p.partnershipId) ?? [];
            if (privates.length > 0) {
                coveredCities = Array.from(
                    new Set(
                        privates
                            .flatMap((r) => [
                                r.originLane ?? '',
                                r.destinationLane ?? '',
                            ])
                            .filter((c) => c.trim() !== '')
                    )
                );
                routeLabel = privates
                    .map((r) => `${r.originLane ?? '—'} → ${r.destinationLane ?? '—'}`)
                    .join('; ');
            } else {
                const wanted = parseDesiredRoutes(p.desiredRoutesJson);
                coveredCities = Array.from(
                    new Set(
                        wanted
                            .flatMap((r) => [r.from ?? '', r.to ?? ''])
                            .filter((c) => c.trim() !== '')
                    )
                );
                routeLabel =
                    wanted.length > 0
                        ? wanted
                              .map((r) => `${r.from ?? '—'} → ${r.to ?? '—'}`)
                              .join('; ')
                        : 'Custom routes';
            }
            if (coveredCities.length === 0) {
                reason =
                    'No routes published for this partnership yet.';
            }
        }

        let matches = false;
        if (!reason) {
            if (!supplierCity) {
                reason =
                    'Your pickup address has no city — update it before handover.';
            } else if (!retailerCity) {
                reason =
                    'The retailer delivery address has no city — cannot match routes.';
            } else if (!cityCovered(coveredCities, supplierCity)) {
                reason = `Pickup city ${supplierCity} is not served by this partner's routes.`;
            } else if (!cityCovered(coveredCities, retailerCity)) {
                reason = `Delivery city ${retailerCity} is not served by this partner's routes.`;
            } else {
                matches = true;
            }
        }

        const option: HandoverOption = {
            partnershipId: p.partnershipId,
            logisticsOrgId,
            logisticsName,
            termType: term as 'SHORT_TERM' | 'LONG_TERM',
            routeLabel,
            coveredCities,
            matches,
            reason,
        };
        (term === 'SHORT_TERM' ? shortTerm : longTerm).push(option);
    }

    return {
        supplierAddresses: supplierAddresses.filter((a) => a.isActive !== false),
        ...pickup,
        supplierCity,
        retailerAddress: delivery.address,
        retailerAddressText: delivery.addressText,
        retailerCity,
        shortTerm,
        longTerm,
    };
}
