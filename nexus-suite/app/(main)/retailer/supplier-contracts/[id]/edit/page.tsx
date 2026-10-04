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
import { DatePicker } from '@/components/ui/date-picker';
import { formatYmd, parseYmd } from '@/lib/date-utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getSupplierContractById,
    updateSupplierContract,
} from '@/lib/services/supplier-contracts-service';
import { parseOptionalFloat, parseOptionalInt } from '@/lib/utils';
import { CURRENCIES } from '@/lib/currency';

const CONTRACT_TYPES = [
    'STANDARD',
    'BLANKET',
    'FRAMEWORK',
    'CONSIGNMENT',
    'VMI',
] as const;

const contractUpdateSchema = z.object({
    contractNumber: z
        .string()
        .min(1, 'Contract number is required')
        .max(50, 'Contract number must not exceed 50 characters'),
    contractName: z
        .string()
        .min(1, 'Contract name is required')
        .max(200, 'Contract name must not exceed 200 characters'),
    description: z
        .string()
        .max(2000, 'Description must not exceed 2000 characters')
        .optional(),
    contractType: z.enum(CONTRACT_TYPES, {
        message: 'Contract type is required',
    }),
    effectiveDate: z.string().min(1, 'Effective date is required'),
    expiryDate: z.string().optional(),
    autoRenewal: z.boolean().optional(),
    renewalNoticeDays: z.number().min(0).optional(),
    baseCurrency: z.string().optional(),
    paymentTermsDays: z.number().min(0).optional(),
    contractAmount: z.number().min(0).optional(),
    incoterms: z
        .string()
        .max(10, 'Incoterms must not exceed 10 characters')
        .optional(),
});

type ContractUpdateFormData = z.infer<typeof contractUpdateSchema>;

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const numericId = Number(id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [contractNumber, setContractNumber] = useState('');

    const form = useForm<ContractUpdateFormData>({
        resolver: zodResolver(contractUpdateSchema),
        defaultValues: {
            contractNumber: '',
            contractName: '',
            description: '',
            contractType: 'STANDARD',
            effectiveDate: '',
            expiryDate: '',
            autoRenewal: false,
            renewalNoticeDays: 30,
            baseCurrency: 'USD',
            paymentTermsDays: 30,
            incoterms: '',
        },
    });

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            if (!Number.isFinite(numericId)) {
                toast.error('Invalid contract id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getSupplierContractById(numericId);
                if (!active) return;
                setContractNumber(data.contractNumber ?? '');
                form.reset({
                    contractNumber: data.contractNumber ?? '',
                    contractName: data.contractName ?? '',
                    description: (data.description as string) ?? '',
                    contractType: data.contractType ?? 'STANDARD',
                    effectiveDate: data.effectiveDate ?? '',
                    expiryDate: (data.expiryDate as string) ?? '',
                    autoRenewal: data.autoRenewal ?? false,
                    renewalNoticeDays: data.renewalNoticeDays ?? 30,
                    baseCurrency: (data.baseCurrency as string) ?? 'USD',
                    paymentTermsDays: data.paymentTermsDays ?? 30,
                    contractAmount: data.contractAmount ?? undefined,
                    incoterms: (data.incoterms as string) ?? '',
                });
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch supplier contract:', error);
                toast.error('Failed to load supplier contract');
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

    const onSubmit = async (data: ContractUpdateFormData) => {
        setIsSaving(true);
        try {
            await updateSupplierContract(numericId, {
                contractNumber: data.contractNumber?.trim() || undefined,
                contractName: data.contractName?.trim() || undefined,
                description: data.description?.trim() || undefined,
                contractType: data.contractType,
                effectiveDate: data.effectiveDate || undefined,
                expiryDate: data.expiryDate || undefined,
                autoRenewal: data.autoRenewal,
                renewalNoticeDays: data.renewalNoticeDays,
                baseCurrency: data.baseCurrency || undefined,
                paymentTermsDays: data.paymentTermsDays,
                contractAmount: data.contractAmount,
                incoterms: data.incoterms?.trim() || undefined,
            });
            toast.success('Supplier contract updated successfully');
            router.push(`/retailer/supplier-contracts/${numericId}`);
        } catch (error) {
            console.error('Failed to update supplier contract:', error);
            toast.error(
                'Failed to update supplier contract. Please try again.'
            );
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
                                        href={`/retailer/supplier-contracts/${numericId}`}
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <h2 className="text-2xl font-bold">
                                        Edit Contract
                                        {contractNumber
                                            ? ` ${contractNumber}`
                                            : ''}
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
                                    <CardTitle>Contract Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="contractNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Contract Number *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. CON-123456"
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
                                            name="contractName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Contract Name *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Contract name"
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
                                        name="contractType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Contract Type *
                                                </FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select contract type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {CONTRACT_TYPES.map(
                                                                (t) => (
                                                                    <SelectItem
                                                                        key={t}
                                                                        value={
                                                                            t
                                                                        }
                                                                    >
                                                                        {t}
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
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Description
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={3}
                                                        placeholder="Contract scope and terms"
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
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="effectiveDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Effective Date *
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
                                                            placeholder="Pick effective date"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="expiryDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Expiry Date
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
                                                            placeholder="Pick expiry date"
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
                                            name="baseCurrency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Base Currency
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select currency" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {CURRENCIES.map(
                                                                    (c) => (
                                                                        <SelectItem
                                                                            key={
                                                                                c.code
                                                                            }
                                                                            value={
                                                                                c.code
                                                                            }
                                                                        >
                                                                            {
                                                                                c.code
                                                                            }{' '}
                                                                            -{' '}
                                                                            {
                                                                                c.label
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
                                            name="contractAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Contract Amount
                                                        (optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="e.g. 50000"
                                                            value={
                                                                field.value?.toString() ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseOptionalFloat(
                                                                        e.target
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
                                            name="paymentTermsDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Payment Terms (days)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            placeholder="30"
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
                                            name="autoRenewal"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                    <FormLabel>
                                                        Auto Renewal
                                                    </FormLabel>
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
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="renewalNoticeDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Renewal Notice Days
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            placeholder="30"
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
