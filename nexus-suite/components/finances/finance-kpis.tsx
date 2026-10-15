'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface FinanceKpi {
    title: string;
    value: string;
    sub?: string;
    icon: LucideIcon;
    tone?: 'default' | 'good' | 'warn' | 'bad';
    onClick?: () => void;
}

const TONE: Record<string, string> = {
    default: 'bg-muted text-muted-foreground',
    good: 'bg-green-100 text-green-700',
    warn: 'bg-yellow-100 text-yellow-800',
    bad: 'bg-red-100 text-red-700',
};

export function FinanceKpis({ items }: { items: FinanceKpi[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((k) => {
                const Icon = k.icon;
                const clickable = !!k.onClick;
                return (
                    <Card
                        key={k.title}
                        className={cn(
                            'p-4 gap-2',
                            clickable &&
                                'cursor-pointer transition hover:border-muted-foreground/30'
                        )}
                        onClick={k.onClick}
                    >
                        <CardHeader className="flex flex-row items-center justify-between p-0 pb-1">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {k.title}
                            </CardTitle>
                            <span
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-md',
                                    TONE[k.tone ?? 'default']
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="font-mono text-2xl font-bold tracking-tight">
                                {k.value}
                            </p>
                            {k.sub && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {k.sub}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export function fmtMoney(amount?: number | null, currency?: string): string {
    if (amount === undefined || amount === null) return '—';
    const n = Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
    });
    return currency ? `${currency} ${n}` : n;
}
