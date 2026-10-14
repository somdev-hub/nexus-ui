'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MockPaymentStatus } from '@/types/payments';
import { Check, Loader2, X } from 'lucide-react';

const STEPS = ['PENDING', 'PROCESSING', 'COMPLETED'] as const;

export function statusColor(s?: string): string {
    switch (s) {
        case 'COMPLETED':
            return 'bg-green-100 text-green-800';
        case 'FAILED':
            return 'bg-red-100 text-red-800';
        case 'PROCESSING':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
}

export function PaymentStatusBadge({ status }: { status?: string }) {
    return (
        <Badge className={cn(statusColor(status))}>{status ?? '—'}</Badge>
    );
}

export function PaymentStatusTimeline({
    status,
}: {
    status: MockPaymentStatus;
}) {
    const failed = status === 'FAILED';
    const activeIdx =
        status === 'COMPLETED' ? 2 : status === 'PROCESSING' ? 1 : 0;
    return (
        <ol className="flex items-center gap-1">
            {STEPS.map((s, i) => {
                const done = i <= activeIdx && !failed;
                const current = i === activeIdx;
                return (
                    <li key={s} className="flex items-center gap-1">
                        <span
                            className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full border text-[11px]',
                                done
                                    ? 'border-green-600 bg-green-600 text-white'
                                    : current
                                      ? 'border-blue-600 text-blue-600'
                                      : 'border-muted-foreground/30 text-muted-foreground'
                            )}
                        >
                            {done ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : current && status !== 'COMPLETED' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                i + 1
                            )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {s}
                        </span>
                        {i < STEPS.length - 1 && (
                            <span className="mx-1 h-px w-6 bg-border" />
                        )}
                    </li>
                );
            })}
            {failed && (
                <li className="ml-2 flex items-center gap-1 text-xs text-red-600">
                    <X className="h-3.5 w-3.5" /> FAILED
                </li>
            )}
        </ol>
    );
}
