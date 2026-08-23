"use client";

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
import { useEffect, useState } from "react";
import { CompanyInsightDto, DashboardStatsDto, TopOpeningDto, TopRoleDto, StatusBreakdownDto } from "@/types";
import { getCompanyInsights, getDashboardStats } from "@/lib/auth-service";

interface DashboardStats {
    label: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

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

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Building2,
    Briefcase,
    FileText,
    Clock,
    Users,
    Users2,
    Ship,
    BarChart3,
    TrendingUp,
    Activity,
    Flag,
    Star,
    CheckCircle,
    AlertTriangle,
    Info,
};

export default function Home() {
    const [companyInsights, setCompanyInsights] = useState<CompanyInsightDto[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"openings" | "applications" | "roles">("openings");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [insightsRes, statsRes] = await Promise.all([
                    getCompanyInsights(),
                    getDashboardStats(),
                ]);

                const insightsData = insightsRes.data;
                const statsData = statsRes.data;

                setCompanyInsights(insightsData);
                setDashboardStats(statsData.map((stat: DashboardStatsDto) => ({
                    ...stat,
                    icon: iconMap[stat.icon] || Building2,
                })));

                if (insightsData.length > 0 && selectedCompanyId === null) {
                    setSelectedCompanyId(insightsData[0].orgId);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCompanyId]);

    const selectedCompany = companyInsights.find(c => c.orgId === selectedCompanyId) || companyInsights[0];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Recruitment insights & analytics</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/recruitment">
                            <Briefcase className="w-4 h-4 mr-2" />
                            All Jobs
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
                                    {selectedCompany && (
                                        <p className="text-sm text-gray-500">
                                            {selectedCompany.totalOpenings} open positions • {selectedCompany.totalApplications} total applications • {selectedCompany.avgTimeToFill} days avg time to fill
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={selectedCompanyId ?? ""}
                                        onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {companyInsights.map((company) => (
                                            <option key={company.orgId} value={company.orgId}>
                                                {company.orgName} ({company.totalOpenings} openings, {company.totalApplications} apps)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* View Mode Tabs */}
                            <div className="border-b border-gray-100">
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
                            {viewMode === "openings" && selectedCompany && (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="w-1/4">Position</TableHead>
                                                <TableHead className="w-1/6">Department</TableHead>
                                                <TableHead className="w-1/6">Type</TableHead>
                                                <TableHead className="w-1/6">Location</TableHead>
                                                <TableHead className="w-1/8">Applications</TableHead>
                                                <TableHead className="w-1/8">Days Open</TableHead>
                                                <TableHead className="w-1/8">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedCompany.topOpenings.map((opening) => (
                                                <TableRow key={opening.id}>
                                                    <TableCell className="font-medium">{opening.title}</TableCell>
                                                    <TableCell>{opening.department}</TableCell>
                                                    <TableCell>{opening.type}</TableCell>
                                                    <TableCell>{opening.location}</TableCell>
                                                    <TableCell>{formatNumber(opening.applicationsCount)}</TableCell>
                                                    <TableCell>{opening.daysOpen} days</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className={getStatusBadge(opening.status)}>
                                                            {opening.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Application Funnel View */}
                            {viewMode === "applications" && selectedCompany && (
                                <div className="p-4 space-y-4">
                                    {selectedCompany.statusBreakdown.map((status, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{status.status}</span>
                                                <span className="text-gray-500">{status.count}</span>
                                            </div>
                                            <Progress value={(status.count / selectedCompany.totalApplications) * 100} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Roles Breakdown View */}
                            {viewMode === "roles" && selectedCompany && (
                                <div className="overflow-x-auto p-4">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Openings</TableHead>
                                                <TableHead>Applications</TableHead>
                                                <TableHead>Conversion Rate</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedCompany.topRoles.map((role, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{role.role}</TableCell>
                                                    <TableCell>{role.openings}</TableCell>
                                                    <TableCell>{formatNumber(role.applications)}</TableCell>
                                                    <TableCell>{role.conversionRate.toFixed(1)}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Insights */}
                    <Card className="border-0 shadow-sm p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg font-semibold">Key Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-0 pt-2">
                            {companyInsights.map((company, index) => (
                                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <TrendingUp className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-blue-800">{company.orgName}</p>
                                            <p className="text-sm text-blue-700">
                                                {company.hiringTrend === "up" ? "Hiring accelerating" : company.hiringTrend === "down" ? "Hiring slowing" : "Hiring stable"} ({company.trendPercent > 0 ? "+" : ""}{company.trendPercent}% vs last month)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Shipping Partners (placeholder) */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm p-4">
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg font-semibold">Shipping Partners</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">Partnership enrollment & health</p>
                        </CardHeader>
                        <CardContent className="p-0 pt-2 space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <Ship className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Shipping partner integration coming soon</p>
                                <p className="text-sm text-gray-500 mt-1">This section will display partnership enrollment data</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}