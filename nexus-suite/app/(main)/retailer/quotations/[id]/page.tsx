'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    QUOTATION_STATUS_COLOR,
    QuotationDetailView,
    retailerAssetsById,
} from '@/components/quotation-detail-view';
import {
    acceptRetailerQuotation,
    getRetailerQuotationById,
    rejectRetailerQuotation,
} from '@/lib/services/counterparty-docs-service';
import { browseSupplierCatalog } from '@/lib/services/supplier-market-service';
import type { SupplierBrowseItem } from '@/lib/services/supplier-market-service';
import type { SupplierQuotation } from '@/types/supplier';

export default function RetailerQuotationDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const numericId = Number(id);

    const [quotation, setQuotation] = useState<SupplierQuotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [catalogById, setCatalogById] = useState<
        Record<number, SupplierBrowseItem>
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
                const q = await getRetailerQuotationById(numericId);
                if (!active) return;
                setQuotation(q);
                // Join catalog info (UoM, SKU, category) for the quoted
                // lines from the supplier's published catalog.
                if (q.supplierOrgId) {
                    try {
                        const res = await browseSupplierCatalog({
                            supplierOrgId: q.supplierOrgId,
                            pageNo: 0,
                            pageOffset: 100,
                        });
                        if (!active) return;
                        const map: Record<number, SupplierBrowseItem> = {};
                        for (const item of res.content ?? []) {
                            const cid = item.catalogId ?? item.id;
                            if (cid !== undefined) map[Number(cid)] = item;
                        }
                        setCatalogById(map);
                    } catch {
                        // catalog extras are best-effort; lines still render
                    }
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
    }, [id, numericId]);

    const handleAccept = async () => {
        if (!quotation) return;
        setAccepting(true);
        try {
            const updated = await acceptRetailerQuotation(
                quotation.quotationId
            );
            setQuotation(updated);
            toast.success('Quotation accepted');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Accept failed');
        } finally {
            setAccepting(false);
        }
    };

    const handleReject = async () => {
        if (!quotation) return;
        setRejecting(true);
        try {
            const updated = await rejectRetailerQuotation(
                quotation.quotationId
            );
            setQuotation(updated);
            toast.success('Quotation rejected');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Reject failed');
        } finally {
            setRejecting(false);
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
                    <Link href="/retailer/quotations">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Quotations
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:gap-6 md:p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/retailer/quotations"
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
                                {quotation.supplierOrgName ||
                                    (quotation.supplierOrgId !== undefined
                                        ? `Org #${quotation.supplierOrgId}`
                                        : '')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {quotation.status === 'SENT' && (
                            <Button
                                onClick={handleAccept}
                                disabled={accepting}
                            >
                                {accepting ? 'Accepting…' : 'Accept'}
                            </Button>
                        )}
                        {quotation.status === 'SENT' && (
                            <Button
                                variant="outline"
                                onClick={handleReject}
                                disabled={rejecting}
                            >
                                {rejecting ? 'Rejecting…' : 'Reject'}
                            </Button>
                        )}
                        {quotation.status === 'ACCEPTED' && (
                            <Button asChild>
                                <Link
                                    href={`/retailer/purchase-orders/add?fromQuotation=${quotation.quotationId}`}
                                >
                                    Convert to PO
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <QuotationDetailView
                    quotation={quotation}
                    catalogById={catalogById}
                    assetsById={retailerAssetsById(quotation)}
                />
            </div>
        </div>
    );
}
