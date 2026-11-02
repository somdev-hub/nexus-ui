'use client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupplierRisks } from '@/lib/services/supplier-risk-service';
import type { SupplierRisk } from '@/types/supplier-risk';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';

const LEVEL_COLOR: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
};
const STATUS_COLOR: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    MITIGATED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-600',
    ESCALATED: 'bg-red-100 text-red-800',
};

export default function RiskPage() {
    const [data, setData] = useState<SupplierRisk[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        let a = true;
        (async () => {
            try {
                const r = await getSupplierRisks({
                    pageNo: 0,
                    // Sufficient for the centralized table (client-side paging).
                    pageOffset: 100,
                });
                if (!a) return;
                setData(r.content);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed');
            } finally {
                if (a) setIsLoading(false);
            }
        })();
        return () => {
            a = false;
        };
    }, []);

    const columns: ColumnDef<SupplierRisk>[] = [
        {
            id: 'supplier',
            header: 'Supplier',
            accessorFn: (row) => row.supplierName ?? row.supplierId,
            cell: ({ row }) => (
                <div>{row.original.supplierName || row.original.supplierId}</div>
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'riskCategory',
            header: 'Category',
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.riskCategory}</Badge>
            ),
        },
        {
            accessorKey: 'riskLevel',
            header: 'Level',
            cell: ({ row }) => (
                <Badge className={LEVEL_COLOR[row.original.riskLevel]}>
                    {row.original.riskLevel}
                </Badge>
            ),
        },
        {
            accessorKey: 'riskStatus',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className={STATUS_COLOR[row.original.riskStatus]}>
                    {row.original.riskStatus}
                </Badge>
            ),
        },
        {
            accessorKey: 'riskScore',
            header: () => <div className="w-full text-right">Score</div>,
            cell: ({ row }) => (
                <div className="text-right">{row.original.riskScore}</div>
            ),
        },
        {
            accessorKey: 'nextReviewDate',
            header: 'Next Review',
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    {row.original.nextReviewDate
                        ? new Date(row.original.nextReviewDate).toLocaleDateString()
                        : '—'}
                </div>
            ),
        },
    ];

    const table = useTables<SupplierRisk>({
        data,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        getRowId: (row) => row.riskId.toString(),
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
                <h1 className="text-2xl font-bold">Supplier Risk Monitoring</h1>
                <p className="text-muted-foreground">
                    Risk categories & mitigation · FR-RET-024
                </p>
            </div>
            <CentralizedDataTable table={table} emptyMessage="No risks" />
        </div>
    );
}
