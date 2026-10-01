'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
    counterpartyOf,
    getLogisticsPartnerships,
    type OrgPartnership,
} from '@/lib/services/org-partnerships-service';
import {
    getLogisticsReceivedInvitations,
    respondToLogisticsInvitation,
} from '@/lib/services/partnership-invitations-service';
import {
    PartnershipInvitationList,
    invitationIdOf,
    isInvitationPending,
} from '@/components/partnership-invitation-list';
import type { PartnershipInvitation } from '@/types/partnership-invitations';
import { useUserMetadata } from '@/hooks/use-user-metadata';

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

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const [partnershipsRes, receivedRes] = await Promise.all([
                    getLogisticsPartnerships(),
                    getLogisticsReceivedInvitations({
                        pageNo: 0,
                        pageOffset: 20,
                    }),
                ]);
                if (!active) return;
                setPartnerships(partnershipsRes.content ?? []);
                setReceived(receivedRes.content ?? []);
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
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                My Partnerships ({partnerships.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {partnerships.length === 0 ? (
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
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {partnerships.map((p) => (
                                            <TableRow key={p.partnershipId}>
                                                <TableCell>
                                                    {p.partnershipId}
                                                </TableCell>
                                                <TableCell>
                                                    Org{' '}
                                                    {counterpartyOf(p, orgId) ??
                                                        '—'}
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
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Received Invitations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PartnershipInvitationList
                                    invitations={receivedPending}
                                    emptyText="No received invitations."
                                    onAccept={(inv) => respond(inv, 'ACCEPT')}
                                    onReject={(inv) => respond(inv, 'REJECT')}
                                    busyId={busyId}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Invitation History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PartnershipInvitationList
                                    invitations={receivedHistory}
                                    emptyText="No accepted or rejected invitations yet."
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
