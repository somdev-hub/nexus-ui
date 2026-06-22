"use client"

import { PositionOpeningGraph } from '@/components/position-opening-graph';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontalIcon, SlidersHorizontal, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react'

const Recruitment = () => {
    const navigator = useRouter();
    const companiesOpenings = [
        {
            name: "TechnoCorp Inc",
            openings: 12
        },
        {
            name: "Innovatech Solutions",
            openings: 8
        },
        {
            name: "GlobalTech Enterprises",
            openings: 15
        },
        {
            name: "NextGen Innovations",
            openings: 5
        },
        {
            name: "FutureTech Labs",
            openings: 10
        },
        {
            name: "CyberDynamics",
            openings: 7
        }
    ]

    const todaysOpportunities = [
        {
            "company": "Cosmos Ltd.",
            "position": "Software Engineer",
            "location": "San Francisco, CA",
            "postedOn": "2026-06-12",
            "status": "OPEN",
            "department": "Engineering"
        },
        {
            "company": "Nebula Inc.",
            "position": "Frontend Developer",
            "location": "New York, NY",
            "postedOn": "2026-06-10",
            "status": "OPEN",
            "department": "Engineering"
        },
        {
            "company": "Stellar Solutions",
            "position": "Data Scientist",
            "location": "Remote",
            "postedOn": "2026-06-08",
            "status": "OPEN",
            "department": "Data Science"
        },
        {
            "company": "Galactic Tech",
            "position": "Product Manager",
            "location": "Austin, TX",
            "postedOn": "2026-06-05",
            "status": "OPEN",
            "department": "Product Management"
        },
        {
            "company": "Cosmic Innovations",
            "position": "UX Designer",
            "location": "Seattle, WA",
            "postedOn": "2026-06-01",
            "status": "OPEN",
            "department": "Design"
        }
    ]
    const previewOpportunities = todaysOpportunities.slice(0, 3); // Get the first 3 opportunities for preview
    return (
        <div>
            <section className="mt-4">
                <h1 className="text-2xl font-bold">Welcome to Recruitments</h1>
                <p>Discover amazing opportunities with our recruitment process.</p>
            </section>
            <section className="mt-8">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Companies currently hiring</CardTitle>
                        <CardDescription>Check out the latest job openings from our partner companies.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {companiesOpenings.map((company, index) => (
                                <Card key={index} className="p-4 gap-2 mb-4">
                                    <CardContent className="flex flex-col justify-center gap-2 p-0">
                                        <p className="font-medium">{company.name}</p>
                                        <h3 className="text-4xl font-bold">{company.openings}</h3>
                                        <h4 className="text-medium text-gray-500 font-semibold">Openings</h4>
                                        <div className="flex items-center gap-2 text-green-500">
                                            <TrendingUp className="w-4 h-4" />
                                            <p className="text-sm text-gray-500"><span className="font-bold">6</span> more than last month</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
            <section className="mt-4 flex gap-4">
                <Card className="p-4 gap-2 w-2/3">
                    <CardHeader className="p-0 flex justify-between items-center">
                        <div className="">
                            <CardTitle>Today&apos;s Opportunities</CardTitle>
                            <CardDescription>Explore the latest job openings and find your next career move.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <form>
                                <Input type="text" placeholder="Search opportunities..." className="h-10" />
                            </form>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className="h-10 w-10"><SlidersHorizontal /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Filter opportunities</p>
                                </TooltipContent>
                            </Tooltip>
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
                                {todaysOpportunities.map((opportunity, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{opportunity.company}</TableCell>
                                        <TableCell>{opportunity.position}</TableCell>
                                        <TableCell>{opportunity.location}</TableCell>
                                        <TableCell>{opportunity.postedOn}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => navigator.push(`/recruitment/${index}`)}>View Details</DropdownMenuItem>

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination className="mt-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationLink href="#">1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#" isActive>
                                        2
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">4</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">5</PaginationLink>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardContent>
                </Card>

                <PositionOpeningGraph />
            </section>
            <section className="mt-4">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0 flex justify-between items-center">
                        <div className="">
                            <CardTitle>Preview Opportunities</CardTitle>
                            <CardDescription>Get a sneak peek at some of the exciting job openings available today.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <form>
                                <Input type="text" placeholder="Search opportunities..." className="h-10" />
                            </form>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className="h-10 w-10"><SlidersHorizontal /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Filter opportunities</p>
                                </TooltipContent>
                            </Tooltip>
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
                                {previewOpportunities.map((opportunity, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{opportunity.company}</TableCell>
                                        <TableCell>{opportunity.position}</TableCell>
                                        <TableCell>{opportunity.location}</TableCell>
                                        <TableCell>{opportunity.postedOn}</TableCell>
                                        <TableCell>
                                            <Badge variant={opportunity.status === "Rejected" ? "destructive" : opportunity.status === "Offer Received" ? "default" : "secondary"}>
                                                {opportunity.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{opportunity.department}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button variant="default" size="sm">
                                                Apply Now
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination className="mt-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationLink href="#">1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#" isActive>
                                        2
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">4</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">5</PaginationLink>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

export default Recruitment