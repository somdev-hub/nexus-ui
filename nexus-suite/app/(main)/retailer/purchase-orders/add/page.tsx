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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Plus, Save, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createPurchaseOrder } from '@/lib/services/purchase-orders-service';
import { getRetailerQuotationById } from '@/lib/services/counterparty-docs-service';
import {
    formatOrgAddress,
    getOrgAddresses,
    orgAddressOptionLabel,
    type OrgAddress,
} from '@/lib/services/org-profile-service';
import { getSuppliers } from '@/lib/services/suppliers-service';
import { browseSupplierCatalog } from '@/lib/services/supplier-market-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { parseOptionalFloat } from '@/lib/utils';
import type { Supplier } from '@/types/suppliers';
import type { SupplierBrowseItem } from '@/lib/services/supplier-market-service';

const lineItemSchema = z.object({
    catalogId: z.number().optional(),
    description: z.string().min(1, 'Description is required'),
    quantityOrdered: z.number().min(0.01, 'Quantity must be positive'),
    unitOfMeasure: z.string().optional(),
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

/** yyyy-mm-dd <-> Date helpers (local time, no UTC shift). */
const parseYmd = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const [y, m, d] = value.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
        return undefined;
    return new Date(y, m - 1, d);
};

const formatYmd = (date: Date | undefined): string => {
    if (!date) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const Page = () => {
    const { orgId } = useUserMetadata();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [catalogItems, setCatalogItems] = useState<SupplierBrowseItem[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [sourceQuotationId, setSourceQuotationId] = useState<number | null>(
        null
    );
    const [sourceQuotationNumber, setSourceQuotationNumber] = useState<
        string | null
    >(null);
    const [prefilling, setPrefilling] = useState(false);
    const [orgAddresses, setOrgAddresses] = useState<OrgAddress[]>([]);
    const [shippingId, setShippingId] = useState('');
    const [billingId, setBillingId] = useState('');

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
                    catalogId: undefined,
                    description: '',
                    quantityOrdered: 1,
                    unitOfMeasure: '',
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
            let supList: Supplier[] = [];
            try {
                const sup = await getSuppliers({}).catch(() => null);
                if (sup) {
                    supList = sup.content ?? [];
                    setSuppliers(supList);
                }
            } catch (error) {
                console.error('Failed to fetch suppliers:', error);
            }
            // Converting from a quotation takes precedence over drafts.
            const fromQuotation = new URLSearchParams(
                window.location.search
            ).get('fromQuotation');
            if (fromQuotation) {
                await prefillFromQuotation(Number(fromQuotation), supList);
                return;
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

    // Fill the PO form from an ACCEPTED quotation (Convert to PO flow).
    const prefillFromQuotation = async (
        quotationId: number,
        supList: Supplier[]
    ) => {
        if (!Number.isFinite(quotationId)) {
            toast.error('Invalid quotation reference');
            return;
        }
        setPrefilling(true);
        try {
            const q = await getRetailerQuotationById(quotationId);
            if (q.status !== 'ACCEPTED') {
                toast.error(
                    `Quotation ${q.quotationNumber} is ${q.status} — only ACCEPTED quotations can be converted`
                );
                return;
            }
            const supplier = supList.find(
                (s) => Number(s.supplierOrgAccountId) === Number(q.supplierOrgId)
            );
            if (!supplier) {
                toast.error(
                    'No matching supplier record found for this quotation'
                );
                return;
            }
            let items: SupplierBrowseItem[] = [];
            try {
                const res = await browseSupplierCatalog({
                    supplierOrgId: q.supplierOrgId,
                    pageNo: 0,
                    pageOffset: 100,
                });
                items = res.content ?? [];
                setCatalogItems(items);
            } catch {
                // catalog extras are best-effort; lines still pre-fill
            }
            const byId: Record<number, SupplierBrowseItem> = {};
            for (const it of items) {
                const cid = it.catalogId ?? it.id;
                if (cid !== undefined) byId[Number(cid)] = it;
            }
            const lines = (q.lineItems ?? []).map((li) => ({
                catalogId: li.catalogId,
                description:
                    li.description || li.catalogName || 'Quoted item',
                quantityOrdered: li.quantity ?? 1,
                unitOfMeasure:
                    (li.catalogId !== undefined
                        ? byId[li.catalogId]?.unitOfMeasure
                        : undefined) ?? '',
                unitPrice: Number(li.unitPrice ?? 0),
            }));
            form.reset({
                ...form.getValues(),
                supplierId: supplier.supplierId,
                currency: q.currency || 'USD',
                notes: q.terms
                    ? `Converted from ${q.quotationNumber} — ${q.terms}`
                    : `Converted from ${q.quotationNumber}`,
                lineItems: lines.length
                    ? lines
                    : [
                          {
                              catalogId: undefined,
                              description: '',
                              quantityOrdered: 1,
                              unitOfMeasure: '',
                              unitPrice: 0,
                          },
                      ],
            });
            setSourceQuotationId(q.quotationId);
            setSourceQuotationNumber(q.quotationNumber);
            toast.success(
                `Pre-filled from quotation ${q.quotationNumber}`
            );
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : 'Failed to load quotation'
            );
        } finally {
            setPrefilling(false);
        }
    };

    // Organization addresses for shipping/billing selection. A single
    // address serves both; otherwise the flagged defaults are pre-selected.
    // Applied only on first load so user picks are never overridden.
    useEffect(() => {
        if (!orgId) return;
        let active = true;
        const run = async () => {
            try {
                const list = await getOrgAddresses(orgId);
                if (!active) return;
                setOrgAddresses(list);
                const pickDefault = (
                    current: string,
                    flagged?: OrgAddress
                ) => {
                    if (current) return current;
                    const one = list.length === 1 ? list[0] : undefined;
                    const pick = flagged ?? one;
                    return pick?.orgAddressId !== undefined
                        ? String(pick.orgAddressId)
                        : '';
                };
                setShippingId((cur) =>
                    pickDefault(
                        cur,
                        list.find((a) => a.isDefaultShipping)
                    )
                );
                setBillingId((cur) =>
                    pickDefault(cur, list.find((a) => a.isDefaultBilling))
                );
            } catch {
                // selecting stays optional; backend fills defaults
            }
        };
        run();
        return () => {
            active = false;
        };
    }, [orgId]);

    // When a draft is restored (or supplier preselected), load that
    // supplier's catalog so line items can reference it.
    const selectedSupplierId = form.watch('supplierId');
    useEffect(() => {
        if (
            draftLoaded &&
            suppliers.length > 0 &&
            selectedSupplierId > 0 &&
            catalogItems.length === 0 &&
            !catalogLoading
        ) {
            loadCatalogForSupplier(selectedSupplierId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftLoaded, suppliers, selectedSupplierId]);

    const loadCatalogForSupplier = async (supplierId: number) => {
        const supplier = suppliers.find((s) => s.supplierId === supplierId);
        const supplierOrgId = supplier?.supplierOrgAccountId;
        setCatalogItems([]);
        if (!supplierOrgId) return;
        setCatalogLoading(true);
        try {
            const res = await browseSupplierCatalog({
                supplierOrgId,
                pageNo: 0,
                pageOffset: 100,
            });
            setCatalogItems(res.content ?? []);
        } catch (error) {
            console.error('Failed to fetch supplier catalog:', error);
        } finally {
            setCatalogLoading(false);
        }
    };

    const watchedItems = form.watch('lineItems');
    const total = watchedItems.reduce(
        (sum, it) =>
            sum +
            (Number(it.quantityOrdered) || 0) * (Number(it.unitPrice) || 0),
        0
    );

    const applyCatalogItemToLine = (index: number, catalogId: number) => {
        const item = catalogItems.find(
            (c) => (c.catalogId ?? c.id) === catalogId
        );
        form.setValue(`lineItems.${index}.catalogId`, catalogId, {
            shouldValidate: true,
        });
        if (item) {
            const currentDesc = form.getValues(
                `lineItems.${index}.description`
            );
            if (!currentDesc) {
                form.setValue(
                    `lineItems.${index}.description`,
                    item.name ?? '',
                    { shouldValidate: true }
                );
            }
            if (!form.getValues(`lineItems.${index}.unitPrice`)) {
                form.setValue(
                    `lineItems.${index}.unitPrice`,
                    item.basePrice ?? 0,
                    { shouldValidate: true }
                );
            }
            if (!form.getValues(`lineItems.${index}.unitOfMeasure`)) {
                form.setValue(
                    `lineItems.${index}.unitOfMeasure`,
                    item.unitOfMeasure ?? '',
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
            const addressById: Record<string, OrgAddress> = {};
            for (const a of orgAddresses) {
                if (a.orgAddressId !== undefined)
                    addressById[String(a.orgAddressId)] = a;
            }
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
                sourceQuotationId: sourceQuotationId ?? undefined,
                shippingAddress:
                    shippingId && addressById[shippingId]
                        ? formatOrgAddress(addressById[shippingId])
                        : undefined,
                billingAddress:
                    billingId && addressById[billingId]
                        ? formatOrgAddress(addressById[billingId])
                        : undefined,
                lineItems: data.lineItems.map((it, idx) => ({
                    lineNumber: idx + 1,
                    description: it.description,
                    quantityOrdered: it.quantityOrdered,
                    unitOfMeasure: it.unitOfMeasure || undefined,
                    unitPrice: it.unitPrice,
                    catalogId: it.catalogId,
                })),
            });
            toast.success(
                sourceQuotationId
                    ? 'Purchase order created — quotation marked CONVERTED'
                    : 'Purchase order created successfully'
            );
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
                                {(prefilling || sourceQuotationId) && (
                                    <div className="rounded-md border border-dashed p-3 text-sm">
                                        {prefilling ? (
                                            <span className="text-muted-foreground">
                                                Loading quotation details…
                                            </span>
                                        ) : (
                                            <div className="flex items-center justify-between gap-2">
                                                <span>
                                                    Creating from accepted
                                                    quotation{' '}
                                                    <span className="font-mono font-medium">
                                                        {
                                                            sourceQuotationNumber
                                                        }
                                                    </span>
                                                    {' — '}supplier, currency
                                                    and line items
                                                    pre-filled. The quotation
                                                    will be marked CONVERTED
                                                    on creation.
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSourceQuotationId(
                                                            null
                                                        );
                                                        setSourceQuotationNumber(
                                                            null
                                                        );
                                                    }}
                                                >
                                                    Remove link
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                                        {suppliers.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                                                                There is no
                                                                established
                                                                partnership
                                                                with any
                                                                supplier yet.
                                                                Accept a
                                                                supplier
                                                                invitation
                                                                first to raise
                                                                a purchase
                                                                order.
                                                            </p>
                                                        ) : (
                                                            <FormControl>
                                                                <Select
                                                                onValueChange={(
                                                                    v
                                                                ) => {
                                                                    const id =
                                                                        Number(
                                                                            v
                                                                        );
                                                                    field.onChange(
                                                                        id
                                                                    );
                                                                    loadCatalogForSupplier(
                                                                        id
                                                                    );
                                                                }
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
                                                        )}
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
                                                            <DatePicker
                                                                date={parseYmd(
                                                                    field.value
                                                                )}
                                                                onDateChange={(
                                                                    date
                                                                ) =>
                                                                    field.onChange(
                                                                        formatYmd(
                                                                            date
                                                                        )
                                                                    )
                                                                }
                                                                placeholder="Pick delivery date"
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
                                                            <DatePicker
                                                                date={parseYmd(
                                                                    field.value
                                                                )}
                                                                onDateChange={(
                                                                    date
                                                                ) =>
                                                                    field.onChange(
                                                                        formatYmd(
                                                                            date
                                                                        )
                                                                    )
                                                                }
                                                                placeholder="Pick expected date"
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
                                        <CardTitle>
                                            Delivery & Billing Addresses
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-0">
                                        {orgAddresses.length === 0 ? (
                                            <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                                                No organization addresses
                                                saved yet — add them under HR
                                                → Organization → Org Profile.
                                                If left empty, the backend
                                                applies the defaults when
                                                available.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label>
                                                        Shipping Address
                                                    </Label>
                                                    <Select
                                                        value={shippingId}
                                                        onValueChange={(v) =>
                                                            setShippingId(
                                                                v === '__none'
                                                                    ? ''
                                                                    : v
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select shipping address" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__none">
                                                                — None —
                                                            </SelectItem>
                                                            {orgAddresses.map(
                                                                (a) => (
                                                                    <SelectItem
                                                                        key={
                                                                            a.orgAddressId
                                                                        }
                                                                        value={String(
                                                                            a.orgAddressId
                                                                        )}
                                                                    >
                                                                        {orgAddressOptionLabel(
                                                                            a
                                                                        )}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Billing Address</Label>
                                                    <Select
                                                        value={billingId}
                                                        onValueChange={(v) =>
                                                            setBillingId(
                                                                v === '__none'
                                                                    ? ''
                                                                    : v
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select billing address" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__none">
                                                                — None —
                                                            </SelectItem>
                                                            {orgAddresses.map(
                                                                (a) => (
                                                                    <SelectItem
                                                                        key={
                                                                            a.orgAddressId
                                                                        }
                                                                        value={String(
                                                                            a.orgAddressId
                                                                        )}
                                                                    >
                                                                        {orgAddressOptionLabel(
                                                                            a
                                                                        )}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
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
                                                                    <DatePicker
                                                                        date={parseYmd(
                                                                            field.value ??
                                                                                ''
                                                                        )}
                                                                        onDateChange={(
                                                                            date
                                                                        ) =>
                                                                            field.onChange(
                                                                                formatYmd(
                                                                                    date
                                                                                )
                                                                            )
                                                                        }
                                                                        placeholder="Pick start date"
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
                                                                    <DatePicker
                                                                        date={parseYmd(
                                                                            field.value ??
                                                                                ''
                                                                        )}
                                                                        onDateChange={(
                                                                            date
                                                                        ) =>
                                                                            field.onChange(
                                                                                formatYmd(
                                                                                    date
                                                                                )
                                                                            )
                                                                        }
                                                                        placeholder="Pick end date"
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

                                {selectedSupplierId > 0 && (
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
                                                        catalogId: undefined,
                                                        description: '',
                                                        quantityOrdered: 1,
                                                        unitOfMeasure: '',
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
                                        {!catalogLoading &&
                                            catalogItems.length === 0 && (
                                                <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                                                    The selected supplier has
                                                    no published catalog
                                                    items. You can still add
                                                    line items manually below.
                                                </p>
                                            )}
                                        {fields.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-12"
                                            >
                                                <div className="md:col-span-3">
                                                    <FormField
                                                        control={form.control}
                                                        name={`lineItems.${index}.catalogId`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Material
                                                                    (from
                                                                    supplier
                                                                    catalog)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        onValueChange={(
                                                                            v
                                                                        ) =>
                                                                            applyCatalogItemToLine(
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
                                                                            <SelectValue
                                                                                placeholder={
                                                                                    catalogLoading
                                                                                        ? 'Loading catalog…'
                                                                                        : catalogItems.length
                                                                                          ? 'Select material'
                                                                                          : 'Select a supplier first'
                                                                                }
                                                                            />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {catalogItems.map(
                                                                                (
                                                                                    c
                                                                                ) => {
                                                                                    const id =
                                                                                        c.catalogId ??
                                                                                        c.id ??
                                                                                        0;
                                                                                    return (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                id
                                                                                            }
                                                                                            value={String(
                                                                                                id
                                                                                            )}
                                                                                        >
                                                                                            {
                                                                                                c.name
                                                                                            }
                                                                                            {c.basePrice
                                                                                                ? ` — ${c.basePrice}`
                                                                                                : ''}
                                                                                        </SelectItem>
                                                                                    );
                                                                                }
                                                                            )}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
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
                                                <div className="md:col-span-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`lineItems.${index}.unitOfMeasure`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    UoM
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="e.g. KG"
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default Page;
