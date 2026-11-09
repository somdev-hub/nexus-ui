'use client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Star } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    getShipments,
    getReviewedShipmentIds,
    getShipmentReviews,
    reviewDeliveredShipment,
} from '@/lib/services/shipment-service';
import type { Shipment } from '@/types/shipment';
import type { ShipmentReview } from '@/types/shipment';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';

export default function ReviewsPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [reviews, setReviews] = useState<ShipmentReview[]>([]);
    const [shipmentPage, setShipmentPage] = useState(0);
    const [reviewPage, setReviewPage] = useState(0);
    const [shipmentPageCount, setShipmentPageCount] = useState(1);
    const [reviewPageCount, setReviewPageCount] = useState(1);
    const pageSize = DEFAULT_TABLE_PAGE_SIZE;
    const [isLoading, setIsLoading] = useState(true);
    const [reviewing, setReviewing] = useState<Shipment | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editExpected, setEditExpected] = useState(false);
    const [editActual, setEditActual] = useState(false);
    const [expectedDate, setExpectedDate] = useState<Date | undefined>();
    const [actualDate, setActualDate] = useState<Date | undefined>();
    const [reviewForm, setReviewForm] = useState({
        rating: '5',
        qualityScore: '80',
        expectedDelivery: '',
        actualDelivery: '',
        expectedQuantity: '',
        actualQuantity: '',
        comments: '',
    });

    const load = async () => {
        setIsLoading(true);
        try {
            const [ship, reviewed, revs] = await Promise.all([
                getShipments({
                    status: 'DELIVERED',
                    pageNo: shipmentPage,
                    pageOffset: pageSize,
                }),
                getReviewedShipmentIds(),
                getShipmentReviews({
                    pageNo: reviewPage,
                    pageOffset: pageSize,
                }),
            ]);
            const reviewedSet = new Set(reviewed ?? []);
            setShipments(
                (ship?.content ?? []).filter(
                    (s) => !reviewedSet.has(s.shipmentId)
                )
            );
            setShipmentPageCount(ship?.totalPages ?? 1);
            setReviews(revs?.content ?? []);
            setReviewPageCount(revs?.totalPages ?? 1);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [shipmentPage, reviewPage]);

    const openReview = (s: Shipment) => {
        setReviewing(s);
        setEditExpected(false);
        setEditActual(false);
        const exp = s.scheduledDeliveryDate || s.estimatedArrival || '';
        const act = s.actualArrival || '';
        setExpectedDate(exp ? new Date(exp) : undefined);
        setActualDate(act ? new Date(act) : undefined);
        setReviewForm({
            rating: '5',
            qualityScore: '80',
            expectedDelivery: exp,
            actualDelivery: act,
            expectedQuantity: String(s.shippedQuantity ?? s.orderedQuantity ?? 0),
            actualQuantity: String(s.shippedQuantity ?? s.orderedQuantity ?? 0),
            comments: '',
        });
    };

    const submitReview = async () => {
        if (!reviewing) return;
        setSubmitting(true);
        try {
            await reviewDeliveredShipment(reviewing.shipmentId, {
                rating: Number(reviewForm.rating),
                qualityScore: Number(reviewForm.qualityScore),
                expectedDelivery: reviewForm.expectedDelivery,
                actualDelivery: reviewForm.actualDelivery,
                expectedQuantity: Number(reviewForm.expectedQuantity),
                actualQuantity: Number(reviewForm.actualQuantity),
                comments: reviewForm.comments,
            });
            toast.success('Review submitted');
            setShipments((prev) =>
                prev.filter((s) => s.shipmentId !== reviewing.shipmentId)
            );
            setReviewing(null);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const shipmentColumns: ColumnDef<Shipment>[] = [
        {
            id: 'shipment',
            header: 'Shipment',
            accessorFn: (row) => row.shipmentNumber,
            cell: ({ row }) => <div>{row.original.shipmentNumber}</div>,
        },
        {
            id: 'supplier',
            header: 'Supplier',
            accessorFn: (row) => row.supplierName ?? row.supplierOrgId,
            cell: ({ row }) => (
                <div>{row.original.supplierName || row.original.supplierOrgId}</div>
            ),
        },
        {
            id: 'type',
            header: 'Type',
            accessorFn: (row) => row.referenceType ?? '',
            cell: ({ row }) => <div>{row.original.referenceType || '—'}</div>,
        },
        {
            id: 'qty',
            header: 'Qty',
            accessorFn: (row) => row.shippedQuantity ?? row.orderedQuantity ?? 0,
            cell: ({ row }) => (
                <div>{row.original.shippedQuantity ?? row.original.orderedQuantity ?? '—'}</div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button size="sm" onClick={() => openReview(row.original)}>
                    Review
                </Button>
            ),
        },
    ];
    const shipmentTable = useTables<Shipment>({
        data: shipments,
        columns: shipmentColumns,
        pageSize,
        manualPagination: true,
        pageCount: shipmentPageCount,
        pagination: { pageIndex: shipmentPage, pageSize },
        onPaginationChange: (p) => setShipmentPage(p.pageIndex),
    });

    const reviewColumns: ColumnDef<ShipmentReview>[] = [
        {
            id: 'shipment',
            header: 'Shipment',
            accessorFn: (row) => row.shipmentNumber ?? row.shipmentId,
            cell: ({ row }) => (
                <div>{row.original.shipmentNumber || row.original.shipmentId}</div>
            ),
        },
        {
            id: 'supplier',
            header: 'Supplier',
            accessorFn: (row) => row.supplierName ?? '',
            cell: ({ row }) => <div>{row.original.supplierName || '—'}</div>,
        },
        {
            id: 'rating',
            header: 'Rating',
            accessorFn: (row) => row.rating ?? 0,
            cell: ({ row }) => (
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                            key={n}
                            className={
                                n <= (row.original.rating ?? 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                            }
                        />
                    ))}
                </div>
            ),
        },
        {
            id: 'quality',
            header: 'Quality',
            accessorFn: (row) => row.qualityScore ?? 0,
            cell: ({ row }) => <div>{row.original.qualityScore ?? '—'}</div>,
        },
        {
            id: 'created',
            header: 'Reviewed At',
            accessorFn: (row) => row.createdAt ?? '',
            cell: ({ row }) => (
                <div>
                    {row.original.createdAt
                        ? new Date(row.original.createdAt).toLocaleDateString()
                        : '—'}
                </div>
            ),
        },
    ];
    const reviewTable = useTables<ShipmentReview>({
        data: reviews,
        columns: reviewColumns,
        pageSize,
        manualPagination: true,
        pageCount: reviewPageCount,
        pagination: { pageIndex: reviewPage, pageSize },
        onPaginationChange: (p) => setReviewPage(p.pageIndex),
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
                <h1 className="text-2xl font-bold">Delivery Reviews</h1>
                <p className="text-muted-foreground">
                    Review delivered shipments and view previous reviews
                </p>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-2">
                    Delivered shipments to review
                </h2>
                <CentralizedDataTable
                    table={shipmentTable}
                    emptyMessage="No delivered shipments to review"
                />
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-2">
                    Previous reviews
                </h2>
                <CentralizedDataTable
                    table={reviewTable}
                    emptyMessage="No previous reviews"
                />
            </div>

            <Dialog open={reviewing !== null} onOpenChange={(v) => !v && setReviewing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Delivery</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Rating</Label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() =>
                                            setReviewForm({ ...reviewForm, rating: String(n) })
                                        }
                                    >
                                        <Star
                                            className={
                                                n <= Number(reviewForm.rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Quality Score (0-100)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={reviewForm.qualityScore}
                                onChange={(e) =>
                                    setReviewForm({ ...reviewForm, qualityScore: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Expected Delivery</Label>
                            {!editExpected ? (
                                <div className="flex items-center gap-2">
                                    <span>
                                        {expectedDate
                                            ? expectedDate.toLocaleDateString()
                                            : '—'}
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditExpected(true)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            ) : (
                                <DatePicker
                                    date={expectedDate}
                                    allowPast
                                    onDateChange={(d) => {
                                        setExpectedDate(d);
                                        setReviewForm({
                                            ...reviewForm,
                                            expectedDelivery: d
                                                ? d.toISOString()
                                                : '',
                                        });
                                    }}
                                />
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>Actual Delivery</Label>
                            {!editActual ? (
                                <div className="flex items-center gap-2">
                                    <span>
                                        {actualDate
                                            ? actualDate.toLocaleDateString()
                                            : '—'}
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditActual(true)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            ) : (
                                <DatePicker
                                    date={actualDate}
                                    allowPast
                                    onDateChange={(d) => {
                                        setActualDate(d);
                                        setReviewForm({
                                            ...reviewForm,
                                            actualDelivery: d
                                                ? d.toISOString()
                                                : '',
                                        });
                                    }}
                                />
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>Expected Quantity</Label>
                            <Input
                                type="number"
                                value={reviewForm.expectedQuantity}
                                onChange={(e) =>
                                    setReviewForm({ ...reviewForm, expectedQuantity: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Actual Quantity Received</Label>
                            <Input
                                type="number"
                                value={reviewForm.actualQuantity}
                                onChange={(e) =>
                                    setReviewForm({ ...reviewForm, actualQuantity: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Comments</Label>
                            <Textarea
                                value={reviewForm.comments}
                                onChange={(e) =>
                                    setReviewForm({ ...reviewForm, comments: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewing(null)}>
                            Cancel
                        </Button>
                        <Button onClick={submitReview} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}