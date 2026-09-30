'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { PartnershipInvitation } from '@/types/partnership-invitations';

export function invitationIdOf(inv: PartnershipInvitation): number {
    const raw =
        inv.id ??
        inv.invitationId ??
        (inv as Record<string, unknown>)['invitation-id'];
    return Number(raw);
}

interface PartnershipInvitationListProps {
    invitations: PartnershipInvitation[];
    emptyText?: string;
    onAccept?: (invitation: PartnershipInvitation) => void;
    onReject?: (invitation: PartnershipInvitation) => void;
    onWithdraw?: (invitation: PartnershipInvitation) => void;
    busyId?: number | null;
}

export function PartnershipInvitationList({
    invitations,
    emptyText = 'No invitations found.',
    onAccept,
    onReject,
    onWithdraw,
    busyId = null,
}: PartnershipInvitationListProps) {
    if (invitations.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-4">{emptyText}</p>
        );
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invitations.map((inv) => {
                    const id = invitationIdOf(inv);
                    const invitedRaw = inv.invitedOrg ?? inv.invitedOrgId;
                    const invitingRaw = inv.invitingOrg ?? inv.inviterOrgId;
                    const counterparty =
                        inv.invitedOrgName ??
                        inv.inviterOrgName ??
                        (invitedRaw !== undefined
                            ? `Org ${String(invitedRaw)}`
                            : invitingRaw !== undefined
                              ? `Org ${String(invitingRaw)}`
                              : `Invitation ${String(id)}`);
                    return (
                        <TableRow key={id}>
                            <TableCell>{id}</TableCell>
                            <TableCell>{counterparty}</TableCell>
                            <TableCell>
                                {String(inv.partnershipContext ?? '—')}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {String(inv.status ?? 'PENDING')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {onAccept ? (
                                        <Button
                                            size="sm"
                                            disabled={busyId === id}
                                            onClick={() => onAccept(inv)}
                                        >
                                            Accept
                                        </Button>
                                    ) : null}
                                    {onReject ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busyId === id}
                                            onClick={() => onReject(inv)}
                                        >
                                            Reject
                                        </Button>
                                    ) : null}
                                    {onWithdraw ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busyId === id}
                                            onClick={() => onWithdraw(inv)}
                                        >
                                            Withdraw
                                        </Button>
                                    ) : null}
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default PartnershipInvitationList;
