'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatYmd, parseYmd } from '@/lib/date-utils';
import { getSupplierPartnerships } from '@/lib/services/org-partnerships-service';
import {
    getDigitalAssets,
    getPriceTiers,
    getVariants,
} from '@/lib/services/supplier-catalog-service';
import type {
    ProductVariant,
    SupplierCatalog,
    SupplierDigitalAsset,
    SupplierPriceTier,
    SupplierQuotation,
} from '@/types/supplier';

export interface QuotationRetailerOption {
    orgId: number;
    label: string;
}

export interface QuotationFormLine {
    key: number;
    catalogId: string;
    variantId: string;
    tierId: string;
    assetIds: string[];
    quantity: string;
    unitPrice: string;
    description: string;
}

export interface QuotationFormValues {
    buyerOrgId: string;
    validFrom: string;
    validTo: string;
    terms: string;
    currency: string;
    lines: QuotationFormLine[];
}

interface CatalogRelated {
    variants: ProductVariant[];
    tiers: SupplierPriceTier[];
    assets: SupplierDigitalAsset[];
}

const EMPTY_LINE: QuotationFormLine = {
    key: 0,
    catalogId: '',
    variantId: '',
    tierId: '',
    assetIds: [],
    quantity: '',
    unitPrice: '',
    description: '',
};

export function emptyQuotationForm(): QuotationFormValues {
    return {
        buyerOrgId: '',
        validFrom: '',
        validTo: '',
        terms: '',
        currency: 'USD',
        lines: [{ ...EMPTY_LINE }],
    };
}

/** Retailers this supplier has a partnership with (for the Buyer dropdown). */
export async function fetchRetailerOptions(
    ownOrgId: number | string | undefined
): Promise<QuotationRetailerOption[]> {
    const res = await getSupplierPartnerships();
    const own = Number(ownOrgId);
    const seen = new Map<number, string>();
    for (const p of res.content ?? []) {
        if (p.status === 'TERMINATED') continue;
        const isPrimary =
            Number.isFinite(own) &&
            p.primaryOrgId !== undefined &&
            Number(p.primaryOrgId) === own;
        const counterId = isPrimary ? p.secondaryOrgId : p.primaryOrgId;
        if (counterId === undefined) continue;
        const id = Number(counterId);
        if (!Number.isFinite(id) || seen.has(id)) continue;
        const name = isPrimary ? p.secondaryOrgName : p.primaryOrgName;
        seen.set(id, name ? `${name} (#${id})` : `Org #${id}`);
    }
    return [...seen.entries()].map(([orgId, label]) => ({ orgId, label }));
}

export function quotationToFormValues(
    q: SupplierQuotation
): QuotationFormValues {
    const lines = q.lineItems?.length ? q.lineItems : [undefined];
    return {
        buyerOrgId: q.buyerOrgId !== undefined ? String(q.buyerOrgId) : '',
        validFrom: q.validFrom ? q.validFrom.slice(0, 10) : '',
        validTo: q.validTo ? q.validTo.slice(0, 10) : '',
        terms: q.terms ?? '',
        currency: q.currency ?? 'USD',
        lines: lines.map((li, i) => ({
            key: i,
            catalogId:
                li?.catalogId !== undefined ? String(li.catalogId) : '',
            variantId:
                li?.variantId !== undefined && li.variantId !== null
                    ? String(li.variantId)
                    : '',
            tierId:
                li?.priceTierId !== undefined && li.priceTierId !== null
                    ? String(li.priceTierId)
                    : '',
            assetIds: (
                li?.digitalAssetIds ??
                (li?.digitalAssetId !== undefined ? [li.digitalAssetId] : [])
            ).map((a) => String(a)),
            quantity: li?.quantity !== undefined ? String(li.quantity) : '',
            unitPrice:
                li?.unitPrice !== undefined && li.unitPrice !== null
                    ? String(li.unitPrice)
                    : '',
            description: li?.description ?? li?.catalogName ?? '',
        })),
    };
}

