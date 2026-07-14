"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Briefcase,
    Building2,
    CheckCircle,
    Clock,
    FileText,
    Flag,
    Info,
    Ship,
    Star,
    TrendingUp,
    Users,
    Users2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CompanyOpeningInsight {
    company: string;
    companyId: number;
    logo?: string;
    topOpenings: TopOpening[];
    totalOpenings: number;
    totalApplications: number;
    applicationsThisWeek: number;
    avgTimeToFill: number; // in days
    topRoles: TopRole[];
    statusBreakdown: StatusBreakdown[];
    hiringTrend: "up" | "down" | "stable";
    trendPercent: number;
}

interface TopOpening {
    id: number;
    title: string;
    department: string;
    type: string;
    location: string;
    postedDate: string;
    applicationsCount: number;
    viewsCount: number;
    status: "active" | "paused" | "closed";
    priority: "high" | "medium" | "low";
    daysOpen: number;
}

interface TopRole {
    role: string;
    openings: number;
    applications: number;
    conversionRate: number; // percentage
}

interface StatusBreakdown {
    status: string;
    count: number;
    color: string;
}

interface ShippingPartnerInsight {
    company: string;
    companyId: number;
    companyType: string;
    monthlyVolume: string;
    partnersNeeded: number;
    currentPartners: number;
    shippingMethods: string[];
    enrollmentDeadline: string;
    requirements: string;
    applicationsReceived: number;
    approvedPartners: number;
    pendingReview: number;
    avgResponseTime: string; // e.g., "2 days"
    partnershipHealth: "excellent" | "good" | "needs-attention";
}

