'use client';

import {
    IconAlertCircle,
    IconChevronDown,
    IconCircleCheckFilled,
    IconClock,
    IconDotsVertical,
    IconEdit,
    IconFile,
    IconFileText,
    IconLayoutColumns,
    IconLoader,
    IconPlus,
    IconRefresh,
    IconTrendingUp,
    IconX
} from '@tabler/icons-react';
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
    type SortingState,
    type VisibilityState
} from '@tanstack/react-table';
import * as React from 'react';
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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { updateSupplierContractStatus } from '@/lib/services/supplier-contracts-service';
import { format } from 'date-fns';
import Link from 'next/link';
import { Field } from './ui/field';
import { TablePagination } from './ui/table-pagination';

import type { SupplierContract } from '@/types/supplier-contracts';

type ContractStatus = SupplierContract['status'];

const statusConfig: Record<
    ContractStatus,
    {
        label: string;
        variant:
            'default' | 'secondary' | 'destructive' | 'outline' | 'success';
        icon: React.ReactNode;
    }
> = {
    DRAFT: {
        label: 'Draft',
        variant: 'secondary',
        icon: <IconFileText className="h-3 w-3" />,
    },
    PENDING_APPROVAL: {
        label: 'Pending Approval',
        variant: 'outline',
        icon: <IconClock className="h-3 w-3" />,
    },
    ACTIVE: {
        label: 'Active',
        variant: 'default',
        icon: <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />,
    },
    EXPIRED: {
        label: 'Expired',
        variant: 'destructive',
        icon: <IconAlertCircle className="h-3 w-3" />,
    },
    TERMINATED: {
        label: 'Terminated',
        variant: 'destructive',
        icon: <IconX className="h-3 w-3" />,
    },
    SUSPENDED: {
        label: 'Suspended',
        variant: 'destructive',
        icon: <IconLoader className="h-3 w-3" />,
    },
    RENEWAL_PENDING: {
        label: 'Renewal Pending',
        variant: 'outline',
        icon: <IconRefresh className="h-3 w-3" />,
    },
};

const fallbackStatusConfig = {
    label: 'Unknown',
    variant: 'secondary' as const,
    icon: <IconFileText className="h-3 w-3" />,
};

