'use client';

import { getPartnerships } from '@/lib/services/partnerships-service';
import {
    getRetailerPendingInvitations,
    getRetailerSentInvitations,
    withdrawRetailerInvitation,
} from '@/lib/services/partnership-invitations-service';
import { PartnershipTable } from '@/components/partnership-table';
import { PartnershipInvitationDialog } from '@/components/partnership-invitation-dialog';
import {
    PartnershipInvitationList,
    invitationIdOf,
} from '@/components/partnership-invitation-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Partnership } from '@/types/partnerships';
import type { PartnershipInvitation } from '@/types/partnership-invitations';

const Page = () => {
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [sent, setSent] = useState<PartnershipInvitation[]>([]);
    const [pending, setPending] = useState<PartnershipInvitation[]>([]);
    const [busyId, setBusyId] = useState<number | null>(null);

    const loadInvitations = async () => {
        try {
            const [sentRes, pendingRes] = await Promise.all([
                getRetailerSentInvitations({ pageNo: 0, pageOffset: 20 }),
                getRetailerPendingInvitations({ pageNo: 0, pageOffset: 20 }),
            ]);
            setSent(sentRes.content ?? []);
            setPending(pendingRes.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to load invitations'
            );
        }
    };

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await getPartnerships({
                    pageNo: 0,
                    pageOffset: 20,
                });
                if (!isActive) return;
                setPartnerships(res.content);
                await loadInvitations();
            } catch (err: unknown) {
                if (!isActive) return;
                toast.error(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load partnerships'
                );
            } finally {
                if (isActive) setIsLoading(false);
            }
        };
        load();
        return () => {
            isActive = false;
        };
    }, []);

    const handleWithdraw = async (inv: PartnershipInvitation) => {
        const id = invitationIdOf(inv);
        setBusyId(id);
        try {
            await withdrawRetailerInvitation(id);
            toast.success('Invitation withdrawn');
            await loadInvitations();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to withdraw'
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
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
                    <div className="w-full space-y-6">
                        <div className="flex justify-between w-full">
                            <h2 className="text-lg font-semibold">
                                Partnerships
                            </h2>
                            <Button onClick={() => setInviteOpen(true)}>
                                <PlusIcon className="size-4" />
                                Create Partnership
                            </Button>
                        </div>
                        <PartnershipTable partnerships={partnerships} />
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sent Invitations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PartnershipInvitationList
                                        invitations={sent}
                                        emptyText="No sent invitations."
                                        onWithdraw={handleWithdraw}
                                        busyId={busyId}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pending Invitations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PartnershipInvitationList
                                        invitations={pending}
                                        emptyText="No pending invitations."
                                        onWithdraw={handleWithdraw}
                                        busyId={busyId}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            <PartnershipInvitationDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                onCreated={loadInvitations}
            />
        </>
    );
};

export default Page;
