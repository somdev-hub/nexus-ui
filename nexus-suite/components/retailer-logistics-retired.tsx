'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─────────────────────────────────────────────────────────────
// Delivery is owned by the supplier: after the retailer raises a
// purchase order, the supplier hands the shipment to a logistics
// partner from the supplier logistics marketplace. The retailer
// journey resumes at goods receipt and payment.
// ─────────────────────────────────────────────────────────────

export default function RetailerLogisticsRetired({ from }: { from: string }) {
    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>This area has moved to the supplier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {from} is no longer managed by the retailer. Delivery
                        is now a supplier responsibility: suppliers partner
                        with logistics providers from their own marketplace
                        and hand shipments over after acknowledgement. Your
                        part ends when the purchase order is raised — you
                        receive the goods and pay on receipt.
                    </p>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href="/retailer/procurement/goods-receipts">
                                Go to Goods Receipts
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/retailer/procurement/invoices">
                                Go to Invoices
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
