'use client';

import * as React from 'react';
import {
    IconChevronDown,
    IconCircleCheckFilled,
    IconDotsVertical,
    IconEdit,
    IconEye,
    IconLayoutColumns,
    IconLoader,
    IconPlus,
    IconTrash,
} from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import Link from 'next/link';
import { createProduct, deleteProduct } from '@/lib/services/products-service';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Field } from './ui/field';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';
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

interface Product {
    productId: number;
    productCode: string;
    productName: string;
    description: string;
    category: string;
    subCategory?: string;
    brand?: string;
    unitOfMeasure: string;
    unitPrice: number;
    currency: string;
    taxRate: number;
    isActive: boolean;
    minOrderQuantity: number;
    maxOrderQuantity?: number;
    leadTimeDays: number;
    weight?: number;
    dimensions?: string;
    barcode?: string;
    sku?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

const createColumns = (
    onDelete: (productId: number, productCode: string) => void,
    onDuplicate: (product: Product) => void
): ColumnDef<Product>[] => [
    {
        accessorKey: 'productName',
        header: 'Product Name',
        cell: ({ row }) => (
            <div className="font-medium">{row.original.productName}</div>
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'productCode',
        header: 'Product Code',
        cell: ({ row }) => (
            <div className="font-mono text-sm">{row.original.productCode}</div>
        ),
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
        accessorKey: 'brand',
        header: 'Brand',
        cell: ({ row }) => row.original.brand || '—',
    },
    {
        accessorKey: 'unitPrice',
        header: () => <div className="w-full text-right">Unit Price</div>,
        cell: ({ row }) => (
            <div className="text-right font-mono">
                {row.original.currency}{' '}
                {row.original.unitPrice.toLocaleString()}
            </div>
        ),
    },
    {
        accessorKey: 'unitOfMeasure',
        header: 'UOM',
        cell: ({ row }) => row.original.unitOfMeasure,
    },
    {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
                {row.original.isActive ? (
                    <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
                ) : (
                    <IconLoader />
                )}
                {row.original.isActive ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    {
        accessorKey: 'minOrderQuantity',
        header: () => <div className="w-full text-right">Min Qty</div>,
        cell: ({ row }) => (
            <div className="text-right">{row.original.minOrderQuantity}</div>
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
                <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                        onSelect={() => {
                            const id = row.original.productId;
                            if (!id) {
                                toast.error(
                                    'Product ID missing — please refresh the list'
                                );
                                return;
                            }
                            window.location.href = `/retailer/products/${id}`;
                        }}
                    >
                        <IconEye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => {
                            const id = row.original.productId;
                            if (!id) {
                                toast.error(
                                    'Product ID missing — please refresh the list'
                                );
                                return;
                            }
                            window.location.href = `/retailer/products/${id}/edit`;
                        }}
                    >
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => onDuplicate(row.original)}
                    >
                        <IconPlus className="mr-2 h-4 w-4" />
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() =>
                            onDelete(
                                row.original.productId,
                                row.original.productCode
                            )
                        }
                    >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export function ProductTable({
    products: initialData,
}: {
    products: Product[];
}) {
    const [data, setData] = React.useState(() => initialData);

    const [confirmingDelete, setConfirmingDelete] = React.useState<{
        productId: number;
        productCode: string;
    } | null>(null);

    const handleDelete = React.useCallback(async () => {
        if (!confirmingDelete) return;
        const { productId } = confirmingDelete;
        try {
            await deleteProduct(productId);
            setData((prev) => prev.filter((p) => p.productId !== productId));
            toast.success('Product deleted');
        } catch {
            toast.error('Failed to delete product. Please try again.');
        } finally {
            setConfirmingDelete(null);
        }
    }, [confirmingDelete]);

    const handleDuplicate = React.useCallback(async (product: Product) => {
        const copyCode = `${product.productCode || 'PRD'}-COPY-${Date.now().toString().slice(-6)}`;
        try {
            const created = await createProduct({
                productCode: copyCode,
                productName: `${product.productName} (Copy)`,
                description: product.description,
                category: product.category,
                subCategory: product.subCategory,
                brand: product.brand,
                unitOfMeasure: product.unitOfMeasure,
                unitPrice: product.unitPrice,
                currency: product.currency,
                taxRate: product.taxRate,
                isActive: product.isActive,
                minOrderQuantity: product.minOrderQuantity,
                maxOrderQuantity: product.maxOrderQuantity,
                leadTimeDays: product.leadTimeDays,
                weight: product.weight,
                dimensions: product.dimensions,
                barcode: undefined,
                sku: undefined,
                tags: product.tags,
            });
            setData((prev) => [created, ...prev]);
            toast.success(`Duplicated as ${created.productCode}`);
        } catch {
            toast.error('Failed to duplicate product. Please try again.');
        }
    }, []);

    const requestDelete = React.useCallback(
        (productId: number, productCode: string) => {
            setConfirmingDelete({ productId, productCode });
        },
        []
    );

    const columns = React.useMemo(
        () => createColumns(requestDelete, handleDuplicate),
        [requestDelete, handleDuplicate]
    );

    const table = useTables<Product>({
        data,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        getRowId: (row) => row.productId.toString(),
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
                            placeholder="Search products..."
                            className="h-8 w-full md:w-64 lg:w-80"
                            value={
                                table
                                    .getColumn('productName')
                                    ?.getFilterValue() as string
                            }
                            onChange={(e) =>
                                table
                                    .getColumn('productName')
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
                        <Link href="/retailer/products/add">
                            <IconPlus />
                            <span className="hidden lg:inline">
                                Add Product
                            </span>
                        </Link>
                    </Button>
                </div>
            </div>
            <TabsContent
                value="outline"
                className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
            >
                <CentralizedDataTable
                    table={table}
                    emptyMessage="No products found."
                />
            </TabsContent>
            <TabsContent value="cards" className="flex flex-col px-4 lg:px-6">
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Card view coming soon
                    </div>
                </div>
            </TabsContent>
            <AlertDialog
                open={confirmingDelete !== null}
                onOpenChange={(v) => !v && setConfirmingDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete product{' '}
                            {confirmingDelete?.productCode ||
                                confirmingDelete?.productId}
                            ? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Tabs>
    );
}
