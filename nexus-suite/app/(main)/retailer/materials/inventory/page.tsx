import { getMaterials } from "@/lib/services/materials-service";
import { ChartBarStacked } from "@/components/inventory-chart";
import { MaterialTable } from "@/components/material-table";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import { Material } from "@/types/materials";

export const dynamic = "force-dynamic";

const Page = async () => {
	const materialsResponse = await getMaterials({ pageNo: 0, pageOffset: 20 });
	const materials = materialsResponse.content;

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
					<div className="w-full">
						<div className="flex justify-between w-full">
							<h2 className="text-lg font-semibold">Inventory</h2>
							<Button>
								<PlusIcon className="size-4" />
								Add
							</Button>
						</div>
						<div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card className="p-4 gap-2">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Total Materials</p>
										<p className="text-2xl font-bold">{materialsResponse.totalElements}</p>
									</div>
									<div className="p-2 bg-blue-100 rounded-lg">
										<span className="text-2xl">📦</span>
									</div>
								</div>
							</Card>
							<Card className="p-4 gap-2">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Active Materials</p>
										<p className="text-2xl font-bold">
											{materials.filter((m: Material) => m.isActive).length}
										</p>
									</div>
									<div className="p-2 bg-green-100 rounded-lg">
										<span className="text-2xl">✅</span>
									</div>
								</div>
							</Card>
							<Card className="p-4 gap-2">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Categories</p>
										<p className="text-2xl font-bold">
											{new Set(materials.map((m: Material) => m.category)).size}
										</p>
									</div>
									<div className="p-2 bg-purple-100 rounded-lg">
										<span className="text-2xl">📂</span>
									</div>
								</div>
							</Card>
							<Card className="p-4 gap-2">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">Low Stock Alerts</p>
										<p className="text-2xl font-bold">
											{materials.filter((m: Material) => m.minOrderQuantity > 100).length}
										</p>
									</div>
									<div className="p-2 bg-orange-100 rounded-lg">
										<span className="text-2xl">⚠️</span>
									</div>
								</div>
							</Card>
						</div>
						<div className="mt-6">
							<ChartBarStacked />
						</div>
						<div className="mt-6">
							<MaterialTable materials={materials} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Page;
