'use client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupplierPerformances } from '@/lib/services/supplier-performance-service';
import type { SupplierPerformance } from '@/types/supplier-performance';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';

const TIER_COLOR: Record<string, string> = {
    EXCELLENT: 'bg-green-100 text-green-800',
    GOOD: 'bg-blue-100 text-blue-800',
    AVERAGE: 'bg-yellow-100 text-yellow-800',
    BELOW_AVERAGE: 'bg-orange-100 text-orange-800',
    POOR: 'bg-red-100 text-red-800',
};

export default function PerformancePage() {
    const [data, setData] = useState<SupplierPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        let a = true;
        (async () => {
            try {
                const r = await getSupplierPerformances({
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

    const right = (label: string): NonNullable<ColumnDef<SupplierPerformance>['header']> =>
        function PerformanceHeader() {
            return <div className="w-full text-right">{label}</div>;
        };

    const columns: ColumnDef<SupplierPerformance>[] = [
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
            accessorKey: 'otifScore',
            header: right('OTIF'),
            cell: ({ row }) => (
                <div className="text-right">{row.original.otifScore}%</div>
            ),
        },
        {
            accessorKey: 'qualityDefectRate',
            header: right('Defect %'),
            cell: ({ row }) => (
                <div className="text-right">
                    {row.original.qualityDefectRate}%
                </div>
            ),
        },
        {
            accessorKey: 'avgLeadTimeDays',
            header: right('Lead Days'),
            cell: ({ row }) => (
                <div className="text-right">{row.original.avgLeadTimeDays}</div>
            ),
        },
        {
            accessorKey: 'responsivenessScore',
            header: right('Responsiveness'),
            cell: ({ row }) => (
                <div className="text-right">
                    {row.original.responsivenessScore}%
                </div>
            ),
        },
        {
            accessorKey: 'overallScore',
            header: right('Overall'),
            cell: ({ row }) => (
                <div className="text-right font-bold">
                    {row.original.overallScore}%
                </div>
            ),
        },
        {
            accessorKey: 'performanceTier',
            header: 'Tier',
            cell: ({ row }) => (
                <Badge className={TIER_COLOR[row.original.performanceTier]}>
                    {row.original.performanceTier}
                </Badge>
            ),
        },
    ];

    const table = useTables<SupplierPerformance>({
        data,
        columns,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        sorting: [],
        columnVisibility: {},
        columnFilters: [],
        getRowId: (row) => row.performanceId.toString(),
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
                <h1 className="text-2xl font-bold">Supplier Performance</h1>
                <p className="text-muted-foreground">
                    OTIF · Quality · Lead Time · Responsiveness · FR-RET-022
                </p>
            </div>
            <CentralizedDataTable
                table={table}
                emptyMessage="No performance records"
            />
        </div>
    );
}
