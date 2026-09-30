'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getPurchaseOrderById,
    updatePurchaseOrder,
} from '@/lib/services/purchase-orders-service';

const poUpdateSchema = z.object({
    expectedDeliveryDate: z.string().optional(),
    paymentTerms: z.string().optional(),
    shippingAddress: z.string().optional(),
    billingAddress: z.string().optional(),
    notes: z.string().optional(),
});

type PoUpdateFormData = z.infer<typeof poUpdateSchema>;

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const numericId = Number(id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [poNumber, setPoNumber] = useState('');

    const form = useForm<PoUpdateFormData>({
        resolver: zodResolver(poUpdateSchema),
        defaultValues: {
            expectedDeliveryDate: '',
            paymentTerms: '',
            shippingAddress: '',
            billingAddress: '',
            notes: '',
        },
    });

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            if (!Number.isFinite(numericId)) {
                toast.error('Invalid purchase order id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getPurchaseOrderById(numericId);
                if (!active) return;
                setPoNumber(data.purchaseOrderNumber);
                form.reset({
                    expectedDeliveryDate: data.expectedDeliveryDate ?? '',
                    paymentTerms: data.paymentTerms ?? '',
                    shippingAddress: data.shippingAddress ?? '',
                    billingAddress: data.billingAddress ?? '',
                    notes: data.notes ?? '',
                });
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch purchase order:', error);
                toast.error('Failed to load purchase order');
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, numericId]);

    const onSubmit = async (data: PoUpdateFormData) => {
        setIsSaving(true);
        try {
            await updatePurchaseOrder(numericId, {
                expectedDeliveryDate: data.expectedDeliveryDate || undefined,
                paymentTerms: data.paymentTerms || undefined,
                shippingAddress: data.shippingAddress || undefined,
                billingAddress: data.billingAddress || undefined,
                notes: data.notes || undefined,
            });
            toast.success('Purchase order updated successfully');
            router.push(`/retailer/purchase-orders/${numericId}`);
        } catch (error) {
            console.error('Failed to update purchase order:', error);
            toast.error('Failed to update purchase order. Please try again.');
        } finally {
            setIsSaving(false);
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
                        <div className="w-full">
                            <div className="mb-6 flex w-full items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Link
                                        href={`/retailer/purchase-orders/${numericId}`}
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <h2 className="text-2xl font-bold">
                                        Edit Purchase Order
                                        {poNumber ? ` ${poNumber}` : ''}
                                    </h2>
                                </div>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>

                            <Card className="gap-2 p-4">
                                <CardHeader>
                                    <CardTitle>Order Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="expectedDeliveryDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Expected Delivery Date
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paymentTerms"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Payment Terms
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Net 30"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="shippingAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Shipping Address
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={2}
                                                        placeholder="Shipping address"
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="billingAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Billing Address
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={2}
                                                        placeholder="Billing address"
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={2}
                                                        placeholder="Order notes"
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default Page;
