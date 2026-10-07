'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Building2,
    MapPin,
    Plus,
    Route as RouteIcon,
    Search,
    Send,
    Star,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import {
    getOrganizationDirectory,
    type SupplierDirectoryEntry,
} from '@/lib/services/supplier-market-service';
import {
    CAPACITY_UNITS,
    capacityUnitLabel,
    formatUnitSpecs,
} from '@/lib/services/logistics-ops-service';
import { getSupplierSentInvitations } from '@/lib/services/partnership-invitations-service';
import {
    createLogisticsProposal,
    getAvailableLogisticsCapacities,
    getSupplierLogisticsPartnerships,
    type LogisticsCapacityRow,
    type SupplierLogisticsPartnership,
} from '@/lib/services/supplier-logistics-service';

// ─────────────────────────────────────────────────────────────
// Supplier Logistics Marketplace (org cards, like the retailer
// supplier discovery cards).
// Suppliers browse logistics orgs with their routing capacities
// and send partnership proposals:
// - SHORT_TERM: validity must sit inside the linked routing-capacity
//   period.
// - LONG_TERM: validity may run beyond it; the logistics partner can
//   then extend its routing-capacity period for the partnership.
// ─────────────────────────────────────────────────────────────

interface LogisticsOrgGroup {
    orgId: number;
    routes: LogisticsCapacityRow[];
}

const ROUTES_PAGE_SIZE = 5;

