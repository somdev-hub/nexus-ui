'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconEye,
    IconFileText,
    IconX,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables } from '@/hooks/use-tables';
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
const ACTIONABLE = new Set([
    'PENDING_APPROVAL',
    'PENDING_SUPPLIER_APPROVAL',
    'PENDING_LOGISTICS_APPROVAL',
    'ACTIVE',
]);

export default function SupplierContractsPage() {
    const { name } = useUserMetadata();
    const [contracts, setContracts] = useState<SupplierContract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<{
        action: 'approve' | 'reject' | 'amendments';
        contract: SupplierContract;
    } | null>(null);
    const [comments, setComments] = useState('');

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await getSupplierContractsForSupplier(0, 100);
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

    const refreshContract = (updated: SupplierContract) => {
        setContracts((prev) =>
            prev.map((c) => (c.contractId === updated.contractId ? updated : c))
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
            toast.error(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setBusy(false);
            setConfirm(null);
            setComments('');
        }
    };

    const supplierStatusOf = (c: SupplierContract): SupplierDecisionStatus =>
        c.supplierStatus ?? 'PENDING';

    const columns: ColumnDef<SupplierContract>[] = [
        {
            accessorKey: 'contractNumber',
            header: 'Number',
            cell: ({ row }) => (
                <div className="font-mono">{row.original.contractNumber}</div>
            ),
        },
        {
            accessorKey: 'contractName',
            header: 'Name',
            cell: ({ row }) => (
                <div className="max-w-xs truncate">
                    {row.original.contractName}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.status}</Badge>
            ),
        },
        {
            id: 'supplierDecision',
            header: 'Your Decision',
            cell: ({ row }) => (
                <Badge
                    variant={
                        supplierStatusOf(row.original) === 'APPROVED'
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {SUPPLIER_STATUS_LABEL[supplierStatusOf(row.original)] ??
                        supplierStatusOf(row.original)}
                </Badge>
            ),
        },
        {
            id: 'effectiveDate',
            header: 'Effective',
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    {row.original.effectiveDate
                        ? new Date(
                              row.original.effectiveDate
                          ).toLocaleDateString()
                        : '—'}
                </div>
            ),
        },
        {
            id: 'expiryDate',
            header: 'Expiry',
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    {row.original.expiryDate
                        ? new Date(row.original.expiryDate).toLocaleDateString()
                        : '—'}
                </div>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                            >
                                <IconDotsVertical />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-40"
                        >
                            <DropdownMenuItem asChild>
                                <Link href={`/supplier/contracts/${c.contractId}`}>
                                    <IconEye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </DropdownMenuItem>
                            {ACTIONABLE.has(c.status) &&
                                supplierStatusOf(c) !== 'APPROVED' &&
                                supplierStatusOf(c) !== 'REJECTED' && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setConfirm({
                                                    action: 'approve',
                                                    contract: c,
                                                })
                                            }
                                        >
                                            <IconCircleCheckFilled className="mr-2 h-4 w-4" />
                                            Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() =>
                                                setConfirm({
                                                    action: 'reject',
                                                    contract: c,
                                                })
                                            }
                                        >
                                            <IconX className="mr-2 h-4 w-4" />
                                            Reject
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setConfirm({
                                                    action: 'amendments',
                                                    contract: c,
                                                })
                                            }
                                        >
                                            <IconFileText className="mr-2 h-4 w-4" />
                                            Amendments
                                        </DropdownMenuItem>
                                    </>
                                )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
    const table = useTables<SupplierContract>({
        data: contracts,
        columns,
        getRowId: (row) => String(row.contractId),
    });

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
                            <CentralizedDataTable
                                table={table}
                                emptyMessage="No contracts shared with you yet."
                            />
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
                                onChange={(e) => setComments(e.target.value)}
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
