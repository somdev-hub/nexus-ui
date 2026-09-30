'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createSupplierContract } from '@/lib/services/supplier-contracts-service';
import { getSuppliers } from '@/lib/services/suppliers-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { parseOptionalFloat, parseOptionalInt } from '@/lib/utils';
import type { Supplier } from '@/types/suppliers';

const contractCreateSchema = z.object({
    supplierId: z.number().min(1, 'Supplier is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    autoRenewal: z.boolean(),
    renewalPeriodDays: z.number().min(0),
    paymentTerms: z.string().min(1, 'Payment terms are required'),
    currency: z.string().min(1, 'Currency is required'),
    totalValue: z.number().min(0.01, 'Total value must be positive'),
});

type ContractCreateFormData = z.infer<typeof contractCreateSchema>;

const Page = () => {
    const router = useRouter();
    const { orgId } = useUserMetadata();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ContractCreateFormData>({
        resolver: zodResolver(contractCreateSchema),
        defaultValues: {
            supplierId: 0,
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            autoRenewal: false,
            renewalPeriodDays: 0,
            paymentTerms: 'Net 30',
            currency: 'USD',
            totalValue: 0,
        },
    });

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await getSuppliers({});
                setSuppliers(res.content ?? []);
            } catch (error) {
                console.error('Failed to fetch suppliers:', error);
            }
        };
        fetchSuppliers();
    }, []);

    const onSubmit = async (data: ContractCreateFormData) => {
        const retailerOrgId = Number(orgId);
        if (!orgId || !Number.isFinite(retailerOrgId) || retailerOrgId <= 0) {
            toast.error(
                'Organization context missing — please re-login and try again'
            );
            return;
        }
        setIsSubmitting(true);
        try {
            await createSupplierContract({
                supplierId: data.supplierId,
                retailerOrgId,
                title: data.title,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                autoRenewal: data.autoRenewal,
                renewalPeriodDays: data.renewalPeriodDays,
                paymentTerms: data.paymentTerms,
                currency: data.currency,
                totalValue: data.totalValue,
            });
            toast.success('Supplier contract created successfully');
            router.push('/retailer/supplier-contracts');
        } catch (error) {
            console.error('Failed to create supplier contract:', error);
            toast.error(
                'Failed to create supplier contract. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
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
                                        href="/retailer/supplier-contracts"
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <h2 className="text-2xl font-bold">
                                        Create Supplier Contract
                                    </h2>
                                </div>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {isSubmitting
                                        ? 'Creating...'
                                        : 'Create Contract'}
                                </Button>
                            </div>

                            <Card className="gap-2 p-4">
                                <CardHeader>
                                    <CardTitle>Contract Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                                                    Number(v)
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
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Title *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Annual Supply Agreement"
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
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Description *
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={3}
                                                        placeholder="Contract scope and terms"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Start Date *
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
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        End Date *
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
                                                                    EUR - Euro
                                                                </SelectItem>
                                                                <SelectItem value="GBP">
                                                                    GBP -
                                                                    British
                                                                    Pound
                                                                </SelectItem>
                                                                <SelectItem value="INR">
                                                                    INR - Indian
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
                                            name="totalValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Total Value *
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
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseOptionalFloat(
                                                                        e.target
                                                                            .value
                                                                    ) ?? 0
                                                                )
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
                                            name="autoRenewal"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                    <FormLabel>
                                                        Auto Renewal
                                                    </FormLabel>
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
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="renewalPeriodDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Renewal Period (days)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            placeholder="0"
                                                            value={
                                                                field.value?.toString() ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseOptionalInt(
                                                                        e.target
                                                                            .value
                                                                    ) ?? 0
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
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default Page;
