import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "@/components/ui/card";

interface SectionCardsProps {
	totalProducts: number;
	totalMaterials: number;
	totalOrders: number;
	totalPartnerships: number;
}

export function SectionCards({ totalProducts, totalMaterials, totalOrders, totalPartnerships }: SectionCardsProps) {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<Card className="@container/card gap-2 p-4">
				<CardHeader className="p-0">
					<CardDescription>Total Products</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{totalProducts}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							<IconTrendingUp />
							+12.5%
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Active products <IconTrendingUp className="size-4" />
					</div>
					<div className="text-muted-foreground">
						Products in catalog
					</div>
				</CardFooter>
			</Card>
			<Card className="@container/card gap-2 p-4">
				<CardHeader className="p-0">
					<CardDescription>Total Materials</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{totalMaterials}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							<IconTrendingDown />
							-20%
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Materials in inventory <IconTrendingDown className="size-4" />
					</div>
					<div className="text-muted-foreground">
						Materials available
					</div>
				</CardFooter>
			</Card>
			<Card className="@container/card gap-2 p-4">
				<CardHeader className="p-0">
					<CardDescription>Total Orders</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{totalOrders}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							<IconTrendingUp />
							+12.5%
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Orders placed <IconTrendingUp className="size-4" />
					</div>
					<div className="text-muted-foreground">Order volume growing</div>
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
						Active partnerships <IconTrendingUp className="size-4" />
					</div>
					<div className="text-muted-foreground">Partnership network expanding</div>
				</CardFooter>
			</Card>
		</div>
	);
}
