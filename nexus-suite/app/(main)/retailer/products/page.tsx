"use client";

import { ProductCards } from "@/components/product-cards";
import { ProductTable } from "@/components/product-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/lib/services/products-service";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/types/products";

export default function Page() {
	const [products, setProducts] = useState<Product[]>([]);
	const [totalElements, setTotalElements] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;
		const load = async () => {
			setIsLoading(true);
			try {
				const res = await getProducts({ pageNo: 0, pageOffset: 20 });
				if (!isActive) return;
				setProducts(res.content);
				setTotalElements(res.totalElements);
			} catch (err: unknown) {
				if (!isActive) return;
				toast.error(err instanceof Error ? err.message : "Failed to load products");
			} finally {
				if (isActive) setIsLoading(false);
			}
		};
		load();
		return () => { isActive = false; };
	}, []);

	if (isLoading) {
		return (
			<div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-[400px] w-full" />
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<ProductCards totalProducts={totalElements} products={products} />
						<ProductTable products={products} />
					</div>
				</div>
			</div>
		</>
	);
}
