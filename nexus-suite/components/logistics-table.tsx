'use client';

import * as React from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type Row,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import {
    IconChevronDown,
    IconChevronUp,
    IconCircleCheckFilled,
    IconDotsVertical,
    IconLayoutColumns,
    IconLoader,
    IconPlus,
    IconTrendingUp,
    IconEye,
    IconEdit,
    IconTrash,
    IconBuildingStore,
    IconMapPin,
    IconStar,
    IconTruck,
    IconAward,
    IconRoute,
    IconPackage,
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Field } from './ui/field';
import { TablePagination } from './ui/table-pagination';

import type { LogisticsPartner } from '@/types/logistics';
import { updatePartnershipStatus } from '@/lib/services/partnerships-service';

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'PENDING':
            return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'EXPIRED':
            return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        case 'TERMINATED':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'REJECTED':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        default:
            return '';
    }
};

const buildColumns = (
    onTerminate: (partner: LogisticsPartner) => void
): ColumnDef<LogisticsPartner>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'logisticsOrgName',
        header: 'Logistics Partner',
        cell: ({ row }) => (
            <div className="font-medium">{row.original.logisticsOrgName}</div>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'title',
        header: 'Partnership Title',
        cell: ({ row }) => (
            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                {row.original.title}
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
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: ({ row }) => (
            <div className="text-sm">
                {row.original.startDate
                    ? new Date(row.original.startDate).toLocaleDateString()
                    : '-'}
            </div>
        ),
    },
    {
        accessorKey: 'endDate',
        header: 'End Date',
        cell: ({ row }) => (
            <div className="text-sm">
                {row.original.endDate
                    ? new Date(row.original.endDate).toLocaleDateString()
                    : 'Ongoing'}
            </div>
        ),
    },
    {
        accessorKey: 'autoRenewal',
        header: 'Auto Renewal',
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <IconCircleCheckFilled
                    className={`size-4 ${
                        row.original.autoRenewal
                            ? 'text-green-500'
                            : 'text-muted-foreground'
                    }`}
                />
            </div>
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
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                        <a
                            href={`/retailer/partnership/logistic-market/${row.original.partnershipId}`}
                        >
                            <IconEye className="mr-2 h-4 w-4" />
                            View Details
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`/retailer/partnership/logistic-market/${row.original.partnershipId}`}
                        >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit Partnership
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onTerminate(row.original)}
                    >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Terminate Partnership
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 80,
    },
];

interface LogisticsTableProps {
    data: LogisticsPartner[];
    isLoading?: boolean;
}

export function LogisticsTable({
    data,
    isLoading = false,
}: LogisticsTableProps) {
    const isMobile = useIsMobile();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [removedIds, setRemovedIds] = React.useState<number[]>([]);

    const visibleData = React.useMemo(
        () => data.filter((p) => !removedIds.includes(p.partnershipId)),
        [data, removedIds]
    );

    const handleTerminate = React.useCallback(
        async (partner: LogisticsPartner) => {
            if (
                typeof window !== 'undefined' &&
                !window.confirm(
                    `Are you sure you want to terminate partnership with ${partner.logisticsOrgName}?`
                )
            )
                return;
            try {
                await updatePartnershipStatus(partner.partnershipId, {
                    status: 'TERMINATED',
                });
                setRemovedIds((prev) => [...prev, partner.partnershipId]);
                toast.success('Partnership terminated');
            } catch (error) {
                console.error('Failed to terminate partnership:', error);
                toast.error('Failed to terminate partnership');
            }
        },
        []
    );

    const columns = React.useMemo(
        () => buildColumns(handleTerminate),
        [handleTerminate]
    );

    const table = useReactTable({
        data: visibleData,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: false,
        pageCount: -1,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search logistics partners..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="max-w-sm"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <IconLayoutColumns className="mr-2 h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="cursor-pointer select-none"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <IconLoader className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span>
                                            Loading logistics partners...
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <IconTruck className="h-10 w-10 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            No logistics partners found
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <span>
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                    </span>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <TablePagination
                        pageIndex={table.getState().pagination.pageIndex}
                        pageCount={table.getPageCount()}
                        canPreviousPage={table.getCanPreviousPage()}
                        canNextPage={table.getCanNextPage()}
                        onPageChange={(index) => table.setPageIndex(index)}
                        onPreviousPage={() => table.previousPage()}
                        onNextPage={() => table.nextPage()}
                        showFirstLast={false}
                    />
                </div>
                <div className="flex flex-1 items-center justify-end gap-2">
                    <span className="hidden shrink-0 text-sm whitespace-nowrap text-muted-foreground sm:inline">
                        Rows per page
                    </span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(value) =>
                            table.setPageSize(Number(value))
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Page size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="40">40</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
