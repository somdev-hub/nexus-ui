'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    counterpartyLabelOf,
    counterpartyOf,
    getLogisticsPartnerships,
    updateLogisticsPartnership,
    type OrgPartnership,
} from '@/lib/services/org-partnerships-service';
import {
    getOrganizationDirectory,
    type SupplierDirectoryEntry,
} from '@/lib/services/supplier-market-service';
import {
    capacityUnitLabel,
    formatUnitSpecs,
    getCapacityForecast,
    createCapacityForecast,
    isUnitizedCapacityUnit,
    CAPACITY_UNITS,
} from '@/lib/services/logistics-ops-service';
import type { CapacityForecast } from '@/types/logistics-ops';
import {
    activateLogisticsPartnership,
    createPartnershipQuotation,
    getPartnershipQuotations,
    getPartnershipRoutes,
    terminateLogisticsPartnership,
} from '@/lib/services/logistics-partnership-service';
import type {
    LogisticsPartnershipQuotation,
    PrivateRouteRow,
} from '@/lib/services/supplier-logistics-service';
import { parseDesiredRoutes } from '@/lib/services/supplier-handover-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    CURRENCIES,
    getDisplayCurrency,
    normalizeCurrency,
} from '@/lib/currency';
import { getOrganizationDetails } from '@/lib/services/organization-service';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    getLogisticsReceivedInvitations,
    respondToLogisticsInvitation,
} from '@/lib/services/partnership-invitations-service';
import {
    PartnershipInvitationList,
    invitationIdOf,
    isInvitationPending,
} from '@/components/partnership-invitation-list';
import {
    PartnershipEditDialog,
    type PartnershipEditValues,
} from '@/components/partnership-edit-dialog';
import type { PartnershipInvitation } from '@/types/partnership-invitations';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

function formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}

