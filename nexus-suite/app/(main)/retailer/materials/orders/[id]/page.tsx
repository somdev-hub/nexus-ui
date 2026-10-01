'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldSeparator } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { PrinterIcon, TrashIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cancelOrder, getOrderById } from '@/lib/services/orders-service';
import type { Order } from '@/types/orders';

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const orderId = Number(params.id);
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await getOrderById(orderId);
                if (!isActive) return;
                setOrder(res);
            } catch (err: unknown) {
                if (!isActive) return;
                toast.error(
                    err instanceof Error ? err.message : 'Failed to load order'
                );
            } finally {
                if (isActive) setIsLoading(false);
            }
        };
        if (Number.isFinite(orderId)) load();
        else setIsLoading(false);
        return () => {
            isActive = false;
        };
    }, [orderId]);

    const handleCancel = async () => {
        if (
            typeof window !== 'undefined' &&
            !window.confirm(
                `Cancel order ${order?.orderNumber ?? orderId}? This cannot be undone.`
            )
        )
            return;
        setIsCancelling(true);
        try {
            await cancelOrder(orderId);
            toast.success('Order cancelled');
            router.push('/retailer/materials/orders');
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to cancel order'
            );
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                <p className="text-sm text-muted-foreground">
                    Order #{params.id} not found.
                </p>
                <Button
                    variant="outline"
                    className="w-fit"
                    onClick={() => router.push('/retailer/materials/orders')}
                >
                    Back to orders
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
                    <div className="w-full">
                        <div className="flex justify-between w-full">
                            <h2 className="text-lg font-semibold mb-2">
                                Order {order.orderNumber}
                                <Badge
                                    className="ml-2"
                                    variant={
                                        order.status === 'CANCELLED'
                                            ? 'destructive'
                                            : 'default'
                                    }
                                >
                                    {order.status}
                                </Badge>
                            </h2>
                            <div className="flex gap-2">
                                <Button onClick={() => window.print()}>
                                    <PrinterIcon className="mr-2 h-4 w-4" />
                                    Print
                                </Button>
                                {order.status !== 'CANCELLED' && (
                                    <Button
                                        variant="destructive"
                                        disabled={isCancelling}
                                        onClick={handleCancel}
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Cancel Order
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <Card className="p-4 gap-4 w-1/3">
                                <div className="">
                                    <h1 className="text-2xl font-semibold">
                                        {order.orderNumber}
                                    </h1>
                                    <p>
                                        Placed on:{' '}
                                        {order.orderDate
                                            ? new Date(
                                                  order.orderDate
                                              ).toLocaleDateString()
                                            : '-'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Expected:{' '}
                                        {order.expectedDeliveryDate
                                            ? new Date(
                                                  order.expectedDeliveryDate
                                              ).toLocaleDateString()
                                            : '-'}
                                    </p>
                                </div>
                                <FieldSeparator />
                                <div className="">
                                    <h2 className="text-lg mb-2">
                                        Supplier Information
                                    </h2>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>
                                            <b>Supplier Name:</b>{' '}
                                            {order.supplierOrgName ??
                                                `#${order.supplierOrgId}`}
                                        </li>
                                        <li>
                                            <b>Payment terms:</b>{' '}
                                            {order.paymentTerms}
                                        </li>
                                        <li>
                                            <b>Shipping address:</b>{' '}
                                            {order.shippingAddress}
                                        </li>
                                        <li>
                                            <b>Billing address:</b>{' '}
                                            {order.billingAddress}
                                        </li>
                                    </ul>
                                </div>
                                {order.notes && (
                                    <Card className="mt-2 p-4 gap-1 bg-muted">
                                        <h2 className="font-semibold">Notes</h2>
                                        <p className="text-muted-foreground">
                                            {order.notes}
                                        </p>
                                    </Card>
                                )}
                            </Card>
                            <Card className="p-4 gap-4 w-2/3">
                                <div className="">
                                    <h2 className="font-bold">Order summary</h2>
                                    <div className="text-sm mt-2 space-y-2">
                                        <div className="flex justify-between">
                                            <p>
                                                Retailer:{' '}
                                                {order.retailerOrgName ??
                                                    `#${order.retailerOrgId}`}
                                            </p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p>Currency</p>
                                            <p>{order.currency}</p>
                                        </div>
                                    </div>
                                    <FieldSeparator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <p>Total</p>
                                        <p>
                                            {order.currency}{' '}
                                            {Number(
                                                order.totalAmount
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Page;
