'use client';

import { PurchaseOrderTable } from '@/components/purchase-order-table';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { getPurchaseOrders } from '@/lib/services/purchase-orders-service';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { toast } from 'sonner';
import type { PurchaseOrder } from '@/types/purchase-orders';
import type { PaginatedResponse } from '@/types/paginated-response';

const STATUSES = [
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'SENT_TO_SUPPLIER',
    'ACKNOWLEDGED',
    'AWAITING_PICKUP',
    'PICKED_UP',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'INVOICED',
    'PAID',
    'CANCELLED',
    'CLOSED',
];

const PAGE_SIZE = 20;

export default function Page() {
    const [data, setData] =
        useState<PaginatedResponse<PurchaseOrder> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [pageNo, setPageNo] = useState(0);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getPurchaseOrders({
                status: status === 'all' ? undefined : status,
                page: pageNo,
                size: PAGE_SIZE,
            });
            setData(res);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to load purchase orders'
            );
        } finally {
            setIsLoading(false);
        }
    }, [status, pageNo]);

    useEffect(() => {
        load();
    }, [load]);

    if (isLoading && !data) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    const purchaseOrders: PurchaseOrder[] = data?.content ?? [];

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Purchase Orders
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Manage and track all purchase orders —
                                    including delivered history
                                </p>
                            </div>
                            <Select
                                value={status}
                                onValueChange={(v) => {
                                    setStatus(v);
                                    setPageNo(0);
                                }}
                            >
                                <SelectTrigger className="w-full md:w-56">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
                                    {STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <PurchaseOrderTable
                            purchaseOrders={
                                purchaseOrders as unknown as ComponentProps<
                                    typeof PurchaseOrderTable
                                >['purchaseOrders']
                            }
                        />
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground">
                                {data?.totalElements ?? 0} order(s)
                            </span>
                            <TablePagination
                                pageIndex={pageNo}
                                pageCount={data?.totalPages ?? 0}
                                canPreviousPage={pageNo > 0}
                                canNextPage={data ? !data.last : false}
                                onPageChange={setPageNo}
                                onPreviousPage={() =>
                                    setPageNo((p) => Math.max(0, p - 1))
                                }
                                onNextPage={() => setPageNo((p) => p + 1)}
                                showFirstLast={false}
                            />
                            <span className="text-sm text-muted-foreground">
                                Page {pageNo + 1} of {data?.totalPages ?? 1}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
