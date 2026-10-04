'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    acceptRetailerQuotation,
    getRetailerQuotations,
} from '@/lib/services/counterparty-docs-service';
import { browseSupplierCatalog } from '@/lib/services/supplier-market-service';
import type { SupplierBrowseItem } from '@/lib/services/supplier-market-service';
import type { SupplierQuotation } from '@/types/supplier';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-amber-100 text-amber-800',
    CONVERTED: 'bg-purple-100 text-purple-800',
};

export default function RetailerQuotationsPage() {
    const [data, setData] = useState<SupplierQuotation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<number | null>(null);
    const [viewing, setViewing] = useState<SupplierQuotation | null>(null);
    const [catalogById, setCatalogById] = useState<
        Record<number, SupplierBrowseItem>
    >({});

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await getRetailerQuotations({ page: 0, size: 20 });
            setData(res.content ?? []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openDetail = async (q: SupplierQuotation) => {
        setViewing(q);
        // Join catalog info (UoM, SKU, category) for the quoted lines from
        // the supplier's published catalog.
        if (q.supplierOrgId) {
            try {
                const res = await browseSupplierCatalog({
                    supplierOrgId: q.supplierOrgId,
                    pageNo: 0,
                    pageOffset: 100,
                });
                const map: Record<number, SupplierBrowseItem> = {};
                for (const item of res.content ?? []) {
                    const id = item.catalogId ?? item.id;
                    if (id !== undefined) map[Number(id)] = item;
                }
                setCatalogById(map);
            } catch {
                // catalog extras are best-effort; lines still render
            }
        }
    };

    const handleAccept = async (id: number) => {
        setAcceptingId(id);
        try {
            await acceptRetailerQuotation(id);
            toast.success('Quotation accepted');
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Accept failed');
        } finally {
            setAcceptingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Supplier Quotations</h1>
                    <p className="text-muted-foreground">
                        Review SENT quotations and accept the ones you want to
                        convert to orders
                    </p>
                </div>
                <Button variant="outline" onClick={load}>
                    Refresh
                </Button>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Quotations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Validity</TableHead>
                                <TableHead className="text-right">
                                    Total
                                </TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((q) => (
                                <TableRow key={q.quotationId}>
                                    <TableCell className="font-mono">
                                        {q.quotationNumber}
                                    </TableCell>
                                    <TableCell>
                                        {q.supplierOrgName ||
                                            (q.supplierOrgId !== undefined
                                                ? `Org #${q.supplierOrgId}`
                                                : '—')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                STATUS_COLOR[q.status] ??
                                                'bg-gray-100 text-gray-800'
                                            }
                                        >
                                            {q.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">
                                        {q.validFrom
                                            ? new Date(
                                                  q.validFrom
                                              ).toLocaleDateString()
                                            : '—'}{' '}
                                        →{' '}
                                        {q.validTo
                                            ? new Date(
                                                  q.validTo
                                              ).toLocaleDateString()
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Money
                                            amount={q.totalAmount}
                                            currency={q.currency}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openDetail(q)}
                                            >
                                                View
                                            </Button>
                                            {q.status === 'SENT' && (
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        acceptingId ===
                                                        q.quotationId
                                                    }
                                                    onClick={() =>
                                                        handleAccept(
                                                            q.quotationId
                                                        )
                                                    }
                                                >
                                                    {acceptingId ===
                                                    q.quotationId
                                                        ? 'Accepting…'
                                                        : 'Accept'}
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No quotations received yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Dialog
                open={viewing !== null}
                onOpenChange={(v) => !v && setViewing(null)}
            >
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Quotation {viewing?.quotationNumber ?? ''}
                        </DialogTitle>
                    </DialogHeader>
                    {viewing && (
                        <QuotationDetail
                            quotation={viewing}
                            catalogById={catalogById}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function QuotationDetail({
    quotation: q,
    catalogById,
}: {
    quotation: SupplierQuotation;
    catalogById: Record<number, SupplierBrowseItem>;
}) {
    const formatDate = (value?: string) =>
        value ? new Date(value).toLocaleDateString() : '—';
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier</span>
                    <span className="font-medium">
                        {q.supplierOrgName ||
                            (q.supplierOrgId !== undefined
                                ? `Org #${q.supplierOrgId}`
                                : '—')}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge>{q.status}</Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid From</span>
                    <span className="font-medium">
                        {formatDate(q.validFrom)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid To</span>
                    <span className="font-medium">
                        {formatDate(q.validTo)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium">{q.currency || '—'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">
                        <Money amount={q.totalAmount} currency={q.currency} />
                    </span>
                </div>
                {q.versionNumber !== undefined && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-medium">
                            v{q.versionNumber}
                        </span>
                    </div>
                )}
                {q.convertedToPoId !== undefined && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Converted PO
                        </span>
                        <span className="font-medium">
                            #{q.convertedToPoId}
                        </span>
                    </div>
                )}
            </div>
            {q.terms && (
                <div className="text-sm">
                    <p className="text-muted-foreground">Terms</p>
                    <p className="font-medium">{q.terms}</p>
                </div>
            )}
            <div>
                <h4 className="mb-2 text-sm font-semibold">
                    Line Items ({q.lineItems?.length ?? 0})
                </h4>
                {q.lineItems?.length ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Catalog Item</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">
                                    Qty
                                </TableHead>
                                <TableHead className="text-right">
                                    Unit Price
                                </TableHead>
                                <TableHead className="text-right">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {q.lineItems.map((li, idx) => {
                                const catalog =
                                    li.catalogId !== undefined
                                        ? catalogById[li.catalogId]
                                        : undefined;
                                return (
                                    <TableRow
                                        key={li.lineId ?? `${idx}`}
                                    >
                                        <TableCell>
                                            <div className="font-medium">
                                                {li.catalogName ||
                                                    catalog?.name ||
                                                    (li.catalogId !== undefined
                                                        ? `Catalog #${li.catalogId}`
                                                        : '—')}
                                            </div>
                                            {(catalog?.sku ||
                                                catalog?.unitOfMeasure ||
                                                catalog?.category) && (
                                                <div className="text-xs text-muted-foreground">
                                                    {[
                                                        catalog?.sku,
                                                        catalog?.unitOfMeasure,
                                                        catalog?.category,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            {li.description || '—'}
                                            {li.notes && (
                                                <div className="text-xs text-muted-foreground">
                                                    {li.notes}
                                                </div>
                                            )}
                                            {(li.digitalAssetNames?.length ||
                                                li.digitalAssetName ||
                                                li.digitalAssetId) && (
                                                <div className="text-xs text-muted-foreground">
                                                    Assets:{' '}
                                                    {(li.digitalAssetNames ??
                                                        []
                                                    ).join(', ') ||
                                                        (li.digitalAssetName ??
                                                        (li.digitalAssetId !== undefined
                                                            ? `#${li.digitalAssetId}`
                                                            : ''))}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {li.quantity ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Money
                                                amount={li.unitPrice}
                                                currency={q.currency}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Money
                                                amount={li.totalPrice}
                                                currency={q.currency}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No line items.
                    </p>
                )}
            </div>
        </div>
    );
}
