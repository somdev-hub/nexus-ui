'use client';

import {
    PartnershipInvitationList,
    invitationIdOf,
    isInvitationPending,
} from '@/components/partnership-invitation-list';
import {
    PartnershipEditDialog,
    type PartnershipEditValues,
} from '@/components/partnership-edit-dialog';
import { Badge } from '@/components/ui/badge';
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
import { useUserMetadata } from '@/hooks/use-user-metadata';
import {
    counterpartyLabelOf,
    getSupplierPartnerships,
    updateSupplierPartnership,
    updateSupplierPartnershipStatus,
    type OrgPartnership,
} from '@/lib/services/org-partnerships-service';
import {
    getSupplierReceivedInvitations,
    respondToSupplierInvitation,
} from '@/lib/services/partnership-invitations-service';
import {
    getSupplierLogisticsPartnerships,
    getSupplierQuotations,
    respondToLogisticsQuotation,
    terminateLogisticsPartnership,
    type LogisticsPartnershipQuotation,
    type SupplierLogisticsPartnership,
} from '@/lib/services/supplier-logistics-service';
import { capacityUnitLabel } from '@/lib/services/logistics-ops-service';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    getOrganizationDirectory,
    type SupplierDirectoryEntry,
} from '@/lib/services/supplier-market-service';
import type { PartnershipInvitation } from '@/types/partnership-invitations';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}

