"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import {
	BriefcaseBusiness,
	CalendarClock,
	CircleDollarSign,
	ChevronLeft,
	ChevronRight,
	FileText,
	Filter,
	MessageSquareMore,
	Search,
	Users,
	Loader2
} from "lucide-react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import {
	getOpenRecruitments,
	getClosedRecruitments,
	getRecruitmentAnalytics,
	getAllScheduledInterviews,
	getMyInterviews,
	PaginatedRecruitmentResponse,
	RecruitmentAnalytics,
	ScheduledInterview,
	PaginatedInterviewsResponse
} from "@/lib/auth-service";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { CreateHiringDialog } from "@/components/create-hiring-dialog";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type AnalyticsCard = {
	title: string;
	value: string;
	change: string;
	note: string;
	icon: React.ComponentType<{ className?: string }>;
};

// ============================================================================
// STYLING MAPS
// ============================================================================

const hiringStatusTone: Record<string, string> = {
	OPEN: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
	CLOSED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
	ON_HOLD: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

const hiringTypeTone: Record<string, string> = {
	PERMANENT: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
	CONTRACT: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
	INTERN: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
};

// ============================================================================
// MAIN RECRUITMENT COMPONENT
// ============================================================================

function Recruitment() {
	const router = useRouter();
	const orgId = useOrgId();
	const { toast } = useToast();

	// Analytics State
	const [analytics, setAnalytics] = useState<RecruitmentAnalytics | null>(null);
	const [analyticsLoading, setAnalyticsLoading] = useState(true);

	// Open Recruitments State
	const [openData, setOpenData] = useState<PaginatedRecruitmentResponse | null>(
		null
	);
	const [openLoading, setOpenLoading] = useState(true);
	const [openSearch, setOpenSearch] = useState("");
	const [openPage, setOpenPage] = useState(0);
	const [openHiringType, setOpenHiringType] = useState<string>("");
	const [openHiringStatus, setOpenHiringStatus] = useState<string>("");

	// Closed Recruitments State
	const [closedData, setClosedData] =
		useState<PaginatedRecruitmentResponse | null>(null);
	const [closedLoading, setClosedLoading] = useState(true);
	const [closedSearch, setClosedSearch] = useState("");
	const [closedPage, setClosedPage] = useState(0);

	// Interview listing state
	const { email: userEmail } = useUserMetadata();
	const [allInterviewsData, setAllInterviewsData] = useState<PaginatedInterviewsResponse | null>(null);
	const [allInterviewsLoading, setAllInterviewsLoading] = useState(true);
	const [allInterviewsPage, setAllInterviewsPage] = useState(0);
	const [allInterviewsSearch, setAllInterviewsSearch] = useState("");
	const [allInterviewsTypeFilter, setAllInterviewsTypeFilter] = useState("");
	const [allInterviewsModeFilter, setAllInterviewsModeFilter] = useState("");

	const [myInterviewsData, setMyInterviewsData] = useState<PaginatedInterviewsResponse | null>(null);
	const [myInterviewsLoading, setMyInterviewsLoading] = useState(true);
	const [myInterviewsPage, setMyInterviewsPage] = useState(0);
	const [myInterviewsSearch, setMyInterviewsSearch] = useState("");
	const [myInterviewsTypeFilter, setMyInterviewsTypeFilter] = useState("");
	const [myInterviewsModeFilter, setMyInterviewsModeFilter] = useState("");

	const pageSize = 10;

	// Fetch analytics
	const fetchAnalytics = useCallback(async () => {
		if (!orgId) return;
		setAnalyticsLoading(true);
		try {
			const data = await getRecruitmentAnalytics(parseInt(orgId));
			setAnalytics(data);
		} catch (error) {
			console.error("Failed to fetch analytics:", error);
			toast({
				title: "Failed to load analytics",
				description:
					error instanceof Error ? error.message : "Please try again later.",
				variant: "destructive"
			});
		} finally {
			setAnalyticsLoading(false);
		}
	}, [orgId, toast]);

	// Fetch open recruitments
	const fetchOpenRecruitments = useCallback(async () => {
		if (!orgId) return;
		setOpenLoading(true);
		try {
			const response = await getOpenRecruitments(parseInt(orgId), {
				isActive: true,
				hiringType: openHiringType || undefined,
				hiringStatus: openHiringStatus || undefined,
				pageNo: openPage,
				pageOffset: pageSize
			});
			setOpenData(response);
		} catch (error) {
			console.error("Failed to fetch open recruitments:", error);
			toast({
				title: "Failed to load open recruitments",
				description:
					error instanceof Error ? error.message : "Please try again later.",
				variant: "destructive"
			});
		} finally {
			setOpenLoading(false);
		}
	}, [orgId, openPage, openHiringType, openHiringStatus, toast]);

	// Fetch closed recruitments
	const fetchClosedRecruitments = useCallback(async () => {
		if (!orgId) return;
		setClosedLoading(true);
		try {
			const response = await getClosedRecruitments(parseInt(orgId), {
				pageNo: closedPage,
				pageOffset: pageSize
			});
			setClosedData(response);
		} catch (error) {
			console.error("Failed to fetch closed recruitments:", error);
			toast({
				title: "Failed to load closed recruitments",
				description:
					error instanceof Error ? error.message : "Please try again later.",
				variant: "destructive"
			});
		} finally {
			setClosedLoading(false);
		}
	}, [orgId, closedPage, toast]);

	// Fetch all scheduled interviews
	const fetchAllScheduledInterviews = useCallback(async () => {
		if (!orgId) return;
		setAllInterviewsLoading(true);
		try {
			const response = await getAllScheduledInterviews(parseInt(orgId), {
				pageNo: allInterviewsPage,
				pageOffset: pageSize,
				interviewType: allInterviewsTypeFilter || undefined,
				interviewMode: allInterviewsModeFilter || undefined,
			});
			setAllInterviewsData(response);
		} catch (error) {
			console.error("Failed to fetch all scheduled interviews:", error);
			toast({
				title: "Failed to load scheduled interviews",
				description: error instanceof Error ? error.message : "Please try again later.",
				variant: "destructive"
			});
		} finally {
			setAllInterviewsLoading(false);
		}
	}, [orgId, allInterviewsPage, allInterviewsTypeFilter, allInterviewsModeFilter, toast]);

	// Fetch my interviews
	const fetchMyInterviews = useCallback(async () => {
		if (!orgId || !userEmail) return;
		setMyInterviewsLoading(true);
		try {
			const response = await getMyInterviews(parseInt(orgId), userEmail, {
				pageNo: myInterviewsPage,
				pageOffset: pageSize,
				interviewType: myInterviewsTypeFilter || undefined,
				interviewMode: myInterviewsModeFilter || undefined,
			});
			setMyInterviewsData(response);
		} catch (error) {
			console.error("Failed to fetch my interviews:", error);
			toast({
				title: "Failed to load my interviews",
				description: error instanceof Error ? error.message : "Please try again later.",
				variant: "destructive"
			});
		} finally {
			setMyInterviewsLoading(false);
		}
	}, [orgId, userEmail, myInterviewsPage, myInterviewsTypeFilter, myInterviewsModeFilter, toast]);

	// Fetch data on mount and when filters/page changes
	useEffect(() => {
		fetchAnalytics();
	}, [fetchAnalytics]);

	useEffect(() => {
		fetchOpenRecruitments();
	}, [fetchOpenRecruitments]);

	useEffect(() => {
		fetchClosedRecruitments();
	}, [fetchClosedRecruitments]);

	useEffect(() => {
		fetchAllScheduledInterviews();
	}, [fetchAllScheduledInterviews]);

	useEffect(() => {
		fetchMyInterviews();
	}, [fetchMyInterviews]);

	// Filter open recruitments by search
	const filteredOpenRecruitments = useMemo(() => {
		if (!openData) return [];
		if (!openSearch.trim()) return openData.content;

		return openData.content.filter((item) => {
			const searchLower = openSearch.toLowerCase();
			return (
				item.title.toLowerCase().includes(searchLower) ||
				item.roleName.toLowerCase().includes(searchLower) ||
				item.departmentName.toLowerCase().includes(searchLower) ||
				item.recruitmentId.toString().includes(searchLower)
			);
		});
	}, [openData, openSearch]);

	// Filter closed recruitments by search
	const filteredClosedRecruitments = useMemo(() => {
		if (!closedData) return [];
		if (!closedSearch.trim()) return closedData.content;

		return closedData.content.filter((item) => {
			const searchLower = closedSearch.toLowerCase();
			return (
				item.title.toLowerCase().includes(searchLower) ||
				item.roleName.toLowerCase().includes(searchLower) ||
				item.departmentName.toLowerCase().includes(searchLower) ||
				item.recruitmentId.toString().includes(searchLower)
			);
		});
	}, [closedData, closedSearch]);

	const openFilterCount = (openHiringType ? 1 : 0) + (openHiringStatus ? 1 : 0);

	// Build analytics cards from API data
	const analyticsCards = useMemo(() => {
		if (!analytics) return [];

		const cards: AnalyticsCard[] = [];

		// Open Roles Card
		cards.push({
			title: "Open Roles",
			value: analytics.openRoles.value.toString(),
			change:
				analytics.openRoles.type === "DIFFERENCE_COMPARISON"
					? `${analytics.openRoles.trend === "INCREMENT" ? "+" : ""}${analytics.openRoles.difference} from ${analytics.openRoles.comparisonWith}`
					: `${analytics.openRoles.difference} ${analytics.openRoles.comparisonWith}`,
			note: analytics.openRoles.description,
			icon: BriefcaseBusiness
		});

		// Applications Card
		cards.push({
			title: "Applications",
			value: analytics.currentApplications.value.toString(),
			change:
				analytics.currentApplications.type === "DIFFERENCE_COMPARISON"
					? `${analytics.currentApplications.trend === "INCREMENT" ? "+" : ""}${analytics.currentApplications.difference} from ${analytics.currentApplications.comparisonWith}`
					: `${analytics.currentApplications.difference} ${analytics.currentApplications.comparisonWith}`,
			note: analytics.currentApplications.description,
			icon: Users
		});

		// Under Review Card
		cards.push({
			title: "Under Review",
			value: analytics.underReview.value.toString(),
			change:
				analytics.underReview.type === "DIFFERENCE_COMPARISON"
					? `${analytics.underReview.trend === "INCREMENT" ? "+" : ""}${analytics.underReview.difference} from ${analytics.underReview.comparisonWith}`
					: `${analytics.underReview.difference} ${analytics.underReview.comparisonWith}`,
			note: analytics.underReview.description,
			icon: MessageSquareMore
		});

		// Offers Sent Card
		cards.push({
			title: "Offers Sent",
			value: analytics.offerSent.value.toString(),
			change:
				analytics.offerSent.type === "DIFFERENCE_COMPARISON"
					? `${analytics.offerSent.trend === "INCREMENT" ? "+" : ""}${analytics.offerSent.difference} from ${analytics.offerSent.comparisonWith}`
					: `${analytics.offerSent.difference} ${analytics.offerSent.comparisonWith}`,
			note: analytics.offerSent.description,
			icon: FileText
		});

		// Avg Time to Fill Card
		cards.push({
			title: "Avg Time to Fill",
			value: analytics.recruitmentTAT.value.toString(),
			change:
				analytics.recruitmentTAT.type === "DIFFERENCE_COMPARISON"
					? `${analytics.recruitmentTAT.trend === "INCREMENT" ? "+" : ""}${analytics.recruitmentTAT.difference} from ${analytics.recruitmentTAT.comparisonWith}`
					: `${analytics.recruitmentTAT.difference} ${analytics.recruitmentTAT.comparisonWith}`,
			note: analytics.recruitmentTAT.description,
			icon: CalendarClock
		});

		// Offer Acceptance Card
		cards.push({
			title: "Offer Acceptance",
			value: `${analytics.offerAcceptance.value}%`,
			change:
				analytics.offerAcceptance.type === "DIFFERENCE_COMPARISON"
					? `${analytics.offerAcceptance.trend === "INCREMENT" ? "+" : ""}${analytics.offerAcceptance.difference}% from ${analytics.offerAcceptance.comparisonWith}`
					: `${analytics.offerAcceptance.difference}% ${analytics.offerAcceptance.comparisonWith}`,
			note: analytics.offerAcceptance.description,
			icon: CircleDollarSign
		});

		return cards;
	}, [analytics]);

	return (
		<div className="space-y-6 p-6 ">
			<section className="space-y-3 flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Recruitment</h1>
					<p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
						Track open requisitions, monitor hiring activity, and review recent
						hiring outcomes from one place.
					</p>
				</div>
				<CreateHiringDialog smallButton={true} />
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{analyticsLoading ? (
					// Loading skeleton
					Array(6)
						.fill(null)
						.map((_, index) => (
							<Card key={`skeleton-${index}`} className="p-4 shadow-sm">
								<CardHeader className="p-0">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 space-y-2">
											<div className="h-4 w-24 animate-pulse rounded bg-muted" />
											<div className="h-8 w-16 animate-pulse rounded bg-muted" />
										</div>
										<div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<div className="mt-4 space-y-2">
										<div className="h-4 w-32 animate-pulse rounded bg-muted" />
										<div className="h-3 w-40 animate-pulse rounded bg-muted" />
									</div>
								</CardContent>
							</Card>
						))
				) : analyticsCards.length === 0 ? (
					<div className="col-span-full text-center py-8">
						<p className="text-muted-foreground">No analytics data available</p>
					</div>
				) : (
					analyticsCards.map((card) => {
						const Icon = card.icon;

						return (
							<Card key={card.title} className="p-4 shadow-sm">
								<CardHeader className="p-0">
									<div className="flex items-start justify-between gap-3">
										<div>
											<CardTitle className="text-sm font-medium text-muted-foreground">
												{card.title}
											</CardTitle>
											<div className="mt-3 text-3xl font-semibold tracking-tight">
												{card.value}
											</div>
										</div>
										<div className="rounded-full bg-primary/10 p-3 text-primary">
											<Icon className="h-5 w-5" />
										</div>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<p className="mt-4 text-sm font-medium text-foreground">
										{card.change}
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										{card.note}
									</p>
								</CardContent>
							</Card>
						);
					})
				)}
			</section>

			<section className="space-y-6">
				{/* Open Recruitments Table */}
				<Card className="p-4 shadow-sm">
					<CardHeader className="p-0">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<CardTitle className="text-lg font-semibold">
									Open Requisitions
								</CardTitle>
								<p className="mt-1 text-sm text-muted-foreground">
									Active requisitions currently in the hiring pipeline.
								</p>
							</div>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<div className="relative w-full sm:w-80">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={openSearch}
										onChange={(event) => setOpenSearch(event.target.value)}
										placeholder="Search requisitions"
										className="pl-9"
									/>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="gap-2">
											<Filter className="h-4 w-4" />
											Filter
											{openFilterCount > 0 ? (
												<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
													{openFilterCount}
												</span>
											) : null}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-64">
										<DropdownMenuLabel>Hiring Type</DropdownMenuLabel>
										<Select
											value={openHiringType}
											onValueChange={setOpenHiringType}
										>
											<SelectTrigger className="mx-2 mt-2 mb-2 w-full">
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="PERMANENT">Permanent</SelectItem>
												<SelectItem value="CONTRACT">Contract</SelectItem>
												<SelectItem value="INTERN">Intern</SelectItem>
											</SelectContent>
										</Select>

										<DropdownMenuSeparator />

										<DropdownMenuLabel>Hiring Status</DropdownMenuLabel>
										<Select
											value={openHiringStatus}
											onValueChange={setOpenHiringStatus}
										>
											<SelectTrigger className="mx-2 mt-2 mb-2 w-full">
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="OPEN">Open</SelectItem>
												<SelectItem value="CLOSED">Closed</SelectItem>
												<SelectItem value="ON_HOLD">On Hold</SelectItem>
											</SelectContent>
										</Select>

										<DropdownMenuSeparator />

										<div className="p-2 pt-1">
											<Button
												variant="ghost"
												className="w-full"
												onClick={() => {
													setOpenSearch("");
													setOpenHiringType("");
													setOpenHiringStatus("");
													setOpenPage(0);
												}}
											>
												Clear filters
											</Button>
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<p className="mb-3 text-sm text-muted-foreground">
							Showing {filteredOpenRecruitments.length} of{" "}
							{openData?.totalElements || 0} requisitions
						</p>
						<div className="overflow-hidden rounded-lg border">
							<div className="overflow-x-auto w-full max-w-full">
								{openLoading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									</div>
								) : (
									<>
										<Table>
											<TableHeader>
												<TableRow className="bg-muted/50 hover:bg-muted/50">
													<TableHead>Recruitment ID</TableHead>
													<TableHead>Title</TableHead>
													<TableHead>Role</TableHead>
													<TableHead>Department</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Created</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredOpenRecruitments.map((requisition) => (
													<TableRow
														key={requisition.recruitmentId}
														className="cursor-pointer hover:bg-muted/50"
														onClick={() =>
															router.push(
																`/hr/recruitment/${requisition.recruitmentId}`
															)
														}
													>
														<TableCell className="font-medium">
															#{requisition.recruitmentId}
														</TableCell>
														<TableCell>{requisition.title}</TableCell>
														<TableCell>{requisition.roleName}</TableCell>
														<TableCell>{requisition.departmentName}</TableCell>
														<TableCell>
															<Badge
																variant="secondary"
																className={
																	hiringTypeTone[requisition.hiringType] ||
																	"bg-gray-100 text-gray-700"
																}
															>
																{requisition.hiringType}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge
																variant="secondary"
																className={
																	hiringStatusTone[requisition.hiringStatus] ||
																	"bg-gray-100 text-gray-700"
																}
															>
																{requisition.hiringStatus}
															</Badge>
														</TableCell>
														<TableCell>
															{new Date(
																requisition.createdAt
															).toLocaleDateString()}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										{filteredOpenRecruitments.length === 0 ? (
											<div className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
												No matching requisitions found.
											</div>
										) : null}
										{/* Pagination */}
										<div className="border-t px-4 py-4 flex items-center justify-between">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setOpenPage(Math.max(0, openPage - 1))}
												disabled={openPage === 0 || openLoading}
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<span className="text-sm text-muted-foreground">
												Page {openPage + 1} of {openData?.totalPages || 1}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setOpenPage(
														Math.min(
															openPage + 1,
															(openData?.totalPages || 1) - 1
														)
													)
												}
												disabled={
													openPage >= (openData?.totalPages || 1) - 1 ||
													openLoading
												}
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Closed Recruitments Table */}
				<Card className="p-4 shadow-sm">
					<CardHeader className="p-0">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<CardTitle className="text-lg font-semibold">
									Closed Requisitions
								</CardTitle>
								<p className="mt-1 text-sm text-muted-foreground">
									Recently filled or closed requisitions and their outcomes.
								</p>
							</div>
							<div className="relative w-full lg:w-80">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={closedSearch}
									onChange={(event) => setClosedSearch(event.target.value)}
									placeholder="Search requisitions"
									className="pl-9"
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<p className="mb-3 text-sm text-muted-foreground">
							Showing {filteredClosedRecruitments.length} of{" "}
							{closedData?.totalElements || 0} requisitions
						</p>
						<div className="overflow-hidden rounded-lg border">
							<div className="overflow-x-auto w-full max-w-full">
								{closedLoading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									</div>
								) : (
									<>
										<Table>
											<TableHeader>
												<TableRow className="bg-muted/50 hover:bg-muted/50">
													<TableHead>Recruitment ID</TableHead>
													<TableHead>Title</TableHead>
													<TableHead>Role</TableHead>
													<TableHead>Department</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Created</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredClosedRecruitments.map((requisition) => (
													<TableRow
														key={requisition.recruitmentId}
														className="cursor-pointer hover:bg-muted/50"
														onClick={() =>
															router.push(
																`/hr/recruitment/${requisition.recruitmentId}`
															)
														}
													>
														<TableCell className="font-medium">
															#{requisition.recruitmentId}
														</TableCell>
														<TableCell>{requisition.title}</TableCell>
														<TableCell>{requisition.roleName}</TableCell>
														<TableCell>{requisition.departmentName}</TableCell>
														<TableCell>
															<Badge
																variant="secondary"
																className={
																	hiringTypeTone[requisition.hiringType] ||
																	"bg-gray-100 text-gray-700"
																}
															>
																{requisition.hiringType}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge
																variant="secondary"
																className={
																	hiringStatusTone[requisition.hiringStatus] ||
																	"bg-gray-100 text-gray-700"
																}
															>
																{requisition.hiringStatus}
															</Badge>
														</TableCell>
														<TableCell>
															{new Date(
																requisition.createdAt
															).toLocaleDateString()}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										{filteredClosedRecruitments.length === 0 ? (
											<div className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
												No closed requisitions found.
											</div>
										) : null}
										{/* Pagination */}
										<div className="border-t px-4 py-4 flex items-center justify-between">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setClosedPage(Math.max(0, closedPage - 1))
												}
												disabled={closedPage === 0 || closedLoading}
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<span className="text-sm text-muted-foreground">
												Page {closedPage + 1} of {closedData?.totalPages || 1}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setClosedPage(
														Math.min(
															closedPage + 1,
															(closedData?.totalPages || 1) - 1
														)
													)
												}
												disabled={
													closedPage >= (closedData?.totalPages || 1) - 1 ||
													closedLoading
												}
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* All Scheduled Interviews Table */}
				<Card className="p-4 shadow-sm overflow-hidden">
					<CardHeader className="p-0">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<CardTitle className="text-lg font-semibold">
									All Scheduled Interviews
								</CardTitle>
								<p className="mt-1 text-sm text-muted-foreground">
									View all scheduled interviews across all requisitions.
								</p>
							</div>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<div className="relative w-full sm:w-80">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={allInterviewsSearch}
										onChange={(event) => setAllInterviewsSearch(event.target.value)}
										placeholder="Search interviews"
										className="pl-9"
									/>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="gap-2">
											<Filter className="h-4 w-4" />
											Filter
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-64">
										<DropdownMenuLabel>Interview Type</DropdownMenuLabel>
										<Select
											value={allInterviewsTypeFilter}
											onValueChange={setAllInterviewsTypeFilter}
										>
											<SelectTrigger className="mx-2 mt-2 mb-2 w-full">
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="TECHNICAL">Technical</SelectItem>
												<SelectItem value="HR">HR</SelectItem>
												<SelectItem value="MANAGERIAL">Managerial</SelectItem>
												<SelectItem value="CULTURAL_FIT">Cultural Fit</SelectItem>
											</SelectContent>
										</Select>

										<DropdownMenuSeparator />

										<DropdownMenuLabel>Interview Mode</DropdownMenuLabel>
										<Select
											value={allInterviewsModeFilter}
											onValueChange={setAllInterviewsModeFilter}
										>
											<SelectTrigger className="mx-2 mt-2 mb-2 w-full">
												<SelectValue placeholder="Select mode" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ONLINE">Online</SelectItem>
												<SelectItem value="OFFLINE">Offline</SelectItem>
												<SelectItem value="HYBRID">Hybrid</SelectItem>
											</SelectContent>
										</Select>

										<DropdownMenuSeparator />

										<div className="p-2 pt-1">
											<Button
												variant="ghost"
												className="w-full"
												onClick={() => {
													setAllInterviewsSearch("");
													setAllInterviewsTypeFilter("");
													setAllInterviewsModeFilter("");
													setAllInterviewsPage(0);
												}}
											>
												Clear filters
											</Button>
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0 w-full max-w-full">
						<p className="mb-3 text-sm text-muted-foreground">
							Showing {allInterviewsData?.content?.length || 0} of{" "}
							{allInterviewsData?.totalElements || 0} interviews
						</p>
						<div className="rounded-lg border">
							<div className="overflow-x-auto w-0 min-w-full ">
								{allInterviewsLoading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									</div>
								) : (
									<>
										<Table>
											<TableHeader>
												<TableRow className="bg-muted/50 hover:bg-muted/50">
													<TableHead>Applicant</TableHead>
													<TableHead>Recruitment</TableHead>
													<TableHead>Role</TableHead>
													<TableHead>Department</TableHead>
													<TableHead>Date</TableHead>
													<TableHead>Time</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Mode</TableHead>
													<TableHead>Interviewer</TableHead>
													<TableHead>Status</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{allInterviewsData?.content?.map((interview) => (
													<TableRow key={interview.recruitmentInterviewId}>
														<TableCell>
															<div>
																<p className="font-medium">{interview.applicantName}</p>
																<p className="text-sm text-muted-foreground">{interview.applicantEmail}</p>
															</div>
														</TableCell>
														<TableCell>{interview.recruitmentTitle}</TableCell>
														<TableCell>{interview.roleName}</TableCell>
														<TableCell>{interview.departmentName}</TableCell>
														<TableCell>
															{new Date(interview.interviewDate).toLocaleDateString()}
														</TableCell>
														<TableCell>{interview.interviewTime}</TableCell>
														<TableCell>
															<Badge variant="secondary">
																{interview.interviewType}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge variant="secondary">
																{interview.interviewMode}
															</Badge>
														</TableCell>
														<TableCell>
															<div>
																<p className="font-medium">{interview.interviewerName}</p>
																<p className="text-sm text-muted-foreground">{interview.interviewerEmail}</p>
															</div>
														</TableCell>
														<TableCell>
															<Badge
																variant={
																	interview.interviewStatus === "SCHEDULED"
																		? "default"
																		: interview.interviewStatus === "COMPLETED"
																			? "outline"
																			: interview.interviewStatus === "CANCELLED"
																				? "destructive"
																				: "secondary"
																}
															>
																{interview.interviewStatus}
															</Badge>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										{(!allInterviewsData?.content || allInterviewsData.content.length === 0) ? (
											<div className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
												No scheduled interviews found.
											</div>
										) : null}
										{/* Pagination */}
										<div className="border-t px-4 py-4 flex items-center justify-between">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setAllInterviewsPage(Math.max(0, allInterviewsPage - 1))}
												disabled={allInterviewsPage === 0 || allInterviewsLoading}
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<span className="text-sm text-muted-foreground">
												Page {allInterviewsPage + 1} of {allInterviewsData?.totalPages || 1}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setAllInterviewsPage(
														Math.min(
															allInterviewsPage + 1,
															(allInterviewsData?.totalPages || 1) - 1
														)
													)
												}
												disabled={
													allInterviewsPage >= (allInterviewsData?.totalPages || 1) - 1 ||
													allInterviewsLoading
												}
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* My Interviews Table */}
				<Card className="p-4 shadow-sm overflow-hidden">
					<CardHeader className="p-0">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<CardTitle className="text-lg font-semibold">
									My Interviews
								</CardTitle>
								<p className="mt-1 text-sm text-muted-foreground">
									Interviews where you are the interviewer.
								</p>
							</div>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<div className="relative w-full sm:w-80">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={myInterviewsSearch}
										onChange={(event) => setMyInterviewsSearch(event.target.value)}
										placeholder="Search interviews"
										className="pl-9"
									/>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="gap-2">
											<Filter className="h-4 w-4" />
											Filter
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-64">
										<DropdownMenuLabel>Interview Type</DropdownMenuLabel>
										<Select
											value={myInterviewsTypeFilter}
											onValueChange={setMyInterviewsTypeFilter}
										>
											<SelectTrigger className="mx-2 mt-2 mb-2 w-full">
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="TECHNICAL">Technical</SelectItem>
												<SelectItem value="HR">HR</SelectItem>
												<SelectItem value="MANAGERIAL">Managerial</SelectItem>
												<SelectItem value="CULTURAL_FIT">Cultural Fit</SelectItem>
											</SelectContent>
										</Select>

										<DropdownMenuSeparator />

										<DropdownMenuLabel>Interview Mode</DropdownMenuLabel>
										<Select
											value={myInterviewsModeFilter}
											onValueChange={setMyInterviewsModeFilter}
										>
											<SelectTrigger className="mx-2 mt-2 mb-2 w-full">
												<SelectValue placeholder="Select mode" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ONLINE">Online</SelectItem>
												<SelectItem value="OFFLINE">Offline</SelectItem>
												<SelectItem value="HYBRID">Hybrid</SelectItem>
											</SelectContent>
										</Select>

										<DropdownMenuSeparator />

										<div className="p-2 pt-1">
											<Button
												variant="ghost"
												className="w-full"
												onClick={() => {
													setMyInterviewsSearch("");
													setMyInterviewsTypeFilter("");
													setMyInterviewsModeFilter("");
													setMyInterviewsPage(0);
												}}
											>
												Clear filters
											</Button>
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0 w-full max-w-full">
						<p className="mb-3 text-sm text-muted-foreground">
							Showing {myInterviewsData?.content?.length || 0} of{" "}
							{myInterviewsData?.totalElements || 0} interviews
						</p>
						<div className="overflow-hidden rounded-lg border">
							<div className="overflow-x-auto w-0 min-w-full">
								{myInterviewsLoading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									</div>
								) : (
									<>
										<Table>
											<TableHeader>
												<TableRow className="bg-muted/50 hover:bg-muted/50">
													<TableHead>Applicant</TableHead>
													<TableHead>Recruitment</TableHead>
													<TableHead>Role</TableHead>
													<TableHead>Department</TableHead>
													<TableHead>Date</TableHead>
													<TableHead>Time</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Mode</TableHead>
													<TableHead>Status</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{myInterviewsData?.content?.map((interview) => (
													<TableRow key={interview.recruitmentInterviewId}>
														<TableCell>
															<div>
																<p className="font-medium">{interview.applicantName}</p>
																<p className="text-sm text-muted-foreground">{interview.applicantEmail}</p>
															</div>
														</TableCell>
														<TableCell>{interview.recruitmentTitle}</TableCell>
														<TableCell>{interview.roleName}</TableCell>
														<TableCell>{interview.departmentName}</TableCell>
														<TableCell>
															{new Date(interview.interviewDate).toLocaleDateString()}
														</TableCell>
														<TableCell>{interview.interviewTime}</TableCell>
														<TableCell>
															<Badge variant="secondary">
																{interview.interviewType}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge variant="secondary">
																{interview.interviewMode}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge
																variant={
																	interview.interviewStatus === "SCHEDULED"
																		? "default"
																		: interview.interviewStatus === "COMPLETED"
																			? "outline"
																			: interview.interviewStatus === "CANCELLED"
																				? "destructive"
																				: "secondary"
																}
															>
																{interview.interviewStatus}
															</Badge>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										{(!myInterviewsData?.content || myInterviewsData.content.length === 0) ? (
											<div className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
												No interviews found.
											</div>
										) : null}
										{/* Pagination */}
										<div className="border-t px-4 py-4 flex items-center justify-between">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setMyInterviewsPage(Math.max(0, myInterviewsPage - 1))}
												disabled={myInterviewsPage === 0 || myInterviewsLoading}
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<span className="text-sm text-muted-foreground">
												Page {myInterviewsPage + 1} of {myInterviewsData?.totalPages || 1}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setMyInterviewsPage(
														Math.min(
															myInterviewsPage + 1,
															(myInterviewsData?.totalPages || 1) - 1
														)
													)
												}
												disabled={
													myInterviewsPage >= (myInterviewsData?.totalPages || 1) - 1 ||
													myInterviewsLoading
												}
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

export default Recruitment;
