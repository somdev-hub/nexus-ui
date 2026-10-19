'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import type { FinancePeriod } from '@/lib/services/finances-service';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import type { AgingBucket, NameAmount, TrendPoint } from '@/types/finances';

const MONTHS_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

/**
 * Trend keys come from the backend as "MM-dd" (daily buckets, e.g. 10-24)
 * or "yyyy-MM" (monthly buckets). Render them as month names + day:
 * "Oct 24" / "Oct 2025".
 */
export function fmtTrendKey(key: string | number): string {
    const k = String(key);
    const [a, b] = k.split('-');
    const monthOf = (m: string) =>
        MONTHS_SHORT[Number(m) - 1] ?? undefined;
    if (a?.length === 2 && b) {
        const m = monthOf(a);
        return m ? `${m} ${Number(b)}` : k; // daily: "10-24" → "Oct 24"
    }
    if (a?.length === 4 && b) {
        const m = monthOf(b);
        return m ? `${m} ${a}` : k; // monthly: "2025-10" → "Oct 2025"
    }
    return k;
}

// ── trend (area→bars; bar keeps single-series crisp) ──────────
export function TrendChart({
    title,
    description,
    data,
    period,
    onPeriodChange,
    loading = false,
}: {
    title: string;
    description?: string;
    data: TrendPoint[];
    period: FinancePeriod;
    onPeriodChange: (p: FinancePeriod) => void;
    /** Blocks the period buttons + skeletons the chart while a refetch runs. */
    loading?: boolean;
}) {
    const config: ChartConfig = {
        amount: { label: 'Amount', color: 'var(--chart-1)' },
    };
    return (
        <Card className="p-4 gap-2">
            <CardHeader className="flex flex-row items-start justify-between gap-2 p-0">
                <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </div>
                <ToggleGroup
                    type="single"
                    size="sm"
                    value={period}
                    // Ignore same-value clicks and lock everything while the
                    // summary is refetching — no double requests, no races.
                    disabled={loading}
                    onValueChange={(v) => {
                        if (!v || v === period || loading) return;
                        onPeriodChange(v as FinancePeriod);
                    }}
                >
                    {(['7d', '30d', '90d', '12m'] as FinancePeriod[]).map(
                        (p) => (
                            <ToggleGroupItem key={p} value={p}>
                                {p}
                            </ToggleGroupItem>
                        )
                    )}
                </ToggleGroup>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="space-y-2 py-2">
                        <Skeleton className="h-55 w-full" />
                    </div>
                ) : data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        No data in this period.
                    </p>
                ) : (
                    <ChartContainer config={config} className="h-60 w-full">
                        <BarChart data={data} margin={{ left: -8 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="period"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={24}
                                tickFormatter={fmtTrendKey}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: number) =>
                                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                                }
                            />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(label) =>
                                            fmtTrendKey(String(label))
                                        }
                                    />
                                }
                            />
                            <Bar
                                dataKey="amount"
                                fill="var(--color-amount)"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ── name/amount split (horizontal bars) ───────────────────────
export function SplitBar({
    title,
    description,
    data,
    onSelect,
}: {
    title: string;
    description?: string;
    data: NameAmount[];
    onSelect?: (name: string) => void;
}) {
    const config: ChartConfig = {
        amount: { label: 'Amount', color: 'var(--chart-2)' },
    };
    return (
        <Card className="p-4 gap-2 h-full">
            <CardHeader className="p-0">
                <CardTitle className="text-base">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-0">
                {data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        Nothing to split yet.
                    </p>
                ) : (
                    <ChartContainer config={config} className="h-60 w-full">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ left: 8 }}
                            onClick={(d) => {
                                const name =
                                    d?.activePayload?.[0]?.payload?.name;
                                if (name && onSelect) onSelect(String(name));
                            }}
                        >
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                width={110}
                                tick={{ fontSize: 12 }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="amount"
                                fill="var(--color-amount)"
                                radius={[0, 6, 6, 0]}
                                className={onSelect ? 'cursor-pointer' : undefined}
                            />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ── status donut ──────────────────────────────────────────────
const DONUT_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

export function StatusDonut({
    title,
    description,
    data,
    onSelect,
}: {
    title: string;
    description?: string;
    data: NameAmount[];
    onSelect?: (name: string) => void;
}) {
    const config: ChartConfig = Object.fromEntries(
        data.map((d, i) => [
            d.name,
            { label: d.name, color: DONUT_COLORS[i % DONUT_COLORS.length] },
        ])
    );
    return (
        <Card className="p-4 gap-2">
            <CardHeader className="p-0">
                <CardTitle className="text-base">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-0">
                {data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        No rows yet.
                    </p>
                ) : (
                    <ChartContainer config={config} className="h-60 w-full">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Pie
                                data={data}
                                dataKey="amount"
                                nameKey="name"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={2}
                                onClick={(d) => {
                                    const name = (d as { name?: string })?.name;
                                    if (name && onSelect) onSelect(name);
                                }}
                                className={onSelect ? 'cursor-pointer' : undefined}
                            >
                                {data.map((d, i) => (
                                    <Cell
                                        key={d.name}
                                        fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ── aging buckets ─────────────────────────────────────────────
export function AgingBars({
    title,
    description,
    data,
}: {
    title: string;
    description?: string;
    data: AgingBucket[];
}) {
    const config: ChartConfig = {
        amount: { label: 'Overdue amount', color: 'var(--chart-4)' },
    };
    return (
        <Card className="p-4 gap-2 h-full">
            <CardHeader className="p-0">
                <CardTitle className="text-base">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-0">
                <ChartContainer config={config} className="h-50 w-full">
                    <BarChart data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="bucket"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis tickLine={false} axisLine={false} hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                            dataKey="amount"
                            fill="var(--color-amount)"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
