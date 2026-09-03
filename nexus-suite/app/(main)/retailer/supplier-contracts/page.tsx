"use client";

import { SupplierContractTable } from "@/components/supplier-contract-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupplierContracts } from "@/lib/services/supplier-contracts-service";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SupplierContract } from "@/types/supplier-contracts";

export default function Page() {
	const [contracts, setContracts] = useState<SupplierContract[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;
		const load = async () => {
			setIsLoading(true);
			try {
				const res = await getSupplierContracts({ pageNo: 0, pageOffset: 20 });
				if (!isActive) return;
				setContracts(res.content);
			} catch (err: unknown) {
				if (!isActive) return;
				toast.error(err instanceof Error ? err.message : "Failed to load supplier contracts");
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
								<h1 className="text-2xl font-bold">Supplier Contracts</h1>
								<p className="text-gray-600 mt-1">Manage and track all supplier contracts</p>
							</div>
						</div>
						<SupplierContractTable supplierContracts={contracts} />
					</div>
				</div>
			</div>
		</>
	);
}
