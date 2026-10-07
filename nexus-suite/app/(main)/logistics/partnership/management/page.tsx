'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '@/lib/services/logistics-ops-service';
import type { CapacityForecast } from '@/types/logistics-ops';
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

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const [partnershipsRes, receivedRes, dirRes] =
                    await Promise.all([
                        getLogisticsPartnerships(),
                        getLogisticsReceivedInvitations({
                            pageNo: 0,
                            pageOffset: 20,
                        }),
                        getOrganizationDirectory('SUPPLIER').catch(() => []),
                    ]);
                if (!active) return;
                setPartnerships(partnershipsRes.content ?? []);
                setReceived(receivedRes.content ?? []);
                setDirectory(dirRes ?? []);
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEdit(p)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
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
                                <CardTitle>Received Invitations</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <PartnershipInvitationList
                                    invitations={receivedPending}
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
                                    <Button
                                        size="sm"
                                        disabled={
                                            busyId === invitationIdOf(viewing)
                                        }
                                        onClick={() =>
                                            respond(viewing, 'ACCEPT')
                                        }
                                    >
                                        Accept
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
