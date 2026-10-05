'use client';

import { useState } from 'react';
import { Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { SupplierBrowseItem } from '@/lib/services/supplier-market-service';
import type { SupplierQuotation } from '@/types/supplier';
import {
    AssetPreviewDialog,
    type PreviewableAsset,
} from '@/components/asset-preview-dialog';

export const QUOTATION_STATUS_COLOR: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-amber-100 text-amber-800',
    CONVERTED: 'bg-purple-100 text-purple-800',
};

export interface QuotationAssetInfo {
    name?: string;
    url?: string | null;
    type?: string | null;
}

type QuotationLineItem = NonNullable<SupplierQuotation['lineItems']>[number];

/**
 * Merge every source of asset info for a line into one ordered list:
 * explicit assetsById map first, DTO names/urls/types as fallback.
 */
export function resolveLineAssets(
    li: QuotationLineItem,
    assetsById: Record<number, QuotationAssetInfo>
): Array<QuotationAssetInfo & { assetId: number }> {
    const ids = li.digitalAssetIds?.length
        ? li.digitalAssetIds
        : li.digitalAssetId !== undefined
          ? [li.digitalAssetId]
          : [];
    return ids.map((id, i) => ({
        assetId: id,
        name:
            assetsById[id]?.name ??
            li.digitalAssetNames?.[i] ??
            (i === 0 ? li.digitalAssetName : undefined) ??
            `Asset #${id}`,
        url: assetsById[id]?.url ?? li.digitalAssetUrls?.[i] ?? null,
        type: assetsById[id]?.type ?? li.digitalAssetTypes?.[i] ?? null,
    }));
}

/**
 * Build an assetsById map from the quotation DTO alone (names/urls/types
 * travel as parallel arrays). Supplier pages can overlay richer metadata
 * fetched from the digital-assets endpoints on top of this.
 */
export function retailerAssetsById(
    q: SupplierQuotation
): Record<number, QuotationAssetInfo> {
    const map: Record<number, QuotationAssetInfo> = {};
    for (const li of q.lineItems ?? []) {
        const ids = li.digitalAssetIds?.length
            ? li.digitalAssetIds
            : li.digitalAssetId !== undefined
              ? [li.digitalAssetId]
              : [];
        ids.forEach((id, i) => {
            if (map[id] !== undefined) return;
            map[id] = {
                name:
                    li.digitalAssetNames?.[i] ??
                    (i === 0 ? li.digitalAssetName : undefined) ??
                    `Asset #${id}`,
                url: li.digitalAssetUrls?.[i] ?? null,
                type: li.digitalAssetTypes?.[i] ?? null,
            };
        });
    }
    return map;
}

function formatDate(value?: string) {
    return value ? new Date(value).toLocaleDateString() : '—';
}

function formatDateTime(value?: string) {
    return value ? new Date(value).toLocaleString() : '—';
}

