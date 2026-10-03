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
    IconCircleCheckFilled,
    IconDotsVertical,
    IconEdit,
    IconLayoutColumns,
    IconLoader,
    IconPlus,
    IconTrash,
    IconTrendingUp,
    IconSend,
    IconTruck,
    IconFileText,
    IconClock,
    IconAlertCircle,
    IconCheck,
    IconX,
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
import { Money } from '@/components/money';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    cancelPurchaseOrder,
    transitionPurchaseOrder,
} from '@/lib/services/purchase-orders-service';

interface PurchaseOrder {
    purchaseOrderId: number;
    purchaseOrderNumber: string;
    retailerOrgId: number;
    retailerOrgName: string;
    supplierOrgId: number;
    supplierOrgName: string;
    orderDate: string;
    expectedDeliveryDate: string;
    status:
        | 'DRAFT'
        | 'PENDING_APPROVAL'
        | 'APPROVED'
        | 'REJECTED'
        | 'CONFIRMED'
        | 'SHIPPED'
        | 'DELIVERED'
        | 'CANCELLED'
        | 'PARTIALLY_DELIVERED';
    totalAmount: number;
    currency: string;
    paymentTerms: string;
    shippingAddress: string;
    billingAddress: string;
    notes?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

const statusConfig: Record<
    PurchaseOrder['status'],
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
    APPROVED: {
        label: 'Approved',
        variant: 'default',
        icon: <IconCheck className="h-3 w-3" />,
    },
    REJECTED: {
        label: 'Rejected',
        variant: 'destructive',
        icon: <IconX className="h-3 w-3" />,
    },
    CONFIRMED: {
        label: 'Confirmed',
        variant: 'default',
        icon: <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />,
    },
    SHIPPED: {
        label: 'Shipped',
        variant: 'default',
        icon: <IconTruck className="h-3 w-3" />,
    },
    DELIVERED: {
        label: 'Delivered',
        variant: 'success',
        icon: <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />,
    },
    CANCELLED: {
        label: 'Cancelled',
        variant: 'destructive',
        icon: <IconX className="h-3 w-3" />,
    },
    PARTIALLY_DELIVERED: {
        label: 'Partially Delivered',
        variant: 'outline',
        icon: <IconAlertCircle className="h-3 w-3" />,
    },
    SENT_TO_SUPPLIER: {
        label: 'Sent to Supplier',
        variant: 'default',
        icon: <IconTruck className="h-3 w-3" />,
    },
    ACKNOWLEDGED: {
        label: 'Acknowledged',
        variant: 'default',
        icon: <IconCheck className="h-3 w-3" />,
    },
    PARTIALLY_RECEIVED: {
        label: 'Partially Received',
        variant: 'outline',
        icon: <IconAlertCircle className="h-3 w-3" />,
    },
    RECEIVED: {
        label: 'Received',
        variant: 'success',
        icon: <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />,
    },
    INVOICED: {
        label: 'Invoiced',
        variant: 'outline',
        icon: <IconFileText className="h-3 w-3" />,
    },
    PAID: {
        label: 'Paid',
        variant: 'success',
        icon: <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />,
    },
    CLOSED: {
        label: 'Closed',
        variant: 'secondary',
        icon: <IconCheck className="h-3 w-3" />,
    },
};

