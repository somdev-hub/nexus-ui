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
import { createSupplierContract } from '@/lib/services/supplier-contracts-service';
import { uploadContractTextDocument } from '@/lib/services/supplier-contracts-service';
import { RichTextEditor } from '@/components/rich-text-editor';
import {
    buildContractTemplate,
    htmlToMarkdown,
    type ContractTemplateValues,
} from '@/lib/contract-doc';
import { getSuppliers } from '@/lib/services/suppliers-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { parseOptionalFloat, parseOptionalInt } from '@/lib/utils';
import { CURRENCIES } from '@/lib/currency';
import type { Supplier } from '@/types/suppliers';

const CONTRACT_TYPES = [
    'STANDARD',
    'BLANKET',
    'FRAMEWORK',
    'CONSIGNMENT',
    'VMI',
] as const;

const generateContractNumber = () =>
    `CON-${Math.floor(100000 + Math.random() * 900000)}`;

const contractCreateSchema = z.object({
    supplierId: z.number().min(1, 'Supplier is required'),
    contractNumber: z
        .string()
        .min(1, 'Contract number is required')
        .max(50, 'Contract number must not exceed 50 characters'),
    contractName: z
        .string()
        .min(1, 'Contract name is required')
        .max(200, 'Contract name must not exceed 200 characters'),
    contractType: z.enum(CONTRACT_TYPES, {
        message: 'Contract type is required',
    }),
    effectiveDate: z.string().min(1, 'Effective date is required'),
    expiryDate: z.string().optional(),
    autoRenewal: z.boolean(),
    renewalNoticeDays: z.number().min(0).optional(),
    baseCurrency: z.string().optional(),
    paymentTermsDays: z.number().min(0).optional(),
    contractAmount: z.number().min(0).optional(),
    incoterms: z
        .string()
        .max(10, 'Incoterms must not exceed 10 characters')
        .optional(),
    description: z
        .string()
        .max(2000, 'Description must not exceed 2000 characters')
        .optional(),
});

type ContractCreateFormData = z.infer<typeof contractCreateSchema>;

const Page = () => {
    const router = useRouter();
    const { orgId } = useUserMetadata();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [docTouched, setDocTouched] = useState(false);
    const [docHtml, setDocHtml] = useState<string>('');

    const form = useForm<ContractCreateFormData>({
        resolver: zodResolver(contractCreateSchema),
        defaultValues: {
            supplierId: 0,
            contractNumber: generateContractNumber(),
            contractName: '',
            contractType: 'STANDARD',
            effectiveDate: '',
            expiryDate: '',
            autoRenewal: false,
            renewalNoticeDays: 30,
            baseCurrency: 'USD',
            paymentTermsDays: 30,
            contractAmount: undefined,
            incoterms: '',
            description: '',
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

    const watched = form.watch();
    const selectedSupplier = suppliers.find(
        (s) => s.supplierId === watched.supplierId
    );

    // Keep the document template in sync with the form until the user
    // edits the document themselves.
    useEffect(() => {
        if (docTouched) return;
        const values: ContractTemplateValues = {
            contractNumber: watched.contractNumber,
            contractName: watched.contractName,
            supplierName: selectedSupplier?.businessName,
            contractType: watched.contractType,
            effectiveDate: watched.effectiveDate,
            expiryDate: watched.expiryDate,
            autoRenewal: watched.autoRenewal,
            renewalNoticeDays: watched.renewalNoticeDays,
            baseCurrency: watched.baseCurrency,
            paymentTermsDays: watched.paymentTermsDays,
            contractAmount: watched.contractAmount,
            incoterms: watched.incoterms,
            description: watched.description,
        };
        setDocHtml(buildContractTemplate(values));
    }, [
        docTouched,
        watched.contractNumber,
        watched.contractName,
        watched.contractType,
        watched.effectiveDate,
        watched.expiryDate,
        watched.autoRenewal,
        watched.renewalNoticeDays,
        watched.baseCurrency,
        watched.paymentTermsDays,
        watched.contractAmount,
        watched.incoterms,
        watched.description,
        selectedSupplier?.businessName,
    ]);

    const onSubmit = async (data: ContractCreateFormData) => {
        const accountId = Number(orgId);
        if (!orgId || !Number.isFinite(accountId) || accountId <= 0) {
            toast.error(
                'Organization context missing — please re-login and try again'
            );
            return;
        }
        setIsSubmitting(true);
        try {
            const contract = await createSupplierContract({
                accountId,
                supplierId: data.supplierId,
                contractNumber: data.contractNumber.trim(),
                contractName: data.contractName.trim(),
                description: data.description?.trim() || undefined,
                contractType: data.contractType,
                status: 'DRAFT',
                effectiveDate: data.effectiveDate,
                expiryDate: data.expiryDate || undefined,
                autoRenewal: data.autoRenewal,
                renewalNoticeDays: data.renewalNoticeDays,
                baseCurrency: data.baseCurrency || undefined,
                paymentTermsDays: data.paymentTermsDays,
                contractAmount: data.contractAmount,
                incoterms: data.incoterms?.trim() || undefined,
            });
            // Save the contract document (encrypted .md in DMS).
            try {
                const fileName = `${data.contractNumber.trim()}.md`;
                await uploadContractTextDocument(contract.contractId, {
                    fileName,
                    content: htmlToMarkdown(docHtml),
                });
                toast.success(
                    'Supplier contract created successfully with document'
                );
            } catch (docError) {
                console.error(
                    'Failed to upload contract document:',
                    docError
                );
                toast.warning(
                    'Contract created, but the document upload failed — you can re-upload it from the contract page.'
                );
            }
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
                                            name="contractName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Contract Name *
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
                                                            value={field.value}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select contract type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {CONTRACT_TYPES.map(
                                                                    (t) => (
                                                                        <SelectItem
                                                                            key={
                                                                                t
                                                                            }
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
                                    </div>
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
                                                                'USD'
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

                            <Card className="gap-2 p-4">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>
                                            Contract Document
                                        </CardTitle>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDocTouched(false)
                                            }
                                        >
                                            Regenerate from fields
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 p-0">
                                    <p className="text-sm text-muted-foreground">
                                        Generated from the fields above and
                                        saved as an encrypted document on
                                        create. You can edit it freely — once
                                        edited it will no longer
                                        auto-update, until regenerated.
                                    </p>
                                    <RichTextEditor
                                        value={docHtml}
                                        onChange={(html) => {
                                            setDocHtml(html);
                                            setDocTouched(true);
                                        }}
                                        placeholder="Contract document…"
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