const buildColumns = (
    onSubmit: (contract: SupplierContract) => void
): ColumnDef<SupplierContract>[] => [
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
        accessorKey: 'contractNumber',
        header: 'Contract #',
        cell: ({ row }) => (
            <div className="font-medium font-mono text-sm">
                {row.original.contractNumber}
            </div>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'supplierName',
        header: 'Supplier',
        cell: ({ row }) => (
            <div className="font-medium">
                {(row.original.supplierName as string) || '—'}
            </div>
        ),
    },
    {
        accessorKey: 'contractType',
        header: 'Type',
        cell: ({ row }) => (
            <div className="text-sm">{row.original.contractType}</div>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const config =
                statusConfig[row.original.status] ?? fallbackStatusConfig;
            return (
                <Badge variant={config.variant} className="gap-1.5">
                    {config.icon}
                    {config.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'effectiveDate',
        header: 'Effective',
        cell: ({ row }) => (
            <div className="text-sm">
                {row.original.effectiveDate
                    ? format(new Date(row.original.effectiveDate), 'MMM dd, yyyy')
                    : '—'}
            </div>
        ),
    },
    {
        accessorKey: 'expiryDate',
        header: 'Expiry',
        cell: ({ row }) => {
            const expiry = row.original.expiryDate as string | undefined;
            return (
                <div className="text-sm">
                    {expiry
                        ? format(new Date(expiry), 'MMM dd, yyyy')
                        : '—'}
                </div>
            );
        },
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
                        <Link
                            href={`/retailer/supplier-contracts/${row.original.contractId}`}
                        >
                            <IconFileText className="mr-2 h-4 w-4" />
                            View Details
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/retailer/supplier-contracts/${row.original.contractId}/edit`}
                        >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {row.original.documentUrl && (
                        <DropdownMenuItem asChild>
                            <a
                                href={row.original.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <IconFile className="mr-2 h-4 w-4" />
                                View Document
                            </a>
                        </DropdownMenuItem>
                    )}
                    {row.original.status === 'DRAFT' && (
                        <DropdownMenuItem
                            onClick={() => onSubmit(row.original)}
                        >
                            <IconTrendingUp className="mr-2 h-4 w-4" />
                            Submit for Approval
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export function SupplierContractTable({
    supplierContracts: initialData,
}: {
    supplierContracts: SupplierContract[];
}) {
    const [data, setData] = React.useState(() => initialData);
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [confirming, setConfirming] = React.useState<SupplierContract | null>(
        null
    );

    const handleSubmit = React.useCallback(async () => {
        if (!confirming) return;
        try {
            const updated = await updateSupplierContractStatus(
                confirming.contractId,
                { status: 'PENDING_APPROVAL' }
            );
            setData((prev) =>
                prev.map((c) =>
                    c.contractId === confirming.contractId ? updated : c
                )
            );
            toast.success('Contract submitted for approval');
        } catch (error) {
            console.error('Failed to submit contract:', error);
            toast.error('Failed to submit contract');
        } finally {
            setConfirming(null);
        }
    }, [confirming]);

    const requestSubmit = React.useCallback((contract: SupplierContract) => {
        setConfirming(contract);
    }, []);

    const columns = React.useMemo(
        () => buildColumns(requestSubmit),
        [requestSubmit]
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        getRowId: (row) => row.contractId.toString(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <Tabs
            defaultValue="outline"
            className="w-full flex-col justify-start gap-6"
        >
            <div className="flex items-center justify-between">
                <Label htmlFor="view-selector" className="sr-only">
                    View
                </Label>
                <Select defaultValue="outline">
                    <SelectTrigger
                        className="flex w-full @4xl/main:hidden"
                        size="sm"
                        id="view-selector"
                    >
                        <SelectValue placeholder="Select a view" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="outline">Table View</SelectItem>
                        <SelectItem value="cards">Card View</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <Field>
                        <Input
                            placeholder="Search contracts..."
                            className="h-8 w-full md:w-64 lg:w-80"
                            value={
                                table
                                    .getColumn('contractNumber')
                                    ?.getFilterValue() as string
                            }
                            onChange={(e) =>
                                table
                                    .getColumn('contractNumber')
                                    ?.setFilterValue(e.target.value)
                            }
                        />
                    </Field>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <IconLayoutColumns />
                                <span className="hidden lg:inline">
                                    Customize Columns
                                </span>
                                <span className="lg:hidden">Columns</span>
                                <IconChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) =>
                                        typeof column.accessorFn !==
                                            'undefined' && column.getCanHide()
                                )
                                .map((column) => {
                                    return (
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
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/retailer/supplier-contracts/add">
                            <IconPlus />
                            <span className="hidden lg:inline">
                                Create Contract
                            </span>
                        </Link>
                    </Button>
                </div>
            </div>
            <TabsContent
                value="outline"
                className="relative flex flex-col gap-4 overflow-auto"
            >
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody className="**:data-[slot=table-cell]:first:w-8">
                            {table.getRowModel().rows?.length ? (
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
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No supplier contracts found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between gap-4 px-4">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} of{' '}
                        {table.getFilteredRowModel().rows.length} row(s)
                        selected.
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
                            onFirstPage={() => table.setPageIndex(0)}
                            onLastPage={() =>
                                table.setPageIndex(table.getPageCount() - 1)
                            }
                        />
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-4">
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </div>
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label
                                htmlFor="rows-per-page"
                                className="shrink-0 text-sm font-medium whitespace-nowrap"
                            >
                                Rows per page
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="w-full"
                                    id="rows-per-page"
                                >
                                    <SelectValue
                                        placeholder={
                                            table.getState().pagination.pageSize
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem
                                            key={pageSize}
                                            value={`${pageSize}`}
                                        >
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="cards" className="flex flex-col px-4 lg:px-6">
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Card view coming soon
                    </div>
                </div>
            </TabsContent>
            <AlertDialog
                open={confirming !== null}
                onOpenChange={(v) => !v && setConfirming(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Submit contract?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Submit contract {confirming?.contractNumber} for
                            approval?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit}>
                            Submit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Tabs>
    );
}
