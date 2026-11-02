'use client';

import * as React from 'react';
import {
    IconDotsVertical,
    IconEdit,
    IconEye,
    IconFileInvoice,
    IconTrash,
} from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';

import {
    PartnershipEditDialog,
    type PartnershipEditValues,
} from '@/components/partnership-edit-dialog';
import {
    getPartnershipById,
    updatePartnership,
    updatePartnershipStatus,
} from '@/lib/services/partnerships-service';
import type { Partnership } from '@/types/partnerships';

const getPartnershipDetailHref = (partnership: Partnership) =>
    partnership.partnershipType === 'LOGISTICS'
        ? `/retailer/partnership/logistic-market/${partnership.partnershipId}`
        : `/retailer/partnership/supplier-market/${partnership.partnershipId}`;

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'PENDING':
            return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'EXPIRED':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'TERMINATED':
            return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        case 'REJECTED':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        default:
            return '';
    }
};

const getPartnershipTypeColor = (type: string) => {
    switch (type) {
        case 'SUPPLIER':
            return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'LOGISTICS':
            return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'DISTRIBUTOR':
            return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        case 'STRATEGIC':
            return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        default:
            return '';
    }
};

const buildColumns = (
    onTerminate: (partnership: Partnership) => void,
    onEdit: (partnership: Partnership) => void
): ColumnDef<Partnership>[] => [
    {
        accessorKey: 'partnershipId',
        header: 'Partnership #',
        cell: ({ row }) => (
            <div className="font-medium">{row.original.partnershipId}</div>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'secondaryOrgName',
        header: 'Partner Org',
        cell: ({ row }) => (
            <div className="font-medium">
                {row.original.secondaryOrgName ??
                    row.original.primaryOrgName ??
                    '—'}
            </div>
        ),
    },
    {
        accessorKey: 'partnershipTerm',
        header: 'Terms',
        cell: ({ row }) => (
            <div className="text-sm text-muted-foreground max-w-50 truncate">
                {row.original.partnershipTerm ?? '—'}
            </div>
        ),
    },
    {
        accessorKey: 'partnershipType',
        header: 'Type',
        cell: ({ row }) => (
            <Badge
                variant="outline"
                className={getPartnershipTypeColor(
                    row.original.partnershipType ?? ''
                )}
            >
                {row.original.partnershipType ?? '—'}
            </Badge>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge
                variant="outline"
                className={getStatusColor(row.original.status)}
            >
                {row.original.status}
            </Badge>
        ),
    },
    {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: ({ row }) =>
            row.original.startDate
                ? new Date(row.original.startDate).toLocaleDateString()
                : '—',
    },
    {
        accessorKey: 'endDate',
        header: 'End Date',
        cell: ({ row }) =>
            row.original.endDate
                ? new Date(row.original.endDate).toLocaleDateString()
                : '—',
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        size="icon"
                    >
                        <IconDotsVertical />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                        <a href={getPartnershipDetailHref(row.original)}>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Details
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(row.original)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {row.original.agreementDocumentId && (
                        <DropdownMenuItem asChild>
                            <a
                                href={row.original.agreementDocumentUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <IconFileInvoice className="mr-2 h-4 w-4" />
                                View Agreement
                            </a>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onTerminate(row.original)}
                    >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Terminate
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export function PartnershipTable({
    partnerships: initialData,
    onPartnershipUpdated,
}: {
    partnerships: Partnership[];
    onPartnershipUpdated?: (partnership: Partnership) => void;
}) {
    const [data, setData] = React.useState(() => initialData);

    const [editing, setEditing] = React.useState<{
        id: number;
        initial: PartnershipEditValues;
    } | null>(null);

    const handleEdit = React.useCallback((partnership: Partnership) => {
        // Prefill from the backend record (row shape lacks term/discount).
        getPartnershipById(partnership.partnershipId)
            .then((detail) => {
                const raw = detail as unknown as Record<string, unknown>;
                setEditing({
                    id: partnership.partnershipId,
                    initial: {
                        partnershipTerm:
                            typeof raw['partnershipTerm'] === 'string'
                                ? (raw['partnershipTerm'] as string)
                                : undefined,
                        discountRate:
                            typeof raw['discountRate'] === 'number'
                                ? (raw['discountRate'] as number)
                                : undefined,
                        endDate:
                            typeof raw['endDate'] === 'string'
                                ? (raw['endDate'] as string)
                                : undefined,
                    },
                });
            })
            .catch(() => {
                // Fall back to a blank form rather than blocking the edit.
                toast.error('Could not load current terms — editing blank');
                setEditing({ id: partnership.partnershipId, initial: {} });
            });
    }, []);

    const [terminating, setTerminating] = React.useState<Partnership | null>(
        null
    );

    const handleTerminate = React.useCallback(async () => {
        if (!terminating) return;
        try {
            const updated = await updatePartnershipStatus(
                terminating.partnershipId,
                { status: 'TERMINATED' }
            );
            setData((prev) =>
                prev.map((p) =>
                    p.partnershipId === terminating.partnershipId ? updated : p
                )
            );
            onPartnershipUpdated?.(updated);
            toast.success('Partnership terminated');
        } catch (error) {
            console.error('Failed to terminate partnership:', error);
            toast.error('Failed to terminate partnership');
        } finally {
            setTerminating(null);
        }
    }, [terminating, onPartnershipUpdated]);

    const requestTerminate = React.useCallback((partnership: Partnership) => {
        setTerminating(partnership);
    }, []);

    const columns = React.useMemo(
        () => buildColumns(requestTerminate, handleEdit),
        [requestTerminate, handleEdit]
    );

    const visibleData = React.useMemo(
        () => data.filter((p) => p.status !== 'TERMINATED'),
        [data]
    );

    const table = useTables<Partnership>({
        data: visibleData,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        getRowId: (row) => row.partnershipId.toString(),
    });

    return (
        <div className="w-full">
            <CentralizedDataTable
                table={table}
                emptyMessage="No partnerships found."
            />
            <PartnershipEditDialog
                open={editing !== null}
                onOpenChange={(v) => {
                    if (!v) setEditing(null);
                }}
                initial={editing?.initial}
                onSave={async (values) => {
                    if (!editing) return;
                    await updatePartnership(editing.id, {
                        termsAndConditions: values.partnershipTerm,
                        discountRate: values.discountRate,
                        endDate: values.endDate,
                    });
                    // Patch the visible end-date cell; terms live on detail.
                    if (values.endDate !== undefined) {
                        setData((prev) =>
                            prev.map((p) =>
                                p.partnershipId === editing.id
                                    ? {
                                          ...p,
                                          endDate: values.endDate as string,
                                      }
                                    : p
                            )
                        );
                    }
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
        </div>
    );
}