interface DashboardStats {
    label: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

const companyInsights: CompanyOpeningInsight[] = [
    {
        company: "TechCorp",
        companyId: 1,
        totalOpenings: 12,
        totalApplications: 342,
        applicationsThisWeek: 28,
        avgTimeToFill: 18,
        hiringTrend: "up",
        trendPercent: 15,
        topOpenings: [
            {
                id: 101,
                title: "Senior Software Engineer",
                department: "Engineering",
                type: "Full-time",
                location: "San Francisco, CA",
                postedDate: "2024-01-15",
                applicationsCount: 89,
                viewsCount: 1240,
                status: "active",
                priority: "high",
                daysOpen: 12,
            },
            {
                id: 102,
                title: "Product Manager",
                department: "Product",
                type: "Full-time",
                location: "New York, NY",
                postedDate: "2024-01-10",
                applicationsCount: 67,
                viewsCount: 890,
                status: "active",
                priority: "high",
                daysOpen: 17,
            },
            {
                id: 103,
                title: "DevOps Engineer",
                department: "Engineering",
                type: "Contract",
                location: "Remote",
                postedDate: "2024-01-20",
                applicationsCount: 34,
                viewsCount: 560,
                status: "active",
                priority: "medium",
                daysOpen: 7,
            },
        ],
        topRoles: [
            { role: "Software Engineer", openings: 5, applications: 156, conversionRate: 12.5 },
            { role: "Product Manager", openings: 2, applications: 89, conversionRate: 8.2 },
            { role: "DevOps Engineer", openings: 2, applications: 45, conversionRate: 15.1 },
            { role: "Data Scientist", openings: 1, applications: 34, conversionRate: 9.8 },
            { role: "UX Designer", openings: 2, applications: 18, conversionRate: 11.3 },
        ],
        statusBreakdown: [
            { status: "Applied", count: 156, color: "bg-blue-500" },
            { status: "Under Review", count: 89, color: "bg-yellow-500" },
            { status: "Interview", count: 56, color: "bg-purple-500" },
            { status: "Offered", count: 23, color: "bg-green-500" },
            { status: "Rejected", count: 18, color: "bg-red-500" },
        ],
    },
    {
        company: "InnovateX",
        companyId: 2,
        totalOpenings: 8,
        totalApplications: 198,
        applicationsThisWeek: 15,
        avgTimeToFill: 22,
        hiringTrend: "stable",
        trendPercent: 2,
        topOpenings: [
            {
                id: 201,
                title: "Data Scientist",
                department: "Data Science",
                type: "Full-time",
                location: "Austin, TX",
                postedDate: "2024-01-08",
                applicationsCount: 78,
                viewsCount: 920,
                status: "active",
                priority: "high",
                daysOpen: 19,
            },
            {
                id: 202,
                title: "UX Designer",
                department: "Design",
                type: "Full-time",
                location: "Seattle, WA",
                postedDate: "2024-01-18",
                applicationsCount: 45,
                viewsCount: 670,
                status: "active",
                priority: "medium",
                daysOpen: 9,
            },
            {
                id: 203,
                title: "ML Engineer",
                department: "Data Science",
                type: "Full-time",
                location: "Remote",
                postedDate: "2024-01-22",
                applicationsCount: 32,
                viewsCount: 410,
                status: "active",
                priority: "high",
                daysOpen: 5,
            },
        ],
        topRoles: [
            { role: "Data Scientist", openings: 3, applications: 112, conversionRate: 10.8 },
            { role: "UX Designer", openings: 2, applications: 56, conversionRate: 12.1 },
            { role: "ML Engineer", openings: 2, applications: 30, conversionRate: 8.5 },
            { role: "Backend Engineer", openings: 1, applications: 0, conversionRate: 0 },
        ],
        statusBreakdown: [
            { status: "Applied", count: 89, color: "bg-blue-500" },
            { status: "Under Review", count: 54, color: "bg-yellow-500" },
            { status: "Interview", count: 32, color: "bg-purple-500" },
            { status: "Offered", count: 14, color: "bg-green-500" },
            { status: "Rejected", count: 9, color: "bg-red-500" },
        ],
    },
    {
        company: "FutureTech",
        companyId: 3,
        totalOpenings: 6,
        totalApplications: 156,
        applicationsThisWeek: 8,
        avgTimeToFill: 25,
        hiringTrend: "down",
        trendPercent: -8,
        topOpenings: [
            {
                id: 301,
                title: "AI Researcher",
                department: "Research",
                type: "Full-time",
                location: "Boston, MA",
                postedDate: "2024-01-05",
                applicationsCount: 56,
                viewsCount: 780,
                status: "active",
                priority: "high",
                daysOpen: 22,
            },
            {
                id: 302,
                title: "Cybersecurity Analyst",
                department: "Security",
                type: "Full-time",
                location: "Washington, DC",
                postedDate: "2024-01-12",
                applicationsCount: 41,
                viewsCount: 590,
                status: "active",
                priority: "high",
                daysOpen: 15,
            },
            {
                id: 303,
                title: "Research Scientist",
                department: "Research",
                type: "Contract",
                location: "Remote",
                postedDate: "2024-01-25",
                applicationsCount: 18,
                viewsCount: 290,
                status: "paused",
                priority: "low",
                daysOpen: 2,
            },
        ],
        topRoles: [
            { role: "AI Researcher", openings: 2, applications: 67, conversionRate: 7.2 },
            { role: "Cybersecurity Analyst", openings: 2, applications: 54, conversionRate: 9.1 },
            { role: "Research Scientist", openings: 2, applications: 35, conversionRate: 5.8 },
        ],
        statusBreakdown: [
            { status: "Applied", count: 72, color: "bg-blue-500" },
            { status: "Under Review", count: 41, color: "bg-yellow-500" },
            { status: "Interview", count: 24, color: "bg-purple-500" },
            { status: "Offered", count: 11, color: "bg-green-500" },
            { status: "Rejected", count: 8, color: "bg-red-500" },
        ],
    },
    {
        company: "GlobalLogistics",
        companyId: 4,
        totalOpenings: 15,
        totalApplications: 287,
        applicationsThisWeek: 34,
        avgTimeToFill: 14,
        hiringTrend: "up",
        trendPercent: 23,
        topOpenings: [
            {
                id: 401,
                title: "Supply Chain Manager",
                department: "Operations",
                type: "Full-time",
                location: "Chicago, IL",
                postedDate: "2024-01-18",
                applicationsCount: 67,
                viewsCount: 890,
                status: "active",
                priority: "high",
                daysOpen: 9,
            },
            {
                id: 402,
                title: "Logistics Coordinator",
                department: "Operations",
                type: "Full-time",
                location: "Dallas, TX",
                postedDate: "2024-01-20",
                applicationsCount: 54,
                viewsCount: 720,
                status: "active",
                priority: "medium",
                daysOpen: 7,
            },
            {
                id: 403,
                title: "Warehouse Operations Lead",
                department: "Operations",
                type: "Full-time",
                location: "Atlanta, GA",
                postedDate: "2024-01-22",
                applicationsCount: 38,
                viewsCount: 480,
                status: "active",
                priority: "medium",
                daysOpen: 5,
            },
        ],
        topRoles: [
            { role: "Supply Chain Manager", openings: 3, applications: 89, conversionRate: 14.2 },
            { role: "Logistics Coordinator", openings: 5, applications: 112, conversionRate: 11.8 },
            { role: "Warehouse Operations Lead", openings: 4, applications: 56, conversionRate: 13.5 },
            { role: "Fleet Manager", openings: 3, applications: 30, conversionRate: 8.9 },
        ],
        statusBreakdown: [
            { status: "Applied", count: 124, color: "bg-blue-500" },
            { status: "Under Review", count: 78, color: "bg-yellow-500" },
            { status: "Interview", count: 45, color: "bg-purple-500" },
            { status: "Offered", count: 24, color: "bg-green-500" },
            { status: "Rejected", count: 16, color: "bg-red-500" },
        ],
    },
];

const shippingPartnerInsights: ShippingPartnerInsight[] = [
    {
        company: "LogiShip",
        companyId: 1,
        companyType: "Retailer",
        monthlyVolume: "1,000 shipments",
        partnersNeeded: 5,
        currentPartners: 3,
        shippingMethods: ["Ground", "Air"],
        enrollmentDeadline: "2024-09-30",
        requirements: "Fleet of 10+ trucks, 98%+ on-time delivery rate, insurance coverage $1M+",
        applicationsReceived: 12,
        approvedPartners: 3,
        pendingReview: 4,
        avgResponseTime: "2 days",
        partnershipHealth: "good",
    },
    {
        company: "ShipEase",
        companyId: 2,
        companyType: "E-commerce",
        monthlyVolume: "500 shipments",
        partnersNeeded: 3,
        currentPartners: 2,
        shippingMethods: ["Ground", "Air", "Sea"],
        enrollmentDeadline: "2024-10-15",
        requirements: "Experience with fragile items, 24/7 customer support, real-time tracking",
        applicationsReceived: 8,
        approvedPartners: 2,
        pendingReview: 2,
        avgResponseTime: "1 day",
        partnershipHealth: "excellent",
    },
    {
        company: "GlobalFreight",
        companyId: 3,
        companyType: "Manufacturing",
        monthlyVolume: "2,000 shipments",
        partnersNeeded: 10,
        currentPartners: 6,
        shippingMethods: ["Air", "Sea"],
        enrollmentDeadline: "2024-11-30",
        requirements: "International shipping capabilities, customs compliance, hazardous materials certified",
        applicationsReceived: 18,
        approvedPartners: 6,
        pendingReview: 5,
        avgResponseTime: "3 days",
        partnershipHealth: "needs-attention",
    },
    {
        company: "EcoShip",
        companyId: 4,
        companyType: "Retailer",
        monthlyVolume: "800 shipments",
        partnersNeeded: 4,
        currentPartners: 1,
        shippingMethods: ["Ground", "Air"],
        enrollmentDeadline: "2024-12-15",
        requirements: "Carbon-neutral fleet, sustainable packaging, green certifications preferred",
        applicationsReceived: 5,
        approvedPartners: 1,
        pendingReview: 2,
        avgResponseTime: "4 days",
        partnershipHealth: "needs-attention",
    },
];

const dashboardStats: DashboardStats[] = [
    {
        label: "Active Companies",
        value: "150+",
        change: "+12% vs last month",
        changeType: "positive",
        icon: Building2,
        color: "text-blue-600 bg-blue-100",
    },
    {
        label: "Open Positions",
        value: "1,247",
        change: "+8% vs last week",
        changeType: "positive",
        icon: Briefcase,
        color: "text-green-600 bg-green-100",
    },
    {
        label: "Total Applications",
        value: "983",
        change: "+23% vs last week",
        changeType: "positive",
        icon: FileText,
        color: "text-purple-600 bg-purple-100",
    },
    {
        label: "Avg Time to Fill",
        value: "19 days",
        change: "-2 days vs last month",
        changeType: "positive",
        icon: Clock,
        color: "text-orange-600 bg-orange-100",
    },
];

const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
        high: "bg-red-100 text-red-700",
        medium: "bg-yellow-100 text-yellow-700",
        low: "bg-green-100 text-green-700",
    };
    return badges[priority] || "bg-gray-100 text-gray-700";
};

