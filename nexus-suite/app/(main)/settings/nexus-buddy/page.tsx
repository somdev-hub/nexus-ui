"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import { useTables } from "@/hooks/use-tables";
import { CentralizedDataTable } from "@/components/centralized-data-table";
import { getNexusBuddyClientConfigs, createNexusBuddyClientConfig, getNexusBuddyActiveClientConfigs, getNexusBuddyToolsConfigs, seedNexusCoreAiTools } from "@/lib/nexus-buddy-service";
import type { NexusBuddyClientConfig, NexusBuddyToolsConfig } from "@/types/nexus-buddy";
import { ColumnDef } from "@tanstack/react-table";
import { RefreshCw, Sparkles, Terminal, Bug, Loader2, Plus } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

const PAGE_SIZE = 20;

export default function NexusBuddySettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [clientConfigs, setClientConfigs] = useState<NexusBuddyClientConfig[]>([]);
    const [activeClientConfigs, setClientConfigss] = useState<NexusBuddyClientConfig[]>([]);
    const [activeToolsConfigs, setToolsConfigs] = useState<NexusBuddyToolsConfig[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const [testMode, setTestMode] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // Fetch configs
    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const [allResponse, activeResponse, toolsResponse] = await Promise.all([
                getNexusBuddyClientConfigs(pageIndex, PAGE_SIZE),
                getNexusBuddyActiveClientConfigs(0, 100),
                getNexusBuddyToolsConfigs(0, 100),
            ]);
            setClientConfigs(allResponse.content || []);
            setClientConfigss(activeResponse.content || []);
            setToolsConfigs(toolsResponse.content || []);
            setTotalPages(allResponse.totalPages || 0);
        } catch (err: unknown) {
            toast({
                title: "Failed to load configurations",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [pageIndex, toast]);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const result = await seedNexusCoreAiTools();
            toast({
                title: "Seeding Complete",
                description: `Created ${result.toolsCreated} tools, ${result.paramsCreated} params. Skipped ${result.toolsSkipped} existing tools.`,
                variant: "success",
            });
            loadConfigs();
        } catch (err: unknown) {
            toast({
                title: "Seeding Failed",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setSeeding(false);
        }
    };

    useEffect(() => {
        loadConfigs();
    }, [loadConfigs]);

    // Columns for client configs table
    const clientColumns: ColumnDef<NexusBuddyClientConfig>[] = [
        {
            accessorKey: "clientName",
            header: "Name",
        },
        {
            accessorKey: "connectionUrl",
            header: "Connection URL",
            cell: ({ row }) => (
                <code className="text-xs bg-muted px-2 py-1 rounded">
                    {row.original.connectionUrl}
                </code>
            ),
        },
        {
            accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.isActive ? "default" : "destructive"}>
                    {row.original.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
    ];

    // Columns for tools table
    const toolsColumns: ColumnDef<NexusBuddyToolsConfig>[] = [
        {
            accessorKey: "toolName",
            header: "Tool Name",
        },
        {
            accessorKey: "endpoint",
            header: "Endpoint",
            cell: ({ row }) => (
                <code className="text-xs bg-muted px-2 py-1 rounded">
                    {row.original.endpoint}
                </code>
            ),
        },
        {
            accessorKey: "httpMethod",
            header: "Method",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.httpMethod}
                </Badge>
            ),
        },
        {
            accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.isActive ? "default" : "destructive"}>
                    {row.original.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
    ];

    // Use tables hook for data grid
    const clientTable = useTables({
        data: clientConfigs,
        columns: clientColumns,
        pageSize: PAGE_SIZE,
        pageIndex,
        pageCount: totalPages,
        manualPagination: true,
        onPaginationChange: (updater) => {
            const current = { pageIndex, pageSize: PAGE_SIZE };
            const next = typeof updater === 'function' 
                ? (updater as (old: typeof current) => typeof current)(current) 
                : updater;
            setPageIndex(next.pageIndex);
        },
    });

    const toolsTable = useTables({
        data: activeToolsConfigs,
        columns: toolsColumns,
        pageSize: PAGE_SIZE,
    });

    if (loading) {
        return (
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Nexus Buddy</h1>
                    <p className="text-muted-foreground">
                        Configure AI-powered assistant with tool integration
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
                        {seeding ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        {seeding ? "Seeding..." : "Seed AI Tools"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadConfigs}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeClientConfigs.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {clientConfigs.length} total configured
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Tools</CardTitle>
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeToolsConfigs.filter(t => t.isActive).length}</div>
                        <p className="text-xs text-muted-foreground">
                            Available for AI assistant
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Bug className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Ready</div>
                        <p className="text-xs text-muted-foreground">
                            AI assistant available
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Test Mode Toggle */}
            <Card>
                <CardHeader>
                    <CardTitle>Development Settings</CardTitle>
                    <CardDescription>
                        Control how the AI assistant behaves
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Test Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable streaming with dummy logs for development
                            </p>
                        </div>
                        <Button
                            variant={testMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTestMode(!testMode)}
                        >
                            {testMode ? (
                                <>
                                    <Terminal className="mr-2 h-4 w-4" />
                                    Test Mode: ON
                                </>
                            ) : (
                                <>
                                    <Bug className="mr-2 h-4 w-4" />
                                    Test Mode: OFF
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Client Configs Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Client Configurations</CardTitle>
                    <CardDescription>
                        API connections that tools can call on behalf of users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CentralizedDataTable
                        table={clientTable}
                        emptyMessage="No client configurations found"
                    />
                </CardContent>
            </Card>

            {/* Tools Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Tools</CardTitle>
                    <CardDescription>
                        Functions the AI assistant can call
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CentralizedDataTable
                        table={toolsTable}
                        emptyMessage="No tools configured"
                    />
                </CardContent>
            </Card>
        </div>
    );
}