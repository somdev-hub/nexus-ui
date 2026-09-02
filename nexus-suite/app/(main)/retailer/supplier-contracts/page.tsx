import { SupplierContractTable } from "@/components/supplier-contract-table";
import { getSupplierContracts } from "@/lib/services/supplier-contracts-service";

export const dynamic = "force-dynamic";

export default async function Page() {
	const supplierContractsResponse = await getSupplierContracts({ pageNo: 0, pageOffset: 20 });

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<div className="flex justify-between items-center">
							<div>
								<h1 className="text-2xl font-bold">Supplier Contracts</h1>
								<p className="text-gray-600 mt-1">Manage and track all supplier contracts</p>
							</div>
						</div>
						<SupplierContractTable supplierContracts={supplierContractsResponse.content} />
					</div>
				</div>
			</div>
		</>
	);
}