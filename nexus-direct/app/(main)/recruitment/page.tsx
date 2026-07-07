"use client"

import { PositionOpeningGraph } from '@/components/position-opening-graph';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontalIcon, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ExperienceWiseBarGraph } from '@/components/experience-wise-bar-graph';
import React, { useCallback, useEffect, useState } from "react";
import { PaginatedResponse } from "@/types/paginated-response";
import {
    CompanyOpeningsCardDto,
    ExperienceWiseOpeningEntry,
    PositionPieGraphEntry,
    RecruitmentApplicantTableResponse
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
    companyWiseOpeningCount,
    getOpeningsBeforeToday,
    getOpeningsExperienceWise,
    getOpeningsToday,
    getPositionPieGraph
} from "@/lib/auth-service";


const FilterMenu = () => {
    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipContent>
                    <p>Filter</p>
                </TooltipContent>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 cursor-pointer">
                            <SlidersHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
            </Tooltip>
            <DropdownMenuContent className="w-40" align="start">
                <DropdownMenuGroup>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuCheckboxItem
                                    checked={true}
                                    onCheckedChange={() => {
                                    }}
                                >
                                    Open
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuItem>Closed</DropdownMenuItem>
                                <DropdownMenuItem>Cancelled</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Company</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <form action="">
                                    <Input type="text" placeholder="Search company..." className="h-8 mb-2" />
                                </form>
                                <DropdownMenuCheckboxItem
                                    checked={true}
                                    onCheckedChange={() => {
                                    }}
                                >
                                    TechnoCorp Inc
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuItem>Innovatech Solutions</DropdownMenuItem>
                                <DropdownMenuItem>GlobalTech Enterprises</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Location</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <form action="">
                                    <Input type="text" placeholder="Search location..." className="h-8 mb-2" />
                                </form>
                                <DropdownMenuCheckboxItem
                                    checked={true}
                                    onCheckedChange={() => {
                                    }}
                                >
                                    San Francisco, CA
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuItem>New York, NY</DropdownMenuItem>
                                <DropdownMenuItem>Austin, TX</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const Recruitment = () => {
    const navigator = useRouter();

    // Data states for all 5 APIs
    const [openingsToday, setOpeningsToday] = useState<PaginatedResponse<RecruitmentApplicantTableResponse> | null>(null);
    const [openingsBeforeToday, setOpeningsBeforeToday] = useState<PaginatedResponse<RecruitmentApplicantTableResponse> | null>(null);
    const [positionPieGraph, setPositionPieGraph] = useState<PositionPieGraphEntry[] | null>(null);
    const [experienceWiseOpenings, setExperienceWiseOpenings] = useState<ExperienceWiseOpeningEntry[] | null>(null);
    const [companyWiseOpeningCountData, setCompanyWiseOpeningCountData] = useState<PaginatedResponse<CompanyOpeningsCardDto> | null>(null);

    // Consolidated loading state
    const [loadingStates, setLoadingStates] = useState({
        openingsToday: true,
        openingsBefore: true,
        pieGraph: true,
        experienceWise: true,
        companyCounts: true,
    });

    // Consolidated pagination state
    const [pageState, setPageState] = useState({
        today: 0,
        before: 0,
        company: 0,
    });
    const pageSize = 10;

    const { toast } = useToast();

    const fetchAllData = useCallback(async () => {
        // Fetch all 5 APIs in parallel
        const [
            todayResult,
            beforeResult,
            pieResult,
            experienceResult,
            companyResult
        ] = await Promise.allSettled([
            getOpeningsToday(pageState.today, pageSize, "", "", ""),
            getOpeningsBeforeToday(pageState.before, pageSize, "", "", ""),
            getPositionPieGraph(),
            getOpeningsExperienceWise(),
            companyWiseOpeningCount(pageState.company, pageSize),
        ]);

        // Handle today's openings
        if (todayResult.status === "fulfilled") {
            setOpeningsToday(todayResult.value.data);
        } else {
            console.error("Failed to fetch today's openings:", todayResult.reason);
            toast({ title: "Error", description: "Failed to load today's openings", variant: "destructive" });
        }

        // Handle openings before today
        if (beforeResult.status === "fulfilled") {
            setOpeningsBeforeToday(beforeResult.value.data);
        } else {
            console.error("Failed to fetch openings before today:", beforeResult.reason);
        }

        // Handle position pie graph
        if (pieResult.status === "fulfilled") {
            setPositionPieGraph(pieResult.value.data);
        } else {
            console.error("Failed to fetch position pie graph:", pieResult.reason);
        }

        // Handle experience-wise openings (API returns a map, transform to array)
        if (experienceResult.status === "fulfilled") {
            const rawMap = experienceResult.value.data;
            const transformed: ExperienceWiseOpeningEntry[] = Object.entries(rawMap).map(([level, count]) => ({
                experienceLevel: level,
                experience: level, // use level as experience description
                count: count,
            }));
            setExperienceWiseOpenings(transformed);
        } else {
            console.error("Failed to fetch experience-wise openings:", experienceResult.reason);
        }

        // Handle company-wise opening count
        if (companyResult.status === "fulfilled") {
            setCompanyWiseOpeningCountData(companyResult.value.data);
        } else {
            console.error("Failed to fetch company-wise opening count:", companyResult.reason);
            toast({ title: "Error", description: "Failed to load company openings", variant: "destructive" });
        }

        setLoadingStates({
            openingsToday: false,
            openingsBefore: false,
            pieGraph: false,
            experienceWise: false,
            companyCounts: false,
        });
    }, [pageState, pageSize, toast]);

    useEffect(() => {
        fetchAllData(); // eslint-disable-line react-hooks/set-state-in-effect
    }, [fetchAllData]);

    // Derived data
    const todaysOpportunities = openingsToday?.content ?? [];
    const previewOpportunities = openingsBeforeToday?.content?.slice(0, 3) ?? [];
    const companiesOpenings = React.useMemo(() => companyWiseOpeningCountData?.content ?? [], [companyWiseOpeningCountData]);
    const totalOpenings = React.useMemo(() => {
        return companiesOpenings.reduce((acc, c) => acc + c.currentOpenings, 0);
    }, [companiesOpenings]);
    return (
        <div>
            <section className="mt-4">
                <h1 className="text-2xl font-bold">Welcome to Recruitments</h1>
                <p>Discover amazing opportunities with our recruitment process.</p>
            </section>
            <section className="mt-8 flex gap-4">
                <Card className="p-4 gap-2 w-1/3">
                    <CardHeader className="p-0">
                        <CardTitle>Total Opportunities Experience wise</CardTitle>
                        <CardDescription>Explore the distribution of job opportunities based on experience
                            levels.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4 mt-2 h-full">
                        {/* <Card className="p-4 gap-2">
                            <CardContent className="p-0 flex justify-between items-center">
                                <div className="">
                                    <p className="font-medium text-md">Junior level Roles</p>
                                    <p className="text-gray-500">0-2 years of experience</p>
                                </div>
                                <div className="">
                                    <h1 className="text-4xl font-bold">50+</h1>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="p-4 gap-2">
                            <CardContent className="p-0 flex justify-between items-center">
                                <div className="">
                                    <p className="font-medium text-md">Mid level Roles</p>
                                    <p className="text-gray-500">3-5 years of experience</p>
                                </div>
                                <div className="">
                                    <h1 className="text-4xl font-bold">20+</h1>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="p-4 gap-2">
                            <CardContent className="p-0 flex justify-between items-center">
                                <div className="">
                                    <p className="font-medium text-md">Senior level Roles</p>
                                    <p className="text-gray-500">5-10 years of experience</p>
                                </div>
                                <div className="">
                                    <h1 className="text-4xl font-bold">15+</h1>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="p-4 gap-2">
                            <CardContent className="p-0 flex justify-between items-center">
                                <div className="">
                                    <p className="font-medium text-md">Executive level Roles</p>
                                    <p className="text-gray-500">10+ years of experience</p>
                                </div>
                                <div className="">
                                    <h1 className="text-4xl font-bold">3</h1>
                                </div>
                            </CardContent>
                        </Card> */}
                        <ExperienceWiseBarGraph data={experienceWiseOpenings} isLoading={loadingStates.experienceWise} />
                    </CardContent>
                    <CardFooter className="p-0 flex flex-col items-start mt-4">
                        <h4 className="font-medium">Total current openings: {totalOpenings}</h4>
                        <p className="text-sm text-gray-500">Showing aggregate of all current openings across companies
                            registered under Nexus Inc.</p>
                    </CardFooter>
                </Card>
                <Card className="p-4 gap-2 w-2/3">
                    <CardHeader className="p-0">
                        <CardTitle>Companies currently hiring</CardTitle>
                        <CardDescription>Check out the latest job openings from our partner companies.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loadingStates.companyCounts ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <Card key={i} className="p-4 gap-2">
                                        <CardContent className="flex flex-col justify-center gap-2 p-0">
                                            <div className="animate-pulse rounded-md bg-muted h-5 w-3/4" />
                                            <div className="animate-pulse rounded-md bg-muted h-10 w-1/2" />
                                            <div className="animate-pulse rounded-md bg-muted h-4 w-1/3" />
                                            <div className="animate-pulse rounded-md bg-muted h-4 w-2/3" />
                                        </CardContent>
                                    </Card>
                                ))
                            ) : companiesOpenings.length > 0 ? (
                                companiesOpenings.map((company) => (
                                    <Card key={company.orgId} className="p-4 gap-2">
                                        <CardContent className="flex flex-col justify-center gap-2 p-0">
                                            <p className="font-medium">{company.orgName}</p>
                                            <h3 className="text-4xl font-bold">{company.currentOpenings}</h3>
                                            <h4 className="text-medium text-gray-500 font-semibold">Openings</h4>
                                            <div className="flex items-center gap-2 text-green-500">
                                                <TrendingUp className="w-4 h-4" />
                                                <p className="text-sm text-gray-500"><span
                                                    className="font-bold">{company.changeFromLastMonth}</span> more than last month</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-full text-center py-8">No company openings found.</p>
                            )}
                        </div>
                        {companyWiseOpeningCountData && companyWiseOpeningCountData.totalPages > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    {Array.from({ length: companyWiseOpeningCountData.totalPages }, (_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                isActive={i === pageState.company}
                                                onClick={(e) => { e.preventDefault(); setPageState(prev => ({ ...prev, company: i })); }}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                </PaginationContent>
                            </Pagination>
                        )}
                    </CardContent>
                </Card>
            </section>
            <section className="mt-4 flex gap-4">
                <Card className="p-4 gap-2 w-2/3">
                    <CardHeader className="p-0 flex justify-between items-center">
                        <div className="">
                            <CardTitle>Today&apos;s Opportunities</CardTitle>
                            <CardDescription>Explore the latest job openings and find your next career
                                move.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <form>
                                <Input type="text" placeholder="Search opportunities..." className="h-10" />
                            </form>
                            <FilterMenu />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Posted On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingStates.openingsToday ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <div className="animate-pulse rounded-md bg-muted h-5 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : todaysOpportunities.length > 0 ? (
                                    todaysOpportunities.map((opportunity) => (
                                        <TableRow key={opportunity.recruitmentId}>
                                            <TableCell>{opportunity.orgName}</TableCell>
                                            <TableCell>{opportunity.roleName}</TableCell>
                                            <TableCell>{opportunity.location}</TableCell>
                                            <TableCell>{new Date(opportunity.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{opportunity.status}</Badge>
                                            </TableCell>
                                            <TableCell>{opportunity.department}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8">
                                                            <MoreHorizontalIcon />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Apply Now</DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => navigator.push(`/recruitment/${opportunity.recruitmentId}`)}>View
                                                            Details</DropdownMenuItem>

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                            No opportunities found for today.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {openingsToday && openingsToday.totalPages > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    {Array.from({ length: openingsToday.totalPages }, (_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                isActive={i === pageState.today}
                                                onClick={(e) => { e.preventDefault(); setPageState(prev => ({ ...prev, today: i })); }}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                </PaginationContent>
                            </Pagination>
                        )}
                    </CardContent>
                </Card>

                <PositionOpeningGraph data={positionPieGraph} isLoading={loadingStates.pieGraph} />
            </section>
            <section className="mt-4">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0 flex justify-between items-center">
                        <div className="">
                            <CardTitle>Preview Opportunities</CardTitle>
                            <CardDescription>Get a sneak peek at some of the exciting job openings available
                                today.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <form>
                                <Input type="text" placeholder="Search opportunities..." className="h-10" />
                            </form>
                            <FilterMenu />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Posted On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingStates.openingsBefore ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <div className="animate-pulse rounded-md bg-muted h-5 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : previewOpportunities.length > 0 ? (
                                    previewOpportunities.map((opportunity) => (
                                        <TableRow key={opportunity.recruitmentId}>
                                            <TableCell>{opportunity.orgName}</TableCell>
                                            <TableCell>{opportunity.roleName}</TableCell>
                                            <TableCell>{opportunity.location}</TableCell>
                                            <TableCell>{new Date(opportunity.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={opportunity.status === "Rejected" ? "destructive" : opportunity.status === "Offer Received" ? "default" : "secondary"}>
                                                    {opportunity.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{opportunity.department}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button variant="default" size="sm">
                                                    Apply Now
                                                </Button>
                                                <Button variant="outline" size="sm"
                                                    onClick={() => navigator.push(`/recruitment/${opportunity.recruitmentId}`)}>
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                            No preview opportunities found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {openingsBeforeToday && openingsBeforeToday.totalPages > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    {Array.from({ length: openingsBeforeToday.totalPages }, (_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                isActive={i === pageState.before}
                                                onClick={(e) => { e.preventDefault(); setPageState(prev => ({ ...prev, before: i })); }}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                </PaginationContent>
                            </Pagination>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

export default Recruitment