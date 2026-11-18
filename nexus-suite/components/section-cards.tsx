import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface SectionCardsProps {
    totalPurchaseOrders?: number;
    totalPO?: number;
    totalPOs?: number;
    totalPartnerships: number;
    totalVmi?: number;
    totalVmis?: number;
    vmiCount?: number;
    vmi?: number;
    totalConsignment?: number;
    totalConsignments?: number;
    consignmentCount?: number;
    consignment?: number;
}

export function SectionCards({
    totalPurchaseOrders,
    totalPO,
    totalPOs,
    totalPartnerships,
    totalVmi,
    totalVmis,
    vmiCount,
    vmi,
    totalConsignment,
    totalConsignments,
    consignmentCount,
    consignment,
}: SectionCardsProps) {
    const resolvedTotalPurchaseOrders =
        totalPurchaseOrders ?? totalPO ?? totalPOs ?? 0;
    const resolvedTotalVmi =
        totalVmi ?? totalVmis ?? vmiCount ?? vmi ?? 0;
    const resolvedTotalConsignment =
        totalConsignment ??
        totalConsignments ??
        consignmentCount ??
        consignment ??
        0;
    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card gap-2 p-4">
                <CardHeader className="p-0">
                    <CardDescription>Total Purchase Orders</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {resolvedTotalPurchaseOrders}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingUp />
                            +8.2%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Purchase orders raised{' '}
                        <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Total POs in system
                    </div>
                </CardFooter>
            </Card>
            <Card className="@container/card gap-2 p-4">
                <CardHeader className="p-0">
                    <CardDescription>Active Partnerships</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {totalPartnerships}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingUp />
                            +4.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Active partnerships{' '}
                        <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Partnership network expanding
                    </div>
                </CardFooter>
            </Card>
            <Card className="@container/card gap-2 p-4">
                <CardHeader className="p-0">
                    <CardDescription>Total VMI</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {resolvedTotalVmi}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingUp />
                            +3.1%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        VMI configurations{' '}
                        <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Vendor managed inventory
                    </div>
                </CardFooter>
            </Card>
            <Card className="@container/card gap-2 p-4">
                <CardHeader className="p-0">
                    <CardDescription>Total Consignment</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {resolvedTotalConsignment}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <IconTrendingUp />
                            +2.4%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Consignment stock{' '}
                        <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Consignment inventory
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
