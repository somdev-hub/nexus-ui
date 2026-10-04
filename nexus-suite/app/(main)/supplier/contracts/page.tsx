'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import type {
    SupplierContract,
    SupplierDecisionStatus,
} from '@/types/supplier-contracts';
import {
    approveSupplierContractAsSupplier,
    getSupplierContractsForSupplier,
    rejectSupplierContractAsSupplier,
    requestContractAmendmentsAsSupplier,
} from '@/lib/services/supplier-contracts-supplier-service';

const SUPPLIER_STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pending Your Decision',
    APPROVED: 'Approved by You',
    REJECTED: 'Rejected by You',
    AMENDMENTS_REQUESTED: 'Amendments Requested',
};

// Contracts the supplier can act on: shared with them and not dead.
const ACTIONABLE = new Set(['PENDING_APPROVAL', 'ACTIVE']);

export default function SupplierContractsPage() {
    const router = useRouter();
    const { name } = useUserMetadata();
    const [contracts, setContracts] = useState<SupplierContract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<
        { action: 'approve' | 'reject' | 'amendments'; contract: SupplierContract } | null
    >(null);
    const [comments, setComments] = useState('');

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await getSupplierContractsForSupplier(0, 50);
            setContracts(res.content ?? []);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to load contracts'
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openDetail = (c: SupplierContract) => {
        router.push(`/supplier/contracts/${c.contractId}`);
    };

    const refreshContract = (updated: SupplierContract) => {
        setContracts((prev) =>
            prev.map((c) =>
                c.contractId === updated.contractId ? updated : c
            )
        );
    };

    const handleConfirm = async () => {
        if (!confirm || busy) return;
        const { action, contract } = confirm;
        if (action !== 'approve' && !comments.trim()) {
            toast.error('Please add comments');
            return;
        }
        setBusy(true);
        try {
            const decidedBy = name || undefined;
            const updated =
                action === 'approve'
                    ? await approveSupplierContractAsSupplier(
                          contract.contractId,
                          decidedBy
                      )
                    : action === 'reject'
                      ? await rejectSupplierContractAsSupplier(
                            contract.contractId,
                            comments.trim(),
                            decidedBy
                        )
                      : await requestContractAmendmentsAsSupplier(
                            contract.contractId,
                            comments.trim(),
                            decidedBy
                        );
            refreshContract(updated);
            toast.success(
                action === 'approve'
                    ? 'Contract approved'
                    : action === 'reject'
                      ? 'Contract rejected'
                      : 'Amendments requested'
            );
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Action failed'
            );
        } finally {
            setBusy(false);
            setConfirm(null);
            setComments('');
        }
    };

    const supplierStatusOf = (
        c: SupplierContract
    ): SupplierDecisionStatus => c.supplierStatus ?? 'PENDING';

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
                    <h2 className="text-lg font-semibold">
                        Contracts ({contracts.length})
                    </h2>
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>Shared With Me</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {contracts.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">
                                    No contracts shared with you yet.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>
                                                Your Decision
                                            </TableHead>
                                            <TableHead>Effective</TableHead>
                                            <TableHead>Expiry</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contracts.map((c) => (
                                            <TableRow key={c.contractId}>
                                                <TableCell className="font-mono">
                                                    {c.contractNumber}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {c.contractName}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {c.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            supplierStatusOf(
                                                                c
                                                            ) === 'APPROVED'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {SUPPLIER_STATUS_LABEL[
                                                            supplierStatusOf(c)
                                                        ] ?? supplierStatusOf(c)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {c.effectiveDate
                                                        ? new Date(
                                                              c.effectiveDate
                                                          ).toLocaleDateString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {c.expiryDate
                                                        ? new Date(
                                                              c.expiryDate
                                                          ).toLocaleDateString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                openDetail(c)
                                                            }
                                                        >
                                                            View
                                                        </Button>
                                                        {ACTIONABLE.has(
                                                            c.status
                                                        ) &&
                                                            supplierStatusOf(
                                                                c
                                                            ) !==
                                                                'APPROVED' &&
                                                            supplierStatusOf(
                                                                c
                                                            ) !==
                                                                'REJECTED' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            setConfirm(
                                                                                {
                                                                                    action: 'approve',
                                                                                    contract:
                                                                                        c,
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            setConfirm(
                                                                                {
                                                                                    action: 'reject',
                                                                                    contract:
                                                                                        c,
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            setConfirm(
                                                                                {
                                                                                    action: 'amendments',
                                                                                    contract:
                                                                                        c,
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        Amendments
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
                </div>
            </div>

            <AlertDialog
                open={confirm !== null}
                onOpenChange={(v) => {
                    if (!v) {
                        setConfirm(null);
                        setComments('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm?.action === 'approve'
                                ? 'Approve contract?'
                                : confirm?.action === 'reject'
                                  ? 'Reject contract?'
                                  : 'Request amendments?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm?.action === 'approve'
                                ? `Approve contract ${confirm?.contract.contractNumber}?`
                                : confirm?.action === 'reject'
                                  ? `Reject contract ${confirm?.contract.contractNumber}? Your comments will be shared with the retailer.`
                                  : `Ask the retailer to amend contract ${confirm?.contract.contractNumber}? Describe what needs to change.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {confirm?.action !== 'approve' && (
                        <div className="grid gap-2">
                            <Label htmlFor="supplier-comments">
                                Comments *
                            </Label>
                            <Textarea
                                id="supplier-comments"
                                value={comments}
                                onChange={(e) =>
                                    setComments(e.target.value)
                                }
                                placeholder={
                                    confirm?.action === 'reject'
                                        ? 'e.g. Pricing not acceptable'
                                        : 'e.g. Please extend the payment terms to 45 days'
                                }
                                rows={3}
                            />
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={busy}
                        >
                            {busy
                                ? 'Saving…'
                                : confirm?.action === 'approve'
                                  ? 'Approve'
                                  : confirm?.action === 'reject'
                                    ? 'Reject'
                                    : 'Send Request'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