export function buildQuotationPayload(
    values: QuotationFormValues
): Partial<SupplierQuotation> {
    return {
        buyerOrgId: values.buyerOrgId ? Number(values.buyerOrgId) : undefined,
        validFrom: values.validFrom || undefined,
        validTo: values.validTo || undefined,
        terms: values.terms || undefined,
        currency: values.currency || 'USD',
        lineItems: values.lines.map((l) => ({
            ...(l.catalogId ? { catalogId: Number(l.catalogId) } : {}),
            ...(l.variantId ? { variantId: Number(l.variantId) } : {}),
            ...(l.tierId ? { priceTierId: Number(l.tierId) } : {}),
            ...(l.assetIds.length
                ? {
                      digitalAssetIds: l.assetIds.map((a) => Number(a)),
                  }
                : {}),
            quantity: Number(l.quantity || 1),
            unitPrice: Number(l.unitPrice || 0),
            description: l.description || undefined,
        })),
    };
}

export function QuotationForm({
    initial,
    retailers,
    catalogs,
    saving,
    submitLabel,
    savingLabel,
    onSubmit,
}: {
    initial: QuotationFormValues;
    retailers: QuotationRetailerOption[];
    catalogs: SupplierCatalog[];
    saving: boolean;
    submitLabel: string;
    savingLabel: string;
    onSubmit: (values: QuotationFormValues) => void;
}) {
    const [form, setForm] = useState({
        buyerOrgId: initial.buyerOrgId,
        validFrom: initial.validFrom,
        validTo: initial.validTo,
        terms: initial.terms,
        currency: initial.currency,
    });
    const [lines, setLines] = useState<QuotationFormLine[]>(() =>
        initial.lines.map((l) => ({ ...l }))
    );
    const [lineSeq, setLineSeq] = useState(initial.lines.length);
    const [relatedByCatalog, setRelatedByCatalog] = useState<
        Record<number, CatalogRelated>
    >({});

    const initialCatalogIds = useMemo(
        () =>
            [
                ...new Set(
                    initial.lines
                        .map((l) => Number(l.catalogId))
                        .filter(
                            (n, i) =>
                                Number.isFinite(n) &&
                                initial.lines[i].catalogId !== ''
                        )
                ),
            ],
        [initial]
    );

    const loadedRef = useRef<Set<number>>(new Set());
    const fetchRelated = useCallback(async (catalogId: number) => {
        const [v, t, a] = await Promise.all([
            getVariants({ catalogId }).catch(() => null),
            getPriceTiers({ catalogId }).catch(() => null),
            getDigitalAssets({ catalogId }).catch(() => null),
        ]);
        return {
            variants: v?.content ?? [],
            tiers: t?.content ?? [],
            assets: a?.content ?? [],
        };
    }, []);
    const ensureRelated = useCallback(
        async (catalogId: number) => {
            if (!Number.isFinite(catalogId) || loadedRef.current.has(catalogId))
                return;
            loadedRef.current.add(catalogId);
            try {
                const related = await fetchRelated(catalogId);
                setRelatedByCatalog((prev) => {
                    if (prev[catalogId]) return prev;
                    return { ...prev, [catalogId]: related };
                });
            } catch {
                loadedRef.current.delete(catalogId);
                // silent per line: just show nothing extra
            }
        },
        [fetchRelated]
    );

    // Prefetch variants/tiers/assets for pre-filled (edit) lines.
    // NOTE: no loadedRef guard here — under StrictMode the effect re-runs
    // after cleanup, and a ref guard would skip the re-fetch while the first
    // run's results were discarded. The prev[cid] check below dedupes.
    useEffect(() => {
        let active = true;
        for (const cid of initialCatalogIds) {
            fetchRelated(cid)
                .then((related) => {
                    if (!active) return;
                    setRelatedByCatalog((prev) => {
                        if (prev[cid]) return prev;
                        return { ...prev, [cid]: related };
                    });
                })
                .catch(() => {
                    // silent per line: just show nothing extra
                });
        }
        return () => {
            active = false;
        };
    }, [initialCatalogIds, fetchRelated]);

    const updateLine = (index: number, patch: Partial<QuotationFormLine>) => {
        setLines((prev) =>
            prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
        );
    };
    const handleCatalogChange = (index: number, value: string) => {
        const catalog = catalogs.find((c) => String(c.catalogId) === value);
        updateLine(index, {
            catalogId: value,
            variantId: '',
            tierId: '',
            assetIds: [],
            description: catalog?.name ?? '',
            unitPrice:
                catalog?.basePrice !== undefined &&
                catalog?.basePrice !== null
                    ? String(catalog.basePrice)
                    : '',
        });
        const id = Number(value);
        if (Number.isFinite(id) && value !== '') void ensureRelated(id);
    };
    const handleVariantChange = (index: number, variantValue: string) => {
        const line = lines[index];
        updateLine(index, { variantId: variantValue, tierId: '' });
        if (!variantValue) {
            const catalog = catalogs.find(
                (c) => String(c.catalogId) === line?.catalogId
            );
            if (
                catalog?.basePrice !== undefined &&
                catalog?.basePrice !== null
            ) {
                updateLine(index, {
                    variantId: variantValue,
                    tierId: '',
                    unitPrice: String(catalog.basePrice),
                });
            }
            return;
        }
        const catalogId = Number(line?.catalogId);
        const related = Number.isFinite(catalogId)
            ? relatedByCatalog[catalogId]
            : undefined;
        const variant = related?.variants.find(
            (v) => String(v.variantId) === variantValue
        );
        if (variant) {
            const catalog = catalogs.find(
                (c) => Number(c.catalogId) === Number(variant.catalogId)
            );
            const base = Number(catalog?.basePrice ?? 0);
            const adj = Number(variant.priceAdjustment ?? 0);
            updateLine(index, {
                variantId: variantValue,
                tierId: '',
                unitPrice: String(base + adj),
            });
        }
    };
    const handleUseTierPrice = (index: number, tier: SupplierPriceTier) => {
        updateLine(index, {
            unitPrice: String(tier.unitPrice),
            tierId: String(tier.tierId),
        });
    };
    const clearTier = (index: number) => {
        updateLine(index, { tierId: '' });
    };
    const addLine = () => {
        setLines((prev) => [
            ...prev,
            {
                key: lineSeq,
                catalogId: '',
                variantId: '',
                tierId: '',
                assetIds: [],
                quantity: '',
                unitPrice: '',
                description: '',
            },
        ]);
        setLineSeq((s) => s + 1);
    };
    const removeLine = (index: number) => {
        setLines((prev) =>
            prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
        );
    };

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label>Buyer (Retailer)</Label>
                {retailers.length === 0 ? (
                    <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                        There is no established partnership with any retailer
                        yet. Accept a retailer invitation first to raise a
                        quotation.
                    </p>
                ) : (
                    <Select
                        value={
                            form.buyerOrgId ? String(form.buyerOrgId) : ''
                        }
                        onValueChange={(v) =>
                            setForm({
                                ...form,
                                buyerOrgId: v,
                            })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select retailer" />
                        </SelectTrigger>
                        <SelectContent>
                            {retailers.map((r) => (
                                <SelectItem
                                    key={r.orgId}
                                    value={String(r.orgId)}
                                >
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Valid From</Label>
                    <DatePicker
                        date={parseYmd(form.validFrom)}
                        onDateChange={(d) =>
                            setForm({
                                ...form,
                                validFrom: formatYmd(d),
                            })
                        }
                        placeholder="Pick start date"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Valid To</Label>
                    <DatePicker
                        date={parseYmd(form.validTo)}
                        onDateChange={(d) =>
                            setForm({
                                ...form,
                                validTo: formatYmd(d),
                            })
                        }
                        placeholder="Pick end date"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Currency</Label>
                    <Select
                        value={form.currency}
                        onValueChange={(v) =>
                            setForm({
                                ...form,
                                currency: v,
                            })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {['USD', 'EUR', 'GBP', 'INR'].map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-2">
                <Label>Terms</Label>
                <Textarea
                    placeholder="e.g. Net 30, FOB destination"
                    value={form.terms}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            terms: e.target.value,
                        })
                    }
                />
            </div>
            <div className="grid gap-3">
                <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addLine}
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add line
                    </Button>
                </div>
                {lines.map((line, index) => {
                    const catalogIdNum = Number(line.catalogId);
                    const related =
                        Number.isFinite(catalogIdNum) &&
                        line.catalogId !== ''
                            ? relatedByCatalog[catalogIdNum]
                            : undefined;
                    const selectedVariant = related?.variants.find(
                        (v) => String(v.variantId) === line.variantId
                    );
                    const qty = Number(line.quantity || 0);
                    const price = Number(line.unitPrice || 0);
                    const total =
                        Number.isFinite(qty) && Number.isFinite(price)
                            ? qty * price
                            : 0;
                    return (
                        <div
                            key={line.key}
                            className="grid gap-3 rounded-md border p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Line {index + 1}
                                </span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={lines.length <= 1}
                                    onClick={() => removeLine(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                            <div className="grid gap-2">
                                <Label>Catalog</Label>
                                <Select
                                    value={line.catalogId}
                                    onValueChange={(v) =>
                                        handleCatalogChange(index, v)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select catalog" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {catalogs.map((c) => (
                                            <SelectItem
                                                key={c.catalogId}
                                                value={String(c.catalogId)}
                                            >
                                                {c.name} ({c.code}) —{' '}
                                                {c.basePrice ?? '-'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {related && (
                                <div className="grid gap-2">
                                    <Label>Variant</Label>
                                    <Select
                                        value={line.variantId}
                                        onValueChange={(v) =>
                                            handleVariantChange(
                                                index,
                                                v === 'none' ? '' : v
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="No variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No variant
                                            </SelectItem>
                                            {related.variants.map((v) => (
                                                <SelectItem
                                                    key={v.variantId}
                                                    value={String(v.variantId)}
                                                >
                                                    {v.variantType}:{' '}
                                                    {v.variantValue}
                                                    {v.skuSuffix
                                                        ? ` (${v.skuSuffix})`
                                                        : ''}{' '}
                                                    — stock{' '}
                                                    {v.quantityAvailable ??
                                                        '-'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedVariant && (
                                        <p className="text-xs text-muted-foreground">
                                            {selectedVariant.variantType}:{' '}
                                            {selectedVariant.variantValue}
                                            {selectedVariant.skuSuffix
                                                ? ` · SKU suffix ${selectedVariant.skuSuffix}`
                                                : ''}{' '}
                                            · Stock{' '}
                                            {selectedVariant.quantityAvailable ??
                                                '-'}
                                            {selectedVariant.priceAdjustment !==
                                                undefined &&
                                                ` · Adj ${selectedVariant.priceAdjustment}`}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label>Qty</Label>
                                    <Input
                                        placeholder="e.g. 100"
                                        value={line.quantity}
                                        onChange={(e) =>
                                            updateLine(index, {
                                                quantity: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Unit Price</Label>
                                    <Input
                                        placeholder="e.g. 99.50"
                                        value={line.unitPrice}
                                        onChange={(e) =>
                                            updateLine(index, {
                                                unitPrice: e.target.value,
                                            })
                                        }
                                    />
                                    {line.tierId && (
                                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                Price tier:{' '}
                                                {related?.tiers.find(
                                                    (t) =>
                                                        String(t.tierId) ===
                                                        line.tierId
                                                )?.tierName ??
                                                    `#${line.tierId}`}
                                            </span>
                                            <button
                                                type="button"
                                                className="underline underline-offset-2 hover:text-foreground"
                                                onClick={() =>
                                                    clearTier(index)
                                                }
                                            >
                                                Clear
                                            </button>
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label>Total</Label>
                                    <div className="flex h-9 items-center text-sm font-medium">
                                        {total.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="Line description"
                                    value={line.description}
                                    onChange={(e) =>
                                        updateLine(index, {
                                            description: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            {related && related.tiers.length > 0 && (
                                <div className="grid gap-2">
                                    <Label>Price tiers</Label>
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b bg-muted/50 text-left">
                                                    <th className="px-2 py-1 font-medium">
                                                        Tier
                                                    </th>
                                                    <th className="px-2 py-1 font-medium">
                                                        Qty
                                                    </th>
                                                    <th className="px-2 py-1 font-medium">
                                                        Unit price
                                                    </th>
                                                    <th className="px-2 py-1" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {related.tiers.map((t) => (
                                                    <tr
                                                        key={t.tierId}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-2 py-1">
                                                            {t.tierName ??
                                                                `#${t.tierId}`}
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            {t.minQuantity ??
                                                                '—'}{' '}
                                                            –{' '}
                                                            {t.maxQuantity ??
                                                                '∞'}
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            {t.unitPrice}
                                                        </td>
                                                        <td className="px-2 py-1 text-right">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleUseTierPrice(
                                                                        index,
                                                                        t
                                                                    )
                                                                }
                                                            >
                                                                Use price
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {related &&
                                related.assets.length > 0 &&
                                (() => {
                                    const allIds = related.assets.map((a) =>
                                        String(a.assetId)
                                    );
                                    const allChecked =
                                        allIds.length > 0 &&
                                        allIds.every((id) =>
                                            line.assetIds.includes(id)
                                        );
                                    const toggleAsset = (id: string) =>
                                        updateLine(index, {
                                            assetIds:
                                                line.assetIds.includes(id)
                                                    ? line.assetIds.filter(
                                                          (x) => x !== id
                                                      )
                                                    : [
                                                          ...line.assetIds,
                                                          id,
                                                      ],
                                        });
                                    return (
                                        <div className="grid gap-2">
                                            <Label>
                                                Digital assets (
                                                {line.assetIds.length}{' '}
                                                selected)
                                            </Label>
                                            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                                <Checkbox
                                                    checked={allChecked}
                                                    onCheckedChange={() =>
                                                        updateLine(index, {
                                                            assetIds:
                                                                allChecked
                                                                    ? []
                                                                    : [
                                                                          ...allIds,
                                                                      ],
                                                        })
                                                    }
                                                />
                                                <span className="text-sm font-medium">
                                                    Select all
                                                </span>
                                            </div>
                                            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                                                {related.assets.map((a) => {
                                                    const id = String(
                                                        a.assetId
                                                    );
                                                    return (
                                                        <label
                                                            key={a.assetId}
                                                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                                                        >
                                                            <Checkbox
                                                                checked={line.assetIds.includes(
                                                                    id
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleAsset(
                                                                        id
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                {a.fileName ??
                                                                    `Asset #${a.assetId}`}{' '}
                                                                <span className="text-muted-foreground">
                                                                    (
                                                                    {
                                                                        a.assetType
                                                                    }
                                                                    )
                                                                </span>
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                        </div>
                    );
                })}
            </div>
            <Button
                onClick={() =>
                    onSubmit({
                        buyerOrgId: form.buyerOrgId,
                        validFrom: form.validFrom,
                        validTo: form.validTo,
                        terms: form.terms,
                        currency: form.currency,
                        lines,
                    })
                }
                disabled={saving}
            >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? savingLabel : submitLabel}
            </Button>
        </div>
    );
}