export default function SupplierLogisticsMarketPage() {
    const { toast } = useToast();
    const { orgId } = useUserMetadata();
    const [rows, setRows] = useState<LogisticsCapacityRow[]>([]);
    const [totalRoutes, setTotalRoutes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    // IAM org directory (same source the retailer supplier marketplace
    // uses): real org names keyed by org id. `Org #id` is only the
    // last-resort backup.
    const [directory, setDirectory] = useState<SupplierDirectoryEntry[]>([]);
    // Org ids with an outstanding PENDING proposal from us. Propose stays
    // disabled for these until accepted/rejected.
    const [pendingOrgIds, setPendingOrgIds] = useState<Set<number>>(new Set());
    // Established, still-valid partnerships by logistics org id. A valid
    // LONG_TERM partnership disables new proposals (enforced server-side
    // too); any established partnership shows a chip on the card.
    const [partnerTermByOrg, setPartnerTermByOrg] = useState<
        Map<number, 'SHORT_TERM' | 'LONG_TERM'>
    >(new Map());
    const [routesOpenFor, setRoutesOpenFor] = useState<number | null>(null);
    const [routesPage, setRoutesPage] = useState(0);
    // Org-scoped proposal (lane info removed — a single route's lane was
    // meaningless when the org publishes many routes).
    const [proposingOrg, setProposingOrg] = useState<number | null>(null);
    const [termType, setTermType] = useState<'SHORT_TERM' | 'LONG_TERM'>(
        'SHORT_TERM'
    );
    // SHORT_TERM: supplier picks a published route; dates are fixed to it.
    const [selectedForecastId, setSelectedForecastId] = useState('');
    // LONG_TERM: supplier defines wanted routes/capacity/dates.
    const [wantedRoutes, setWantedRoutes] = useState<
        { from: string; to: string; capacity: string }[]
    >([{ from: '', to: '', capacity: '' }]);
    const [wantedUnit, setWantedUnit] = useState<string>('KG');
    const [validityStart, setValidityStart] = useState('');
    const [validityEnd, setValidityEnd] = useState('');
    const [proposedTerms, setProposedTerms] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [market, dir, sent, mine] = await Promise.all([
                getAvailableLogisticsCapacities({
                    search: search || undefined,
                    pageNo: 0,
                    pageOffset: 100,
                }),
                getOrganizationDirectory('LOGISTICS').catch(
                    () => [] as SupplierDirectoryEntry[]
                ),
                getSupplierSentInvitations({
                    pageNo: 0,
                    pageOffset: 100,
                }).catch(() => null),
                getSupplierLogisticsPartnerships().catch(() => null),
            ]);
            setRows(market.content ?? []);
            setTotalRoutes(market.totalElements ?? 0);
            setDirectory(dir ?? []);
            const pending = new Set<number>();
            for (const inv of sent?.content ?? []) {
                if (String(inv.status ?? '').toUpperCase() !== 'PENDING')
                    continue;
                if (inv.partnershipContext !== 'SUPPLIER_LOGISTICS') continue;
                const id = Number(inv.invitedOrg ?? inv.invitedOrgId ?? NaN);
                if (Number.isFinite(id) && id > 0) pending.add(id);
            }
            setPendingOrgIds(pending);
            // Established, still-valid partnerships by counterparty org.
            const own = Number(orgId);
            const now = Date.now();
            const terms = new Map<number, 'SHORT_TERM' | 'LONG_TERM'>();
            for (const p of mine?.content ??
                [] as SupplierLogisticsPartnership[]) {
                if (String(p.status ?? '').toUpperCase() !== 'ACTIVE')
                    continue;
                if (p.validityEnd) {
                    const end = new Date(p.validityEnd).getTime();
                    if (Number.isFinite(end) && end < now) continue;
                }
                const counter =
                    Number.isFinite(own) && Number(p.primaryOrgId) === own
                        ? p.secondaryOrgId
                        : Number.isFinite(own) && Number(p.secondaryOrgId) === own
                          ? p.primaryOrgId
                          : (p.secondaryOrgId ?? p.primaryOrgId);
                if (counter === undefined || counter === null) continue;
                const term = String(
                    p.partnershipTermType ?? ''
                ).toUpperCase() as 'SHORT_TERM' | 'LONG_TERM';
                if (term !== 'SHORT_TERM' && term !== 'LONG_TERM') continue;
                // Prefer LONG_TERM when several valid partnerships exist.
                if (term === 'LONG_TERM' || !terms.has(Number(counter))) {
                    terms.set(Number(counter), term);
                }
            }
            setPartnerTermByOrg(terms);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [search, toast, orgId]);

    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
    }, [load]);

    const dirEntryOf = (id?: number | null): SupplierDirectoryEntry | undefined => {
        if (id === undefined || id === null) return undefined;
        return directory.find((d) => Number(d.id) === Number(id));
    };

    // Logistics partner display name: directory name first, then the Core
    // account name, with `Org #id` only as the last-resort backup.
    const orgDisplayName = (
        orgId: number | undefined,
        coreName?: string | null
    ): string => {
        const dir = String(dirEntryOf(orgId)?.orgName ?? '').trim();
        const core = String(coreName ?? '').trim();
        return (
            (dir ? dir : undefined) ??
            (core ? core : undefined) ??
            (orgId ? `Org #${orgId}` : 'Unnamed logistics partner')
        );
    };

    const groups: LogisticsOrgGroup[] = useMemo(() => {
        const byOrg = new Map<number, LogisticsCapacityRow[]>();
        for (const r of rows) {
            if (r.logisticsOrgId === undefined || r.logisticsOrgId === null)
                continue;
            const list = byOrg.get(Number(r.logisticsOrgId)) ?? [];
            list.push(r);
            byOrg.set(Number(r.logisticsOrgId), list);
        }
        const q = search.trim().toLowerCase();
        const mapped: LogisticsOrgGroup[] = [];
        for (const [orgId, routes] of byOrg) {
            if (!q) {
                mapped.push({ orgId, routes });
                continue;
            }
            const nameHit = orgDisplayName(
                orgId,
                routes[0]?.logisticsOrgName
            )
                .toLowerCase()
                .includes(q);
            if (nameHit) {
                mapped.push({ orgId, routes });
                continue;
            }
            const laneHit = routes.some(
                (r) =>
                    (r.originLane ?? '').toLowerCase().includes(q) ||
                    (r.destinationLane ?? '').toLowerCase().includes(q) ||
                    (r.equipmentType ?? '').toLowerCase().includes(q)
            );
            if (laneHit) mapped.push({ orgId, routes });
        }
        mapped.sort((a, b) =>
            orgDisplayName(a.orgId, a.routes[0]?.logisticsOrgName).localeCompare(
                orgDisplayName(b.orgId, b.routes[0]?.logisticsOrgName)
            )
        );
        return mapped;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, directory, search]);

    const routesDialogGroup = useMemo(
        () => groups.find((g) => g.orgId === routesOpenFor) ?? null,
        [groups, routesOpenFor]
    );
    const routesDialogPages = routesDialogGroup
        ? Math.max(1, Math.ceil(routesDialogGroup.routes.length / ROUTES_PAGE_SIZE))
        : 1;
    const routesDialogRows = routesDialogGroup
        ? routesDialogGroup.routes.slice(
              routesPage * ROUTES_PAGE_SIZE,
              routesPage * ROUTES_PAGE_SIZE + ROUTES_PAGE_SIZE
          )
        : [];

    const openRoutes = (orgId: number) => {
        setRoutesPage(0);
        setRoutesOpenFor(orgId);
    };

    const openPropose = (orgId: number, forecastId?: number) => {
        const group = groups.find((g) => g.orgId === orgId);
        const first = forecastId
            ? group?.routes.find((r) => r.forecastId === forecastId)
            : group?.routes[0];
        setTermType('SHORT_TERM');
        setSelectedForecastId(first ? String(first.forecastId) : '');
        setValidityStart(first?.periodStart ?? '');
        setValidityEnd(first?.periodEnd ?? '');
        setWantedRoutes([{ from: '', to: '', capacity: '' }]);
        setWantedUnit('KG');
        setProposedTerms('');
        setRoutesOpenFor(null);
        setProposingOrg(orgId);
    };

    const proposingGroup =
        groups.find((g) => g.orgId === proposingOrg) ?? null;
    const selectedRoute =
        proposingGroup?.routes.find(
            (r) => String(r.forecastId) === selectedForecastId
        ) ?? null;

    const submitProposal = async () => {
        if (!proposingGroup) {
            toast({ title: 'No logistics org selected', variant: 'destructive' });
            return;
        }
        const base = {
            invitedOrgId: proposingGroup.orgId,
            partnershipContext: 'SUPPLIER_LOGISTICS' as const,
            proposedTerms: proposedTerms || undefined,
            partnershipTermType: termType,
        };
        if (termType === 'SHORT_TERM') {
            if (!selectedRoute) {
                toast({
                    title: 'Select a route for the short-term proposal',
                    variant: 'destructive',
                });
                return;
            }
            setSubmitting(true);
            try {
                await createLogisticsProposal({
                    ...base,
                    // Dates are fixed to the selected route's period.
                    validityStart: selectedRoute.periodStart,
                    validityEnd: selectedRoute.periodEnd,
                    linkedCapacityForecastId: selectedRoute.forecastId,
                });
                toast({ title: 'Partnership proposal sent', variant: 'success' });
                setPendingOrgIds((prev) => new Set(prev).add(proposingGroup.orgId));
                setProposingOrg(null);
                setProposedTerms('');
            } catch (e: unknown) {
                toast({
                    title: e instanceof Error ? e.message : String(e),
                    variant: 'destructive',
                });
            } finally {
                setSubmitting(false);
            }
            return;
        }
        // LONG_TERM: supplier-defined routes + capacity + dates.
        const cleaned = wantedRoutes
            .map((r) => ({
                from: r.from.trim(),
                to: r.to.trim(),
                capacity: r.capacity ? Number(r.capacity) : undefined,
            }))
            .filter((r) => r.from && r.to);
        if (cleaned.length === 0) {
            toast({
                title: 'Add at least one wanted route (from / to)',
                variant: 'destructive',
            });
            return;
        }
        if (!validityStart || !validityEnd) {
            toast({
                title: 'LONG_TERM proposals need a validity period',
                variant: 'destructive',
            });
            return;
        }
        const total = cleaned.reduce(
            (sum, r) => sum + (Number.isFinite(r.capacity) ? (r.capacity as number) : 0),
            0
        );
        const summary = `Wanted routes: ${cleaned
            .map(
                (r) =>
                    `${r.from} → ${r.to}${r.capacity !== undefined ? ` (${r.capacity} ${capacityUnitLabel(wantedUnit)})` : ''}`
            )
            .join('; ')} · Validity ${validityStart} → ${validityEnd}`;
        setSubmitting(true);
        try {
            await createLogisticsProposal({
                ...base,
                proposedTerms: [proposedTerms || undefined, summary]
                    .filter(Boolean)
                    .join(' | '),
                validityStart,
                validityEnd,
                desiredRoutesJson: JSON.stringify(cleaned),
                desiredCapacity: total > 0 ? total : undefined,
                desiredCapacityUnit: wantedUnit,
            });
            toast({ title: 'Partnership proposal sent', variant: 'success' });
            setPendingOrgIds((prev) => new Set(prev).add(proposingGroup.orgId));
            setProposingOrg(null);
            setWantedRoutes([{ from: '', to: '', capacity: '' }]);
            setValidityStart('');
            setValidityEnd('');
            setProposedTerms('');
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 gap-2 p-4 md:gap-6 md:p-6">
                    <div className="w-full space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Logistics Marketplace
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Browse logistics partners and their
                                    routing capacities — propose short-term
                                    or long-term, no manual org-ID typing.
                                </p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-8 sm:w-64"
                                    placeholder="Search name, lane, equipment…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline">
                                {groups.length} logistics partners
                            </Badge>
                            <Badge variant="outline">
                                {totalRoutes} routes
                            </Badge>
                        </div>

                        {groups.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    No logistics partners match your search.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {groups.map((g) => {
                                    const entry = dirEntryOf(g.orgId);
                                    const name = orgDisplayName(
                                        g.orgId,
                                        g.routes[0]?.logisticsOrgName
                                    );
                                    const location =
                                        [entry?.city, entry?.country]
                                            .filter(Boolean)
                                            .join(', ') || '—';
                                    const top = g.routes.slice(0, 3);
                                    const pending = pendingOrgIds.has(g.orgId);
                                    const establishedTerm =
                                        partnerTermByOrg.get(g.orgId);
                                    const longTermLocked =
                                        establishedTerm === 'LONG_TERM';
                                    return (
                                        <Card
                                            key={g.orgId}
                                            className="flex flex-col p-4 gap-2"
                                        >
                                            <CardHeader className="p-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base">
                                                                {name}
                                                            </CardTitle>
                                                            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {location}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {entry?.trustScore !==
                                                        undefined &&
                                                    entry?.trustScore !==
                                                        null ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            {entry.trustScore}
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex flex-1 flex-col gap-3 p-0">
                                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                                    <Badge variant="secondary">
                                                        <RouteIcon className="mr-1 h-3 w-3" />
                                                        {g.routes.length}{' '}
                                                        {g.routes.length === 1
                                                            ? 'route'
                                                            : 'routes'}
                                                    </Badge>
                                                    {establishedTerm ? (
                                                        <Badge variant="default">
                                                            {establishedTerm ===
                                                            'LONG_TERM'
                                                                ? 'Long-term partner'
                                                                : 'Short-term partner'}
                                                        </Badge>
                                                    ) : null}
                                                </div>

                                                <div className="divide-y rounded-md border">
                                                    {top.map((r) => (
                                                        <div
                                                            key={r.forecastId}
                                                            className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium">
                                                                    {r.originLane ??
                                                                        '—'}{' '}
                                                                    →{' '}
                                                                    {r.destinationLane ??
                                                                        '—'}
                                                                </p>
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {r.equipmentType ??
                                                                        '—'}{' '}
                                                                    {' · '}
                                                                    {r.periodStart ??
                                                                        '—'}{' '}
                                                                    →{' '}
                                                                    {r.periodEnd ??
                                                                        '—'}
                                                                </p>
                                                            </div>
                                                            <span className="shrink-0 text-right font-mono text-xs">
                                                                {r.availableCapacity ??
                                                                    0}{' '}
                                                                {capacityUnitLabel(
                                                                    r.capacityUnit
                                                                )}
                                                                {formatUnitSpecs(
                                                                    r
                                                                ) && (
                                                                    <span className="block font-sans text-muted-foreground">
                                                                        {formatUnitSpecs(
                                                                            r
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-auto flex gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openRoutes(g.orgId)
                                                        }
                                                    >
                                                        Show more (
                                                        {g.routes.length})
                                                    </Button>
                                                    {pending ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                        >
                                                            <Send className="mr-1 h-3.5 w-3.5" />
                                                            Proposal Pending
                                                        </Button>
                                                    ) : longTermLocked ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                            title="A long-term partnership is already active — no new proposals while it remains valid"
                                                        >
                                                            <Send className="mr-1 h-3.5 w-3.5" />
                                                            Partnered
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                openPropose(
                                                                    g.orgId
                                                                )
                                                            }
                                                        >
                                                            <Send className="mr-1 h-3.5 w-3.5" />
                                                            Propose
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* All routes for one logistics org (paginated) */}
            <Dialog
                open={routesOpenFor !== null}
                onOpenChange={(v) => {
                    if (!v) setRoutesOpenFor(null);
                }}
            >
                <DialogContent className="md:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Routes ·{' '}
                            {routesDialogGroup
                                ? orgDisplayName(
                                      routesDialogGroup.orgId,
                                      routesDialogGroup.routes[0]
                                          ?.logisticsOrgName
                                  )
                                : '—'}
                        </DialogTitle>
                        <DialogDescription>
                            All available routing capacities for this partner.
                            Propose from any route.
                        </DialogDescription>
                    </DialogHeader>
                    {routesDialogGroup && (
                        <div className="grid gap-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lane</TableHead>
                                            <TableHead>Equipment</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>
                                                Available / Booked
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Action
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {routesDialogRows.map((r) => (
                                            <TableRow key={r.forecastId}>
                                                <TableCell className="text-xs">
                                                    {r.originLane ?? '—'} →{' '}
                                                    {r.destinationLane ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {r.equipmentType ??
                                                            '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {r.periodStart ?? '—'} →{' '}
                                                    {r.periodEnd ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {r.availableCapacity ??
                                                        0}{' '}
                                                    {capacityUnitLabel(
                                                        r.capacityUnit
                                                    )}{' '}
                                                    / {r.bookedCapacity ?? 0}
                                                    {formatUnitSpecs(r) && (
                                                        <span className="block text-muted-foreground">
                                                            {formatUnitSpecs(r)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {pendingOrgIds.has(
                                                        routesDialogGroup.orgId
                                                    ) ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                        >
                                                            Pending
                                                        </Button>
                                                    ) : partnerTermByOrg.get(
                                                          routesDialogGroup.orgId
                                                      ) === 'LONG_TERM' ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                            title="A long-term partnership is already active"
                                                        >
                                                            Partnered
                                                        </Button>
                                                    ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    openPropose(
                                                                        routesDialogGroup.orgId,
                                                                        r.forecastId
                                                                    )
                                                                }
                                                            >
                                                                Propose
                                                            </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-between">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={routesPage <= 0}
                                    onClick={() =>
                                        setRoutesPage((p) => Math.max(0, p - 1))
                                    }
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {routesPage + 1} of{' '}
                                    {routesDialogPages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                        routesPage + 1 >= routesDialogPages
                                    }
                                    onClick={() =>
                                        setRoutesPage((p) =>
                                            Math.min(
                                                routesDialogPages - 1,
                                                p + 1
                                            )
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Partnership proposal */}
            <Dialog
                open={proposingOrg !== null}
                onOpenChange={(v) => {
                    if (!v) setProposingOrg(null);
                }}
            >
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Propose partnership ·{' '}
                            {proposingGroup
                                ? orgDisplayName(
                                      proposingGroup.orgId,
                                      proposingGroup.routes[0]?.logisticsOrgName
                                  )
                                : '—'}
                        </DialogTitle>
                        <DialogDescription>
                            Short-term proposals pick a published route with
                            fixed dates. Long-term proposals let you define
                            the routes, capacity and dates you want.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Partnership term</Label>
                            <Select
                                value={termType}
                                onValueChange={(v) =>
                                    setTermType(
                                        v as 'SHORT_TERM' | 'LONG_TERM'
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SHORT_TERM">
                                        Short-term — pick a published route,
                                        dates fixed
                                    </SelectItem>
                                    <SelectItem value="LONG_TERM">
                                        Long-term — define your own routes,
                                        capacity and dates
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {termType === 'SHORT_TERM' ? (
                            <>
                                <div className="grid gap-2">
                                    <Label>Route</Label>
                                    <Select
                                        value={selectedForecastId}
                                        onValueChange={(v) => {
                                            setSelectedForecastId(v);
                                            const r =
                                                proposingGroup?.routes.find(
                                                    (x) =>
                                                        String(x.forecastId) ===
                                                        v
                                                );
                                            setValidityStart(
                                                r?.periodStart ?? ''
                                            );
                                            setValidityEnd(r?.periodEnd ?? '');
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a route" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proposingGroup?.routes.map((r) => (
                                                <SelectItem
                                                    key={r.forecastId}
                                                    value={String(r.forecastId)}
                                                >
                                                    {r.originLane ?? '—'} →{' '}
                                                    {r.destinationLane ?? '—'}{' '}
                                                    · {r.periodStart ?? '—'} →{' '}
                                                    {r.periodEnd ?? '—'} ·{' '}
                                                    {r.availableCapacity ?? 0}{' '}
                                                    {capacityUnitLabel(
                                                        r.capacityUnit
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-2">
                                        <Label>Validity start (fixed)</Label>
                                        <Input
                                            value={validityStart}
                                            disabled
                                            readOnly
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Validity end (fixed)</Label>
                                        <Input
                                            value={validityEnd}
                                            disabled
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Dates follow the selected route&apos;s
                                    capacity period and cannot be changed for
                                    short-term proposals.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Wanted routes</Label>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setWantedRoutes((prev) => [
                                                    ...prev,
                                                    {
                                                        from: '',
                                                        to: '',
                                                        capacity: '',
                                                    },
                                                ])
                                            }
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                            Add route
                                        </Button>
                                    </div>
                                    {wantedRoutes.map((wr, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"
                                        >
                                            <div className="grid gap-1">
                                                <Label>From</Label>
                                                <Input
                                                    placeholder="e.g. Mumbai"
                                                    value={wr.from}
                                                    onChange={(e) =>
                                                        setWantedRoutes(
                                                            (prev) =>
                                                                prev.map(
                                                                    (x, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...x,
                                                                                  from: e
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
                                                <Label>To</Label>
                                                <Input
                                                    placeholder="e.g. Pune"
                                                    value={wr.to}
                                                    onChange={(e) =>
                                                        setWantedRoutes(
                                                            (prev) =>
                                                                prev.map(
                                                                    (x, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...x,
                                                                                  to: e
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
                                                <Label>Capacity</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 40"
                                                    value={wr.capacity}
                                                    onChange={(e) =>
                                                        setWantedRoutes(
                                                            (prev) =>
                                                                prev.map(
                                                                    (x, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...x,
                                                                                  capacity:
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
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                disabled={
                                                    wantedRoutes.length <= 1
                                                }
                                                onClick={() =>
                                                    setWantedRoutes((prev) =>
                                                        prev.filter(
                                                            (_, i) => i !== idx
                                                        )
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="grid gap-2">
                                        <Label>Capacity unit</Label>
                                        <Select
                                            value={wantedUnit}
                                            onValueChange={setWantedUnit}
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
                                    <div className="grid gap-2">
                                        <Label>Validity start</Label>
                                        <Input
                                            type="date"
                                            value={validityStart}
                                            onChange={(e) =>
                                                setValidityStart(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Validity end</Label>
                                        <Input
                                            type="date"
                                            value={validityEnd}
                                            onChange={(e) =>
                                                setValidityEnd(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="grid gap-2">
                            <Label>Proposed terms (optional)</Label>
                            <Textarea
                                value={proposedTerms}
                                onChange={(e) =>
                                    setProposedTerms(e.target.value)
                                }
                                placeholder="e.g. Weekly pickup, SLA 98% OTIF"
                            />
                        </div>
                        <Button
                            onClick={submitProposal}
                            disabled={submitting}
                        >
                            {submitting ? 'Sending…' : 'Send Proposal'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
