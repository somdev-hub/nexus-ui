import { getSuppliers } from "@/lib/services/suppliers-service";
import { SupplierTable } from "@/components/supplier-table";

import { Button } from "@/components/ui/button";
import { PlusIcon, Search } from "lucide-react";
import { Supplier } from "@/types/suppliers";

export const dynamic = "force-dynamic";

const Page = async () => {
	const suppliersResponse = await getSuppliers({ pageNo: 0, pageOffset: 20 });
	const suppliers = suppliersResponse.content;

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
					<div className="w-full">
						<div className="flex justify-between w-full">
							<h2 className="text-lg font-semibold">Suppliers</h2>
							<div className="flex gap-2">
								<Button>
									<PlusIcon className="size-4" />
									Add Supplier
								</Button>
							</div>
						</div>
						<SupplierTable suppliers={suppliers} />
					</div>
				</div>
			</div>
		</>
	);
};

export default Page;
