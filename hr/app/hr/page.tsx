"use client";

import { CreateHiringDialog } from "@/components/create-hiring-dialog";
import { TeamManagementDialog } from "@/components/team/TeamManagementDialog";
import { DailyCheckinCheckoutChart } from "@/components/daily-checkin-checkout-line-chart";
import EventOnboardDialog from "@/components/EventOnboardDialog";
import { HrRequestDialog } from "@/components/hr-request-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { WeeklyEmployeeStrengthChart } from "@/components/weekly-employee-strength-graph";
import { WeeklyWorkingHoursChart } from "@/components/weekly-working-hours";
import { useToast } from "@/hooks/use-toast";
import { useOrgId } from "@/hooks/use-user-metadata";
import { getHeroAnalytics, getTodayHrRequests, getAllDepartments, getWeeklyEmployeeStrength, getWeeklyWorkingHours, getWeeklyCheckInCheckOut } from "@/lib/auth-service";
import type {
	HeroAnalyticsResponse,
	RequestStatus,
	TodayHrRequest,
	User,
	WeeklyEmployeeStrengthResponse,
	WeeklyWorkingHoursResponse,
	WeeklyCheckInCheckOutResponse
} from "@/types";
import {
	AlertCircle,
	Check,
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	Minus,
	Search,
	TrendingDown,
	TrendingUp,
	Users,
	X
} from "lucide-react";
import { useEffect, useState } from "react";

// Default data for weekly analytics charts
const defaultWeeklyEmployeeStrength = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
const defaultWeeklyWorkingHours = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
const defaultWeeklyCheckInCheckOut = {
	Mon: { checkIn: "00:00", checkout: "00:00" },
	Tue: { checkIn: "00:00", checkout: "00:00" },
	Wed: { checkIn: "00:00", checkout: "00:00" },
	Thu: { checkIn: "00:00", checkout: "00:00" },
	Fri: { checkIn: "00:00", checkout: "00:00" },
	Sat: { checkIn: "00:00", checkout: "00:00" },
	Sun: { checkIn: "00:00", checkout: "00:00" }
};

const metricCards = [
	{
		title: "Total Employees",
		metricKey: "totalEmployees",
		icon: Users,
		color: "text-blue-500"
	},
	{
		title: "Employee Present",
		metricKey: "presentEmployees",
		icon: Users,
		color: "text-green-500"
	},
	{
		title: "On Leave",
		metricKey: "onLeaveEmployees",
		icon: Clock,
		color: "text-orange-500"
	},
	{
		title: "Pending Requests",
		metricKey: "openHrRequests",
		icon: AlertCircle,
		color: "text-red-500"
	}
] as const;

const requestStatuses = [
	"All",
	"OPEN",
	"SCRUTINY",
	"APPROVED",
	"REJECTED",
	"CLOSED"
] as const;

type RequestStatusFilter = (typeof requestStatuses)[number];

const formatLabel = (value: string) =>
	value
		.split("_")
		.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
		.join(" ");

const formatDate = (value: string | null) => {
	if (!value) {
		return "-";
	}

	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric"
	}).format(new Date(value));
};

const formatDateTime = (value: string | null) => {
	if (!value) {
		return "-";
	}

	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit"
	}).format(new Date(value));
};

const formatRequestDetails = (request: TodayHrRequest) => {
	if (request.fromDate || request.toDate) {
		return `${formatDate(request.fromDate)} - ${formatDate(request.toDate)}`;
	}

	if (request.checkInHours || request.checkOutHours) {
		return `${request.checkInHours || "-"} / ${request.checkOutHours || "-"}`;
	}

	if (request.leaveType) {
		return request.leaveType;
	}

	return "-";
};

