'use client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getStockMovements } from '@/lib/services/stock-service';
import type { StockMovement } from '@/types/stock';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';

export default function MovementsPage() {
    const [data, setData] = useState<StockMovement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await getStockMovements({
                    pageNo: 0,
                    // Sufficient for the centralized table (client-side paging).
                    pageOffset: 100,
                });
                if (!active) return;
                setData(res.content);
            } catch (e) {
                toast.error(
                    e instanceof Error ? e.message : 'Failed to load movements'
                );
            } finally {
                if (active) setIsLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const columns: ColumnDef<StockMovement>[] = [
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.type}</Badge>
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'quantity',
            header: () => <div className="w-full text-right">Qty</div>,
            cell: ({ row }) => (
                <div className="text-right">{row.original.quantity}</div>
            ),
        },
        {
            id: 'beforeAfter',
            header: 'Before → After',
            accessorFn: (row) => row.quantityBefore ?? 0,
            cell: ({ row }) => (
                <div>
                    {row.original.quantityBefore} → {row.original.quantityAfter}
                </div>
            ),
        },
        {
            id: 'reference',
            header: 'Reference',
            accessorFn: (row) => row.referenceType ?? '',
            cell: ({ row }) => (
                <div>
                    {row.original.referenceType} #{row.original.referenceId}
                </div>
            ),
        },
        {
            accessorKey: 'batchNumber',
            header: 'Batch',
            cell: ({ row }) => (
                <div>{row.original.batchNumber || '—'}</div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    {new Date(row.original.createdAt).toLocaleString()}
                </div>
            ),
        },
    ];

    const table = useTables<StockMovement>({
        data,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        getRowId: (row) => row.movementId.toString(),
    });

    if (isLoading)
        return (
            <div className="p-6">
                <Skeleton className="h-[400px] w-full" />
            </div>
        );

    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div>
                <h1 className="text-2xl font-bold">Stock Movements</h1>
                <p className="text-muted-foreground">
                    Audit trail · FR-RET-013 (batch/expiry tracked)
                </p>
            </div>
            <CentralizedDataTable
                table={table}
                emptyMessage="No movements"
            />
        </div>
    );
}