const buildColumns = (
    onSubmit: (po: PurchaseOrder) => void,
    onSend: (po: PurchaseOrder) => void,
    onDelete: (po: PurchaseOrder) => void
): ColumnDef<PurchaseOrder>[] => [
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
        accessorKey: 'purchaseOrderNumber',
        header: 'PO Number',
        cell: ({ row }) => (
            <div className="font-medium font-mono text-sm">
                {row.original.purchaseOrderNumber}
            </div>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'supplierOrgName',
        header: 'Supplier',
        cell: ({ row }) => (
            <div className="font-medium">{row.original.supplierOrgName}</div>
        ),
    },
    {
        accessorKey: 'orderDate',
        header: 'Order Date',
        cell: ({ row }) => (
            <div className="text-sm">
                {row.original.orderDate
                    ? format(new Date(row.original.orderDate), 'MMM dd, yyyy')
                    : '—'}
            </div>
        ),
    },
    {
        accessorKey: 'expectedDeliveryDate',
        header: 'Expected Delivery',
        cell: ({ row }) => (
            <div className="text-sm">
                {row.original.expectedDeliveryDate
                    ? format(
                          new Date(row.original.expectedDeliveryDate),
                          'MMM dd, yyyy'
                      )
                    : '—'}
            </div>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const config = statusConfig[row.original.status] ?? {
                label: row.original.status ?? 'Unknown',
                variant: 'outline' as const,
                icon: null,
            };
            return (
                <Badge variant={config.variant} className="gap-1.5">
                    {config.icon}
                    {config.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'totalAmount',
        header: () => <div className="w-full text-right">Total Amount</div>,
        cell: ({ row }) => (
            <div className="text-right font-mono font-medium">
                <Money
                    amount={row.original.totalAmount}
                    currency={row.original.currency}
                />
            </div>
        ),
    },
    {
        accessorKey: 'paymentTerms',
        header: 'Payment Terms',
        cell: ({ row }) => row.original.paymentTerms || '—',
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
                            href={`/retailer/purchase-orders/${row.original.purchaseOrderId}`}
                        >
                            <IconFileText className="mr-2 h-4 w-4" />
                            View Details
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/retailer/purchase-orders/${row.original.purchaseOrderId}/edit`}
                        >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {row.original.status === 'DRAFT' && (
                        <DropdownMenuItem
                            onClick={() => onSubmit(row.original)}
                        >
                            <IconTrendingUp className="mr-2 h-4 w-4" />
                            Submit for Approval
                        </DropdownMenuItem>
                    )}
                    {row.original.status === 'APPROVED' && (
                        <DropdownMenuItem
                            onClick={() => onSend(row.original)}
                        >
                            <IconSend className="mr-2 h-4 w-4" />
                            Send to Supplier
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(row.original)}
                    >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export function PurchaseOrderTable({
    purchaseOrders: initialData,
}: {
    purchaseOrders: PurchaseOrder[];
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

    const [confirming, setConfirming] = React.useState<{
        action: 'submit' | 'send' | 'delete';
        po: PurchaseOrder;
    } | null>(null);

    const handleSubmit = React.useCallback(async () => {
        if (!confirming || confirming.action !== 'submit') return;
        const po = confirming.po;
        try {
            const updated = await transitionPurchaseOrder(
                po.purchaseOrderId,
                'PENDING_APPROVAL'
            );
            setData((prev) =>
                prev.map((p) =>
                    p.purchaseOrderId === po.purchaseOrderId ? updated : p
                )
            );
            toast.success('Purchase order submitted for approval');
        } catch (error) {
            console.error('Failed to submit purchase order:', error);
            toast.error('Failed to submit purchase order');
        } finally {
            setConfirming(null);
        }
    }, [confirming]);

    const handleSend = React.useCallback(async () => {
        if (!confirming || confirming.action !== 'send') return;
        const po = confirming.po;
        try {
            const updated = await transitionPurchaseOrder(
                po.purchaseOrderId,
                'SENT_TO_SUPPLIER'
            );
            setData((prev) =>
                prev.map((p) =>
                    p.purchaseOrderId === po.purchaseOrderId ? updated : p
                )
            );
            toast.success('Purchase order sent to supplier');
        } catch (error) {
            console.error('Failed to send purchase order:', error);
            toast.error('Failed to send purchase order');
        } finally {
            setConfirming(null);
        }
    }, [confirming]);

    const handleDelete = React.useCallback(async () => {
        if (!confirming || confirming.action !== 'delete') return;
        const po = confirming.po;
        try {
            await cancelPurchaseOrder(po.purchaseOrderId);
            setData((prev) =>
                prev.filter((p) => p.purchaseOrderId !== po.purchaseOrderId)
            );
            toast.success('Purchase order deleted');
        } catch (error) {
            console.error('Failed to delete purchase order:', error);
            toast.error('Failed to delete purchase order');
        } finally {
            setConfirming(null);
        }
    }, [confirming]);

    const requestSubmit = React.useCallback((po: PurchaseOrder) => {
        setConfirming({ action: 'submit', po });
    }, []);

    const requestSend = React.useCallback((po: PurchaseOrder) => {
        setConfirming({ action: 'send', po });
    }, []);

    const requestDelete = React.useCallback((po: PurchaseOrder) => {
        setConfirming({ action: 'delete', po });
    }, []);

    const columns = React.useMemo(
        () => buildColumns(requestSubmit, requestSend, requestDelete),
        [requestSubmit, requestSend, requestDelete]
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
        getRowId: (row) => row.purchaseOrderId.toString(),
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
            <div className="flex items-center justify-between px-4 lg:px-6">
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
                            placeholder="Search purchase orders..."
                            className="h-8 w-full md:w-64 lg:w-80"
                            value={
                                table
                                    .getColumn('purchaseOrderNumber')
                                    ?.getFilterValue() as string
                            }
                            onChange={(e) =>
                                table
                                    .getColumn('purchaseOrderNumber')
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
                        <Link href="/retailer/purchase-orders/add">
                            <IconPlus />
                            <span className="hidden lg:inline">Create PO</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <TabsContent
                value="outline"
                className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
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
                                        No purchase orders found.
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
                            {confirming?.action === 'submit'
                                ? 'Submit purchase order?'
                                : confirming?.action === 'send'
                                  ? 'Send purchase order?'
                                  : 'Delete purchase order?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirming?.action === 'submit'
                                ? `Submit purchase order ${confirming?.po.purchaseOrderNumber} for approval?`
                                : confirming?.action === 'send'
                                  ? `Send purchase order ${confirming?.po.purchaseOrderNumber} to the supplier?`
                                  : `Delete purchase order ${confirming?.po.purchaseOrderNumber}? This cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={
                                confirming?.action === 'submit'
                                    ? handleSubmit
                                    : confirming?.action === 'send'
                                      ? handleSend
                                      : handleDelete
                            }
                        >
                            {confirming?.action === 'submit'
                                ? 'Submit'
                                : confirming?.action === 'send'
                                  ? 'Send'
                                  : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Tabs>
    );
}
