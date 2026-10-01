'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getMatchingSummary,
    canInvoice,
    performThreeWayMatch,
} from '@/lib/services/procurement-extended-service';
import type { ThreeWayMatchResult } from '@/types/procurement';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ThreeWayPage() {
    const [poId, setPoId] = useState('');
    const [result, setResult] = useState<any>(null);
    const [match, setMatch] = useState<ThreeWayMatchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isMatching, setIsMatching] = useState(false);

    const check = async () => {
        if (!poId) return toast.error('Enter Purchase Order ID');
        setIsLoading(true);
        try {
            const [summary, can] = await Promise.all([
                getMatchingSummary(Number(poId)).catch(() => null),
                canInvoice(Number(poId)).catch(() => null),
            ]);
            setResult({ summary, can });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed');
        } finally {
            setIsLoading(false);
        }
    };

    const runMatch = async () => {
        if (!poId) return toast.error('Enter Purchase Order ID');
        setIsMatching(true);
        try {
            const r = await performThreeWayMatch(Number(poId));
            setMatch(r);
            toast.success('Three-way match completed');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed');
        } finally {
            setIsMatching(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div>
                <h1 className="text-2xl font-bold">Three-Way Matching</h1>
                <p className="text-muted-foreground">
                    PO → Goods Receipt → Invoice · FR-RET-005 / FR-FIN-002/003
                </p>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Check Purchase Order</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex gap-4">
                    <Input
                        placeholder="Purchase Order ID"
                        value={poId}
                        onChange={(e) => setPoId(e.target.value)}
                        className="max-w-xs"
                    />
                    <Button
                        onClick={check}
                        disabled={isLoading}
                        variant="outline"
                    >
                        {isLoading ? 'Checking...' : 'Check Match'}
                    </Button>
                    <Button onClick={runMatch} disabled={isMatching}>
                        {isMatching ? 'Matching...' : 'Run Match'}
                    </Button>
                </CardContent>
            </Card>
            {(isLoading || isMatching) && <Skeleton className="h-40 w-full" />}
            {match && (
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Match Run Result</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-2">
                            <div>
                                PO:{' '}
                                <span className="font-mono">
                                    {match.poNumber || match.purchaseOrderId}
                                </span>{' '}
                                <Badge>{match.status}</Badge>
                            </div>
                            <div>
                                Qty Matched:{' '}
                                <Badge
                                    variant={
                                        match.quantityMatched
                                            ? 'default'
                                            : 'outline'
                                    }
                                >
                                    {String(match.quantityMatched)}
                                </Badge>{' '}
                                Amount Matched:{' '}
                                <Badge
                                    variant={
                                        match.amountMatched
                                            ? 'default'
                                            : 'outline'
                                    }
                                >
                                    {String(match.amountMatched)}
                                </Badge>
                            </div>
                            {match.discrepancies &&
                                match.discrepancies.length > 0 && (
                                    <div className="text-sm text-red-600">
                                        Discrepancies:{' '}
                                        {match.discrepancies.join(', ')}
                                    </div>
                                )}
                            <p className="text-sm text-muted-foreground">
                                {match.canReleasePayment
                                    ? 'Match passed — the invoice can proceed to approval and payment release.'
                                    : 'Match has open discrepancies — resolve the goods receipt or invoice quantities/amounts, then run the match again. Payment stays on hold until the match passes.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
            {result && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>Match Result</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {result.summary ? (
                                <div className="space-y-2">
                                    <div>
                                        Status:{' '}
                                        <Badge>
                                            {result.summary.status || 'UNKNOWN'}
                                        </Badge>
                                    </div>
                                    <div>
                                        Qty Matched:{' '}
                                        {String(result.summary.quantityMatched)}
                                    </div>
                                    <div>
                                        Amount Matched:{' '}
                                        {String(result.summary.amountMatched)}
                                    </div>
                                    <div>
                                        Can Release Payment:{' '}
                                        <Badge
                                            variant={
                                                result.summary.canReleasePayment
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            {String(
                                                result.summary.canReleasePayment
                                            )}
                                        </Badge>
                                    </div>
                                    {result.summary.discrepancies?.length >
                                        0 && (
                                        <div className="text-sm text-red-600">
                                            Discrepancies:{' '}
                                            {result.summary.discrepancies.join(
                                                ', '
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">
                                    No summary
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>Can Invoice?</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {result.can ? (
                                <Badge
                                    className={
                                        result.can.canInvoice
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }
                                >
                                    {String(result.can.canInvoice)}
                                </Badge>
                            ) : (
                                '—'
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
