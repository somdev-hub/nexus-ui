'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    PartnershipInvitationList,
    invitationIdOf,
} from '@/components/partnership-invitation-list';
import {
    getLogisticsPendingInvitations,
    getLogisticsReceivedInvitations,
    respondToLogisticsInvitation,
} from '@/lib/services/partnership-invitations-service';
import { updatePartnershipStatus } from '@/lib/services/partnerships-service';
import type { PartnershipInvitation } from '@/types/partnership-invitations';

async function advancePartnershipIfDraft(result: PartnershipInvitation) {
    try {
        const record = result as Record<string, unknown>;
        const partnership = record['partnership'] as Record<
            string,
            unknown
        > | null;
        const status = String(
            partnership?.['status'] ?? record['status'] ?? ''
        ).toUpperCase();
        const partnershipId = Number(
            partnership?.['partnershipId'] ?? record['partnershipId'] ?? NaN
        );
        if (
            (status === 'DRAFT' || status === 'PENDING') &&
            Number.isFinite(partnershipId)
        ) {
            await updatePartnershipStatus(partnershipId, {
                status: 'ACTIVE',
            });
        }
    } catch {
        // Best-effort activation; ignore failures so accept still succeeds.
    }
}

export default function LogisticsPartnershipInboxPage() {
    const [received, setReceived] = useState<PartnershipInvitation[]>([]);
    const [pending, setPending] = useState<PartnershipInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = async () => {
        setIsLoading(true);
        try {
            const [receivedRes, pendingRes] = await Promise.all([
                getLogisticsReceivedInvitations({ pageNo: 0, pageOffset: 20 }),
                getLogisticsPendingInvitations({ pageNo: 0, pageOffset: 20 }),
            ]);
            setReceived(receivedRes.content ?? []);
            setPending(pendingRes.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to load inbox'
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const respond = async (
        inv: PartnershipInvitation,
        action: 'ACCEPT' | 'REJECT'
    ) => {
        const id = invitationIdOf(inv);
        setBusyId(id);
        try {
            const result = await respondToLogisticsInvitation(id, { action });
            if (action === 'ACCEPT') {
                await advancePartnershipIfDraft(result);
            }
            toast.success(
                action === 'ACCEPT'
                    ? 'Invitation accepted'
                    : 'Invitation rejected'
            );
            await load();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to respond'
            );
        } finally {
            setBusyId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
                <div className="w-full space-y-6">
                    <h2 className="text-lg font-semibold">Partnership Inbox</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Received</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PartnershipInvitationList
                                    invitations={received}
                                    emptyText="No received invitations."
                                    onAccept={(inv) => respond(inv, 'ACCEPT')}
                                    onReject={(inv) => respond(inv, 'REJECT')}
                                    busyId={busyId}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PartnershipInvitationList
                                    invitations={pending}
                                    emptyText="No pending invitations."
                                    onAccept={(inv) => respond(inv, 'ACCEPT')}
                                    onReject={(inv) => respond(inv, 'REJECT')}
                                    busyId={busyId}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
