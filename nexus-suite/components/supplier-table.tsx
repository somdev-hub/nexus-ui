'use client';

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
import type { ColumnDef } from '@tanstack/react-table';
import type { Supplier } from '@/types/suppliers';
import {
    IconDotsVertical,
    IconEdit,
    IconEye,
    IconMapPin,
    IconStar,
    IconTrash,
} from '@tabler/icons-react';

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'INACTIVE':
            return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        case 'PENDING_VERIFICATION':
            return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'SUSPENDED':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        default:
            return '';
    }
};

const columns: ColumnDef<Supplier>[] = [
    {
        accessorKey: 'businessName',
        header: 'Business Name',
        cell: ({ row }) => (
            <div className="font-medium">{row.original.businessName}</div>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
            <Badge variant="outline" className="text-muted-foreground px-1.5">
                {row.original.category}
            </Badge>
        ),
    },
    {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
            <div className="flex items-center gap-1">
                <IconMapPin className="size-3 text-muted-foreground" />
                <span>{row.original.location}</span>
            </div>
        ),
    },
    {
        accessorKey: 'rating',
        header: () => <div className="w-full text-right">Rating</div>,
        cell: ({ row }) => (
            <div className="text-right flex items-center justify-end gap-1">
                <IconStar className="size-4 text-yellow-500 fill-yellow-500" />
                <span className="font-mono">
                    {row.original.rating?.toFixed(1) || '0.0'}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'totalOrders',
        header: () => <div className="w-full text-right">Total Orders</div>,
        cell: ({ row }) => (
            <div className="text-right">{row.original.totalOrders || 0}</div>
        ),
    },
    {
        accessorKey: 'onTimeDeliveryRate',
        header: () => <div className="w-full text-right">On-Time %</div>,
        cell: ({ row }) => (
            <div className="text-right">
                {(row.original.onTimeDeliveryRate || 0).toFixed(1)}%
            </div>
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
                        <a
                            href={`/retailer/partnership/supplier-market/${row.original.supplierId}`}
                        >
                            <IconEye className="mr-2 h-4 w-4" />
                            View Details
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`/retailer/partnership/supplier-market/${row.original.supplierId}`}
                        >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                        <IconTrash className="mr-2 h-4 w-4" />
                        Remove
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export function SupplierTable({
    suppliers,
}: {
    suppliers: Supplier[];
}) {
    const table = useTables<Supplier>({
        data: suppliers,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        pageIndex: 0,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        enablePagination: true,
        enableSorting: true,
        getRowId: (row) => row.supplierId.toString(),
    });

    return (
        <CentralizedDataTable table={table} emptyMessage="No suppliers found." />
    );
}
