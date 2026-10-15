'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SuiteCheckout } from '@/components/payments/suite-checkout';
import { markBillingQuotePaid } from '@/lib/services/billing-service';
import { transitionInvoice } from '@/lib/services/procurement-extended-service';
import type { SuiteIntent } from '@/types/payments';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';

function CheckoutContent() {
    const params = useSearchParams();
    const ref = params.get('ref');

    // Record settlement in the core ledger but stay on the success
    // screen — the checkout handles the delayed return itself.
    const markPaid = async (intent: SuiteIntent) => {
        try {
            if (intent.quoteRef) {
                const r = await markBillingQuotePaid({
                    quoteRef: intent.quoteRef,
                    amountPaid: Number(intent.amount),
                    intentRef:
                        intent.mockPayment?.transactionReference ??
                        `SUITE-${intent.intentId}`,
                });
                toast.success(
                    r.fullyCovered
                        ? 'Settlement recorded — quote fully covered'
                        : 'Settlement recorded — partial payment applied oldest-first'
                );
                return;
            }
            if (!intent.invoiceId) return;
            await transitionInvoice(intent.invoiceId, 'PAID', {
                paymentReferenceId:
                    intent.mockPayment?.transactionReference ??
                    `SUITE-${intent.intentId}`,
                pmsPaymentId: intent.mockPaymentId,
            });
            toast.success('Invoice marked PAID in ledger');
        } catch (e) {
            toast.error(
                e instanceof Error
                    ? `Paid, but ledger update failed: ${e.message}`
                    : 'Paid, but ledger update failed'
            );
        }
    };

    if (!ref) {
        return (
            <Card className="mx-auto max-w-lg">
                <CardContent className="grid gap-2 py-10 text-center">
                    <p className="font-semibold">Missing payment link</p>
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                        Open an approved invoice and press Pay to generate a
                        secure checkout link.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return <SuiteCheckout payRef={ref} onPaid={markPaid} />;
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="grid gap-6 lg:grid-cols-5">
                    <Skeleton className="h-[380px] lg:col-span-2" />
                    <Skeleton className="h-[380px] lg:col-span-3" />
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}
