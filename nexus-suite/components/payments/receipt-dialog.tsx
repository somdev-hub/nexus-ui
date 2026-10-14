'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { MockReceipt } from '@/types/payments';
import { Download, Printer } from 'lucide-react';

function row(k: string, v?: string | number | null) {
    return (
        <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium">{v ?? '—'}</span>
        </div>
    );
}

function downloadReceipt(receipt: MockReceipt) {
    const lines = [
        'NEXUS PAY — PAYMENT RECEIPT (mock gateway, no real money moved)',
        '===============================================================',
        `Receipt no      : ${receipt.receiptNo}`,
        `Transaction ref : ${receipt.transactionReference}`,
        `Status          : ${receipt.status}`,
        `Amount paid     : ${receipt.currency} ${Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `Fee             : ${receipt.currency} ${Number(receipt.feeAmount ?? 0).toFixed(2)}`,
        `Net             : ${receipt.currency} ${Number(receipt.netAmount ?? receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `Method          : ${receipt.paymentMethod} · ${receipt.methodDetailMasked ?? ''}`,
        `Payer           : ${receipt.payerName ?? '—'}`,
        `Invoice         : ${receipt.invoiceNumber ?? receipt.invoiceId ?? '—'}`,
        `Payer role      : ${receipt.payerRole ?? '—'}`,
        `Paid at         : ${receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : '—'}`,
        `Idempotency key : ${receipt.idempotencyKey}`,
        `Description     : ${receipt.description ?? '—'}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receiptNo ?? 'receipt'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function ReceiptDialog({
    receipt,
    open,
    onOpenChange,
}: {
    receipt: MockReceipt | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Payment receipt</DialogTitle>
                    <DialogDescription>
                        Mock gateway receipt — safe for demo, no real money
                        moved.
                    </DialogDescription>
                </DialogHeader>
                {!receipt ? (
                    <p className="text-sm text-muted-foreground">
                        No receipt yet.
                    </p>
                ) : (
                    <Card className="print:border-none print:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-mono text-lg">
                                    {receipt.receiptNo}
                                </CardTitle>
                                <p className="font-mono text-xs text-muted-foreground">
                                    {receipt.transactionReference}
                                </p>
                            </div>
                            <div className="flex gap-2 print:hidden">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadReceipt(receipt)}
                                >
                                    <Download className="mr-1 h-4 w-4" /> Download
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="mr-1 h-4 w-4" /> Print
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {row(
                                'Amount paid',
                                `${receipt.currency} ${Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            )}
                            {row('Fee', `${receipt.currency} ${Number(receipt.feeAmount ?? 0).toFixed(2)}`)}
                            {row('Method', `${receipt.paymentMethod} · ${receipt.methodDetailMasked ?? ''}`)}
                            {row('Invoice', receipt.invoiceNumber ?? receipt.invoiceId)}
                            {row('Payer role', receipt.payerRole)}
                            {row('Paid at', receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : '—')}
                            {row('Idempotency key', receipt.idempotencyKey)}
                            <Separator className="my-2" />
                            <p className="text-xs text-muted-foreground">
                                {receipt.description}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </DialogContent>
        </Dialog>
    );
}
