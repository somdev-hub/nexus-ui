'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useUserMetadata } from '@/hooks/use-user-metadata';
import type { SupplierContract } from '@/types/supplier-contracts';
import {
    approveSupplierContractAsSupplier,
    getSupplierContractByIdForSupplier,
    getSupplierContractDocumentContent,
    rejectSupplierContractAsSupplier,
    requestContractAmendmentsAsSupplier,
} from '@/lib/services/supplier-contracts-supplier-service';
import { markdownToHtml } from '@/lib/contract-doc';

const SUPPLIER_STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pending Your Decision',
    APPROVED: 'Approved by You',
    REJECTED: 'Rejected by You',
    AMENDMENTS_REQUESTED: 'Amendments Requested',
};

// Contracts the supplier can act on.
const ACTIONABLE = new Set(['PENDING_APPROVAL', 'ACTIVE']);

export default function SupplierContractDetailPage() {
    const params = useParams();
    const { name } = useUserMetadata();
    const id = params.id as string;
    const numericId = Number(id);

    const [contract, setContract] = useState<SupplierContract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [docHtml, setDocHtml] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<
        'approve' | 'reject' | 'amendments' | null
    >(null);
    const [comments, setComments] = useState('');

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
                const data =
                    await getSupplierContractByIdForSupplier(numericId);
                if (!active) return;
                setContract(data);
                try {
                    const doc = await getSupplierContractDocumentContent(
                        numericId
                    );
                    if (!active) return;
                    if (doc.content) setDocHtml(markdownToHtml(doc.content));
                } catch {
                    // document is optional; details still render
                }
            } catch (err: unknown) {
                if (!active) return;
                setLoadError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load contract'
                );
                toast.error('Failed to load contract');
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [id, numericId]);

    const decision = contract?.supplierStatus ?? 'PENDING';
    const actionable =
        !!contract &&
        ACTIONABLE.has(contract.status) &&
        decision !== 'APPROVED' &&
        decision !== 'REJECTED';

    const handleConfirm = async () => {
        if (!contract || !confirm || busy) return;
        if (confirm !== 'approve' && !comments.trim()) {
            toast.error('Please add comments');
            return;
        }
        setBusy(true);
        try {
            const decidedBy = name || undefined;
            const updated =
                confirm === 'approve'
                    ? await approveSupplierContractAsSupplier(
                          contract.contractId,
                          decidedBy
                      )
                    : confirm === 'reject'
                      ? await rejectSupplierContractAsSupplier(
                            contract.contractId,
                            comments.trim(),
                            decidedBy
                        )
                      : await requestContractAmendmentsAsSupplier(
                            contract.contractId,
                            comments.trim(),
                            decidedBy
                        );
            setContract(updated);
            toast.success(
                confirm === 'approve'
                    ? 'Contract approved'
                    : confirm === 'reject'
                      ? 'Contract rejected'
                      : 'Amendments requested'
            );
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Action failed'
            );
        } finally {
            setBusy(false);
            setConfirm(null);
            setComments('');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-75 w-full" />
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
                    <Link href="/supplier/contracts">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Contracts
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
                                href="/supplier/contracts"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {contract.contractNumber}
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {contract.contractName}
                                </p>
                            </div>
                        </div>
                        {actionable && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setConfirm('approve')}
                                    disabled={busy}
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setConfirm('reject')}
                                    disabled={busy}
                                >
                                    Reject
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirm('amendments')}
                                    disabled={busy}
                                >
                                    Amendments
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card className="gap-2 p-4">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg">
                                    Contract Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-0">
                                <InfoRow
                                    label="Retailer"
                                    value={
                                        contract.retailerOrgName ||
                                        (contract.accountId !== undefined
                                            ? `Org #${contract.accountId}`
                                            : '—')
                                    }
                                />
                                <InfoRow
                                    label="Status"
                                    value={
                                        <Badge variant="outline">
                                            {contract.status}
                                        </Badge>
                                    }
                                />
                                <InfoRow
                                    label="Your Decision"
                                    value={
                                        <Badge
                                            variant={
                                                decision === 'APPROVED'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {SUPPLIER_STATUS_LABEL[decision] ??
                                                decision}
                                        </Badge>
                                    }
                                />
                                <InfoRow
                                    label="Type"
                                    value={contract.contractType || '—'}
                                />
                                <InfoRow
                                    label="Effective"
                                    value={
                                        contract.effectiveDate
                                            ? new Date(
                                                  contract.effectiveDate
                                              ).toLocaleDateString()
                                            : '—'
                                    }
                                />
                                <InfoRow
                                    label="Expiry"
                                    value={
                                        contract.expiryDate
                                            ? new Date(
                                                  contract.expiryDate
                                              ).toLocaleDateString()
                                            : '—'}
                                />
                                {contract.description && (
                                    <div className="text-sm">
                                        <p className="text-muted-foreground">
                                            Description
                                        </p>
                                        <p className="font-medium">
                                            {contract.description}
                                        </p>
                                    </div>
                                )}
                                {(contract.supplierComments ||
                                    contract.supplierDecidedBy) && (
                                    <div className="text-sm rounded-md border p-3">
                                        <p className="text-muted-foreground">
                                            Your feedback
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
                                <InfoRow
                                    label="Currency"
                                    value={contract.baseCurrency || '—'}
                                />
                                <InfoRow
                                    label="Contract Amount"
                                    value={
                                        <Money
                                            amount={contract.contractAmount}
                                            currency={contract.baseCurrency}
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Payment Terms"
                                    value={
                                        contract.paymentTermsDays !== undefined
                                            ? `${contract.paymentTermsDays} days`
                                            : '—'
                                    }
                                />
                                <InfoRow
                                    label="Incoterms"
                                    value={contract.incoterms || '—'}
                                />
                                <InfoRow
                                    label="Auto Renewal"
                                    value={
                                        contract.autoRenewal
                                            ? `Yes (${contract.renewalNoticeDays ?? 0} days notice)`
                                            : 'No'
                                    }
                                />
                            </CardContent>
                        </Card>

                        <Card className="gap-2 p-4 md:col-span-2">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg">
                                    Contract Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {docHtml ? (
                                    <div
                                        className="prose max-h-[32rem] overflow-y-auto rounded-md border p-4 text-sm"
                                        dangerouslySetInnerHTML={{
                                            __html: docHtml,
                                        }}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No document attached yet.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <AlertDialog
                open={confirm !== null}
                onOpenChange={(v) => {
                    if (!v) {
                        setConfirm(null);
                        setComments('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm === 'approve'
                                ? 'Approve contract?'
                                : confirm === 'reject'
                                  ? 'Reject contract?'
                                  : 'Request amendments?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm === 'approve'
                                ? `Approve contract ${contract.contractNumber}?`
                                : confirm === 'reject'
                                  ? `Reject contract ${contract.contractNumber}? Your comments will be shared with the retailer.`
                                  : `Ask the retailer to amend contract ${contract.contractNumber}? Describe what needs to change.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {confirm !== 'approve' && (
                        <div className="grid gap-2">
                            <Label htmlFor="supplier-comments">
                                Comments *
                            </Label>
                            <Textarea
                                id="supplier-comments"
                                value={comments}
                                onChange={(e) =>
                                    setComments(e.target.value)
                                }
                                placeholder={
                                    confirm === 'reject'
                                        ? 'e.g. Pricing not acceptable'
                                        : 'e.g. Please extend the payment terms to 45 days'
                                }
                                rows={3}
                            />
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={busy}
                        >
                            {busy ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {busy
                                ? 'Saving…'
                                : confirm === 'approve'
                                  ? 'Approve'
                                  : confirm === 'reject'
                                    ? 'Reject'
                                    : 'Send Request'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );

    function InfoRow({
        label,
        value,
    }: {
        label: string;
        value: React.ReactNode;
    }) {
        return (
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
            </div>
        );
    }
}
