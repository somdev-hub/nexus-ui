'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Download, Eye, MapPin, Truck } from 'lucide-react';
import { Money } from '@/components/finances/money';
import { getBillingQuote } from '@/lib/services/billing-service';
import type { PayQuote, QuoteShipment } from '@/types/finances';
import type { SuiteIntent } from '@/types/payments';

// ─────────────────────────────────────────────────────────────
// Settlement payments table: every LOGISTICS_SETTLEMENT intent
// (trips batched or a cycle statement) the payer made through
// /checkout. Details dialog shows the payment + frozen quote
// with full trip facts; Download produces a txt invoice.
// ─────────────────────────────────────────────────────────────

function fmtRaw(amount: number | null | undefined, currency?: string | null) {
    if (amount === null || amount === undefined) return '—';
    return `${currency ?? ''} ${Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
    })}`.trim();
}

function dt(v?: string | number | null, dateOnly = false) {
    if (!v) return '—';
    return dateOnly
        ? new Date(v).toLocaleDateString()
        : new Date(v).toLocaleString();
}

function detailRow(k: string, v?: string | number | null, mono = false) {
    return (
        <div
            key={k}
            className="grid grid-cols-[130px_minmax(0,1fr)] items-start gap-2 py-1 text-sm"
        >
            <span className="text-muted-foreground">{k}</span>
            <span
                className={`min-w-0 break-all font-medium ${mono ? 'font-mono text-xs' : ''}`}
            >
                {v ?? '—'}
            </span>
        </div>
    );
}

function addrText(a?: string, b?: string) {
    return [a, b].filter((x) => x && x.trim()).join(' · ') || undefined;
}

function kindLabel(kind?: string, shipmentId?: number | null) {
    if (kind === 'BASE_TRIP') return `Base fare · trip ${shipmentId ?? ''}`;
    if (kind === 'LATE_FEE') return `Late fee · trip ${shipmentId ?? ''}`;
    return 'Cycle penalty';
}

/** Builds the txt invoice from the intent + its frozen quote breakdown. */
function buildInvoiceText(intent: SuiteIntent, quote: PayQuote | null): string {
    const c = intent.currency ?? 'USD';
    const lines: string[] = [
        'NEXUS — LOGISTICS SETTLEMENT INVOICE',
        '====================================',
        `Payment ref    : ${intent.ref}`,
        `Quote ref      : ${intent.quoteRef ?? '—'}`,
        `Status         : ${intent.status}`,
        `Partnership    : #${intent.partnershipId ?? '—'}`,
        `Payer role     : ${intent.payerRole ?? '—'}`,
        `Description    : ${intent.description ?? '—'}`,
        `Amount paid    : ${fmtRaw(intent.amount, c)}`,
        `Created at     : ${dt(intent.createdAt)}`,
        `Completed at   : ${dt(intent.completedAt)}`,
    ];
    if (quote) {
        const ship = quote.shipments ?? {};
        lines.push('', '--- Billed trips ---');
        for (const l of quote.lines ?? []) {
            if (l.kind === 'BASE_TRIP') {
                const s: QuoteShipment | undefined =
                    ship[String(l.shipmentId ?? '')];
                lines.push('');
                lines.push(
                    `  Shipment ${s?.shipmentNumber ?? '#' + String(l.shipmentId ?? '—')}`
                );
                lines.push(`  Lane           : ${s?.lane ?? '—'}`);
                const from = addrText(s?.pickupLocation, s?.pickupAddress);
                if (from)
                    lines.push(
                        `  Pickup         : ${from} (${dt(s?.pickupDate, true)})`
                    );
                const to = addrText(s?.deliveryLocation, s?.deliveryAddress);
                if (to)
                    lines.push(
                        `  Delivery       : ${to} (${dt(s?.deliveredAt, true)})`
                    );
                if (s?.deliveryDate)
                    lines.push(
                        `  Promised by    : ${dt(s.deliveryDate, true)}`
                    );
                if (s?.logisticsOrg)
                    lines.push(`  Logistics      : ${s.logisticsOrg}`);
                lines.push(`  Base fare      : ${fmtRaw(l.quoted, c)}`);
            } else {
                lines.push(
                    `  ${kindLabel(l.kind, l.shipmentId).padEnd(16, ' ')}: ${fmtRaw(l.quoted, c)}`
                );
            }
        }
        lines.push(
            '',
            '--- Totals ---',
            `Base total     : ${fmtRaw(quote.baseTotal, c)}`,
            `Late fees      : ${fmtRaw(quote.feeTotal, c)}`,
            `Penalties      : ${fmtRaw(quote.penaltyTotal, c)}`,
            `Grand total    : ${fmtRaw(quote.grandTotal, c)}`
        );
    }
    lines.push(
        '',
        'Mock gateway — no real money moved. Generated by Nexus Suite.'
    );
    return lines.join('\n');
}