export default function HRDashboard() {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] =
		useState<RequestStatusFilter>("All");
	const [currentPage, setCurrentPage] = useState(1);
	const [requests, setRequests] = useState<TodayHrRequest[]>([]);
	const [hasMoreRequests, setHasMoreRequests] = useState(false);
	const [isRequestsLoading, setIsRequestsLoading] = useState(true);
	const [heroAnalytics, setHeroAnalytics] =
		useState<HeroAnalyticsResponse | null>(null);
	const [isMetricsLoading, setIsMetricsLoading] = useState(true);
	const [departments, setDepartments] = useState<{ deptId: number; deptName: string }[]>([]);
	const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);

	// Weekly analytics state
	const [weeklyEmployeeStrength, setWeeklyEmployeeStrength] = useState<WeeklyEmployeeStrengthResponse | null>(null);
	const [weeklyWorkingHours, setWeeklyWorkingHours] = useState<WeeklyWorkingHoursResponse | null>(null);
	const [weeklyCheckInCheckOut, setWeeklyCheckInCheckOut] = useState<WeeklyCheckInCheckOutResponse | null>(null);
	const [isWeeklyAnalyticsLoading, setIsWeeklyAnalyticsLoading] = useState(true);
	const itemsPerPage = 10;
	const orgId = useOrgId();
	const { toast } = useToast();

	// Fetch departments when orgId changes
	useEffect(() => {
		if (!orgId) return;

		let isActive = true;
		const loadDepartments = async () => {
			setIsDepartmentsLoading(true);
			try {
				const parsedOrgId = Number(orgId);
				if (Number.isNaN(parsedOrgId)) return;

				const data = await getAllDepartments(parsedOrgId);
				if (isActive) {
					setDepartments(data);
				}
			} catch (error) {
				console.error("Failed to load departments:", error);
			} finally {
				if (isActive) {
					setIsDepartmentsLoading(false);
				}
			}
		};

		loadDepartments();
		return () => { isActive = false; };
	}, [orgId]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 350);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [searchQuery]);

	useEffect(() => {
		let isActive = true;

		const loadHeroAnalytics = async () => {
			if (!orgId) {
				if (isActive) {
					setHeroAnalytics(null);
					setIsMetricsLoading(false);
				}
				return;
			}

			const parsedOrgId = Number(orgId);

			if (Number.isNaN(parsedOrgId)) {
				if (isActive) {
					setHeroAnalytics(null);
					setIsMetricsLoading(false);
					toast({
						title: "Unable to load dashboard metrics",
						description: "Organization id is invalid.",
						variant: "destructive"
					});
				}
				return;
			}

			setIsMetricsLoading(true);

			try {
				const response = await getHeroAnalytics(parsedOrgId);

				if (!isActive) {
					return;
				}

				setHeroAnalytics(response.data);
			} catch (error) {
				if (!isActive) {
					return;
				}

				setHeroAnalytics(null);
				toast({
					title: "Failed to load dashboard metrics",
					description:
						error instanceof Error ? error.message : "Please try again later.",
					variant: "destructive"
				});
			} finally {
				if (isActive) {
					setIsMetricsLoading(false);
				}
			}
		};

		loadHeroAnalytics();

		return () => {
			isActive = false;
		};
	}, [orgId, toast]);

	// Fetch weekly analytics data
	useEffect(() => {
		let isActive = true;

		const loadWeeklyAnalytics = async () => {
			if (!orgId) {
				if (isActive) {
					setWeeklyEmployeeStrength(null);
					setWeeklyWorkingHours(null);
					setWeeklyCheckInCheckOut(null);
					setIsWeeklyAnalyticsLoading(false);
				}
				return;
			}

			const parsedOrgId = Number(orgId);

			if (Number.isNaN(parsedOrgId)) {
				if (isActive) {
					setWeeklyEmployeeStrength(null);
					setWeeklyWorkingHours(null);
					setWeeklyCheckInCheckOut(null);
					setIsWeeklyAnalyticsLoading(false);
				}
				return;
			}

			setIsWeeklyAnalyticsLoading(true);

			try {
				const [strengthRes, hoursRes, checkInOutRes] = await Promise.all([
					getWeeklyEmployeeStrength(orgId),
					getWeeklyWorkingHours(orgId),
					getWeeklyCheckInCheckOut(orgId)
				]);

				if (!isActive) {
					return;
				}

				setWeeklyEmployeeStrength(strengthRes);
				setWeeklyWorkingHours(hoursRes);
				setWeeklyCheckInCheckOut(checkInOutRes);
			} catch (error) {
				if (!isActive) {
					return;
				}

				setWeeklyEmployeeStrength(null);
				setWeeklyWorkingHours(null);
				setWeeklyCheckInCheckOut(null);
				console.error("Failed to load weekly analytics:", error);
			} finally {
				if (isActive) {
					setIsWeeklyAnalyticsLoading(false);
				}
			}
		};

		loadWeeklyAnalytics();

		return () => {
			isActive = false;
		};
	}, [orgId]);

	useEffect(() => {
		let isActive = true;

		const loadRequests = async () => {
			if (!orgId) {
				if (isActive) {
					setRequests([]);
					setHasMoreRequests(false);
					setIsRequestsLoading(false);
				}
				return;
			}

			const parsedOrgId = Number(orgId);

			if (Number.isNaN(parsedOrgId)) {
				if (isActive) {
					setRequests([]);
					setHasMoreRequests(false);
					setIsRequestsLoading(false);
					toast({
						title: "Unable to load HR requests",
						description: "Organization id is invalid.",
						variant: "destructive"
					});
				}
				return;
			}

			setIsRequestsLoading(true);

			try {
				const data = await getTodayHrRequests(parsedOrgId, {
					status:
						selectedStatus === "All"
							? undefined
							: (selectedStatus as RequestStatus),
					page: currentPage - 1,
					offset: itemsPerPage,
					empName: debouncedSearchQuery || undefined
				});

				if (!isActive) {
					return;
				}

				setRequests(data);
				setHasMoreRequests(data.length === itemsPerPage);
			} catch (error) {
				if (!isActive) {
					return;
				}

				setRequests([]);
				setHasMoreRequests(false);
				toast({
					title: "Failed to load HR requests",
					description:
						error instanceof Error ? error.message : "Please try again later.",
					variant: "destructive"
				});
			} finally {
				if (isActive) {
					setIsRequestsLoading(false);
				}
			}
		};

		loadRequests();

		return () => {
			isActive = false;
		};
	}, [
		currentPage,
		debouncedSearchQuery,
		itemsPerPage,
		orgId,
		selectedStatus,
		toast
	]);

	const handleStatusFilter = (status: string) => {
		setSelectedStatus(status as RequestStatusFilter);
		setCurrentPage(1);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setCurrentPage(1);
	};

	const handleClearSearch = () => {
		setSearchQuery("");
		setCurrentPage(1);
	};

	return (
		<div className="flex flex-col gap-8 p-6">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold tracking-tight">
					HR Management Dashboard
				</h1>
				<p className="text-muted-foreground mt-2">
					Monitor your workforce and key metrics in real-time
				</p>
			</div>

			{/* Block 1: Key Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{metricCards.map((metric, idx) => {
					const Icon = metric.icon;
					const metricData = heroAnalytics?.[metric.metricKey];
					const TrendIcon =
						metricData?.trend === "DECREMENT"
							? TrendingDown
							: metricData?.trend === "STABLE"
								? Minus
								: TrendingUp;
					const trendClassName =
						metricData?.trend === "DECREMENT"
							? "text-red-500"
							: metricData?.trend === "STABLE"
								? "text-muted-foreground"
								: "text-green-500";
					const trendPrefix =
						metricData?.trend === "DECREMENT"
							? "-"
							: metricData?.trend === "STABLE"
								? ""
								: "+";

					return (
						<Card key={idx} className="overflow-hidden p-4">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
								<CardTitle className="text-sm font-medium">
									{metric.title}
								</CardTitle>
								<Icon className={`h-4 w-4 ${metric.color}`} />
							</CardHeader>
							<CardContent className="p-0">
								{isMetricsLoading ? (
									<div className="space-y-3">
										<Skeleton className="h-8 w-20" />
										<div className="flex items-center gap-2">
											<Skeleton className="h-4 w-4 rounded-full" />
											<Skeleton className="h-3 w-32" />
										</div>
									</div>
								) : (
									<>
										<div className="text-2xl font-bold">
											{metricData?.value ?? "--"}
										</div>
										<div className="flex items-center gap-1 mt-2">
											{metricData ? (
												<>
													<TrendIcon className={`h-4 w-4 ${trendClassName}`} />
													<span className={`text-xs ${trendClassName}`}>
														{trendPrefix}
														{metricData.difference} vs{" "}
														{metricData.comparisonWith}
													</span>
												</>
											) : (
												<>
													<Minus className="h-4 w-4 text-muted-foreground" />
													<span className="text-xs text-muted-foreground">
														No data available
													</span>
												</>
											)}
										</div>
									</>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Block 2: Attendance and Performance Graphs */}
			<div className="flex w-full justify-between gap-4">
				{/* Weekly Employee Strength */}
				{isWeeklyAnalyticsLoading ? (
					<WeeklyEmployeeStrengthChart data={defaultWeeklyEmployeeStrength} />
				) : (
					<WeeklyEmployeeStrengthChart data={weeklyEmployeeStrength || defaultWeeklyEmployeeStrength} />
				)}

				{/* Weekly Working Hours */}
				{isWeeklyAnalyticsLoading ? (
					<WeeklyWorkingHoursChart data={defaultWeeklyWorkingHours} />
				) : (
					<WeeklyWorkingHoursChart data={weeklyWorkingHours || defaultWeeklyWorkingHours} />
				)}

				{/* Daily Check-in/Check-out */}
				{isWeeklyAnalyticsLoading ? (
					<DailyCheckinCheckoutChart data={defaultWeeklyCheckInCheckOut} />
				) : (
					<DailyCheckinCheckoutChart data={weeklyCheckInCheckOut || defaultWeeklyCheckInCheckOut} />
				)}
			</div>

			{/* Block 3: HR Requests and Expense Breakdown */}
			<div className="flex gap-4">
				{/* HR Requests Table */}
				<Card className="lg:col-span-2 p-4 w-2/3">
					<CardHeader className="p-0">
						<CardTitle>Open HR Requests</CardTitle>
						<CardDescription>
							Pending requests awaiting approval
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0 space-y-4">
						{/* Search Bar and Filter Button */}
						<div className="flex gap-2">
							<div className="relative flex-1">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by employee name..."
									value={searchQuery}
									onChange={(e) => handleSearchChange(e.target.value)}
									className="pl-8"
								/>
							</div>
							{searchQuery && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleClearSearch}
									className="px-2"
								>
									<X className="h-4 w-4" />
								</Button>
							)}

							{/* Filter Dropdown Menu */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="gap-2">
										<Filter className="h-4 w-4" />
										Filter {selectedStatus !== "All" && `(${selectedStatus})`}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{requestStatuses.map((status) => (
										<DropdownMenuItem
											key={status}
											onClick={() => handleStatusFilter(status)}
											className="cursor-pointer flex items-center justify-between"
										>
											<span>
												{status === "All" ? status : formatLabel(status)}
											</span>
											{selectedStatus === status && (
												<Check className="h-4 w-4 text-green-600" />
											)}
										</DropdownMenuItem>
									))}
									{selectedStatus !== "All" && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => handleStatusFilter("All")}
												className="cursor-pointer text-muted-foreground"
											>
												Clear Filter
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Results info */}
						<div className="text-xs text-muted-foreground">
							{isRequestsLoading
								? "Loading requests..."
								: `Page ${currentPage} showing ${requests.length} result${requests.length === 1 ? "" : "s"}`}
						</div>

						{/* Table */}
						<div className="border rounded-lg overflow-hidden">
							{isRequestsLoading ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Request ID</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Applied On</TableHead>
											<TableHead>Details</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Remarks</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{Array.from({ length: itemsPerPage }).map((_, idx) => (
											<TableRow key={idx}>
												<TableCell>
													<Skeleton className="h-4 w-16" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-5 w-32" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-28" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-36" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-5 w-20" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-4 w-40" />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : requests.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Request ID</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Applied On</TableHead>
											<TableHead>Details</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Remarks</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{requests.map((request) => (
											<TableRow key={request.requestId}>
												<TableCell className="font-medium">
													{request.requestId}
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{formatLabel(request.requestType)}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{formatDateTime(request.appliedOn)}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{formatRequestDetails(request)}
												</TableCell>
												<TableCell>
													<Badge
														variant="secondary"
														className="bg-yellow-100 text-yellow-800"
													>
														{formatLabel(request.status)}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{request.remarks || "-"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="p-8 text-center text-sm text-muted-foreground">
									No requests found matching your search or filter.
								</div>
							)}
						</div>

						{/* Pagination Controls */}
						{!isRequestsLoading && (currentPage > 1 || hasMoreRequests) && (
							<div className="flex items-center justify-between">
								<div className="text-xs text-muted-foreground">
									Page {currentPage}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										disabled={currentPage === 1}
									>
										<ChevronLeft className="h-4 w-4" />
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage((p) => p + 1)}
										disabled={!hasMoreRequests}
									>
										Next
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Overall Expense Breakdown Radar */}
				{/* <ExpenseBreakdownChart /> */}

				<div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3 w-1/3 min-h-[40dvh]">
					{/* <Card className="p-4 items-center justify-center gap-2">
                    <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
                      <PartyPopper />
                      <p className="font-medium">Onboard Event</p>
                    </CardContent>
                  </Card> */}
					<TeamManagementDialog mode="team" />
					<EventOnboardDialog />
					<CreateHiringDialog />
					<HrRequestDialog />
				</div>
			</div>
		</div>
	);
}
