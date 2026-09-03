"use client";

import { getOrders } from "@/lib/services/orders-service";
import { OrderTable } from "@/components/order-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Order } from "@/types/orders";

const Page = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;
		const load = async () => {
			setIsLoading(true);
			try {
				const res = await getOrders({ pageNo: 0, pageOffset: 20 });
				if (!isActive) return;
				setOrders(res.content);
			} catch (err: unknown) {
				if (!isActive) return;
				toast.error(err instanceof Error ? err.message : "Failed to load orders");
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
				<div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
					<div className="w-full">
						<div className="flex justify-between w-full">
							<h2 className="text-lg font-semibold mb-2">Orders</h2>
							<Button>
								<PlusIcon className="size-4" />
								Create new order
							</Button>
						</div>
						<OrderTable orders={orders} />
					</div>
				</div>
			</div>
		</>
	);
};

export default Page;