/** Trip fact card inside the details dialog. */
function TripCard({ s }: { s: QuoteShipment }) {
    return (
        <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                        {s.shipmentNumber ?? `Shipment #${s.shipmentId}`}
                    </span>
                </div>
                {s.status && (
                    <Badge variant="outline" className="shrink-0">
                        {s.status}
                    </Badge>
                )}
            </div>
            {s.logisticsOrg && (
                <p className="mt-1 text-xs text-muted-foreground">
                    {s.logisticsOrg}
                </p>
            )}
            <div className="mt-2 grid gap-1 text-xs">
                <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                        <span className="font-medium">Pickup</span>{' '}
                        <span className="text-muted-foreground">
                            {addrText(s.pickupLocation, s.pickupAddress) ?? '—'}
                            {' · '}
                            {dt(s.pickupDate, true)}
                        </span>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                        <span className="font-medium">Delivery</span>{' '}
                        <span className="text-muted-foreground">
                            {addrText(s.deliveryLocation, s.deliveryAddress) ??
                                '—'}
                            {' · delivered '}
                            {dt(s.deliveredAt, true)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function LogisticsPaymentsTable({
    payments,
    loading = false,
}: {
    payments: SuiteIntent[];
    loading?: boolean;
}) {
    const [open, setOpen] = useState<SuiteIntent | null>(null);
    const [quote, setQuote] = useState<PayQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    // Frozen quote (with enriched shipment facts) for the details dialog.
    useEffect(() => {
        if (!open?.quoteRef) {
            setQuote(null);
            return;
        }
        let active = true;
        setQuoteLoading(true);
        getBillingQuote(open.quoteRef)
            .then((q) => active && setQuote(q))
            .catch(() => active && setQuote(null))
            .finally(() => active && setQuoteLoading(false));
        return () => {
            active = false;
        };
    }, [open]);

    const download = (intent: SuiteIntent) => {
        // Reuse the already-fetched quote if it matches, else build from intent alone.
        const q = quote && open?.intentId === intent.intentId ? quote : null;
        const text = buildInvoiceText(intent, q);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settlement-${intent.quoteRef ?? intent.intentId}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const statusVariant = (s: string) =>
        s === 'COMPLETED'
            ? 'default'
            : s === 'FAILED' || s === 'CANCELLED' || s === 'EXPIRED'
              ? 'destructive'
              : 'secondary';

    const baseTrips = (quote?.lines ?? []).filter(
        (l) => l.kind === 'BASE_TRIP'
    );

    return (
        <Card className="p-4 gap-2">
            <CardHeader className="p-0">
                <CardTitle className="text-base">
                    Payments made to logistics
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                        every checkout settlement on this partnership
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading && payments.length === 0 ? (
                    <Skeleton className="h-[120px] w-full" />
                ) : payments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No settlement payments yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Quote</TableHead>
                                    <TableHead className="text-right">
                                        Amount
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Completed</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((it) => (
                                    <TableRow key={it.intentId}>
                                        <TableCell className="max-w-[220px] truncate font-medium">
                                            {it.description ??
                                                `Intent #${it.intentId}`}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {it.quoteRef ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            <Money
                                                amount={it.amount}
                                                currency={it.currency}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={statusVariant(
                                                    it.status
                                                )}
                                            >
                                                {it.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {dt(it.completedAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setOpen(it)}
                                                >
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    Details
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => download(it)}
                                                >
                                                    <Download className="mr-1 h-4 w-4" />
                                                    Invoice
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Dialog
                open={open !== null}
                onOpenChange={(v) => !v && setOpen(null)}
            >
                <DialogContent className="slim-scrollbar max-h-[85vh] overflow-y-auto md:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Settlement payment details</DialogTitle>
                        <DialogDescription>
                            {open?.description ?? ''}
                        </DialogDescription>
                    </DialogHeader>

                    {/* payment facts */}
                    <div>
                        {detailRow('Payment ref', open?.ref, true)}
                        {detailRow('Quote ref', open?.quoteRef, true)}
                        {detailRow('Status', open?.status)}
                        <div className="grid grid-cols-[130px_minmax(0,1fr)] items-start gap-2 py-1 text-sm">
                            <span className="text-muted-foreground">
                                Amount
                            </span>
                            <span className="min-w-0 font-medium font-mono">
                                {fmtRaw(open?.amount, open?.currency)}
                            </span>
                        </div>
                        {detailRow(
                            'Partnership',
                            open?.partnershipId
                                ? `#${open.partnershipId}`
                                : null
                        )}
                        {detailRow('Created at', dt(open?.createdAt))}
                        {detailRow('Completed at', dt(open?.completedAt))}
                        {(open?.failureReason ?? null) !== null &&
                            detailRow('Failure reason', open?.failureReason)}
                    </div>

                    {/* frozen quote breakdown with trip facts */}
                    {open?.quoteRef && (
                        <div className="rounded-md border">
                            <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                                Frozen quote breakdown{' '}
                                {quote?.status ? `· ${quote.status}` : ''}
                            </p>
                            <div className="grid gap-2 px-3 py-2">
                                {quoteLoading ? (
                                    <>
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                    </>
                                ) : quote ? (
                                    <>
                                        {baseTrips.map((l, i) => {
                                            const s =
                                                quote.shipments?.[
                                                    String(l.shipmentId ?? '')
                                                ];
                                            return (
                                                <TripCard
                                                    key={i}
                                                    s={
                                                        s ?? {
                                                            shipmentId:
                                                                l.shipmentId ??
                                                                0,
                                                        }
                                                    }
                                                />
                                            );
                                        })}
                                        <div className="grid gap-0.5 pt-1">
                                            {(quote.lines ?? [])
                                                .filter(
                                                    (l) =>
                                                        l.kind !== 'BASE_TRIP'
                                                )
                                                .map((l, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between text-xs"
                                                    >
                                                        <span className="text-muted-foreground">
                                                            {kindLabel(
                                                                l.kind,
                                                                l.shipmentId
                                                            )}
                                                        </span>
                                                        <span className="font-mono">
                                                            {fmtRaw(
                                                                l.quoted,
                                                                open.currency
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            <div className="mt-1 flex items-center justify-between border-t pt-1 text-xs font-medium">
                                                <span>Base total</span>
                                                <span className="font-mono">
                                                    {fmtRaw(
                                                        quote.baseTotal,
                                                        open.currency
                                                    )}
                                                </span>
                                            </div>
                                            {(Number(quote.feeTotal ?? 0) > 0 ||
                                                Number(
                                                    quote.penaltyTotal ?? 0
                                                ) > 0) && (
                                                <>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">
                                                            Late fees
                                                        </span>
                                                        <span className="font-mono">
                                                            {fmtRaw(
                                                                quote.feeTotal,
                                                                open.currency
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">
                                                            Penalties
                                                        </span>
                                                        <span className="font-mono">
                                                            {fmtRaw(
                                                                quote.penaltyTotal,
                                                                open.currency
                                                            )}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            <div className="flex items-center justify-between border-t pt-1 text-xs font-semibold">
                                                <span>Grand total</span>
                                                <span className="font-mono">
                                                    {fmtRaw(
                                                        quote.grandTotal,
                                                        open.currency
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Quote breakdown unavailable.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => open && download(open)}
                        >
                            <Download className="mr-1 h-4 w-4" />
                            Download invoice
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
