'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Save, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createPurchaseOrder } from '@/lib/services/purchase-orders-service';
import { getSuppliers } from '@/lib/services/suppliers-service';
import { getProducts } from '@/lib/services/products-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { parseOptionalFloat } from '@/lib/utils';
import type { Supplier } from '@/types/suppliers';
import type { Product } from '@/types/products';

const lineItemSchema = z.object({
    productId: z.number().optional(),
    description: z.string().min(1, 'Description is required'),
    quantityOrdered: z.number().min(0.01, 'Quantity must be positive'),
    unitPrice: z.number().min(0.01, 'Unit price must be positive'),
});

const poCreateSchema = z.object({
    poNumber: z.string().min(1, 'PO number is required'),
    supplierId: z.number().min(1, 'Supplier is required'),
    paymentTerms: z.string().min(1, 'Payment terms are required'),
    currency: z.string().min(1, 'Currency is required'),
    incoterms: z.string().optional(),
    requestedDeliveryDate: z.string().min(1, 'Delivery date is required'),
    expectedDeliveryDate: z.string().optional(),
    notes: z.string().optional(),
    isBlanketOrder: z.boolean().optional(),
    blanketStartDate: z.string().optional(),
    blanketEndDate: z.string().optional(),
    releaseSchedule: z.string().optional(),
    lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item'),
});

type PoCreateFormData = z.infer<typeof poCreateSchema>;

const PO_DRAFT_KEY = 'nexus:po:draft:new';

const newPoNumber = () => `PO-${Date.now().toString().slice(-6)}`;