const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
        active: "bg-green-100 text-green-700",
        paused: "bg-yellow-100 text-yellow-700",
        closed: "bg-gray-100 text-gray-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
};

const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
};

const getHealthBadge = (health: string) => {
    const badges: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
        excellent: { label: "Excellent", class: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
        good: { label: "Good", class: "bg-blue-100 text-blue-700", icon: <Flag className="w-3 h-3" /> },
        "needs-attention": { label: "Needs Attention", class: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-3 h-3" /> },
    };
    return badges[health] || badges.good;
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
};

export default function Home() {
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(1);
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(1);
    const [viewMode, setViewMode] = useState<"openings" | "applications" | "roles">("openings");

    const selectedCompany = companyInsights.find(c => c.companyId === selectedCompanyId) || companyInsights[0];
    const selectedPartner = shippingPartnerInsights.find(p => p.companyId === selectedPartnerId) || shippingPartnerInsights[0];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Recruitment & shipping partnership insights</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/recruitment">
                            <Briefcase className="w-4 h-4 mr-2" />
                            All Jobs
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/shipping-partners">
                            <Ship className="w-4 h-4 mr-2" />
                            All Partners
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {dashboardStats.map((stat, index) => (
                    <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                    <p className={`text-xs mt-1 ${stat.changeType === "positive" ? "text-green-600" : stat.changeType === "negative" ? "text-red-600" : "text-gray-500"}`}>
                                        {stat.change}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Company Insights (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Company Selector & Top Openings */}
                    <Card className="border-0 shadow-sm p-4">
                        <CardHeader className="p-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="text-lg font-semibold">Top Openings by Company</CardTitle>
                                    <p className="text-sm text-gray-500">
                                        {selectedCompany.totalOpenings} open positions • {selectedCompany.totalApplications} total applications • {selectedCompany.avgTimeToFill} days avg time to fill
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={selectedCompanyId ?? ""}
                                        onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {companyInsights.map((company) => (
                                            <option key={company.companyId} value={company.companyId}>
                                                {company.company} ({company.totalOpenings} openings, {company.totalApplications} apps)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* View Mode Tabs */}
                            <div className="border-b border-gray-100 ">
                                <nav className="flex gap-1" role="tablist">
                                    {[
                                        { value: "openings", label: "Top Openings", icon: Briefcase },
                                        { value: "applications", label: "Application Funnel", icon: BarChart3 },
                                        { value: "roles", label: "Roles Breakdown", icon: Users2 },
                                    ].map((tab) => (
                                        <button
                                            key={tab.value}
                                            role="tab"
                                            aria-selected={viewMode === tab.value}
                                            onClick={() => setViewMode(tab.value as typeof viewMode)}
                                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === tab.value
                                                ? "border-blue-500 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Top Openings View */}
                            {viewMode === "openings" && (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="w-1/4">Position</TableHead>
                                                <TableHead className="w-1/6">Department</TableHead>
                                                <TableHead className="w-1/6">Type</TableHead>
                                                <TableHead className="w-1/6">Location</TableHead>
                                                <TableHead className="w-1/8">Applications</TableHead>
                                                <TableHead className="w-1/8">Views</TableHead>
                                                <TableHead className="w-1/8">Days Open</TableHead>
                                                <TableHead className="w-1/8">Priority</TableHead>
                                                <TableHead className="w-1/8">Status</TableHead>
                                                <TableHead className="text-right w-24">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedCompany.topOpenings.map((opening) => (
                                                <TableRow key={opening.id} className="hover:bg-gray-50 border-t border-gray-100">
                                                    <TableCell className="font-medium text-gray-900">{opening.title}</TableCell>
                                                    <TableCell className="text-gray-600">{opening.department}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className={opening.type === "Full-time" ? "bg-blue-100 text-blue-700" : opening.type === "Contract" ? "bg-yellow-100 text-yellow-700" : "bg-purple-100 text-purple-700"}>
                                                            {opening.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{opening.location}</TableCell>
                                                    <TableCell className="font-medium text-gray-900">
                                                        <Users className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                                        {opening.applicationsCount}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500">
                                                        <Activity className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                                        {formatNumber(opening.viewsCount)}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500">
                                                        <Clock className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                                        {opening.daysOpen}d
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className={getPriorityBadge(opening.priority)}>
                                                            {opening.priority.charAt(0).toUpperCase() + opening.priority.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className={getStatusBadge(opening.status)}>
                                                            {opening.status.charAt(0).toUpperCase() + opening.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                            <Link href={`/recruitment/${opening.id}`}>
                                                                <ArrowRight className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Application Funnel View */}
                            {viewMode === "applications" && (
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                                        {selectedCompany.statusBreakdown.map((status, index) => (
                                            <Card key={index} className="border-0 shadow-sm bg-gray-50">
                                                <CardContent className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                                                        <span className="text-sm font-medium text-gray-700">{status.status}</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {((status.count / selectedCompany.totalApplications) * 100).toFixed(1)}%
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        {selectedCompany.statusBreakdown.map((status, index) => (
                                            <div key={index} className="flex items-center gap-4">
                                                <div className="w-32 text-sm font-medium text-gray-700">{status.status}</div>
                                                <div className="flex-1">
                                                    <Progress
                                                        value={(status.count / selectedCompany.totalApplications) * 100}
                                                        className="h-3"
                                                        style={{ "--progress-color": status.color.replace("bg-", "").replace("-500", "-500") } as React.CSSProperties}
                                                    />
                                                </div>
                                                <div className="w-20 text-right text-sm font-medium text-gray-900">{status.count}</div>
                                                <div className="w-16 text-right text-sm text-gray-500">
                                                    {((status.count / selectedCompany.totalApplications) * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-800 mb-2">
                                            <Info className="w-4 h-4" />
                                            <span className="font-medium">This Week: {selectedCompany.applicationsThisWeek} new applications</span>
                                        </div>
                                        <p className="text-sm text-blue-700">
                                            Average time to fill: {selectedCompany.avgTimeToFill} days • Hiring trend:{' '}
                                            <span className={`font-medium ${selectedCompany.hiringTrend === "up" ? "text-green-600" : selectedCompany.hiringTrend === "down" ? "text-red-600" : "text-gray-600"}`}>
                                                {getTrendIcon(selectedCompany.hiringTrend)} {selectedCompany.trendPercent > 0 ? "+" : ""}{selectedCompany.trendPercent}%
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Roles Breakdown View */}
                            {viewMode === "roles" && (
                                <div className="p-4">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead className="text-center">Openings</TableHead>
                                                    <TableHead className="text-center">Applications</TableHead>
                                                    <TableHead className="text-center">Conversion Rate</TableHead>
                                                    <TableHead className="text-center">Avg Apps/Opening</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedCompany.topRoles.map((role, index) => (
                                                    <TableRow key={index} className="hover:bg-gray-50 border-t border-gray-100">
                                                        <TableCell className="font-medium text-gray-900">{role.role}</TableCell>
                                                        <TableCell className="text-center font-medium text-gray-900">{role.openings}</TableCell>
                                                        <TableCell className="text-center text-gray-600">
                                                            <Users className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                                            {role.applications}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Progress
                                                                    value={role.conversionRate}
                                                                    className="w-24 h-2"
                                                                    style={{ "--progress-color": role.conversionRate > 10 ? "green" : role.conversionRate > 5 ? "yellow" : "red" } as React.CSSProperties}
                                                                />
                                                                <span className="text-sm font-medium text-gray-900">{role.conversionRate.toFixed(1)}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center text-gray-500">
                                                            {(role.applications / role.openings).toFixed(1)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                                <Link href={`/recruitment?role=${encodeURIComponent(role.role)}`}>
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Company Overview Accordion */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-lg font-semibold">All Companies Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Accordion type="multiple" className="w-full">
                                {companyInsights.map((company) => (
                                    <AccordionItem key={company.companyId} value={company.companyId.toString()}>
                                        <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`p-2 rounded-lg ${selectedCompanyId === company.companyId ? "bg-blue-100" : "bg-gray-100"}`}>
                                                    <Building2 className={`w-5 h-5 ${selectedCompanyId === company.companyId ? "text-blue-600" : "text-gray-600"}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900 truncate">{company.company}</p>
                                                        <Badge variant="secondary" className={company.hiringTrend === "up" ? "bg-green-100 text-green-700" : company.hiringTrend === "down" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}>
                                                            {getTrendIcon(company.hiringTrend)} {company.trendPercent > 0 ? "+" : ""}{company.trendPercent}%
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500 flex flex-wrap gap-4 mt-1">
                                                        <span><Briefcase className="w-3.5 h-3.5 inline mr-1" /> {company.totalOpenings} openings</span>
                                                        <span><Users className="w-3.5 h-3.5 inline mr-1" /> {company.totalApplications} applications</span>
                                                        <span><Clock className="w-3.5 h-3.5 inline mr-1" /> {company.avgTimeToFill} days avg fill</span>
                                                        <span><FileText className="w-3.5 h-3.5 inline mr-1" /> {company.applicationsThisWeek} this week</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4">
                                            <div className="border-t border-gray-100 pt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Openings</h4>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader className="bg-gray-50">
                                                            <TableRow>
                                                                <TableHead className="w-1/3">Position</TableHead>
                                                                <TableHead className="w-1/6">Type</TableHead>
                                                                <TableHead className="w-1/6">Applications</TableHead>
                                                                <TableHead className="w-1/6">Days Open</TableHead>
                                                                <TableHead className="w-1/6">Status</TableHead>
                                                                <TableHead className="text-right w-24">Action</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {company.topOpenings.map((opening) => (
                                                                <TableRow key={opening.id} className="hover:bg-gray-50 border-t border-gray-100">
                                                                    <TableCell className="font-medium text-gray-900">{opening.title}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="secondary" className={opening.type === "Full-time" ? "bg-blue-100 text-blue-700" : opening.type === "Contract" ? "bg-yellow-100 text-yellow-700" : "bg-purple-100 text-purple-700"}>
                                                                            {opening.type}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-gray-900">
                                                                        <Users className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                                                        {opening.applicationsCount}
                                                                    </TableCell>
                                                                    <TableCell className="text-gray-500">
                                                                        <Clock className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                                                        {opening.daysOpen}d
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="secondary" className={getStatusBadge(opening.status)}>
                                                                            {opening.status.charAt(0).toUpperCase() + opening.status.slice(1)}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                                            <Link href={`/recruitment/${opening.id}`}>
                                                                                <ArrowRight className="w-4 h-4" />
                                                                            </Link>
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Shipping Partnerships (1/3 width) */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="p-4 pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="text-lg font-semibold">Shipping Partnerships</CardTitle>
                                    <p className="text-sm text-gray-500">
                                        {selectedPartner.currentPartners}/{selectedPartner.partnersNeeded} partners • {selectedPartner.applicationsReceived} applications
                                    </p>
                                </div>
                                <select
                                    value={selectedPartnerId ?? ""}
                                    onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                >
                                    {shippingPartnerInsights.map((partner) => (
                                        <option key={partner.companyId} value={partner.companyId}>
                                            {partner.company} ({partner.currentPartners}/{partner.partnersNeeded})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {shippingPartnerInsights.map((partner) => (
                                    <div
                                        key={partner.companyId}
                                        className={`p-4 hover:bg-gray-50 transition-colors ${selectedPartnerId === partner.companyId ? "bg-blue-50" : ""}`}
                                        onClick={() => setSelectedPartnerId(partner.companyId)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${selectedPartnerId === partner.companyId ? "bg-blue-100" : "bg-gray-100"}`}>
                                                    <Ship className={`w-4 h-4 ${selectedPartnerId === partner.companyId ? "text-blue-600" : "text-gray-600"}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{partner.company}</p>
                                                    <Badge variant="secondary" className={`text-xs ${partner.companyType === "Retailer" ? "bg-blue-100 text-blue-700" : partner.companyType === "E-commerce" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                                                        {partner.companyType}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {getHealthBadge(partner.partnershipHealth).icon}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Monthly Volume</p>
                                                <p className="font-medium text-gray-900">{partner.monthlyVolume}</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Partners</p>
                                                <p className="font-medium text-gray-900">{partner.currentPartners}/{partner.partnersNeeded}</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Applications</p>
                                                <p className="font-medium text-gray-900">{partner.applicationsReceived}</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Approved</p>
                                                <p className="font-medium text-gray-900">{partner.approvedPartners}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {partner.shippingMethods.map((method, i) => (
                                                <Badge key={i} variant="outline" className="text-xs h-5 px-2">
                                                    {method}
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                            <span>Deadline: <span className="font-medium text-gray-700">{formatDate(partner.enrollmentDeadline)}</span></span>
                                            <Badge variant="secondary" className={getHealthBadge(partner.partnershipHealth).class}>
                                                {getHealthBadge(partner.partnershipHealth).label}
                                            </Badge>
                                        </div>

                                        {selectedPartnerId === partner.companyId && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-slide-down">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500">Pending Review</p>
                                                        <p className="font-medium text-gray-900">{partner.pendingReview}</p>
                                                    </div>
                                                    <div className="p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500">Avg Response</p>
                                                        <p className="font-medium text-gray-900">{partner.avgResponseTime}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600"><strong>Requirements:</strong> {partner.requirements}</p>
                                                <Button variant="outline" size="sm" asChild className="w-full">
                                                    <Link href={`/shipping-partners/enroll?company=${partner.company}`} onClick={(e) => e.stopPropagation()}>
                                                        Manage Partnership
                                                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Insights */}
                    <Card className="border-0 shadow-sm p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg font-semibold">Key Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-0 pt-2">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-800">Hiring Accelerating</p>
                                        <p className="text-sm text-green-700">3 companies showing 15%+ growth in openings this month</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-amber-800">Partnership Gaps</p>
                                        <p className="text-sm text-amber-700">2 shipping partners need attention - below target partner count</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Star className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-blue-800">High Conversion Roles</p>
                                        <p className="text-sm text-blue-700">DevOps Engineer (15.1%) and Supply Chain Manager (14.2%) leading</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-purple-800">Fastest Time-to-Fill</p>
                                        <p className="text-sm text-purple-700">GlobalLogistics at 14 days avg - 5 days faster than average</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-0 pt-2">
                            <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                                <Link href="/recruitment">
                                    <Briefcase className="w-4 h-4" />
                                    Browse All Jobs
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                                <Link href="/shipping-partners">
                                    <Ship className="w-4 h-4" />
                                    Browse Shipping Partners
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                                <Link href="/signup">
                                    <Users className="w-4 h-4" />
                                    Create Account
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                                <Link href="/recruitment?view=analytics">
                                    <BarChart3 className="w-4 h-4" />
                                    View Full Analytics
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <style jsx>{`
        .animate-slide-down {
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}