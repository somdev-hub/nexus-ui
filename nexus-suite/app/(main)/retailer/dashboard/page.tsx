import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { getProducts } from "@/lib/services/products-service";
import { getMaterials } from "@/lib/services/materials-service";
import { getOrders } from "@/lib/services/orders-service";
import { getPartnerships } from "@/lib/services/partnerships-service";
import { getPurchaseOrders } from "@/lib/services/purchase-orders-service";
import { getSupplierContracts } from "@/lib/services/supplier-contracts-service";

export const dynamic = 'force-dynamic';

export default async function Page() {
	// Fetch real data from backend services
	const [products, materials, orders, partnerships, purchaseOrders, supplierContracts] = await Promise.all([
		getProducts({ pageNo: 0, pageOffset: 5 }),
		getMaterials({ pageNo: 0, pageOffset: 5 }),
		getOrders({ pageNo: 0, pageOffset: 5 }),
		getPartnerships({ pageNo: 0, pageOffset: 5 }),
		getPurchaseOrders({ pageNo: 0, pageOffset: 5 }),
		getSupplierContracts({ pageNo: 0, pageOffset: 5 }),
	]);

	// Transform data for the DataTable component
	const tableData = [
		...products.content.slice(0, 3).map((p, i) => ({
			id: i + 1,
			header: p.productName,
			type: p.category,
			status: p.isActive ? "Active" : "Inactive",
			target: p.unitPrice.toString(),
			limit: p.minOrderQuantity.toString(),
			reviewer: p.brand || "N/A"
		})),
		...materials.content.slice(0, 3).map((m, i) => ({
			id: i + 4,
			header: m.materialName,
			type: m.category,
			status: m.isActive ? "Active" : "Inactive",
			target: m.unitPrice.toString(),
			limit: m.minOrderQuantity.toString(),
			reviewer: m.unitOfMeasure || "N/A"
		}))
	];

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<SectionCards
							totalProducts={products.totalElements}
							totalMaterials={materials.totalElements}
							totalOrders={orders.totalElements}
							totalPartnerships={partnerships.totalElements}
						/>
						<div className="px-4 lg:px-6">
							<ChartAreaInteractive />
						</div>
						<DataTable data={tableData} />
					</div>
				</div>
			</div>
		</>
	);
}
