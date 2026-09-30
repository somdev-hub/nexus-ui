'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    parseOptionalFloat,
    parseOptionalInt,
    parseRequiredNumber,
} from '@/lib/utils';
import {
    createProduct,
    getProductCategories,
    getProductBrands,
} from '@/lib/services/products-service';
import type { ProductCreateRequest } from '@/types/products';

// Zod schema for product creation validation
const productCreateSchema = z.object({
    productCode: z
        .string()
        .min(1, 'Product code is required')
        .max(50, 'Product code must be 50 characters or less'),
    productName: z
        .string()
        .min(1, 'Product name is required')
        .max(100, 'Product name must be 100 characters or less'),
    description: z
        .string()
        .min(1, 'Description is required')
        .max(1000, 'Description must be 1000 characters or less'),
    category: z.string().min(1, 'Category is required'),
    subCategory: z.string().optional(),
    brand: z.string().optional(),
    unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    taxRate: z
        .number()
        .min(0, 'Tax rate must be positive')
        .max(100, 'Tax rate cannot exceed 100%'),
    isActive: z.boolean(),
    minOrderQuantity: z
        .number()
        .min(1, 'Minimum order quantity must be at least 1'),
    maxOrderQuantity: z.number().optional(),
    leadTimeDays: z.number().min(0, 'Lead time must be positive'),
    weight: z.number().optional(),
    dimensions: z.string().optional(),
    barcode: z.string().optional(),
    sku: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

type ProductCreateFormData = z.infer<typeof productCreateSchema>;

// localStorage key for the in-progress "new product" draft.
const NEW_PRODUCT_DRAFT_KEY = 'nexus:product:draft:new';

const Page = () => {
    const [categories, setCategories] = useState<string[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftLoaded, setDraftLoaded] = useState(false);

    const form = useForm<ProductCreateFormData>({
        resolver: zodResolver(productCreateSchema),
        defaultValues: {
            productCode: '',
            productName: '',
            description: '',
            category: '',
            subCategory: '',
            brand: '',
            unitOfMeasure: 'PCS',
            unitPrice: 0,
            currency: 'USD',
            taxRate: 0,
            isActive: true,
            minOrderQuantity: 1,
            maxOrderQuantity: undefined,
            leadTimeDays: 0,
            weight: undefined,
            dimensions: '',
            barcode: '',
            sku: '',
            tags: [],
        },
    });

    // Fetch categories and brands on mount, then restore any saved draft
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, brnds] = await Promise.all([
                    getProductCategories(),
                    getProductBrands(),
                ]);
                setCategories(cats);
                setBrands(brnds);
            } catch (error) {
                console.error('Failed to fetch categories/brands:', error);
            }
            try {
                const draft = localStorage.getItem(NEW_PRODUCT_DRAFT_KEY);
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

    const onSubmit = async (data: ProductCreateFormData) => {
        setIsSubmitting(true);
        try {
            const createRequest: ProductCreateRequest = {
                productCode: data.productCode,
                productName: data.productName,
                description: data.description,
                category: data.category,
                subCategory: data.subCategory || undefined,
                brand: data.brand || undefined,
                unitOfMeasure: data.unitOfMeasure,
                unitPrice: data.unitPrice,
                currency: data.currency,
                taxRate: data.taxRate,
                isActive: data.isActive,
                minOrderQuantity: data.minOrderQuantity,
                maxOrderQuantity: data.maxOrderQuantity,
                leadTimeDays: data.leadTimeDays,
                weight: data.weight,
                dimensions: data.dimensions || undefined,
                barcode: data.barcode || undefined,
                sku: data.sku || undefined,
                tags: data.tags,
            };

            await createProduct(createRequest);
            toast.success('Product created successfully');
            try {
                localStorage.removeItem(NEW_PRODUCT_DRAFT_KEY);
            } catch {
                // ignore
            }
            setDraftLoaded(false);
            // Redirect to products list
            window.location.href = '/retailer/products';
        } catch (error) {
            console.error('Failed to create product:', error);
            toast.error('Failed to create product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSaveDraft = async (data: ProductCreateFormData) => {
        try {
            localStorage.setItem(NEW_PRODUCT_DRAFT_KEY, JSON.stringify(data));
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
                            <div className="flex justify-between w-full items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <Link
                                        href="/retailer/products"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <h2 className="text-2xl font-bold">
                                        Add New Product
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={form.handleSubmit(onSaveDraft)}
                                        disabled={isSubmitting}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {draftLoaded
                                            ? 'Update Draft'
                                            : 'Save Draft'}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {isSubmitting
                                            ? 'Creating...'
                                            : 'Publish Product'}
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 flex w-full gap-6">
                                <div className="flex flex-col gap-4 w-2/3">
                                    {/* Basic Information */}
                                    <Card className="p-4 gap-2">
                                        <CardHeader>
                                            <CardTitle>
                                                Basic Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-0">
                                            <FormField
                                                control={form.control}
                                                name="productName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Product Name *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter product name"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="productCode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Product Code *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter product code (e.g., PRD-001)"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Description *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter product description"
                                                                rows={3}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="category"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Category *
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
                                                                        <SelectValue placeholder="Select category" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {categories.map(
                                                                            (
                                                                                cat
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        cat
                                                                                    }
                                                                                    value={
                                                                                        cat
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        cat
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
                                                <FormField
                                                    control={form.control}
                                                    name="subCategory"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Sub Category
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter sub category"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="brand"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Brand
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Select
                                                                    onValueChange={(
                                                                        v
                                                                    ) =>
                                                                        field.onChange(
                                                                            v ===
                                                                                '__none'
                                                                                ? ''
                                                                                : v
                                                                        )
                                                                    }
                                                                    value={
                                                                        field.value ||
                                                                        '__none'
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Select brand (optional)" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="__none">
                                                                            None
                                                                        </SelectItem>
                                                                        {brands.map(
                                                                            (
                                                                                brand
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        brand
                                                                                    }
                                                                                    value={
                                                                                        brand
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        brand
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
                                                <FormField
                                                    control={form.control}
                                                    name="unitOfMeasure"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Unit of Measure
                                                                *
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
                                                                        <SelectValue placeholder="Select UOM" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="PCS">
                                                                            PCS
                                                                            -
                                                                            Pieces
                                                                        </SelectItem>
                                                                        <SelectItem value="KG">
                                                                            KG -
                                                                            Kilograms
                                                                        </SelectItem>
                                                                        <SelectItem value="M">
                                                                            M -
                                                                            Meters
                                                                        </SelectItem>
                                                                        <SelectItem value="L">
                                                                            L -
                                                                            Liters
                                                                        </SelectItem>
                                                                        <SelectItem value="BOX">
                                                                            BOX
                                                                            -
                                                                            Boxes
                                                                        </SelectItem>
                                                                        <SelectItem value="PACK">
                                                                            PACK
                                                                            -
                                                                            Packs
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Pricing & Inventory */}
                                    <Card className="p-4 gap-2">
                                        <CardHeader>
                                            <CardTitle>
                                                Pricing & Inventory
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-0">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="unitPrice"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Unit Price *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    placeholder="0.00"
                                                                    value={
                                                                        field.value?.toString() ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        field.onChange(
                                                                            parseRequiredNumber(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                                parseFloat,
                                                                                0
                                                                            )
                                                                        )
                                                                    }
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
                                                                            USD
                                                                            - US
                                                                            Dollar
                                                                        </SelectItem>
                                                                        <SelectItem value="EUR">
                                                                            EUR
                                                                            -
                                                                            Euro
                                                                        </SelectItem>
                                                                        <SelectItem value="GBP">
                                                                            GBP
                                                                            -
                                                                            British
                                                                            Pound
                                                                        </SelectItem>
                                                                        <SelectItem value="INR">
                                                                            INR
                                                                            -
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
                                                    name="taxRate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Tax Rate (%) *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0.00"
                                                                    value={
                                                                        field.value?.toString() ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        field.onChange(
                                                                            parseRequiredNumber(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                                parseFloat,
                                                                                0
                                                                            )
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Enter tax rate
                                                                as percentage
                                                                (e.g., 18 for
                                                                18%)
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="minOrderQuantity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Min Order
                                                                Quantity *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    placeholder="1"
                                                                    value={
                                                                        field.value?.toString() ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        field.onChange(
                                                                            parseRequiredNumber(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    parseInt(
                                                                                        v,
                                                                                        10
                                                                                    ),
                                                                                1
                                                                            )
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="maxOrderQuantity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Max Order
                                                                Quantity
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    placeholder="Optional"
                                                                    value={
                                                                        field.value?.toString() ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        field.onChange(
                                                                            parseOptionalInt(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Leave empty for
                                                                no maximum
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="leadTimeDays"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Lead Time (Days)
                                                                *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    value={
                                                                        field.value?.toString() ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        field.onChange(
                                                                            parseRequiredNumber(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    parseInt(
                                                                                        v,
                                                                                        10
                                                                                    ),
                                                                                0
                                                                            )
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Physical Properties */}
                                    <Card className="p-4 gap-2">
                                        <CardHeader>
                                            <CardTitle>
                                                Physical Properties (Optional)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-0">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="weight"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Weight (kg)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    placeholder="0.00"
                                                                    value={
                                                                        field.value?.toString() ||
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
                                                                            )
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="dimensions"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Dimensions
                                                                (LxWxH cm)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="e.g., 30x20x10"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="barcode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Barcode
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter barcode"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="sku"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                SKU
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter SKU"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="tags"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Tags (comma
                                                            separated)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="tag1, tag2, tag3"
                                                                value={
                                                                    field.value?.join(
                                                                        ', '
                                                                    ) || ''
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target.value
                                                                            .split(
                                                                                ','
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    t
                                                                                ) =>
                                                                                    t.trim()
                                                                            )
                                                                            .filter(
                                                                                Boolean
                                                                            )
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Enter tags separated
                                                            by commas
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="flex flex-col gap-4 w-1/3">
                                    {/* Status & Settings */}
                                    <Card className="p-4 gap-2">
                                        <CardHeader>
                                            <CardTitle>
                                                Status & Settings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-0">
                                            <FormField
                                                control={form.control}
                                                name="isActive"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-3">
                                                        <FormControl>
                                                            <Switch
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1">
                                                            <FormLabel className="mb-0">
                                                                Active Product
                                                            </FormLabel>
                                                            <FormDescription>
                                                                Product will be
                                                                visible and
                                                                available for
                                                                orders
                                                            </FormDescription>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <Separator />
                                            <div className="space-y-2">
                                                <FormLabel>
                                                    Product Images
                                                </FormLabel>
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden"
                                                        id="image-upload"
                                                    />
                                                    <label
                                                        htmlFor="image-upload"
                                                        className="cursor-pointer"
                                                    >
                                                        <p className="text-gray-600 mb-2">
                                                            Drag and drop images
                                                            here
                                                        </p>
                                                        <p className="text-sm text-gray-500 mb-4">
                                                            or
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            className="cursor-pointer"
                                                        >
                                                            Select Images
                                                        </Button>
                                                    </label>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Images will be uploaded
                                                    after product creation
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default Page;
