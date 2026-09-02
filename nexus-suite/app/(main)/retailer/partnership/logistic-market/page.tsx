import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Search, Star, Truck, MapPin, Plus } from "lucide-react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext
} from "@/components/ui/carousel";
import Link from "next/link";
import { LogisticsTable } from "@/components/logistics-table";
import { getLogisticsPartners } from "@/lib/services/logistics-service";
import type { LogisticsPartner } from "@/types/logistics";

export const dynamic = "force-dynamic";

const LogisticMarketPage = async () => {
	// Fetch logistics partners from API
	const response = await getLogisticsPartners({});
	const logisticsPartners: LogisticsPartner[] = response.content || [];

	return (
		<>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
					<div className="w-full space-y-6">
						{/* Header */}
						<div className="flex justify-between w-full items-center">
							<div>
								<h1 className="text-2xl font-bold">Logistics Partners</h1>
								<p className="text-gray-600 mt-1">
									Connect with reliable transport and delivery partners
								</p>
							</div>
							<div className="flex gap-2">
								<Field>
									<Input type="text" placeholder="Search logistics..." />
								</Field>
								<Button variant="outline">
									<Search className="h-4 w-4" />
								</Button>
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Add Partner
								</Button>
							</div>
						</div>

						{/* Featured Partners Carousel */}
						<div>
							<h2 className="text-lg font-semibold mb-4">Featured Partners</h2>
							<div className="flex items-center justify-center">
								<Carousel className="w-[90%]">
									<CarouselContent>
										{logisticsPartners.slice(0, 4).map((partner) => (
											<CarouselItem key={partner.partnershipId} className="basis-1/4">
												<Link href={`/retailer/partnership/logistic-market/${partner.partnershipId}`}>
													<Card className="h-40 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow">
														<CardContent className="flex flex-col items-center justify-center w-full h-full p-4">
															<p className="font-semibold text-center text-sm">
																{partner.logisticsOrgName}
															</p>
															<Badge variant="outline" className="mt-2">
																{partner.title}
															</Badge>
														</CardContent>
													</Card>
												</Link>
											</CarouselItem>
										))}
									</CarouselContent>
									<CarouselPrevious />
									<CarouselNext />
								</Carousel>
							</div>
						</div>

						{/* All Partners Table */}
						<div>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-lg font-semibold">All Logistics Partners</h2>
								<Badge variant="outline" className="text-muted-foreground">
									{logisticsPartners.length} partners
								</Badge>
							</div>
							<LogisticsTable data={logisticsPartners} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default LogisticMarketPage;
