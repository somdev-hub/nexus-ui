'use client';

import * as React from 'react';
import { Pie, PieChart } from 'recharts';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

export interface MaterialDistributionItem {
    name: string;
    value: number;
}

export interface MaterialDistributionPieProps {
    data: MaterialDistributionItem[];
    title?: string;
}

export function MaterialDistributionPie({
    data,
    title = 'Material Distribution',
}: MaterialDistributionPieProps) {
    const chartData = React.useMemo(() => {
        const filtered =
            data && data.length > 0
                ? data.filter((d) => (d.value ?? 0) > 0)
                : [];
        const source =
            filtered.length > 0 ? filtered : [{ name: 'No data', value: 1 }];
        return source.map((item, index) => ({
            ...item,
            fill: `var(--color-${item.name})`,
            _index: index,
        }));
    }, [data]);

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        chartData.forEach((item, index) => {
            config[item.name] = {
                label: item.name,
                color: `var(--chart-${(index % 5) + 1})`,
            };
        });
        return config;
    }, [chartData]);

    return (
        <Card className="@container/card gap-2 p-4 h-full">
            <CardHeader className="p-0">
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    Materials received via PO / Consignment / VMI
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={0}
                        />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
