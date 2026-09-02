import { getPartnerships } from "@/lib/services/partnerships-service";
import { PartnershipTable } from "@/components/partnership-table";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Partnership } from "@/types/partnerships";

export const dynamic = "force-dynamic";

const Page = async () => {
	const partnershipsResponse = await getPartnerships({ pageNo: 0, pageOffset: 20 });
	const partnerships = partnershipsResponse.content;

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
					<div className="w-full">
						<div className="flex justify-between w-full">
							<h2 className="text-lg font-semibold">Partnerships</h2>
							<Button>
								<PlusIcon className="size-4" />
								Create Partnership
							</Button>
						</div>
						<PartnershipTable partnerships={partnerships} />
					</div>
				</div>
			</div>
		</>
	);
};

export default Page;
