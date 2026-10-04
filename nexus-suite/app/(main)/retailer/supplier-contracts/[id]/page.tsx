'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    getContractDocumentContent,
    uploadContractTextDocument,
} from '@/lib/services/supplier-contracts-service';
import {
    htmlToMarkdown,
    markdownToHtml,
} from '@/lib/contract-doc';
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
import { Money } from '@/components/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getSupplierContractById,
    updateSupplierContractStatus,
    approveSupplierContract,
    rejectSupplierContract,
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
    const [confirmApprove, setConfirmApprove] = useState(false);
    const [confirmReject, setConfirmReject] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isDeciding, setIsDeciding] = useState(false);
    const [docHtml, setDocHtml] = useState<string>('');
    const [docLoading, setDocLoading] = useState(false);
    const [docSaving, setDocSaving] = useState(false);
    const [docFileName, setDocFileName] = useState<string>('');

    // Load the stored (decrypted) contract document into the editor
    // whenever the viewed contract changes.
    useEffect(() => {
        let active = true;
        const loadDoc = async () => {
            if (!contract) return;
            setDocLoading(true);
            try {
                const doc = await getContractDocumentContent(
                    contract.contractId
                );
                if (!active) return;
                setDocFileName(doc.fileName ?? '');
                setDocHtml(markdownToHtml(doc.content ?? ''));
            } catch {
                if (!active) return;
                setDocFileName('');
                setDocHtml('');
            } finally {
                if (active) setDocLoading(false);
            }
        };
        loadDoc();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contract?.contractId]);

    const handleSaveDocument = async () => {
        if (!contract || docSaving) return;
        setDocSaving(true);
        try {
            await uploadContractTextDocument(contract.contractId, {
                fileName:
                    docFileName || `${contract.contractNumber}.md`,
                content: htmlToMarkdown(docHtml),
            });
            toast.success('Contract document saved');
        } catch (err: unknown) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to save document'
            );
        } finally {
            setDocSaving(false);
        }
    };

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

    const handleApprove = async () => {
        if (!contract || isDeciding) return;
        setIsDeciding(true);
        try {
            const updated = await approveSupplierContract(
                contract.contractId,
                'retailer-user'
            );
            setContract(updated);
            toast.success('Contract approved');
            router.refresh();
        } catch (error) {
            console.error('Failed to approve contract:', error);
            toast.error('Failed to approve contract. Please try again.');
        } finally {
            setIsDeciding(false);
            setConfirmApprove(false);
        }
    };

    const handleReject = async () => {
        if (!contract || isDeciding) return;
        if (!rejectionReason.trim()) {
            toast.error('Please enter a rejection reason');
            return;
        }
        setIsDeciding(true);
        try {
            const updated = await rejectSupplierContract(
                contract.contractId,
                rejectionReason.trim()
            );
            setContract(updated);
            toast.success('Contract rejected');
            router.refresh();
        } catch (error) {
            console.error('Failed to reject contract:', error);
            toast.error('Failed to reject contract. Please try again.');
        } finally {
            setIsDeciding(false);
            setConfirmReject(false);
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

    const documentUrl =
        (contract.documentUrl as string | undefined) ?? undefined;
    const documentName =
        (contract.documentName as string | undefined) ??
        (contract.dmsDocumentName as string | undefined) ??
        'View Document';

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
                                {contract.contractName} —{' '}
                                {contract.supplierName ?? '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {documentUrl && (
                            <Button variant="outline" asChild>
                                <a
                                    href={documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {documentName}
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
                        {(contract.status === 'DRAFT' ||
                            contract.status === 'PENDING_APPROVAL') && (
                            <>
                                <Button
                                    onClick={() => setConfirmApprove(true)}
                                    disabled={isDeciding}
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setConfirmReject(true)}
                                    disabled={isDeciding}
                                >
                                    Reject
                                </Button>
                            </>
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
                                    Contract Number
                                </span>
                                <span className="font-medium">
                                    {contract.contractNumber}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Contract Name
                                </span>
                                <span className="font-medium">
                                    {contract.contractName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Supplier
                                </span>
                                <span className="font-medium">
                                    {contract.supplierName ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Contract Type
                                </span>
                                <span className="font-medium">
                                    {contract.contractType}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Status
                                </span>
                                <span className="font-medium">
                                    {contract.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Effective Date
                                </span>
                                <span className="font-medium">
                                    {contract.effectiveDate || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Expiry Date
                                </span>
                                <span className="font-medium">
                                    {(contract.expiryDate as string) || '—'}
                                </span>
                            </div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Description
                                </p>
                                <p className="font-medium">
                                    {(contract.description as string) || '—'}
                                </p>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Supplier Decision
                                </span>
                                <Badge
                                    variant={
                                        contract.supplierStatus === 'APPROVED'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {contract.supplierStatus ?? 'PENDING'}
                                </Badge>
                            </div>
                            {(contract.supplierComments ||
                                contract.supplierDecidedBy) && (
                                <div className="text-sm rounded-md border p-3">
                                    <p className="text-muted-foreground">
                                        Supplier feedback
                                        {contract.supplierDecidedAt
                                            ? ` · ${new Date(contract.supplierDecidedAt).toLocaleString()}`
                                            : ''}
                                    </p>
                                    <p className="font-medium">
                                        {contract.supplierComments || '—'}
                                    </p>
                                </div>
                            )}
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
                                    Base Currency
                                </span>
                                <span className="font-medium">
                                    {(contract.baseCurrency as string) || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Payment Terms (days)
                                </span>
                                <span className="font-medium">
                                    {contract.paymentTermsDays ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Incoterms
                                </span>
                                <span className="font-medium">
                                    {(contract.incoterms as string) || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Contract Amount
                                </span>
                                <span className="font-medium">
                                    <Money
                                        amount={contract.contractAmount}
                                        currency={contract.baseCurrency}
                                    />
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Auto Renewal
                                </span>
                                <span className="font-medium">
                                    {contract.autoRenewal
                                        ? `Yes (${contract.renewalNoticeDays ?? 0} days notice)`
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
                                    {(contract.createdAt as string) || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Updated
                                </span>
                                <span className="font-medium">
                                    {(contract.updatedAt as string) || '—'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 p-4 md:col-span-2">
                        <CardHeader className="p-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    Contract Document
                                </CardTitle>
                                <Button
                                    size="sm"
                                    onClick={handleSaveDocument}
                                    disabled={docSaving || docLoading}
                                >
                                    {docSaving
                                        ? 'Saving…'
                                        : 'Save Document'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {docLoading ? (
                                <p className="text-sm text-muted-foreground">
                                    Loading document…
                                </p>
                            ) : (
                                <RichTextEditor
                                    value={docHtml}
                                    onChange={setDocHtml}
                                    placeholder="Contract document…"
                                />
                            )}
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
            <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Approve contract?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Approve contract {contract.contractNumber}? It will
                            become ACTIVE.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                            Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject contract?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Reject contract {contract.contractNumber}? Please
                            give a reason.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="rejection-reason">Reason</Label>
                        <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) =>
                                setRejectionReason(e.target.value)
                            }
                            placeholder="e.g. Terms not acceptable"
                            rows={3}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject}>
                            Reject
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default Page;
