'use client';

import * as React from 'react';
import {
    IconDotsVertical,
    IconEye,
    IconLayoutColumns,
    IconPlus,
} from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';

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
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';
import { Material } from '@/types/materials';
import { Money } from '@/components/finances/money';

interface MaterialTableProps {
    materials: Material[];
}

export function MaterialTable({ materials }: MaterialTableProps) {
    const columns: ColumnDef<Material>[] = React.useMemo(
        () => [
            {
                accessorKey: 'materialCode',
                header: 'Material Code',
                cell: ({ row }) => (
                    <div className="font-mono text-sm">
                        {row.getValue('materialCode')}
                    </div>
                ),
            },
            {
                accessorKey: 'materialName',
                header: 'Material Name',
                cell: ({ row }) => (
                    <div className="font-medium">
                        {row.getValue('materialName')}
                    </div>
                ),
            },
            {
                accessorKey: 'category',
                header: 'Category',
                cell: ({ row }) => (
                    <Badge
                        variant="outline"
                        className="text-muted-foreground px-1.5"
                    >
                        {row.getValue('category')}
                    </Badge>
                ),
            },
            {
                accessorKey: 'unitOfMeasure',
                header: 'Unit',
                cell: ({ row }) => <div>{row.getValue('unitOfMeasure')}</div>,
            },
            {
                accessorKey: 'unitPrice',
                header: 'Unit Price',
                cell: ({ row }) => (
                    <div className="font-mono tabular-nums">
                        <Money
                            amount={row.getValue('unitPrice')}
                            currency={
                                (row.original as { currency?: string })
                                    .currency
                            }
                        />
                    </div>
                ),
            },
            {
                accessorKey: 'minOrderQuantity',
                header: 'Min Order Qty',
                cell: ({ row }) => (
                    <div className="text-right">
                        {row.getValue('minOrderQuantity')}
                    </div>
                ),
            },
            {
                accessorKey: 'isActive',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.getValue('isActive') ? 'default' : 'secondary'
                        }
                    >
                        {row.getValue('isActive') ? 'Active' : 'Inactive'}
                    </Badge>
                ),
            },
            {
                accessorKey: 'leadTimeDays',
                header: 'Lead Time (days)',
                cell: ({ row }) => (
                    <div className="text-right">
                        {row.getValue('leadTimeDays')}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: () => (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconEye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconPlus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <IconDotsVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
        ],
        []
    );

    const table = useTables<Material>({
        data: materials,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        globalFilter: '',
    });

    return (
        <CentralizedDataTable
            table={table}
            emptyMessage="No materials found."
            toolbar={
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search materials..."
                        value={table.getState().globalFilter ?? ''}
                        onChange={(e) => table.setGlobalFilter(e.target.value)}
                        className="max-w-xs"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <IconLayoutColumns className="mr-2 h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
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
            }
        />
    );
}
