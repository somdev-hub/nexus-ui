"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, FilterIcon, XIcon, DownloadIcon } from "lucide-react";
import { format } from "date-fns";
import { LogEntry, ClientInsightsFilters } from "@/types/client-insights";

interface LogsTableProps {
    data: LogEntry[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    filters: ClientInsightsFilters;
    onFiltersChange: (filters: ClientInsightsFilters) => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    isLoading?: boolean;
    availableTools: string[];
    availableStatusCodes: number[];
    availableHttpMethods: string[];
}

export function LogsTable({
    data,
    pagination,
    filters,
    onFiltersChange,
    onPageChange,
    onPageSizeChange,
    isLoading,
    availableTools,
    availableStatusCodes,
    availableHttpMethods,
}: LogsTableProps) {
    const [showFilters, setShowFilters] = React.useState(false);
    const [localFilters, setLocalFilters] = React.useState(filters);
    const [openRequestPopover, setOpenRequestPopover] = React.useState<string | null>(null);
    const [openResponsePopover, setOpenResponsePopover] = React.useState<string | null>(null);

    const handleFilterChange = (key: keyof ClientInsightsFilters, value: any) => {
        const newFilters = { ...localFilters, [key]: value, page: 0 }; // Reset to page 0 (0-based for API)
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters: ClientInsightsFilters = {
            page: 0, // 0-based for API
            pageSize: localFilters.pageSize,
        };
        setLocalFilters(clearedFilters);
        onFiltersChange(clearedFilters);
    };

    const hasActiveFilters = Object.entries(localFilters).some(
        ([key, value]) => key !== "page" && key !== "pageSize" && value !== undefined && value !== null && value !== ""
    );

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy HH:mm:ss");
        } catch {
            return dateString;
        }
    };

    const getStatusBadgeVariant = (statusCode: number) => {
        if (statusCode >= 200 && statusCode < 300) return "default";
        if (statusCode >= 400 && statusCode < 500) return "destructive";
        if (statusCode >= 500) return "destructive";
        return "secondary";
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Tool Name</TableHead>
                            <TableHead className="w-[200px]">Request</TableHead>
                            <TableHead className="w-[200px]">Response</TableHead>
                            <TableHead className="w-[100px]">Status Code</TableHead>
                            <TableHead className="w-[100px]">HTTP Method</TableHead>
                            <TableHead className="w-[180px]">Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>
                                <TableCell><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>
                                <TableCell><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>
                                <TableCell><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>
                                <TableCell><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>
                                <TableCell><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="text-lg font-medium mb-2">No logs found</div>
                <div className="text-sm">Try adjusting your filters or time range</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FilterIcon className="h-4 w-4 mr-1" />
                        Filters {hasActiveFilters && <Badge variant="secondary" className="ml-1">Active</Badge>}
                    </Button>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                            <XIcon className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <div className="flex flex-wrap gap-4 w-full sm:w-auto flex-1">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="tool-filter" className="text-sm">Tool:</Label>
                            <Select value={localFilters.toolName || ""} onValueChange={(value) => handleFilterChange("toolName", value || undefined)}>
                                <SelectTrigger id="tool-filter" className="w-[180px]">
                                    <SelectValue placeholder="All tools" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All tools</SelectItem>
                                    {availableTools.map((tool) => (
                                        <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="status-filter" className="text-sm">Status:</Label>
                            <Select value={localFilters.success !== undefined ? String(localFilters.success) : ""} onValueChange={(value) => handleFilterChange("success", value === "" ? undefined : value === "true")}>
                                <SelectTrigger id="status-filter" className="w-[150px]">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All</SelectItem>
                                    <SelectItem value="true">Success</SelectItem>
                                    <SelectItem value="false">Failure</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="status-code-filter" className="text-sm">Status Code:</Label>
                            <Select value={localFilters.statusCode != null ? String(localFilters.statusCode) : ""} onValueChange={(value: string | null) => handleFilterChange("statusCode", value === "" || value === null ? undefined : parseInt(value))}>
                                <SelectTrigger id="status-code-filter" className="w-[130px]">
                                    <SelectValue placeholder="All codes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All codes</SelectItem>
                                    {availableStatusCodes.map((code) => (
                                        <SelectItem key={code} value={code.toString()}>{code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="method-filter" className="text-sm">Method:</Label>
                            <Select value={localFilters.httpMethod || ""} onValueChange={(value) => handleFilterChange("httpMethod", value || undefined)}>
                                <SelectTrigger id="method-filter" className="w-[120px]">
                                    <SelectValue placeholder="All methods" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All methods</SelectItem>
                                    {availableHttpMethods.map((method) => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="from-date" className="text-sm">From:</Label>
                            <Popover>
                                <PopoverTrigger>
                                    <Button variant="outline" className="w-[180px] h-9" size="sm">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        {localFilters.fromDate ? format(new Date(localFilters.fromDate), "MMM dd, yyyy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <input
                                        type="date"
                                        id="from-date"
                                        className="p-2 border rounded"
                                        value={localFilters.fromDate ? format(new Date(localFilters.fromDate), "yyyy-MM-dd") : ""}
                                        onChange={(e) => handleFilterChange("fromDate", e.target.value || undefined)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="to-date" className="text-sm">To:</Label>
                            <Popover>
                                <PopoverTrigger>
                                    <Button variant="outline" className="w-[180px] h-9" size="sm">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        {localFilters.toDate ? format(new Date(localFilters.toDate), "MMM dd, yyyy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <input
                                        type="date"
                                        id="to-date"
                                        className="p-2 border rounded"
                                        value={localFilters.toDate ? format(new Date(localFilters.toDate), "yyyy-MM-dd") : ""}
                                        onChange={(e) => handleFilterChange("toDate", e.target.value || undefined)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Tool Name</TableHead>
                            <TableHead className="w-[200px]">Request</TableHead>
                            <TableHead className="w-[200px]">Response</TableHead>
                            <TableHead className="w-[100px]">Status Code</TableHead>
                            <TableHead className="w-[100px]">HTTP Method</TableHead>
                            <TableHead className="w-[180px]">Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((log, index) => {
                            const rowId = log.id || `log-${index}`;
                            return (
                                <TableRow key={rowId}>
                                    <TableCell className="font-medium">{log.toolName}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <div className="max-w-[200px] truncate font-mono text-xs" title={log.request}>
                                                {log.request}
                                            </div>
                                            <Popover key={`request-popover-${rowId}`} open={openRequestPopover === rowId} onOpenChange={(open) => setOpenRequestPopover(open ? rowId : null)}>
                                                <PopoverTrigger
                                                    render={(props) => (
                                                        <Button {...props} variant="ghost" size="icon" className="h-6 w-6 p-0">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Button>
                                                    )}
                                                />
                                                <PopoverContent className="w-[500px] max-h-[400px] p-4">
                                                    <div className="font-mono text-xs bg-muted p-3 rounded whitespace-pre-wrap overflow-auto max-h-[350px]">
                                                        {log.request}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <div className="max-w-[200px] truncate font-mono text-xs" title={log.response}>
                                                {log.response}
                                            </div>
                                            <Popover key={`response-popover-${rowId}`} open={openResponsePopover === rowId} onOpenChange={(open) => setOpenResponsePopover(open ? rowId : null)}>
                                                <PopoverTrigger
                                                    render={(props) => (
                                                        <Button {...props} variant="ghost" size="icon" className="h-6 w-6 p-0">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Button>
                                                    )}
                                                />
                                                <PopoverContent className="w-[500px] max-h-[400px] p-4">
                                                    <div className="font-mono text-xs bg-muted p-3 rounded whitespace-pre-wrap overflow-auto max-h-[350px]">
                                                        {log.response}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(log.statusCode)}>
                                            {log.statusCode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.httpMethod}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{formatDate(log.createdAt)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.page > 1) onPageChange(pagination.page - 1);
                                }}
                                disabled={pagination.page <= 1}
                            />
                        </PaginationItem>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                            let pageNum: number;
                            if (pagination.totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                                pageNum = i + 1;
                            } else if (pagination.page >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i;
                            } else {
                                pageNum = pagination.page - 2 + i;
                            }
                            return (
                                <PaginationItem key={pageNum}>
                                    <PaginationLink
                                        href="#"
                                        isActive={pagination.page === pageNum}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onPageChange(pageNum);
                                        }}
                                    >
                                        {pageNum}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.page < pagination.totalPages) onPageChange(pagination.page + 1);
                                }}
                                disabled={pagination.page >= pagination.totalPages}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="page-size" className="text-sm font-medium">Rows per page:</Label>
                        <Select value={`${pagination.pageSize}`} onValueChange={(value) => onPageSizeChange(Number(value))}>
                            <SelectTrigger id="page-size" className="w-[80px]">
                                <SelectValue placeholder={pagination.pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} logs
                    </div>
                </div>
            </div>
        </div>
    );
}