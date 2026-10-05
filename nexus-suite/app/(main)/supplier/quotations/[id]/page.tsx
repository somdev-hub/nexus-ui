'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useUserMetadata } from '@/hooks/use-user-metadata';
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
import {
    QUOTATION_STATUS_COLOR,
    QuotationDetailView,
    retailerAssetsById,
    type QuotationAssetInfo,
} from '@/components/quotation-detail-view';
import {
    buildQuotationPayload,
    fetchRetailerOptions,
    quotationToFormValues,
    QuotationForm,
    type QuotationFormValues,
    type QuotationRetailerOption,
} from '@/components/quotation-form';
import {
    deleteQuotation,
    getQuotationById,
    transitionQuotation,
    updateQuotation,
} from '@/lib/services/supplier-commercial-service';
import {
    getDigitalAssets,
    getSupplierCatalogs,
} from '@/lib/services/supplier-catalog-service';
import type { SupplierBrowseItem } from '@/lib/services/supplier-market-service';
import type {
    SupplierCatalog,
    SupplierQuotation,
} from '@/types/supplier';

export default function SupplierQuotationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const numericId = Number(id);

    const [quotation, setQuotation] = useState<SupplierQuotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [retailers, setRetailers] = useState<QuotationRetailerOption[]>([]);
    const { orgId } = useUserMetadata();
    const [catalogById, setCatalogById] = useState<
        Record<number, SupplierBrowseItem>
    >({});
    const [catalogs, setCatalogs] = useState<SupplierCatalog[]>([]);
    const [assetsById, setAssetsById] = useState<
        Record<number, QuotationAssetInfo>
    >({});

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            if (!Number.isFinite(numericId)) {
                setLoadError('Invalid quotation id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const q = await getQuotationById(numericId);
                if (!active) return;
                setQuotation(q);
                // Start from the names/urls embedded in the quotation DTO so
                // lines render even if asset lookups fail.
                setAssetsById(retailerAssetsById(q));
                // Join own-catalog extras (UoM, SKU, category) plus full
                // digital-asset metadata (file links) for the quoted lines.
                try {
                    const catalogs = await getSupplierCatalogs({
                        page: 0,
                        size: 100,
                    });
                    if (!active) return;
                    setCatalogs(catalogs.content ?? []);
                    const cmap: Record<number, SupplierBrowseItem> = {};
                    for (const c of catalogs.content ?? []) {
                        cmap[c.catalogId] =
                            c as unknown as SupplierBrowseItem;
                    }
                    setCatalogById(cmap);
                    const catalogIds = [
                        ...new Set(
                            (q.lineItems ?? [])
                                .map((li) => li.catalogId)
                                .filter(
                                    (v): v is number => v !== undefined
                                )
                        ),
                    ];
                    const assetMap: Record<number, QuotationAssetInfo> = {};
                    await Promise.all(
                        catalogIds.map(async (cid) => {
                            try {
                                const res = await getDigitalAssets({
                                    catalogId: cid,
                                    page: 0,
                                    size: 100,
                                });
                                for (const a of res.content ?? []) {
                                    assetMap[a.assetId] = {
                                        name:
                                            a.fileName ??
                                            `Asset #${a.assetId}`,
                                        url: a.dmsDocumentUrl ?? null,
                                        type: a.assetType ?? null,
                                    };
                                }
                            } catch {
                                // per-catalog failures are best-effort
                            }
                        })
                    );
                    if (!active) return;
                    if (Object.keys(assetMap).length > 0) {
                        setAssetsById((prev) => ({ ...prev, ...assetMap }));
                    }
                } catch {
                    // catalog/asset extras are best-effort
                }
            } catch (e) {
                if (!active) return;
                setLoadError(
                    e instanceof Error ? e.message : 'Failed to load quotation'
                );
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [id, numericId, reloadKey]);

    // Retailers for the Buyer dropdown (loaded when the edit dialog opens).
    useEffect(() => {
        if (!editOpen) return;
        let active = true;
        const run = async () => {
            try {
                const options = await fetchRetailerOptions(orgId);
                if (!active) return;
                setRetailers(options);
            } catch {
                // leave dropdown empty; global 500 toast already fired
            }
        };
        run();
        return () => {
            active = false;
        };
    }, [editOpen, orgId]);

    // Catalog list for the edit form (detail view already joined it above).
    const editInitial = useMemo(
        () => (quotation ? quotationToFormValues(quotation) : null),
        [quotation]
    );

    const handleEditSubmit = async (values: QuotationFormValues) => {
        if (!quotation || editSaving) return;
        setEditSaving(true);
        try {
            await updateQuotation(
                quotation.quotationId,
                buildQuotationPayload(values)
            );
            toast.success('Quotation updated');
            setEditOpen(false);
            setReloadKey((k) => k + 1);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setEditSaving(false);
        }
    };

    const runTransition = async (newStatus: string) => {
        if (!quotation || actionBusy) return;
        setActionBusy(true);
        try {
            const updated = await transitionQuotation(
                quotation.quotationId,
                newStatus
            );
            setQuotation(updated);
            toast.success(`Moved to ${newStatus}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Transition failed');
        } finally {
            setActionBusy(false);
        }
    };

    const runDelete = async () => {
        if (!quotation || actionBusy) return;
        setActionBusy(true);
        try {
            await deleteQuotation(quotation.quotationId);
            toast.success('Quotation deleted');
            router.push('/supplier/quotations');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setActionBusy(false);
            setConfirmDelete(false);
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

    if (loadError || !quotation) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
                <p className="text-muted-foreground">
                    {loadError ?? 'Quotation not found'}
                </p>
                <Button variant="outline" asChild>
                    <Link href="/supplier/quotations">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Quotations
                    </Link>
                </Button>
            </div>
        );
    }

    const deletable =
        quotation.status !== 'ACCEPTED' && quotation.status !== 'CONVERTED';

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:gap-6 md:p-6">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/supplier/quotations"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold">
                                        {quotation.quotationNumber}
                                    </h2>
                                    <Badge
                                        className={
                                            QUOTATION_STATUS_COLOR[
                                                quotation.status
                                            ] ?? 'bg-gray-100 text-gray-800'
                                        }
                                    >
                                        {quotation.status}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {quotation.buyerOrgName ||
                                        (quotation.buyerOrgId !== undefined
                                            ? `Org #${quotation.buyerOrgId}`
                                            : '')}{' '}
                                    · v{quotation.versionNumber ?? 1}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            {quotation.status === 'DRAFT' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionBusy}
                                    onClick={() => setEditOpen(true)}
                                >
                                    Edit
                                </Button>
                            )}
                            {quotation.status === 'DRAFT' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionBusy}
                                    onClick={() => runTransition('SENT')}
                                >
                                    Send
                                </Button>
                            )}
                            {(quotation.status === 'DRAFT' ||
                                quotation.status === 'SENT') && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionBusy}
                                    onClick={() => runTransition('REJECTED')}
                                >
                                    Reject
                                </Button>
                            )}
                            {quotation.status === 'SENT' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionBusy}
                                    onClick={() => runTransition('EXPIRED')}
                                >
                                    Expire
                                </Button>
                            )}
                            {quotation.status === 'ACCEPTED' && (
                                <span className="text-xs text-muted-foreground">
                                    Accepted — awaiting retailer order
                                </span>
                            )}
                            {deletable && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={actionBusy}
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>

                    <QuotationDetailView
                        quotation={quotation}
                        catalogById={catalogById}
                        assetsById={assetsById}
                        showPriceTier
                        showVariant
                    />
                </div>
            </div>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Quotation {quotation.quotationNumber} (v
                            {quotation.versionNumber ?? 1})
                        </DialogTitle>
                    </DialogHeader>
                    {editInitial && (
                        <QuotationForm
                            key={quotation.quotationId}
                            initial={editInitial}
                            retailers={retailers}
                            catalogs={catalogs}
                            saving={editSaving}
                            submitLabel="Save changes"
                            savingLabel="Saving…"
                            onSubmit={handleEditSubmit}
                        />
                    )}
                </DialogContent>
            </Dialog>
            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete quotation &ldquo;
                            {quotation.quotationNumber}&rdquo;. Accepted or
                            converted quotations cannot be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionBusy}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={runDelete}
                            disabled={actionBusy}
                        >
                            {actionBusy && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {actionBusy ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