const Page = () => {
    const { orgId } = useUserMetadata();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftLoaded, setDraftLoaded] = useState(false);

    const form = useForm<PoCreateFormData>({
        resolver: zodResolver(poCreateSchema),
        defaultValues: {
            poNumber: newPoNumber(),
            supplierId: 0,
            paymentTerms: 'Net 30',
            currency: 'USD',
            incoterms: '',
            requestedDeliveryDate: '',
            expectedDeliveryDate: '',
            notes: '',
            isBlanketOrder: false,
            blanketStartDate: '',
            blanketEndDate: '',
            releaseSchedule: '',
            lineItems: [
                {
                    productId: undefined,
                    description: '',
                    quantityOrdered: 1,
                    unitPrice: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'lineItems',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sup, prod] = await Promise.all([
                    getSuppliers({}).catch(() => null),
                    getProducts({ pageNo: 0, pageOffset: 50 }).catch(
                        () => null
                    ),
                ]);
                if (sup) setSuppliers(sup.content ?? []);
                if (prod) setProducts(prod.content ?? []);
            } catch (error) {
                console.error('Failed to fetch suppliers/products:', error);
            }
            try {
                const draft = localStorage.getItem(PO_DRAFT_KEY);
                if (draft) {
                    form.reset({ ...form.getValues(), ...JSON.parse(draft) });
                    setDraftLoaded(true);
                    toast.info('Draft restored');
                }
            } catch {
                // corrupt draft — ignore and start blank
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const watchedItems = form.watch('lineItems');
    const total = watchedItems.reduce(
        (sum, it) =>
            sum +
            (Number(it.quantityOrdered) || 0) * (Number(it.unitPrice) || 0),
        0
    );

    const applyProductToLine = (index: number, productId: number) => {
        const product = products.find((p) => p.productId === productId);
        form.setValue(`lineItems.${index}.productId`, productId, {
            shouldValidate: true,
        });
        if (product) {
            const currentDesc = form.getValues(
                `lineItems.${index}.description`
            );
            if (!currentDesc) {
                form.setValue(
                    `lineItems.${index}.description`,
                    product.productName,
                    { shouldValidate: true }
                );
            }
            if (!form.getValues(`lineItems.${index}.unitPrice`)) {
                form.setValue(
                    `lineItems.${index}.unitPrice`,
                    product.unitPrice,
                    { shouldValidate: true }
                );
            }
        }
    };

    const onSubmit = async (data: PoCreateFormData) => {
        const buyerOrgId = Number(orgId);
        if (!orgId || !Number.isFinite(buyerOrgId) || buyerOrgId <= 0) {
            toast.error(
                'Organization context missing — please re-login and try again'
            );
            return;
        }
        setIsSubmitting(true);
        try {
            await createPurchaseOrder({
                poNumber: data.poNumber,
                buyerOrgId,
                supplierId: data.supplierId,
                paymentTerms: data.paymentTerms,
                currency: data.currency,
                incoterms: data.incoterms || undefined,
                requestedDeliveryDate: data.requestedDeliveryDate,
                expectedDeliveryDate: data.expectedDeliveryDate || undefined,
                notes: data.notes || undefined,
                isBlanketOrder: data.isBlanketOrder || undefined,
                blanketStartDate: data.blanketStartDate || undefined,
                blanketEndDate: data.blanketEndDate || undefined,
                releaseSchedule: data.releaseSchedule || undefined,
                lineItems: data.lineItems.map((it, idx) => ({
                    lineNumber: idx + 1,
                    description: it.description,
                    quantityOrdered: it.quantityOrdered,
                    unitPrice: it.unitPrice,
                    productId: it.productId,
                })),
            });
            toast.success('Purchase order created successfully');
            try {
                localStorage.removeItem(PO_DRAFT_KEY);
            } catch {
                // ignore
            }
            setDraftLoaded(false);
            window.location.href = '/retailer/purchase-orders';
        } catch (error) {
            console.error('Failed to create purchase order:', error);
            toast.error('Failed to create purchase order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSaveDraft = async (data: PoCreateFormData) => {
        try {
            localStorage.setItem(PO_DRAFT_KEY, JSON.stringify(data));
            setDraftLoaded(true);
            toast.success('Draft saved — it will be restored on revisit');
        } catch {
            toast.error('Could not save draft in this browser');
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
                        <div className="w-full">
                            <div className="mb-6 flex w-full items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Link
                                        href="/retailer/purchase-orders"
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <h2 className="text-2xl font-bold">
                                        Create Purchase Order
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={form.handleSubmit(onSaveDraft)}
                                        disabled={isSubmitting}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {draftLoaded
                                            ? 'Update Draft'
                                            : 'Save Draft'}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {isSubmitting
                                            ? 'Creating...'
                                            : 'Create PO'}
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 flex w-full flex-col gap-4">
                                <Card className="gap-2 p-4">
                                    <CardHeader>
                                        <CardTitle>Order Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-0">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="poNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            PO Number *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. PO-882310"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="supplierId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Supplier *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                onValueChange={(
                                                                    v
                                                                ) =>
                                                                    field.onChange(
                                                                        Number(
                                                                            v
                                                                        )
                                                                    )
                                                                }
                                                                value={
                                                                    field.value
                                                                        ? String(
                                                                              field.value
                                                                          )
                                                                        : ''
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select supplier" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {suppliers.map(
                                                                        (s) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    s.supplierId
                                                                                }
                                                                                value={String(
                                                                                    s.supplierId
                                                                                )}
                                                                            >
                                                                                {
                                                                                    s.businessName
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <FormField
                                                control={form.control}
                                                name="paymentTerms"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Payment Terms *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. Net 30"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Currency *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                defaultValue={
                                                                    field.value
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select currency" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="USD">
                                                                        USD - US
                                                                        Dollar
                                                                    </SelectItem>
                                                                    <SelectItem value="EUR">
                                                                        EUR -
                                                                        Euro
                                                                    </SelectItem>
                                                                    <SelectItem value="GBP">
                                                                        GBP -
                                                                        British
                                                                        Pound
                                                                    </SelectItem>
                                                                    <SelectItem value="INR">
                                                                        INR -
                                                                        Indian
                                                                        Rupee
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="incoterms"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Incoterms
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. FOB"
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
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="requestedDeliveryDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Requested Delivery
                                                            Date *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="date"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="expectedDeliveryDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Expected Delivery
                                                            Date
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
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Notes</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="e.g. Deliver to dock 4, call on arrival"
                                                            rows={2}
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
                                    </CardContent>
                                </Card>

                                <Card className="gap-2 p-4">
                                    <CardHeader>
                                        <CardTitle>Blanket Order</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-0">
                                        <FormField
                                            control={form.control}
                                            name="isBlanketOrder"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={
                                                                field.value ??
                                                                false
                                                            }
                                                            onCheckedChange={
                                                                field.onChange
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormLabel>
                                                        This is a blanket order
                                                        (scheduled releases)
                                                    </FormLabel>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {form.watch('isBlanketOrder') && (
                                            <>
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="blanketStartDate"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Blanket
                                                                    Start Date
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
                                                        name="blanketEndDate"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Blanket End
                                                                    Date
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
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="releaseSchedule"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Release Schedule
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="e.g. Monthly release of 500 units on the 1st"
                                                                    rows={2}
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
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="gap-2 p-4">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>Line Items</CardTitle>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    append({
                                                        productId: undefined,
                                                        description: '',
                                                        quantityOrdered: 1,
                                                        unitPrice: 0,
                                                    })
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Item
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-0">
                                        {fields.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-12"
                                            >
                                                <div className="md:col-span-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`lineItems.${index}.productId`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Product
                                                                    (optional)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        onValueChange={(
                                                                            v
                                                                        ) =>
                                                                            applyProductToLine(
                                                                                index,
                                                                                Number(
                                                                                    v
                                                                                )
                                                                            )
                                                                        }
                                                                        value={
                                                                            field.value
                                                                                ? String(
                                                                                      field.value
                                                                                  )
                                                                                : ''
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder="Select product" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {products.map(
                                                                                (
                                                                                    p
                                                                                ) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            p.productId
                                                                                        }
                                                                                        value={String(
                                                                                            p.productId
                                                                                        )}
                                                                                    >
                                                                                        {
                                                                                            p.productName
                                                                                        }
                                                                                    </SelectItem>
                                                                                )
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`lineItems.${index}.description`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Description
                                                                    *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="e.g. Hydraulic Pump X200"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <FormField
                                                        control={form.control}
                                                        name={`lineItems.${index}.quantityOrdered`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Qty *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="1"
                                                                        value={
                                                                            field.value?.toString() ??
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            field.onChange(
                                                                                parseOptionalFloat(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ??
                                                                                    0
                                                                            )
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`lineItems.${index}.unitPrice`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Unit Price *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={
                                                                            field.value?.toString() ??
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            field.onChange(
                                                                                parseOptionalFloat(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ??
                                                                                    0
                                                                            )
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex items-end md:col-span-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={
                                                            fields.length <= 1
                                                        }
                                                        onClick={() =>
                                                            remove(index)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {form.formState.errors.lineItems
                                            ?.root && (
                                            <p className="text-sm text-destructive">
                                                {
                                                    form.formState.errors
                                                        .lineItems.root.message
                                                }
                                            </p>
                                        )}
                                        <div className="flex justify-end">
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">
                                                    Estimated total:{' '}
                                                </span>
                                                <span className="font-mono font-semibold">
                                                    {total.toLocaleString(
                                                        undefined,
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default Page;
