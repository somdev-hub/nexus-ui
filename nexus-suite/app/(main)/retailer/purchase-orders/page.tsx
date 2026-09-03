"use client";

import { PurchaseOrderTable } from "@/components/purchase-order-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getPurchaseOrders } from "@/lib/services/purchase-orders-service";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PurchaseOrder } from "@/types/purchase-orders";

export default function Page() {
	const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;
		const load = async () => {
			setIsLoading(true);
			try {
				const res = await getPurchaseOrders({ pageNo: 0, pageOffset: 20 });
				if (!isActive) return;
				setPurchaseOrders(res.content);
			} catch (err: unknown) {
				if (!isActive) return;
				toast.error(err instanceof Error ? err.message : "Failed to load purchase orders");
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
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-[400px] w-full" />
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<div className="flex justify-between items-center">
							<div>
								<h1 className="text-2xl font-bold">Purchase Orders</h1>
								<p className="text-gray-600 mt-1">Manage and track all purchase orders</p>
							</div>
						</div>
						<PurchaseOrderTable purchaseOrders={purchaseOrders} />
					</div>
				</div>
			</div>
		</>
	);
}