export default function LogisticsPartnershipsPage() {
    const { orgId } = useUserMetadata();
    const [partnerships, setPartnerships] = useState<OrgPartnership[]>([]);
    const [received, setReceived] = useState<PartnershipInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [editing, setEditing] = useState<{
        id: number;
        initial: PartnershipEditValues;
    } | null>(null);
    // IAM org directory: real org names (Core account names are often
    // empty, which is why `Org #id` was showing everywhere).
    const [directory, setDirectory] = useState<SupplierDirectoryEntry[]>([]);
    const [viewing, setViewing] = useState<PartnershipInvitation | null>(null);
    const [linkedRoute, setLinkedRoute] = useState<CapacityForecast | null>(
        null
    );
    // Long-term quotation flow.
    const [quotations, setQuotations] = useState<
        LogisticsPartnershipQuotation[]
    >([]);
    const [quoting, setQuoting] =
        useState<PartnershipInvitation | null>(null);
    const [quoteLines, setQuoteLines] = useState<
        {
            include: boolean;
            from: string;
            to: string;
            capacity: string;
            capacityUnit: string;
            unitPrice: string;
            currency: string;
            unitLength: string;
            unitWidth: string;
            unitHeight: string;
            dimensionUom: string;
            unitVolume: string;
            volumeUom: string;
            periodStart: string;
            periodEnd: string;
        }[]
    >([]);
    const [quoteTerms, setQuoteTerms] = useState('');
    const [quoteValidityStart, setQuoteValidityStart] = useState('');
    const [quoteValidityEnd, setQuoteValidityEnd] = useState('');
    const [quoteViewing, setQuoteViewing] =
        useState<LogisticsPartnershipQuotation | null>(null);
    // Private routes manager.
    const [managing, setManaging] =
        useState<OrgPartnership | null>(null);
    const [privateRoutes, setPrivateRoutes] = useState<PrivateRouteRow[]>([]);
    const [newRoute, setNewRoute] = useState({
        originLane: '',
        destinationLane: '',
        equipmentType: 'TRUCK',
        periodStart: '',
        periodEnd: '',
        availableCapacity: '',
        capacityUnit: 'KG',
        unitPrice: '',
        currency: 'USD',
        unitLength: '',
        unitWidth: '',
        unitHeight: '',
        dimensionUom: 'M',
        unitVolume: '',
        volumeUom: 'CBM',
    });
    const [confirmTerminate, setConfirmTerminate] =
        useState<OrgPartnership | null>(null);
    // Org default currency (Organization Settings) for quotation pricing.
    const [orgCurrency, setOrgCurrency] = useState<string>(
        () => getDisplayCurrency()
    );

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const [partnershipsRes, receivedRes, dirRes, quotesRes] =
                    await Promise.all([
                        getLogisticsPartnerships(),
                        getLogisticsReceivedInvitations({
                            pageNo: 0,
                            pageOffset: 20,
                        }),
                        getOrganizationDirectory('SUPPLIER').catch(() => []),
                        getPartnershipQuotations().catch(() => null),
                    ]);
                if (!active) return;
                setPartnerships(partnershipsRes.content ?? []);
                setReceived(receivedRes.content ?? []);
                setDirectory(dirRes ?? []);
                setQuotations(quotesRes?.content ?? []);
                if (orgId) {
                    getOrganizationDetails(orgId)
                        .then((org) => {
                            if (!active) return;
                            setOrgCurrency(
                                normalizeCurrency(
                                    org.defaultCurrency ??
                                        getDisplayCurrency()
                                )
                            );
                        })
                        .catch(() => {});
                }
            } catch (err: unknown) {
                if (!active) return;
                toast.error(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load partnerships'
                );
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);

    const respond = async (
        inv: PartnershipInvitation,
        action: 'ACCEPT' | 'REJECT'
    ) => {
        const id = invitationIdOf(inv);
        if (!Number.isFinite(id) || id <= 0) {
            toast.error('Invitation ID missing — please refresh the list');
            return;
        }
        setBusyId(id);
        try {
            await respondToLogisticsInvitation(id, { action });
            toast.success(
                action === 'ACCEPT'
                    ? 'Invitation accepted'
                    : 'Invitation rejected'
            );
            const [partnershipsRes, receivedRes] = await Promise.all([
                getLogisticsPartnerships(),
                getLogisticsReceivedInvitations({ pageNo: 0, pageOffset: 20 }),
            ]);
            setPartnerships(partnershipsRes.content ?? []);
            setReceived(receivedRes.content ?? []);
            setViewing(null);
            setLinkedRoute(null);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to respond'
            );
        } finally {
            setBusyId(null);
        }
    };

    const receivedPending = received.filter(isInvitationPending);
    const receivedHistory = received.filter((inv) => !isInvitationPending(inv));
    // Long-term proposals get Reject / Raise Quotation instead of plain Accept.
    const isLongTermProposal = (inv: PartnershipInvitation) =>
        inv.partnershipContext === 'SUPPLIER_LOGISTICS' &&
        String(inv.partnershipTermType ?? '').toUpperCase() === 'LONG_TERM';
    const longTermPending = receivedPending.filter(isLongTermProposal);
    const otherPending = receivedPending.filter(
        (inv) => !isLongTermProposal(inv)
    );

    const refreshAll = async () => {
        try {
            const [partnershipsRes, receivedRes, quotesRes] = await Promise.all([
                getLogisticsPartnerships(),
                getLogisticsReceivedInvitations({ pageNo: 0, pageOffset: 20 }),
                getPartnershipQuotations().catch(() => null),
            ]);
            setPartnerships(partnershipsRes.content ?? []);
            setReceived(receivedRes.content ?? []);
            setQuotations(quotesRes?.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to refresh'
            );
        }
    };

    const openQuoteDialog = (inv: PartnershipInvitation) => {
        const wanted = parseDesiredRoutes(inv.desiredRoutesJson);
        setQuoteLines(
            wanted.length > 0
                ? wanted.map((w) => ({
                      include: true,
                      from: w.from ?? '',
                      to: w.to ?? '',
                      capacity:
                          w.capacity !== undefined ? String(w.capacity) : '',
                      capacityUnit:
                          (inv.desiredCapacityUnit as string) ?? 'KG',
                      unitPrice: '',
                      currency: orgCurrency,
                      unitLength: '',
                      unitWidth: '',
                      unitHeight: '',
                      dimensionUom: 'M',
                      unitVolume: '',
                      volumeUom: 'CBM',
                      periodStart: (inv.validityStart ?? '').slice(0, 10),
                      periodEnd: (inv.validityEnd ?? '').slice(0, 10),
                  }))
                : []
        );
        setQuoteTerms('');
        setQuoteValidityStart((inv.validityStart ?? '').slice(0, 10));
        setQuoteValidityEnd((inv.validityEnd ?? '').slice(0, 10));
        setQuoting(inv);
    };

    const submitQuotation = async () => {
        if (!quoting) return;
        const id = invitationIdOf(quoting);
        const lines = quoteLines.filter((l) => l.include);
        if (lines.length === 0) {
            toast.error('Include at least one route in the quotation');
            return;
        }
        const missingDims = lines.filter(
            (l) =>
                isUnitizedCapacityUnit(l.capacityUnit) &&
                (!l.unitLength || !l.unitWidth || !l.unitHeight)
        );
        if (missingDims.length > 0) {
            toast.error(
                `Container/pallet routes need unit dimensions: ${missingDims
                    .map((l) => `${l.from || '—'} → ${l.to || '—'}`)
                    .join('; ')}`
            );
            return;
        }
        setBusyId(id);
        try {
            await createPartnershipQuotation({
                invitationId: id,
                routeLines: lines.map((l) => ({
                    fromLane: l.from.trim(),
                    toLane: l.to.trim(),
                    capacity: l.capacity ? Number(l.capacity) : undefined,
                    capacityUnit: l.capacityUnit || undefined,
                    unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined,
                    currency: l.currency || undefined,
                    unitLength: l.unitLength
                        ? Number(l.unitLength)
                        : undefined,
                    unitWidth: l.unitWidth
                        ? Number(l.unitWidth)
                        : undefined,
                    unitHeight: l.unitHeight
                        ? Number(l.unitHeight)
                        : undefined,
                    dimensionUom: l.dimensionUom || undefined,
                    unitVolume: l.unitVolume
                        ? Number(l.unitVolume)
                        : undefined,
                    volumeUom: l.volumeUom || undefined,
                    periodStart: l.periodStart || undefined,
                    periodEnd: l.periodEnd || undefined,
                })),
                currency: orgCurrency,
                validityStart: quoteValidityStart || undefined,
                validityEnd: quoteValidityEnd || undefined,
                terms: quoteTerms || undefined,
            });
            toast.success('Quotation raised for supplier review');
            setQuoting(null);
            await refreshAll();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to raise quotation'
            );
        } finally {
            setBusyId(null);
        }
    };

    const openRoutesManager = async (p: OrgPartnership) => {
        setManaging(p);
        try {
            const res = await getPartnershipRoutes(p.partnershipId);
            setPrivateRoutes(res.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to load routes'
            );
        }
    };

    // Jump straight from an accepted quotation to its partnership routes.
    const openRoutesForQuotation = async (
        q: LogisticsPartnershipQuotation
    ) => {
        if (!q.partnershipId) {
            toast.error('No partnership linked to this quotation yet');
            return;
        }
        const found = partnerships.find(
            (p) => p.partnershipId === q.partnershipId
        );
        if (!found) {
            toast.error(
                'Partnership not in the list — refreshing, please retry'
            );
            await refreshAll();
            return;
        }
        await openRoutesManager(found);
    };

    const addPrivateRoute = async () => {
        if (!managing) return;
        if (!newRoute.originLane.trim() || !newRoute.destinationLane.trim()) {
            toast.error('Origin and destination lanes are required');
            return;
        }
        if (
            isUnitizedCapacityUnit(newRoute.capacityUnit) &&
            (!newRoute.unitLength || !newRoute.unitWidth || !newRoute.unitHeight)
        ) {
            toast.error(
                'Container/pallet routes need unit length, width and height'
            );
            return;
        }
        setBusyId(-1);
        try {
            await createCapacityForecast({
                originLane: newRoute.originLane.trim() || undefined,
                destinationLane: newRoute.destinationLane.trim() || undefined,
                equipmentType: newRoute.equipmentType as CapacityForecast['equipmentType'],
                periodStart: newRoute.periodStart || undefined,
                periodEnd: newRoute.periodEnd || undefined,
                availableCapacity: newRoute.availableCapacity
                    ? Number(newRoute.availableCapacity)
                    : undefined,
                capacityUnit: newRoute.capacityUnit as CapacityForecast['capacityUnit'],
                unitPrice: newRoute.unitPrice
                    ? Number(newRoute.unitPrice)
                    : undefined,
                currency: newRoute.currency || undefined,
                unitLength: newRoute.unitLength
                    ? Number(newRoute.unitLength)
                    : undefined,
                unitWidth: newRoute.unitWidth
                    ? Number(newRoute.unitWidth)
                    : undefined,
                unitHeight: newRoute.unitHeight
                    ? Number(newRoute.unitHeight)
                    : undefined,
                dimensionUom: newRoute.dimensionUom || undefined,
                unitVolume: newRoute.unitVolume
                    ? Number(newRoute.unitVolume)
                    : undefined,
                volumeUom: newRoute.volumeUom || undefined,
                partnershipId: managing.partnershipId,
            });
            toast.success('Private route added');
            const res = await getPartnershipRoutes(managing.partnershipId);
            setPrivateRoutes(res.content ?? []);
            setNewRoute({
                originLane: '',
                destinationLane: '',
                equipmentType: 'TRUCK',
                periodStart: '',
                periodEnd: '',
                availableCapacity: '',
                capacityUnit: 'KG',
                unitPrice: '',
                currency: 'USD',
                unitLength: '',
                unitWidth: '',
                unitHeight: '',
                dimensionUom: 'M',
                unitVolume: '',
                volumeUom: 'CBM',
            });
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to add route'
            );
        } finally {
            setBusyId(null);
        }
    };

    const activate = async (p: OrgPartnership) => {
        setBusyId(p.partnershipId);
        try {
            const res = await activateLogisticsPartnership(p.partnershipId);
            toast.success(
                `Partnership active — ${res.routesAdded ?? 0} routes in effect`
            );
            setManaging(null);
            await refreshAll();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Activation failed'
            );
        } finally {
            setBusyId(null);
        }
    };

    const terminate = async (p: OrgPartnership) => {
        setBusyId(p.partnershipId);
        try {
            const res = await terminateLogisticsPartnership(p.partnershipId);
            const released = (res.releasedShipments as string[] | undefined) ?? [];
            toast.success(
                released.length > 0
                    ? `Terminated — ${released.length} load(s) released back to the supplier`
                    : 'Partnership terminated'
            );
            setConfirmTerminate(null);
            setManaging(null);
            await refreshAll();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Termination failed'
            );
        } finally {
            setBusyId(null);
        }
    };

    const managingWanted = managing
        ? parseDesiredRoutes(
              (managing as unknown as Record<string, unknown>)
                  .desiredRoutesJson as string | undefined
          )
        : [];

    const managingAgreed = managing
        ? quotations.filter(
              (q) =>
                  q.partnershipId === managing.partnershipId &&
                  q.status === 'ACCEPTED'
          )
        : [];

    const useAgreedLine = (line: Record<string, unknown>) => {
        setNewRoute((prev) => ({
            ...prev,
            originLane: String(line.fromLane ?? line.from ?? ''),
            destinationLane: String(line.toLane ?? line.to ?? ''),
            availableCapacity:
                line.capacity !== undefined && line.capacity !== null
                    ? String(line.capacity)
                    : prev.availableCapacity,
            capacityUnit: String(line.capacityUnit ?? prev.capacityUnit),
            unitPrice:
                line.unitPrice !== undefined && line.unitPrice !== null
                    ? String(line.unitPrice)
                    : prev.unitPrice,
            currency: String(line.currency ?? prev.currency),
            periodStart: String(line.periodStart ?? prev.periodStart).slice(
                0,
                10
            ),
            periodEnd: String(line.periodEnd ?? prev.periodEnd).slice(0, 10),
            unitLength:
                line.unitLength !== undefined && line.unitLength !== null
                    ? String(line.unitLength)
                    : '',
            unitWidth:
                line.unitWidth !== undefined && line.unitWidth !== null
                    ? String(line.unitWidth)
                    : '',
            unitHeight:
                line.unitHeight !== undefined && line.unitHeight !== null
                    ? String(line.unitHeight)
                    : '',
            dimensionUom: String(line.dimensionUom ?? 'M'),
            unitVolume:
                line.unitVolume !== undefined && line.unitVolume !== null
                    ? String(line.unitVolume)
                    : '',
            volumeUom: String(line.volumeUom ?? 'CBM'),
        }));
    };

    const parseQuoteLines = (
        q: LogisticsPartnershipQuotation | null
    ): Record<string, unknown>[] => {
        if (!q?.routeLinesJson) return [];
        try {
            const parsed = JSON.parse(q.routeLinesJson) as Record<
                string,
                unknown
            >[];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const dirNameOf = (id?: number | null): string | undefined => {
        if (id === undefined || id === null) return undefined;
        const text = String(
            directory.find((d) => Number(d.id) === Number(id))?.orgName ?? ''
        ).trim();
        return text ? text : undefined;
    };

    // Partnership counterparty: directory name first, Core label second,
    // `Org #id` only as the last-resort backup.
    const partnerNameOf = (p: OrgPartnership): string => {
        const id = counterpartyOf(p, orgId);
        return dirNameOf(id) ?? counterpartyLabelOf(p, orgId);
    };

    const termTypeOf = (p: OrgPartnership): string =>
        String(
            (p as unknown as Record<string, unknown>).partnershipTermType ?? ''
        ).toUpperCase();

    const termChipOf = (p: OrgPartnership) => {
        const term = termTypeOf(p);
        if (term !== 'SHORT_TERM' && term !== 'LONG_TERM') {
            return <Badge variant="outline">—</Badge>;
        }
        return term === 'LONG_TERM' ? (
            <Badge>Long-term</Badge>
        ) : (
            <Badge variant="secondary">Short-term</Badge>
        );
    };

    // Invitation sender (supplier): directory name first.
    const inviterNameOf = (inv: PartnershipInvitation): string | undefined => {
        const raw = inv.invitingOrg ?? inv.inviterOrgId;
        const id = Number(raw);
        if (Number.isFinite(id) && id > 0) return dirNameOf(id);
        return undefined;
    };

    const viewProposal = async (inv: PartnershipInvitation) => {
        setViewing(inv);
        setLinkedRoute(null);
        if (inv.linkedCapacityForecastId) {
            try {
                const route = await getCapacityForecast(
                    inv.linkedCapacityForecastId
                );
                setLinkedRoute(route);
            } catch {
                // Route may have been deleted; dialog still shows the rest.
            }
        }
    };

    const viewingDesiredRoutes = (() => {
        if (!viewing?.desiredRoutesJson) return [];
        try {
            const parsed = JSON.parse(viewing.desiredRoutesJson) as {
                from?: string;
                to?: string;
                capacity?: number;
            }[];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    const activePartnerships = partnerships.filter(
        (p) => p.status !== 'TERMINATED'
    );
    const closedPartnerships = partnerships.filter(
        (p) => p.status === 'TERMINATED'
    );

    const openEdit = (p: OrgPartnership) => {
        setEditing({
            id: p.partnershipId,
            initial: {
                partnershipTerm: p.term || undefined,
                discountRate: p.discountRate,
                endDate: p.endDate ? p.endDate.slice(0, 10) : undefined,
            },
        });
    };

    const handleSaveEdit = async (values: PartnershipEditValues) => {
        if (!editing) return;
        const updated = await updateLogisticsPartnership(editing.id, values);
        setPartnerships((prev) =>
            prev.map((p) =>
                p.partnershipId === editing.id ? { ...p, ...updated } : p
            )
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
                <div className="w-full space-y-6">
                    <h2 className="text-lg font-semibold">Partnerships</h2>
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>
                                My Partnerships ({activePartnerships.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {activePartnerships.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">
                                    No partnerships yet. Accept an invitation
                                    below to get started.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Partner Org</TableHead>
                                            <TableHead>Terms</TableHead>
                                            <TableHead>Term</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Start</TableHead>
                                            <TableHead>End</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activePartnerships.map((p) => (
                                            <TableRow key={p.partnershipId}>
                                                <TableCell>
                                                    {p.partnershipId}
                                                </TableCell>
                                                <TableCell>
                                                    {partnerNameOf(p)}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {p.term || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {termChipOf(p)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {p.status || '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(p.startDate)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(p.endDate)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {String(
                                                            (
                                                                p as unknown as Record<
                                                                    string,
                                                                    unknown
                                                                >
                                                            ).partnershipTermType ??
                                                                ''
                                                        ).toUpperCase() ===
                                                            'LONG_TERM' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openRoutesManager(
                                                                        p
                                                                    )
                                                                }
                                                            >
                                                                Routes
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                openEdit(p)
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setConfirmTerminate(
                                                                    p
                                                                )
                                                            }
                                                        >
                                                            Terminate
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle>
                                    Long-Term Proposals ({longTermPending.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {longTermPending.length === 0 ? (
                                    <p className="py-4 text-sm text-muted-foreground">
                                        No long-term proposals awaiting review.
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Supplier</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {longTermPending.map((inv) => (
                                                <TableRow
                                                    key={invitationIdOf(inv)}
                                                >
                                                    <TableCell>
                                                        {invitationIdOf(inv)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {inviterNameOf(inv) ??
                                                            `Org ${inv.invitingOrg ?? inv.inviterOrgId ?? '—'}`}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    viewProposal(
                                                                        inv
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={
                                                                    busyId ===
                                                                    invitationIdOf(
                                                                        inv
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    respond(
                                                                        inv,
                                                                        'REJECT'
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                disabled={
                                                                    busyId ===
                                                                    invitationIdOf(
                                                                        inv
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    openQuoteDialog(
                                                                        inv
                                                                    )
                                                                }
                                                            >
                                                                Raise Quotation
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <div className="flex items-center justify-between">
                                    <CardTitle>
                                        Quotations ({quotations.length})
                                    </CardTitle>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => refreshAll()}
                                    >
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {quotations.length === 0 ? (
                                    <p className="py-4 text-sm text-muted-foreground">
                                        No quotations raised yet.
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Quote</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {quotations.map((q) => (
                                                <TableRow key={q.quotationId}>
                                                    <TableCell className="font-mono text-xs">
                                                        {q.quotationNumber ??
                                                            q.quotationId}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {q.status ?? '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setQuoteViewing(
                                                                        q
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                            {q.status ===
                                                                'ACCEPTED' &&
                                                                q.partnershipId && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            openRoutesForQuotation(
                                                                                q
                                                                            )
                                                                        }
                                                                    >
                                                                        Manage
                                                                        Routes
                                                                    </Button>
                                                                )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle>Received Invitations</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <PartnershipInvitationList
                                    invitations={otherPending}
                                    emptyText="No received invitations."
                                    onView={viewProposal}
                                    nameOf={inviterNameOf}
                                    onAccept={(inv) => respond(inv, 'ACCEPT')}
                                    onReject={(inv) => respond(inv, 'REJECT')}
                                    busyId={busyId}
                                />
                            </CardContent>
                        </Card>
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle>Closed Partnerships</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {closedPartnerships.length > 0 && (
                                <Table className="mb-4">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Partner Org</TableHead>
                                                <TableHead>Term</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Start</TableHead>
                                                <TableHead>End</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {closedPartnerships.map((p) => (
                                                <TableRow key={p.partnershipId}>
                                                    <TableCell>
                                                        {p.partnershipId}
                                                    </TableCell>
                                                    <TableCell>
                                                        {partnerNameOf(p)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {termChipOf(p)}
                                                    </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {p.status}
                                                    </Badge>
                                                </TableCell>
                                                    <TableCell>
                                                        {formatDate(p.startDate)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(p.endDate)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                <PartnershipInvitationList
                                    invitations={receivedHistory}
                                    emptyText="No accepted or rejected invitations yet."
                                    onView={viewProposal}
                                    nameOf={inviterNameOf}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <PartnershipEditDialog
                open={editing !== null}
                onOpenChange={(v) => {
                    if (!v) setEditing(null);
                }}
                initial={editing?.initial}
                onSave={async (values) => {
                    await handleSaveEdit(values);
                }}
            />
            <Dialog
                open={viewing !== null}
                onOpenChange={(v) => {
                    if (!v) {
                        setViewing(null);
                        setLinkedRoute(null);
                    }
                }}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Proposal ·{' '}
                            {viewing ? (inviterNameOf(viewing) ?? `Org ${viewing.invitingOrg ?? viewing.inviterOrgId ?? '—'}`) : '—'}
                        </DialogTitle>
                        <DialogDescription>
                            {viewing?.partnershipContext ?? '—'} ·{' '}
                            {String(viewing?.status ?? '')}
                        </DialogDescription>
                    </DialogHeader>
                    {viewing && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Term</p>
                                    <Badge variant="outline">
                                        {viewing.partnershipTermType ?? '—'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Validity start
                                    </p>
                                    <p>{formatDate(viewing.validityStart)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Validity end
                                    </p>
                                    <p>{formatDate(viewing.validityEnd)}</p>
                                </div>
                            </div>
                            {viewing.linkedCapacityForecastId ? (
                                <div className="grid gap-2">
                                    <p className="text-sm font-medium">
                                        Selected route (short-term)
                                    </p>
                                    {linkedRoute ? (
                                        <div className="rounded-md border px-3 py-2 text-sm">
                                            <p className="font-medium">
                                                {linkedRoute.originLane ?? '—'}{' '}
                                                →{' '}
                                                {linkedRoute.destinationLane ??
                                                    '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {linkedRoute.equipmentType ??
                                                    '—'}{' '}
                                                {' · '}
                                                {linkedRoute.periodStart ??
                                                    '—'}{' '}
                                                → {linkedRoute.periodEnd ?? '—'}{' '}
                                                {' · '}
                                                {linkedRoute.availableCapacity ??
                                                    0}{' '}
                                                {capacityUnitLabel(
                                                    linkedRoute.capacityUnit
                                                )}
                                                {formatUnitSpecs(linkedRoute)
                                                    ? ` (${formatUnitSpecs(linkedRoute)})`
                                                    : ''}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Route #
                                            {
                                                viewing.linkedCapacityForecastId
                                            }{' '}
                                            (details unavailable)
                                        </p>
                                    )}
                                </div>
                            ) : null}
                            {viewingDesiredRoutes.length > 0 ? (
                                <div className="grid gap-2">
                                    <p className="text-sm font-medium">
                                        Wanted routes (long-term)
                                        {viewing.desiredCapacity !== undefined &&
                                        viewing.desiredCapacity !== null
                                            ? ` · ${viewing.desiredCapacity} ${capacityUnitLabel(viewing.desiredCapacityUnit)} total`
                                            : ''}
                                    </p>
                                    <div className="divide-y rounded-md border">
                                        {viewingDesiredRoutes.map((r, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                            >
                                                <span className="font-medium">
                                                    {r.from ?? '—'} →{' '}
                                                    {r.to ?? '—'}
                                                </span>
                                                {r.capacity !== undefined ? (
                                                    <span className="font-mono text-xs">
                                                        {r.capacity}{' '}
                                                        {capacityUnitLabel(
                                                            viewing.desiredCapacityUnit
                                                        )}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">
                                    Proposed terms
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {viewing.proposedTerms || '—'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">
                                        Invited
                                    </p>
                                    <p>{formatDate(viewing.invitedAt)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Expires
                                    </p>
                                    <p>{formatDate(viewing.expiresAt)}</p>
                                </div>
                            </div>
                            {isInvitationPending(viewing) ? (
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                            busyId === invitationIdOf(viewing)
                                        }
                                        onClick={() =>
                                            respond(viewing, 'REJECT')
                                        }
                                    >
                                        Reject
                                    </Button>
                                    {isLongTermProposal(viewing) ? (
                                        <Button
                                            size="sm"
                                            disabled={
                                                busyId ===
                                                invitationIdOf(viewing)
                                            }
                                            onClick={() => {
                                                setViewing(null);
                                                openQuoteDialog(viewing);
                                            }}
                                        >
                                            Raise Quotation
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled={
                                                busyId ===
                                                invitationIdOf(viewing)
                                            }
                                            onClick={() =>
                                                respond(viewing, 'ACCEPT')
                                            }
                                        >
                                            Accept
                                        </Button>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Raise counter-quotation on a long-term proposal */}
            <Dialog
                open={quoting !== null}
                onOpenChange={(v) => {
                    if (!v) setQuoting(null);
                }}
            >
                <DialogContent className="md:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            Raise Quotation ·{' '}
                            {quoting
                                ? (inviterNameOf(quoting) ??
                                  `Org ${quoting.invitingOrg ?? '—'}`)
                                : '—'}
                        </DialogTitle>
                        <DialogDescription>
                            Include some or all requested routes, adjust
                            capacities and add your pricing. The supplier
                            reviews it before anything takes effect.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                        {quoteLines.map((l, idx) => (
                            <div
                                key={idx}
                                className="grid gap-2 rounded-md border p-3"
                            >
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={l.include}
                                        onChange={(e) =>
                                            setQuoteLines((prev) =>
                                                prev.map((x, i) =>
                                                    i === idx
                                                        ? {
                                                              ...x,
                                                              include:
                                                                  e.target
                                                                      .checked,
                                                          }
                                                        : x
                                                )
                                            )
                                        }
                                    />
                                    {l.from || '—'} → {l.to || '—'}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="grid gap-1">
                                        <Label>Capacity</Label>
                                        <Input
                                            type="number"
                                            value={l.capacity}
                                            onChange={(e) =>
                                                setQuoteLines((prev) =>
                                                    prev.map((x, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...x,
                                                                  capacity:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Unit</Label>
                                        <Select
                                            value={l.capacityUnit}
                                            onValueChange={(v) =>
                                                setQuoteLines((prev) =>
                                                    prev.map((x, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...x,
                                                                  capacityUnit:
                                                                      v,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CAPACITY_UNITS.map((u) => (
                                                    <SelectItem
                                                        key={u}
                                                        value={u}
                                                    >
                                                        {capacityUnitLabel(u)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Price / unit</Label>
                                        <Input
                                            type="number"
                                            value={l.unitPrice}
                                            onChange={(e) =>
                                                setQuoteLines((prev) =>
                                                    prev.map((x, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...x,
                                                                  unitPrice:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Currency</Label>
                                        <Select
                                            value={l.currency}
                                            onValueChange={(v) =>
                                                setQuoteLines((prev) =>
                                                    prev.map((x, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...x,
                                                                  currency: v,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCIES.map((c) => (
                                                    <SelectItem
                                                        key={c.code}
                                                        value={c.code}
                                                    >
                                                        {c.code} — {c.label} (
                                                        {c.symbol})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-1">
                                        <Label>Period start</Label>
                                        <Input
                                            type="date"
                                            value={l.periodStart}
                                            onChange={(e) =>
                                                setQuoteLines((prev) =>
                                                    prev.map((x, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...x,
                                                                  periodStart:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Period end</Label>
                                        <Input
                                            type="date"
                                            value={l.periodEnd}
                                            onChange={(e) =>
                                                setQuoteLines((prev) =>
                                                    prev.map((x, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...x,
                                                                  periodEnd:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                {isUnitizedCapacityUnit(l.capacityUnit) && (
                                    <div className="grid gap-2 rounded-md border p-2">
                                        <p className="text-xs font-medium">
                                            Unit dimensions (required for{' '}
                                            {capacityUnitLabel(
                                                l.capacityUnit
                                            )}
                                            )
                                        </p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(
                                                [
                                                    ['unitLength', 'Length'],
                                                    ['unitWidth', 'Width'],
                                                    ['unitHeight', 'Height'],
                                                ] as const
                                            ).map(([field, label]) => (
                                                <div
                                                    key={field}
                                                    className="grid gap-1"
                                                >
                                                    <Label>{label}</Label>
                                                    <Input
                                                        type="number"
                                                        value={l[field]}
                                                        onChange={(e) =>
                                                            setQuoteLines(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (
                                                                            x,
                                                                            i
                                                                        ) =>
                                                                            i ===
                                                                            idx
                                                                                ? {
                                                                                      ...x,
                                                                                      [field]:
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                  }
                                                                                : x
                                                                    )
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))}
                                            <div className="grid gap-1">
                                                <Label>Dim. unit</Label>
                                                <Select
                                                    value={l.dimensionUom}
                                                    onValueChange={(v) =>
                                                        setQuoteLines((prev) =>
                                                            prev.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          dimensionUom:
                                                                              v,
                                                                      }
                                                                    : x
                                                            )
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="M">
                                                            Meters
                                                        </SelectItem>
                                                        <SelectItem value="FT">
                                                            Feet
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="grid gap-1">
                                                <Label>
                                                    Volume / unit (auto from
                                                    L×W×H if empty)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={l.unitVolume}
                                                    onChange={(e) =>
                                                        setQuoteLines((prev) =>
                                                            prev.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          unitVolume:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : x
                                                            )
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label>Volume unit</Label>
                                                <Select
                                                    value={l.volumeUom}
                                                    onValueChange={(v) =>
                                                        setQuoteLines((prev) =>
                                                            prev.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          volumeUom:
                                                                              v,
                                                                      }
                                                                    : x
                                                            )
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CBM">
                                                            CBM
                                                        </SelectItem>
                                                        <SelectItem value="CFT">
                                                            CFT
                                                        </SelectItem>
                                                        <SelectItem value="L">
                                                            Litres
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {quoteLines.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                The proposal carries no structured routes —
                                describe your offer in the terms below.
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                                <Label>Validity start</Label>
                                <Input
                                    type="date"
                                    value={quoteValidityStart}
                                    onChange={(e) =>
                                        setQuoteValidityStart(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Validity end</Label>
                                <Input
                                    type="date"
                                    value={quoteValidityEnd}
                                    onChange={(e) =>
                                        setQuoteValidityEnd(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Your terms</Label>
                            <Textarea
                                value={quoteTerms}
                                onChange={(e) => setQuoteTerms(e.target.value)}
                                placeholder="e.g. 2× 40ft containers weekly, detention free 5 days"
                            />
                        </div>
                        <Button
                            onClick={submitQuotation}
                            disabled={busyId !== null}
                        >
                            {busyId !== null
                                ? 'Raising…'
                                : 'Raise Quotation'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Quotation detail */}
            <Dialog
                open={quoteViewing !== null}
                onOpenChange={(v) => {
                    if (!v) setQuoteViewing(null);
                }}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Quotation {quoteViewing?.quotationNumber ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            {quoteViewing?.status ?? ''} · validity{' '}
                            {formatDate(quoteViewing?.validityStart)} →{' '}
                            {formatDate(quoteViewing?.validityEnd)}
                        </DialogDescription>
                    </DialogHeader>
                    {quoteViewing && (
                        <div className="grid gap-4">
                            <div className="divide-y rounded-md border">
                                {(parseQuoteLines(quoteViewing) ?? []).map(
                                    (l, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                        >
                                            <span className="font-medium">
                                                {String(
                                                    l.fromLane ?? l.from ?? '—'
                                                )}{' '}
                                                →{' '}
                                                {String(
                                                    l.toLane ?? l.to ?? '—'
                                                )}
                                            </span>
                                            <span className="font-mono text-xs">
                                                {String(
                                                    l.capacity ?? '—'
                                                )}{' '}
                                                {capacityUnitLabel(
                                                    String(
                                                        l.capacityUnit ?? ''
                                                    ) || undefined
                                                )}
                                                {l.unitPrice !== undefined &&
                                                l.unitPrice !== null
                                                    ? ` @ ${l.unitPrice} ${l.currency ?? ''}`
                                                    : ''}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">Terms</p>
                                <p className="text-sm text-muted-foreground">
                                    {quoteViewing.terms || '—'}
                                </p>
                            </div>
                            {quoteViewing.status === 'ACCEPTED' &&
                                quoteViewing.partnershipId && (
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setQuoteViewing(null);
                                                openRoutesForQuotation(
                                                    quoteViewing
                                                );
                                            }}
                                        >
                                            Manage Routes
                                        </Button>
                                    </div>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Private routes manager */}
            <Dialog
                open={managing !== null}
                onOpenChange={(v) => {
                    if (!v) setManaging(null);
                }}
            >
                <DialogContent className="md:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Partnership routes · #
                            {managing?.partnershipId} (
                            {managing
                                ? partnerNameOf(managing)
                                : '—'}
                            )
                        </DialogTitle>
                        <DialogDescription>
                            These lanes belong to this partnership only and
                            stay hidden from the public marketplace. Add every
                            agreed route, then activate — the partnership takes
                            effect only after all routes are added (
                            {privateRoutes.length}/{managingWanted.length || '—'}{' '}
                            added).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                        <div className="divide-y rounded-md border">
                            {privateRoutes.map((r) => (
                                <div
                                    key={r.forecastId}
                                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                >
                                    <span className="font-medium">
                                        {r.originLane ?? '—'} →{' '}
                                        {r.destinationLane ?? '—'}
                                    </span>
                                    <span className="font-mono text-xs">
                                        {r.availableCapacity ?? 0}{' '}
                                        {capacityUnitLabel(r.capacityUnit)}
                                        {r.unitPrice !== undefined &&
                                        r.unitPrice !== null
                                            ? ` @ ${r.unitPrice} ${r.currency ?? ''}`
                                            : ''}
                                    </span>
                                </div>
                            ))}
                            {privateRoutes.length === 0 && (
                                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                    No routes added yet.
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2 rounded-md border p-3">
                            <p className="text-sm font-medium">
                                Add route for this partnership
                            </p>
                            {managingAgreed.length > 0 && (
                                <div className="grid gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        From the accepted quotation — Use fills
                                        the form below, dimensions included.
                                    </p>
                                    {managingAgreed.flatMap((q) =>
                                        parseQuoteLines(q).map((l, i) => (
                                            <div
                                                key={`${q.quotationId}-${i}`}
                                                className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                                            >
                                                <span className="font-medium">
                                                    {String(
                                                        l.fromLane ??
                                                            l.from ??
                                                            '—'
                                                    )}{' '}
                                                    →{' '}
                                                    {String(
                                                        l.toLane ??
                                                            l.to ??
                                                            '—'
                                                    )}{' '}
                                                    <span className="font-normal text-muted-foreground">
                                                        ({q.quotationNumber ??
                                                            q.quotationId}
                                                        )
                                                    </span>
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        useAgreedLine(l)
                                                    }
                                                >
                                                    Use
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1">
                                    <Label>Origin</Label>
                                    <Input
                                        value={newRoute.originLane}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                originLane: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Mumbai"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Destination</Label>
                                    <Input
                                        value={newRoute.destinationLane}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                destinationLane: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Pune"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-1">
                                    <Label>Period start</Label>
                                    <Input
                                        type="date"
                                        value={newRoute.periodStart}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                periodStart: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Period end</Label>
                                    <Input
                                        type="date"
                                        value={newRoute.periodEnd}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                periodEnd: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Equipment</Label>
                                    <Input
                                        value={newRoute.equipmentType}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                equipmentType: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="grid gap-1">
                                    <Label>Capacity</Label>
                                    <Input
                                        type="number"
                                        value={newRoute.availableCapacity}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                availableCapacity:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Unit</Label>
                                    <Select
                                        value={newRoute.capacityUnit}
                                        onValueChange={(v) =>
                                            setNewRoute({
                                                ...newRoute,
                                                capacityUnit: v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CAPACITY_UNITS.map((u) => (
                                                <SelectItem key={u} value={u}>
                                                    {capacityUnitLabel(u)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1">
                                    <Label>Price / unit</Label>
                                    <Input
                                        type="number"
                                        value={newRoute.unitPrice}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                unitPrice: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Currency</Label>
                                    <Input
                                        value={newRoute.currency}
                                        onChange={(e) =>
                                            setNewRoute({
                                                ...newRoute,
                                                currency:
                                                    e.target.value.toUpperCase(),
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            {isUnitizedCapacityUnit(newRoute.capacityUnit) && (
                                <div className="grid gap-2 rounded-md border p-2">
                                    <p className="text-xs font-medium">
                                        Unit dimensions (required for{' '}
                                        {capacityUnitLabel(
                                            newRoute.capacityUnit
                                        )}
                                        )
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(
                                            [
                                                ['unitLength', 'Length'],
                                                ['unitWidth', 'Width'],
                                                ['unitHeight', 'Height'],
                                            ] as const
                                        ).map(([field, label]) => (
                                            <div
                                                key={field}
                                                className="grid gap-1"
                                            >
                                                <Label>{label}</Label>
                                                <Input
                                                    type="number"
                                                    value={newRoute[field]}
                                                    onChange={(e) =>
                                                        setNewRoute({
                                                            ...newRoute,
                                                            [field]:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        ))}
                                        <div className="grid gap-1">
                                            <Label>Dim. unit</Label>
                                            <Select
                                                value={newRoute.dimensionUom}
                                                onValueChange={(v) =>
                                                    setNewRoute({
                                                        ...newRoute,
                                                        dimensionUom: v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="M">
                                                        Meters
                                                    </SelectItem>
                                                    <SelectItem value="FT">
                                                        Feet
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-1">
                                            <Label>
                                                Volume / unit (auto from L×W×H
                                                if empty)
                                            </Label>
                                            <Input
                                                type="number"
                                                value={newRoute.unitVolume}
                                                onChange={(e) =>
                                                    setNewRoute({
                                                        ...newRoute,
                                                        unitVolume:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Volume unit</Label>
                                            <Select
                                                value={newRoute.volumeUom}
                                                onValueChange={(v) =>
                                                    setNewRoute({
                                                        ...newRoute,
                                                        volumeUom: v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CBM">
                                                        CBM
                                                    </SelectItem>
                                                    <SelectItem value="CFT">
                                                        CFT
                                                    </SelectItem>
                                                    <SelectItem value="L">
                                                        Litres
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <Button
                                onClick={addPrivateRoute}
                                disabled={busyId === -1}
                            >
                                {busyId === -1 ? 'Adding…' : 'Add Route'}
                            </Button>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setManaging(null)}
                            >
                                Close
                            </Button>
                            {managing?.status !== 'ACTIVE' && (
                                <Button
                                    disabled={busyId === managing?.partnershipId}
                                    onClick={() =>
                                        managing && activate(managing)
                                    }
                                >
                                    {busyId === managing?.partnershipId
                                        ? 'Activating…'
                                        : 'Activate Partnership'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={confirmTerminate !== null}
                onOpenChange={(v) => !v && setConfirmTerminate(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Terminate partnership{' '}
                            {confirmTerminate
                                ? `#${confirmTerminate.partnershipId} (${partnerNameOf(confirmTerminate)})`
                                : ''}
                            ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Loads already handed over but not yet shipped
                            (booked or assigned) will be released back to the
                            supplier as prepared shipments. Termination is
                            blocked while any shipment is already moving.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={
                                busyId ===
                                confirmTerminate?.partnershipId
                            }
                            onClick={() =>
                                confirmTerminate &&
                                terminate(confirmTerminate)
                            }
                        >
                            Terminate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
