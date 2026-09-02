import { getOrders } from "@/lib/services/orders-service";
import { OrderTable } from "@/components/order-table";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Order } from "@/types/orders";

export const dynamic = "force-dynamic";

const Page = async () => {
	const ordersResponse = await getOrders({ pageNo: 0, pageOffset: 20 });
	const orders = ordersResponse.content;

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