export default function SupplierPartnershipsPage() {
    const { orgId } = useUserMetadata();
    const [partnerships, setPartnerships] = useState<OrgPartnership[]>([]);
    const [received, setReceived] = useState<PartnershipInvitation[]>([]);
    const [logisticsPartnerships, setLogisticsPartnerships] = useState<
        SupplierLogisticsPartnership[]
    >([]);
    const [logisticsDir, setLogisticsDir] = useState<SupplierDirectoryEntry[]>(
        []
    );
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [quotations, setQuotations] = useState<
        LogisticsPartnershipQuotation[]
    >([]);
    const [quoteViewing, setQuoteViewing] =
        useState<LogisticsPartnershipQuotation | null>(null);
    const [confirmTerminate, setConfirmTerminate] = useState<number | null>(
        null
    );
    const [editing, setEditing] = useState<{
        id: number;
        initial: PartnershipEditValues;
    } | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const [partnershipsRes, receivedRes, logisticsRes, dirRes, quotesRes] =
                    await Promise.all([
                        getSupplierPartnerships(),
                        getSupplierReceivedInvitations({
                            pageNo: 0,
                            pageOffset: 20,
                        }),
                        getSupplierLogisticsPartnerships().catch(() => null),
                        getOrganizationDirectory('LOGISTICS').catch(() => []),
                        getSupplierQuotations().catch(() => null),
                    ]);
                if (!active) return;
                setPartnerships(partnershipsRes.content ?? []);
                setReceived(receivedRes.content ?? []);
                setLogisticsPartnerships(logisticsRes?.content ?? []);
                setLogisticsDir(dirRes ?? []);
                setQuotations(quotesRes?.content ?? []);
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
            await respondToSupplierInvitation(id, { action });
            toast.success(
                action === 'ACCEPT'
                    ? 'Invitation accepted'
                    : 'Invitation rejected'
            );
            const [partnershipsRes, receivedRes, logisticsRes, quotesRes] = await Promise.all([
                getSupplierPartnerships(),
                getSupplierReceivedInvitations({ pageNo: 0, pageOffset: 20 }),
                getSupplierLogisticsPartnerships().catch(() => null),
                getSupplierQuotations().catch(() => null),
            ]);
            setPartnerships(partnershipsRes.content ?? []);
            setReceived(receivedRes.content ?? []);
            if (logisticsRes) setLogisticsPartnerships(logisticsRes.content ?? []);
            if (quotesRes) setQuotations(quotesRes.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to respond'
            );
        } finally {
            setBusyId(null);
        }
    };

    const respondQuotation = async (
        q: LogisticsPartnershipQuotation,
        action: 'ACCEPT' | 'REJECT'
    ) => {
        setBusyId(q.quotationId);
        try {
            await respondToLogisticsQuotation(q.quotationId, action);
            toast.success(
                action === 'ACCEPT'
                    ? 'Quotation accepted — logistics will now publish the agreed routes'
                    : 'Quotation rejected'
            );
            setQuoteViewing(null);
            const quotesRes = await getSupplierQuotations().catch(() => null);
            if (quotesRes) setQuotations(quotesRes.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to respond'
            );
        } finally {
            setBusyId(null);
        }
    };

    const terminate = async (p: SupplierLogisticsPartnership) => {
        setBusyId(p.partnershipId);
        try {
            await terminateLogisticsPartnership(p.partnershipId);
            toast.success('Partnership terminated');
            setConfirmTerminate(null);
            const logisticsRes = await getSupplierLogisticsPartnerships().catch(
                () => null
            );
            if (logisticsRes)
                setLogisticsPartnerships(logisticsRes.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Termination failed'
            );
        } finally {
            setBusyId(null);
        }
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

    const receivedPending = received.filter(isInvitationPending);
    const receivedHistory = received.filter((inv) => !isInvitationPending(inv));

    // Supplier-logistics partnerships live in their own card below; keep
    // them out of the general retailer-facing table.
    const isLogisticsRow = (p: OrgPartnership) =>
        String(
            (p as unknown as Record<string, unknown>).partnershipType ?? ''
        ).toUpperCase() === 'LOGISTICS';
    const nonLogistics = partnerships.filter((p) => !isLogisticsRow(p));

    const activePartnerships = nonLogistics.filter(
        (p) => p.status !== 'TERMINATED'
    );
    const closedPartnerships = nonLogistics.filter(
        (p) => p.status === 'TERMINATED'
    );

    const logisticsDirNameOf = (id?: number | null): string | undefined => {
        if (id === undefined || id === null) return undefined;
        const text = String(
            logisticsDir.find((d) => Number(d.id) === Number(id))?.orgName ?? ''
        ).trim();
        return text ? text : undefined;
    };

    const logisticsPartnerName = (
        p: SupplierLogisticsPartnership
    ): string => {
        const own = Number(orgId);
        const counterparty =
            Number.isFinite(own) && Number(p.primaryOrgId) === own
                ? p.secondaryOrgId
                : Number.isFinite(own) && Number(p.secondaryOrgId) === own
                  ? p.primaryOrgId
                  : (p.secondaryOrgId ?? p.primaryOrgId);
        const core = String(
            (Number.isFinite(own) && Number(p.primaryOrgId) === own
                ? p.secondaryOrgName
                : Number.isFinite(own) && Number(p.secondaryOrgId) === own
                  ? p.primaryOrgName
                  : (p.secondaryOrgName ?? p.primaryOrgName)) ?? ''
        ).trim();
        return (
            logisticsDirNameOf(counterparty) ??
            (core ? core : undefined) ??
            (counterparty ? `Org #${counterparty}` : '—')
        );
    };

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
        const updated = await updateSupplierPartnership(editing.id, values);
        setPartnerships((prev) =>
            prev.map((p) =>
                p.partnershipId === editing.id ? { ...p, ...updated } : p
            )
        );
    };

    const [terminating, setTerminating] = useState<OrgPartnership | null>(
        null
    );

    const handleTerminate = async () => {
        if (!terminating) return;
        const p = terminating;
        setBusyId(p.partnershipId);
        try {
            const updated = await updateSupplierPartnershipStatus(
                p.partnershipId,
                'TERMINATED'
            );
            setPartnerships((prev) =>
                prev.map((x) =>
                    x.partnershipId === p.partnershipId
                        ? { ...x, ...updated, status: updated.status || 'TERMINATED' }
                        : x
                )
            );
            toast.success('Partnership terminated');
        } catch (err: unknown) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to terminate partnership'
            );
        } finally {
            setBusyId(null);
            setTerminating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-75 w-full" />
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
                                                    {counterpartyLabelOf(
                                                        p,
                                                        orgId
                                                    )}
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
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={
                                                                busyId === p.partnershipId ||
                                                                p.status === 'TERMINATED'
                                                            }
                                                            onClick={() =>
                                                                openEdit(p)
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={
                                                                busyId === p.partnershipId ||
                                                                p.status === 'TERMINATED'
                                                            }
                                                            onClick={() =>
                                                                setTerminating(p)
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
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>
                                My Logistics Partnerships (
                                {logisticsPartnerships.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {logisticsPartnerships.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">
                                    No logistics partnerships yet. Propose one
                                    from the logistics marketplace.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Partner</TableHead>
                                            <TableHead>Term</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Validity</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logisticsPartnerships.map((p) => (
                                            <TableRow
                                                key={p.partnershipId}
                                            >
                                                <TableCell>
                                                    {p.partnershipId}
                                                </TableCell>
                                                <TableCell>
                                                    {logisticsPartnerName(p)}
                                                </TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const term = String(
                                                            p.partnershipTermType ??
                                                                ''
                                                        ).toUpperCase();
                                                        if (
                                                            term ===
                                                            'LONG_TERM'
                                                        )
                                                            return (
                                                                <Badge>
                                                                    Long-term
                                                                </Badge>
                                                            );
                                                        if (
                                                            term ===
                                                            'SHORT_TERM'
                                                        )
                                                            return (
                                                                <Badge variant="secondary">
                                                                    Short-term
                                                                </Badge>
                                                            );
                                                        return (
                                                            <Badge variant="outline">
                                                                —
                                                            </Badge>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {p.status || '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {(p.validityStart as string) ??
                                                        '—'}{' '}
                                                    →{' '}
                                                    {(p.validityEnd as string) ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {p.status ===
                                                    'TERMINATED' ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    ) : confirmTerminate ===
                                                      p.partnershipId ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setConfirmTerminate(
                                                                        null
                                                                    )
                                                                }
                                                            >
                                                                Keep
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={
                                                                    busyId ===
                                                                    p.partnershipId
                                                                }
                                                                onClick={() =>
                                                                    terminate(
                                                                        p
                                                                    )
                                                                }
                                                            >
                                                                Confirm?
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setConfirmTerminate(
                                                                    p.partnershipId
                                                                )
                                                            }
                                                        >
                                                            Terminate
                                                        </Button>
                                                    )}
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
                            <CardTitle>
                                Logistics Quotations ({quotations.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {quotations.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">
                                    No quotations from logistics partners yet.
                                    They appear here when a partner answers
                                    your long-term proposal with their own
                                    terms.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Quote</TableHead>
                                            <TableHead>Partner</TableHead>
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
                                                    {q.logisticsOrgName ??
                                                        (q.logisticsOrgId
                                                            ? `Org #${q.logisticsOrgId}`
                                                            : '—')}
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
                                                            'SUBMITTED' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={
                                                                        busyId ===
                                                                        q.quotationId
                                                                    }
                                                                    onClick={() =>
                                                                        respondQuotation(
                                                                            q,
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
                                                                        q.quotationId
                                                                    }
                                                                    onClick={() =>
                                                                        respondQuotation(
                                                                            q,
                                                                            'ACCEPT'
                                                                        )
                                                                    }
                                                                >
                                                                    Accept
                                                                </Button>
                                                            </>
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
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle>Received Invitations</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <PartnershipInvitationList
                                    invitations={receivedPending}
                                    emptyText="No received invitations."
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
                        <CardContent className="p-0 space-y-4">
                            {closedPartnerships.length > 0 && (
                                <Table>
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
                                                    {counterpartyLabelOf(p, orgId)}
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
            <AlertDialog
                open={terminating !== null}
                onOpenChange={(v) => !v && setTerminating(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Terminate partnership?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to terminate partnership #
                            {terminating?.partnershipId}? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleTerminate}>
                            Terminate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
                                {parseQuoteLines(quoteViewing).map((l, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                    >
                                        <span className="font-medium">
                                            {String(
                                                l.fromLane ?? l.from ?? '—'
                                            )}{' '}
                                            →{' '}
                                            {String(l.toLane ?? l.to ?? '—')}
                                        </span>
                                        <span className="font-mono text-xs">
                                            {(l.capacity as number) ?? '—'}{' '}
                                            {capacityUnitLabel(
                                                String(
                                                    l.capacityUnit ?? ''
                                                ) || undefined
                                            )}
                                            {l.unitPrice !== undefined &&
                                            l.unitPrice !== null
                                                ? ` @ ${l.unitPrice} ${String(l.currency ?? '')}`
                                                : ''}
                                        </span>
                                    </div>
                                ))}
                                {parseQuoteLines(quoteViewing).length ===
                                    0 && (
                                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                        No route lines.
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">Terms</p>
                                <p className="text-sm text-muted-foreground">
                                    {quoteViewing.terms || '—'}
                                </p>
                            </div>
                            {quoteViewing.status === 'SUBMITTED' && (
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                            busyId === quoteViewing.quotationId
                                        }
                                        onClick={() =>
                                            respondQuotation(
                                                quoteViewing,
                                                'REJECT'
                                            )
                                        }
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={
                                            busyId === quoteViewing.quotationId
                                        }
                                        onClick={() =>
                                            respondQuotation(
                                                quoteViewing,
                                                'ACCEPT'
                                            )
                                        }
                                    >
                                        Accept
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
