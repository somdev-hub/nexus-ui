import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";

interface ProductCardsProps {
	totalProducts: number;
	products: Array<{
		productId: number;
		productName: string;
		category: string;
		unitPrice: number;
		currency: string;
		isActive: boolean;
		brand?: string;
	}>;
}

export function ProductCards({ totalProducts, products }: ProductCardsProps) {
	const activeProducts = products.filter(p => p.isActive).length;
	const totalValue = products.reduce((sum, p) => sum + p.unitPrice, 0);
	const categories = new Set(products.map(p => p.category)).size;

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<Card className="@container/card p-2">
				<CardHeader>
					<CardDescription>Total Products</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{totalProducts}
					</CardTitle>
				</CardHeader>
			</Card>
			<Card className="@container/card p-2">
				<CardHeader>
					<CardDescription>Active Products</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{activeProducts}
					</CardTitle>
				</CardHeader>
			</Card>
			<Card className="@container/card p-2">
				<CardHeader>
					<CardDescription>Categories</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{categories}
					</CardTitle>
				</CardHeader>
			</Card>
			<Card className="@container/card p-2">
				<CardHeader>
					<CardDescription>Total Value</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{products.length > 0 ? products[0].currency : "$"} {totalValue.toLocaleString()}
					</CardTitle>
				</CardHeader>
			</Card>
		</div>
	);
}