export function QuotationDetailView({
    quotation: q,
    catalogById = {},
    assetsById = {},
    showPriceTier = false,
    showVariant = false,
}: {
    quotation: SupplierQuotation;
    catalogById?: Record<number, SupplierBrowseItem>;
    assetsById?: Record<number, QuotationAssetInfo>;
    showPriceTier?: boolean;
    showVariant?: boolean;
}) {
    const [preview, setPreview] = useState<PreviewableAsset | null>(null);
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                    <CardTitle className="text-lg">
                        Quotation Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Number</span>
                        <span className="font-mono font-medium">
                            {q.quotationNumber}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                            className={
                                QUOTATION_STATUS_COLOR[q.status] ??
                                'bg-gray-100 text-gray-800'
                            }
                        >
                            {q.status}
                        </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-medium">
                            v{q.versionNumber ?? 1}
                        </span>
                    </div>
                    {q.parentQuotationId !== undefined && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Parent Quotation
                            </span>
                            <span className="font-medium">
                                #{q.parentQuotationId}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Valid From
                        </span>
                        <span className="font-medium">
                            {formatDate(q.validFrom)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valid To</span>
                        <span className="font-medium">
                            {formatDate(q.validTo)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Currency</span>
                        <span className="font-medium">{q.currency || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Total Amount
                        </span>
                        <span className="font-medium">
                            <Money
                                amount={q.totalAmount}
                                currency={q.currency}
                            />
                        </span>
                    </div>
                    {q.convertedToPoId !== undefined && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Converted PO
                            </span>
                            <span className="font-medium">
                                #{q.convertedToPoId}
                            </span>
                        </div>
                    )}
                    {q.createdAt && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Created
                            </span>
                            <span className="font-medium">
                                {formatDateTime(q.createdAt)}
                            </span>
                        </div>
                    )}
                    {q.updatedAt && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Last Updated
                            </span>
                            <span className="font-medium">
                                {formatDateTime(q.updatedAt)}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                    <CardTitle className="text-lg">Parties & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Supplier</span>
                        <span className="font-medium">
                            {q.supplierOrgName ||
                                (q.supplierOrgId !== undefined
                                    ? `Org #${q.supplierOrgId}`
                                    : '—')}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Buyer</span>
                        <span className="font-medium">
                            {q.buyerOrgName ||
                                (q.buyerOrgId !== undefined
                                    ? `Org #${q.buyerOrgId}`
                                    : '—')}
                        </span>
                    </div>
                    <div className="text-sm">
                        <p className="text-muted-foreground">Terms</p>
                        <p className="font-medium">{q.terms || '—'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="gap-2 p-4 md:col-span-2">
                <CardHeader className="p-0">
                    <CardTitle className="text-lg">
                        Line Items ({q.lineItems?.length ?? 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                                    const assets = resolveLineAssets(
                                        li,
                                        assetsById
                                    );
                                    return (
                                        <TableRow
                                            key={li.lineId ?? `${idx}`}
                                        >
                                            <TableCell>
                                                <div className="font-medium">
                                                    {li.catalogName ||
                                                        catalog?.name ||
                                                        (li.catalogId !==
                                                        undefined
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
                                                {showPriceTier &&
                                                    li.priceTierId !==
                                                        undefined &&
                                                    li.priceTierId !== null && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Price tier:{' '}
                                                            <span className="font-medium text-foreground">
                                                                {li.priceTierName ??
                                                                    `#${li.priceTierId}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                {showVariant &&
                                                    li.variantId !== undefined &&
                                                    li.variantId !== null && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Variant:{' '}
                                                            <span className="font-medium text-foreground">
                                                                {li.variantName ??
                                                                    `#${li.variantId}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                {assets.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {assets.map((a) =>
                                                            a.url ? (
                                                                <div
                                                                    key={
                                                                        a.assetId
                                                                    }
                                                                    className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1 text-xs"
                                                                >
                                                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span className="font-medium">
                                                                        {a.name}
                                                                    </span>
                                                                    {a.type && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-[10px]"
                                                                        >
                                                                            {
                                                                                a.type
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="ml-auto h-7 gap-1 text-xs"
                                                                        onClick={() =>
                                                                            setPreview(
                                                                                a
                                                                            )
                                                                        }
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                        Preview
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={
                                                                        a.assetId
                                                                    }
                                                                    className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1 text-xs"
                                                                >
                                                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span className="font-medium">
                                                                        {a.name}
                                                                    </span>
                                                                    {a.type && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-[10px]"
                                                                        >
                                                                            {
                                                                                a.type
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                    <span className="ml-auto text-muted-foreground">
                                                                        #
                                                                        {
                                                                            a.assetId
                                                                        }{' '}
                                                                        · no
                                                                        file
                                                                        link
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
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
                </CardContent>
            </Card>
            <AssetPreviewDialog
                asset={preview}
                onClose={() => setPreview(null)}
            />
        </div>
    );
}
