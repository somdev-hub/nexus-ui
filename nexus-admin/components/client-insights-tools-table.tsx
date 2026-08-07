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
import { ToolInsightsData } from "@/types/client-insights";

interface ToolsTableProps {
    data: ToolInsightsData[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    isLoading?: boolean;
}

export function ToolsTable({ data, pagination, onPageChange, onPageSizeChange, isLoading }: ToolsTableProps) {
    const columns = [
        { key: "toolName", header: "Tool Name" },
        { key: "totalHits", header: "Total Hits" },
        { key: "successHits", header: "Success Hits" },
        { key: "failureHits", header: "Failure Hits" },
        { key: "mostFailureCode", header: "Most Failure Code" },
        { key: "successRatio", header: "Success Ratio" },
    ];

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className="w-[150px]">{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                {columns.map((col) => (
                                    <TableCell key={col.key}>
                                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                                    </TableCell>
                                ))}
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
                <div className="text-lg font-medium mb-2">No tool data found</div>
                <div className="text-sm">No tools configured for this client</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className="w-[150px]">{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((tool) => (
                            <TableRow key={tool.toolName}>
                                <TableCell className="font-medium">{tool.toolName}</TableCell>
                                <TableCell>{tool.totalHits.toLocaleString()}</TableCell>
                                <TableCell className="text-green-600">{tool.successHits.toLocaleString()}</TableCell>
                                <TableCell className="text-red-600">{tool.failureHits.toLocaleString()}</TableCell>
                                <TableCell>
                                    {tool.mostFailureCode ? (
                                        <Badge variant="destructive">{tool.mostFailureCode}</Badge>
                                    ) : (
                                        <Badge variant="secondary">None</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${tool.successRatio}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-16 text-right">
                                            {tool.successRatio.toFixed(1)}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
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

            <div className="text-sm text-muted-foreground text-center">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} tools
            </div>
        </div>
    );
}