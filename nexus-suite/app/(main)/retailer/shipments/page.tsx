'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    getShipments,
    searchShipments,
    type Shipment,
    type ShipmentFilter,
    type ShipmentMode,
    type ShipmentPaginatedResponse,
    type ShipmentStatus,
} from '@/lib/services/shipment-service';
import {
    Edit,
    Eye,
    Package,
    Plane,
    Plus,
    Ship,
    Train,
    Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { TablePagination } from '@/components/ui/table-pagination';

const STATUS_COLORS: Record<ShipmentStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PICKUP_SCHEDULED: 'bg-indigo-100 text-indigo-800',
    IN_TRANSIT: 'bg-purple-100 text-purple-800',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    EXCEPTION: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600 line-through',
    RETURNED: 'bg-amber-100 text-amber-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-slate-100 text-slate-800',
};

const MODE_ICONS: Record<ShipmentMode, React.ReactNode> = {
    ROAD: <Truck className="w-4 h-4" />,
    RAIL: <Train className="w-4 h-4" />,
    AIR: <Plane className="w-4 h-4" />,
    SEA: <Ship className="w-4 h-4" />,
    MULTIMODAL: <Package className="w-4 h-4" />,
};

const searchSchema = z.object({
    searchTerm: z.string().max(100, 'Search term too long').optional(),
});
type SearchFormData = z.infer<typeof searchSchema>;

export default function ShipmentsPage() {
    const [data, setData] = useState<ShipmentPaginatedResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<ShipmentFilter>({
        pageNo: 0,
        pageOffset: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
    });

    const searchForm = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema),
        defaultValues: { searchTerm: '' },
    });

    const fetchShipments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = searchTerm
                ? await searchShipments(
                      { q: searchTerm },
                      filter.pageNo ?? 0,
                      filter.pageOffset ?? 10
                  )
                : await getShipments(filter);
            setData(result);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Failed to load shipments';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [filter, searchTerm]);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments, filter, searchTerm]);

    const handlePageChange = (newPage: number) => {
        setFilter((prev) => ({ ...prev, pageNo: newPage }));
    };

    const handleFilterChange = (newFilter: Partial<ShipmentFilter>) => {
        setFilter((prev) => ({ ...prev, ...newFilter, pageNo: 0 }));
    };

    const onSearchSubmit = (formData: SearchFormData) => {
        setSearchTerm(formData.searchTerm?.trim() ?? '');
        setFilter((prev) => ({ ...prev, pageNo: 0 }));
    };

    if (isLoading && !data) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Shipments</h1>
                    <Skeleton className="h-9 w-28" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchShipments} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    const rows: Shipment[] = data?.content ?? [];

    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Shipments</h1>
                    <p className="text-muted-foreground">
                        Manage and track all shipments
                    </p>
                </div>
                <Link href="/retailer/shipments/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Shipment
                    </Button>
                </Link>
            </div>

            <Form {...searchForm}>
                <form
                    onSubmit={searchForm.handleSubmit(onSearchSubmit)}
                    className="flex flex-col gap-4 md:flex-row p-4 border rounded-lg bg-card"
                >
                    <div className="flex-1">
                        <FormField
                            control={searchForm.control}
                            name="searchTerm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="Search shipments..."
                                            {...field}
                                            className="w-full"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" variant="outline">
                            Search
                        </Button>
                        <Select
                            value={filter.status || ''}
                            onValueChange={(value) =>
                                handleFilterChange({
                                    status: value || undefined,
                                })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Statuses</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="CONFIRMED">
                                    Confirmed
                                </SelectItem>
                                <SelectItem value="PICKUP_SCHEDULED">
                                    Pickup Scheduled
                                </SelectItem>
                                <SelectItem value="IN_TRANSIT">
                                    In Transit
                                </SelectItem>
                                <SelectItem value="OUT_FOR_DELIVERY">
                                    Out for Delivery
                                </SelectItem>
                                <SelectItem value="DELIVERED">
                                    Delivered
                                </SelectItem>
                                <SelectItem value="EXCEPTION">
                                    Exception
                                </SelectItem>
                                <SelectItem value="CANCELLED">
                                    Cancelled
                                </SelectItem>
                                <SelectItem value="RETURNED">
                                    Returned
                                </SelectItem>
                                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filter.mode || ''}
                            onValueChange={(value) =>
                                handleFilterChange({ mode: value || undefined })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Modes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Modes</SelectItem>
                                <SelectItem value="ROAD">Road</SelectItem>
                                <SelectItem value="RAIL">Rail</SelectItem>
                                <SelectItem value="AIR">Air</SelectItem>
                                <SelectItem value="SEA">Sea</SelectItem>
                                <SelectItem value="MULTIMODAL">
                                    Multimodal
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </form>
            </Form>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Shipment #</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Logistics</TableHead>
                            <TableHead>Pickup Date</TableHead>
                            <TableHead>Delivery Date</TableHead>
                            <TableHead>Freight Cost</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.shipmentId}>
                                <TableCell className="font-mono font-medium">
                                    {row.shipmentNumber}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={
                                            STATUS_COLORS[
                                                row.status as ShipmentStatus
                                            ] || 'bg-gray-100 text-gray-800'
                                        }
                                    >
                                        {row.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2">
                                        {MODE_ICONS[
                                            row.mode as ShipmentMode
                                        ] || <Package className="w-4 h-4" />}
                                        {row.mode}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {row.supplierOrgName || '—'}
                                </TableCell>
                                <TableCell>
                                    {row.logisticsOrgName || '—'}
                                </TableCell>
                                <TableCell>
                                    {row.pickupDate
                                        ? new Date(
                                              row.pickupDate
                                          ).toLocaleDateString()
                                        : '—'}
                                </TableCell>
                                <TableCell>
                                    {row.deliveryDate
                                        ? new Date(
                                              row.deliveryDate
                                          ).toLocaleDateString()
                                        : '—'}
                                </TableCell>
                                <TableCell>
                                    {row.freightCost
                                        ? `${row.currency || 'USD'} ${row.freightCost.toLocaleString()}`
                                        : '—'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/retailer/shipments/${row.shipmentId}`}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link
                                            href={`/retailer/shipments/${row.shipmentId}`}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No shipments
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center">
                    <span className="text-sm text-muted-foreground">
                        {data?.totalElements ?? 0} shipment(s)
                    </span>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <TablePagination
                        pageIndex={filter.pageNo ?? 0}
                        pageCount={data?.totalPages ?? 0}
                        canPreviousPage={(filter.pageNo ?? 0) > 0}
                        canNextPage={data ? !data.last : false}
                        onPageChange={handlePageChange}
                        onPreviousPage={() =>
                            handlePageChange((filter.pageNo ?? 0) - 1)
                        }
                        onNextPage={() =>
                            handlePageChange((filter.pageNo ?? 0) + 1)
                        }
                        showFirstLast={false}
                    />
                </div>
                <div className="flex flex-1 items-center justify-end">
                    <span className="text-sm text-muted-foreground">
                        Page {(filter.pageNo ?? 0) + 1} of{' '}
                        {data?.totalPages ?? 1}
                    </span>
                </div>
            </div>
        </div>
    );
}
