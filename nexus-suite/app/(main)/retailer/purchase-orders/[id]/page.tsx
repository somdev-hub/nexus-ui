'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getPurchaseOrderById,
    transitionPurchaseOrder,
} from '@/lib/services/purchase-orders-service';
import type { PurchaseOrder } from '@/types/purchase-orders';

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const numericId = Number(id);

    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            if (!Number.isFinite(numericId)) {
                setLoadError('Invalid purchase order id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getPurchaseOrderById(numericId);
                if (!active) return;
                setPurchaseOrder(data);
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch purchase order:', error);
                const message =
                    (
                        error as {
                            response?: { data?: { message?: string } };
                        }
                    )?.response?.data?.message ||
                    (error instanceof Error
                        ? error.message
                        : 'Failed to load purchase order');
                setLoadError(
                    `Could not load purchase order #${id}: ${message}`
                );
                toast.error('Failed to load purchase order');
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [id, numericId]);

    const handleSubmitForApproval = async () => {
        if (!purchaseOrder) return;
        if (
            typeof window !== 'undefined' &&
            !window.confirm(
                `Submit purchase order ${purchaseOrder.purchaseOrderNumber} for approval?`
            )
        )
            return;
        setIsSubmitting(true);
        try {
            const updated = await transitionPurchaseOrder(
                purchaseOrder.purchaseOrderId,
                'PENDING_APPROVAL'
            );
            setPurchaseOrder(updated);
            toast.success('Purchase order submitted for approval');
            router.refresh();
        } catch (error) {
            console.error('Failed to submit purchase order:', error);
            toast.error('Failed to submit purchase order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (loadError || !purchaseOrder) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
                <p className="text-muted-foreground">
                    {loadError ?? 'Purchase order not found'}
                </p>
                <Button variant="outline" asChild>
                    <Link href="/retailer/purchase-orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Purchase Orders
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:gap-6 md:p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/retailer/purchase-orders"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">
                                    {purchaseOrder.purchaseOrderNumber}
                                </h2>
                                <Badge variant="outline">
                                    {purchaseOrder.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {purchaseOrder.supplierOrgName}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={`/retailer/purchase-orders/${purchaseOrder.purchaseOrderId}/edit`}
                            >
                                Edit
                            </Link>
                        </Button>
                        {purchaseOrder.status === 'DRAFT' && (
                            <Button
                                onClick={handleSubmitForApproval}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting
                                    ? 'Submitting...'
                                    : 'Submit for Approval'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">
                                Order Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Retailer
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.retailerOrgName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Supplier
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.supplierOrgName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Order Date
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.orderDate || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Expected Delivery
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.expectedDeliveryDate || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Payment Terms
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.paymentTerms || '—'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">Totals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Currency
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.currency}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">
                                    Total Amount
                                </span>
                                <span className="font-mono text-lg font-semibold">
                                    {purchaseOrder.currency}{' '}
                                    {purchaseOrder.totalAmount.toLocaleString(
                                        undefined,
                                        { minimumFractionDigits: 2 }
                                    )}
                                </span>
                            </div>
                            {purchaseOrder.approvedBy && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Approved By
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.approvedBy}
                                        {purchaseOrder.approvedAt
                                            ? ` on ${purchaseOrder.approvedAt}`
                                            : ''}
                                    </span>
                                </div>
                            )}
                            {purchaseOrder.rejectionReason && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Rejection Reason
                                    </span>
                                    <span className="font-medium">
                                        {purchaseOrder.rejectionReason}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">Addresses</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Shipping Address
                                </p>
                                <p className="font-medium">
                                    {purchaseOrder.shippingAddress || '—'}
                                </p>
                            </div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Billing Address
                                </p>
                                <p className="font-medium">
                                    {purchaseOrder.billingAddress || '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">
                                Notes & Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="text-sm">
                                <p className="text-muted-foreground">Notes</p>
                                <p className="font-medium">
                                    {purchaseOrder.notes || '—'}
                                </p>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Created
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.createdAt} by{' '}
                                    {purchaseOrder.createdBy}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Updated
                                </span>
                                <span className="font-medium">
                                    {purchaseOrder.updatedAt} by{' '}
                                    {purchaseOrder.updatedBy}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Page;
