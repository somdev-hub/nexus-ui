'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getSupplierContractById,
    updateSupplierContractStatus,
} from '@/lib/services/supplier-contracts-service';
import type { SupplierContract } from '@/types/supplier-contracts';

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const numericId = Number(id);

    const [contract, setContract] = useState<SupplierContract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            if (!Number.isFinite(numericId)) {
                setLoadError('Invalid contract id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getSupplierContractById(numericId);
                if (!active) return;
                setContract(data);
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch supplier contract:', error);
                const message =
                    (
                        error as {
                            response?: { data?: { message?: string } };
                        }
                    )?.response?.data?.message ||
                    (error instanceof Error
                        ? error.message
                        : 'Failed to load supplier contract');
                setLoadError(`Could not load contract #${id}: ${message}`);
                toast.error('Failed to load supplier contract');
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [id, numericId]);

    const [confirmSubmit, setConfirmSubmit] = useState(false);

    const handleSubmitForApproval = async () => {
        if (!contract) return;
        setIsSubmitting(true);
        try {
            const updated = await updateSupplierContractStatus(
                contract.contractId,
                { status: 'PENDING_APPROVAL' }
            );
            setContract(updated);
            toast.success('Contract submitted for approval');
            router.refresh();
        } catch (error) {
            console.error('Failed to submit contract:', error);
            toast.error('Failed to submit contract. Please try again.');
        } finally {
            setIsSubmitting(false);
            setConfirmSubmit(false);
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

    if (loadError || !contract) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
                <p className="text-muted-foreground">
                    {loadError ?? 'Contract not found'}
                </p>
                <Button variant="outline" asChild>
                    <Link href="/retailer/supplier-contracts">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Supplier Contracts
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:gap-6 md:p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/retailer/supplier-contracts"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">
                                    {contract.contractNumber}
                                </h2>
                                <Badge variant="outline">
                                    {contract.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {contract.title} — {contract.supplierName}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {contract.documentUrl && (
                            <Button variant="outline" asChild>
                                <a
                                    href={contract.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {contract.documentName ?? 'View Document'}
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link
                                href={`/retailer/supplier-contracts/${contract.contractId}/edit`}
                            >
                                Edit
                            </Link>
                        </Button>
                        {contract.status === 'DRAFT' && (
                            <Button
                                onClick={() => setConfirmSubmit(true)}
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
                                Contract Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Supplier
                                </span>
                                <span className="font-medium">
                                    {contract.supplierName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Retailer
                                </span>
                                <span className="font-medium">
                                    {contract.retailerOrgName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Start Date
                                </span>
                                <span className="font-medium">
                                    {contract.startDate || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    End Date
                                </span>
                                <span className="font-medium">
                                    {contract.endDate || '—'}
                                </span>
                            </div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Description
                                </p>
                                <p className="font-medium">
                                    {contract.description || '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">
                                Commercial Terms
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Currency
                                </span>
                                <span className="font-medium">
                                    {contract.currency}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">
                                    Total Value
                                </span>
                                <span className="font-mono text-lg font-semibold">
                                    {contract.currency}{' '}
                                    {contract.totalValue.toLocaleString(
                                        undefined,
                                        { minimumFractionDigits: 2 }
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Payment Terms
                                </span>
                                <span className="font-medium">
                                    {contract.paymentTerms || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Auto Renewal
                                </span>
                                <span className="font-medium">
                                    {contract.autoRenewal
                                        ? `Yes (${contract.renewalPeriodDays} days)`
                                        : 'No'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4 md:col-span-2">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg">Audit</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-0">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Created
                                </span>
                                <span className="font-medium">
                                    {contract.createdAt} by {contract.createdBy}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Updated
                                </span>
                                <span className="font-medium">
                                    {contract.updatedAt} by {contract.updatedBy}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
            <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Submit contract?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Submit contract {contract.contractNumber} for
                            approval?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmitForApproval}>
                            Submit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default Page;
