import { ProductCards } from "@/components/product-cards";
import { ProductTable } from "@/components/product-table";
import { getProducts } from "@/lib/services/products-service";

export const dynamic = 'force-dynamic';

export default async function Page() {
	const productsResponse = await getProducts({ pageNo: 0, pageOffset: 20 });

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<ProductCards
							totalProducts={productsResponse.totalElements}
							products={productsResponse.content}
						/>
						<ProductTable products={productsResponse.content} />
					</div>
				</div>
			</div>
		</>
	);
}
