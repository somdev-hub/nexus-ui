'use client';

import { PurchaseOrderTable } from '@/components/purchase-order-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getPurchaseOrders } from '@/lib/services/purchase-orders-service';
import type { PaginatedResponse } from '@/types/paginated-response';
import type { PurchaseOrder } from '@/types/purchase-orders';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { toast } from 'sonner';

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

// Fetch a larger batch so the centralized table (inside PurchaseOrderTable)
// can paginate client-side; the page itself no longer renders pagination.
const PAGE_SIZE = 100;

export default function Page() {
    const [data, setData] = useState<PaginatedResponse<PurchaseOrder> | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('all');

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getPurchaseOrders({
                status: status === 'all' ? undefined : status,
                page: 0,
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
    }, [status]);

    useEffect(() => {
        load();
    }, [load]);

    if (isLoading && !data) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-100 w-full" />
            </div>
        );
    }

    const purchaseOrders: PurchaseOrder[] = data?.content ?? [];

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
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
                                onValueChange={setStatus}
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
                    </div>
                </div>
            </div>
        </>
    );
}
