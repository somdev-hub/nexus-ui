"use client";

import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Server, Code, Database, ChevronDown, ChevronUp } from "lucide-react";
import { NexusBuddyConfigurationDialog } from "@/components/nexus-buddy-configuration-dialog";
import {
    getNexusBuddyClientConfigs,
    getNexusBuddyActiveClientConfigs,
    getNexusBuddyToolsConfigs,
    getNexusBuddyActiveToolsConfigs,
    getNexusBuddyToolsConfigsByClientConfigId,
    getNexusBuddyToolsParamConfigs,
    getNexusBuddyActiveToolsParamConfigs,
    getNexusBuddyToolsParamConfigsByToolsConfigId,
} from "@/lib/auth-service";
import type {
    NexusBuddyClientConfig,
    NexusBuddyToolsConfig,
    NexusBuddyToolsParamConfig,
} from "@/types/nexus-buddy";

export default function NexusBuddyPage() {
    const [activeTab, setActiveTab] = React.useState("overview");
    
    // Client Configs
    const [clientConfigs, setClientConfigs] = React.useState<NexusBuddyClientConfig[]>([]);
    const [activeClientConfigs, setActiveClientConfigs] = React.useState<NexusBuddyClientConfig[]>([]);
    const [loadingClientConfigs, setLoadingClientConfigs] = React.useState(false);
    const [clientConfigSort, setClientConfigSort] = React.useState<{ key: keyof NexusBuddyClientConfig; direction: "asc" | "desc" } | null>(null);
    
    // Tools Configs
    const [toolsConfigs, setToolsConfigs] = React.useState<NexusBuddyToolsConfig[]>([]);
    const [activeToolsConfigs, setActiveToolsConfigs] = React.useState<NexusBuddyToolsConfig[]>([]);
    const [loadingToolsConfigs, setLoadingToolsConfigs] = React.useState(false);
    const [toolsConfigSort, setToolsConfigSort] = React.useState<{ key: keyof NexusBuddyToolsConfig; direction: "asc" | "desc" } | null>(null);
    const [selectedClientForTools, setSelectedClientForTools] = React.useState<number | null>(null);
    
    // Param Configs
    const [toolsParamConfigs, setToolsParamConfigs] = React.useState<NexusBuddyToolsParamConfig[]>([]);
    const [activeToolsParamConfigs, setActiveToolsParamConfigs] = React.useState<NexusBuddyToolsParamConfig[]>([]);
    const [loadingToolsParamConfigs, setLoadingToolsParamConfigs] = React.useState(false);
    const [paramConfigSort, setParamConfigSort] = React.useState<{ key: keyof NexusBuddyToolsParamConfig; direction: "asc" | "desc" } | null>(null);
    const [selectedToolForParams, setSelectedToolForParams] = React.useState<number | null>(null);

    // Dialog
    const [dialogOpen, setDialogOpen] = React.useState(false);

    // Sort handlers
    const handleClientConfigSort = (key: keyof NexusBuddyClientConfig) => {
        setClientConfigSort(prev => ({
            key,
            direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    const handleToolsConfigSort = (key: keyof NexusBuddyToolsConfig) => {
        setToolsConfigSort(prev => ({
            key,
            direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    const handleParamConfigSort = (key: keyof NexusBuddyToolsParamConfig) => {
        setParamConfigSort(prev => ({
            key,
            direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    const getSortedClientConfigs = () => {
        if (!clientConfigSort) return clientConfigs;
        return [...clientConfigs].sort((a, b) => {
            const aVal = a[clientConfigSort.key];
            const bVal = b[clientConfigSort.key];
            if (aVal === undefined || bVal === undefined) return 0;
            const comparison = String(aVal).localeCompare(String(bVal));
            return clientConfigSort.direction === "asc" ? comparison : -comparison;
        });
    };

    const getSortedToolsConfigs = () => {
        if (!toolsConfigSort) return toolsConfigs;
        return [...toolsConfigs].sort((a, b) => {
            const aVal = a[toolsConfigSort.key];
            const bVal = b[toolsConfigSort.key];
            if (aVal === undefined || bVal === undefined) return 0;
            const comparison = String(aVal).localeCompare(String(bVal));
            return toolsConfigSort.direction === "asc" ? comparison : -comparison;
        });
    };

    const getSortedParamConfigs = () => {
        if (!paramConfigSort) return toolsParamConfigs;
        return [...toolsParamConfigs].sort((a, b) => {
            const aVal = a[paramConfigSort.key];
            const bVal = b[paramConfigSort.key];
            if (aVal === undefined || bVal === undefined) return 0;
            const comparison = String(aVal).localeCompare(String(bVal));
            return paramConfigSort.direction === "asc" ? comparison : -comparison;
        });
    };

    // Load functions
        const loadClientConfigs = useCallback(async () => {
        setLoadingClientConfigs(true);
        try {
            const [allResponse, activeResponse] = await Promise.all([
                getNexusBuddyClientConfigs(),
                getNexusBuddyActiveClientConfigs(),
            ]);
            setClientConfigs(allResponse.content || []);
            setActiveClientConfigs(activeResponse || []);
        } catch (error) {
            console.error("Failed to load client configs:", error);
        } finally {
            setLoadingClientConfigs(false);
        }
        }, []);

    const loadToolsConfigs = useCallback(async (clientConfigId?: number) => {
        setLoadingToolsConfigs(true);
        try {
            let response;
            if (clientConfigId) {
                const byClient = await getNexusBuddyToolsConfigsByClientConfigId(clientConfigId);
                response = { content: byClient };
            } else {
                response = await getNexusBuddyToolsConfigs();
            }
            setToolsConfigs(response.content || []);
            
            // Also load active tools configs for dropdowns
            const activeResponse = await getNexusBuddyActiveToolsConfigs();
            setActiveToolsConfigs(activeResponse || []);
        } catch (error) {
            console.error("Failed to load tools configs:", error);
        } finally {
            setLoadingToolsConfigs(false);
        }
        }, []);

        const loadToolsParamConfigs = useCallback(async (toolsConfigId?: number) => {
        setLoadingToolsParamConfigs(true);
        try {
            let response;
            if (toolsConfigId) {
                const byTool = await getNexusBuddyToolsParamConfigsByToolsConfigId(toolsConfigId);
                response = { content: byTool };
            } else {
                response = await getNexusBuddyToolsParamConfigs();
            }
            setToolsParamConfigs(response.content || []);
            
            // Also load active param configs for dropdowns
            const activeResponse = await getNexusBuddyActiveToolsParamConfigs();
            setActiveToolsParamConfigs(activeResponse || []);
        } catch (error) {
            console.error("Failed to load tools param configs:", error);
        } finally {
            setLoadingToolsParamConfigs(false);
        }
        }, []);

    // Load initial data
    React.useEffect(() => {
            setTimeout(() => {
                loadClientConfigs();
                loadToolsConfigs();
                loadToolsParamConfigs();
            }, 0);
            }, [loadClientConfigs, loadToolsConfigs, loadToolsParamConfigs]);

        // Reload tools configs when client filter changes
        React.useEffect(() => {
            setTimeout(() => {
                loadToolsConfigs(selectedClientForTools || undefined);
            }, 0);
            }, [selectedClientForTools, loadToolsConfigs]);

        // Reload param configs when tool filter changes
        React.useEffect(() => {
            setTimeout(() => {
                loadToolsParamConfigs(selectedToolForParams || undefined);
            }, 0);
            }, [selectedToolForParams, loadToolsParamConfigs]);

    const handleRefresh = () => {
        loadClientConfigs();
        loadToolsConfigs(selectedClientForTools || undefined);
        loadToolsParamConfigs(selectedToolForParams || undefined);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">NexusBuddy Configuration</h1>
                    <p className="text-muted-foreground">Manage client configs, tools, and parameter configurations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingClientConfigs || loadingToolsConfigs || loadingToolsParamConfigs}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loadingClientConfigs || loadingToolsConfigs || loadingToolsParamConfigs ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Server className="mr-2 h-4 w-4" />
                        Configure
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4 gap-2">
                                <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Client Configs</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                                <CardContent className="p-0">
                        <div className="text-2xl font-bold">{clientConfigs.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeClientConfigs.length} active
                        </p>
                    </CardContent>
                </Card>
                            <Card className="p-4 gap-2">
                                <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tools Configs</CardTitle>
                        <Code className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                                <CardContent className="p-0">
                        <div className="text-2xl font-bold">{toolsConfigs.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeToolsConfigs.length} active
                        </p>
                    </CardContent>
                </Card>
                            <Card className="p-4 gap-2">
                                <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Param Configs</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                                <CardContent className="p-0">
                        <div className="text-2xl font-bold">{toolsParamConfigs.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeToolsParamConfigs.length} active
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="clients">Client Configs</TabsTrigger>
                    <TabsTrigger value="tools">Tools Configs</TabsTrigger>
                    <TabsTrigger value="params">Param Configs</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Client Configs Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    Client Configurations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {clientConfigs.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No client configs</p>
                                    ) : (
                                        clientConfigs.map((config) => (
                                            <div key={config.clientConfigId} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{config.clientName}</span>
                                                    <Badge variant={config.isActive ? "default" : "destructive"}>
                                                        {config.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono truncate">{config.connectionUrl}</p>
                                                                                <p className="text-xs text-muted-foreground">Health Check: {config.healthCheckPath}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tools Configs Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    Tools Configurations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {toolsConfigs.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No tools configs</p>
                                    ) : (
                                        toolsConfigs.map((config) => (
                                            <div key={config.toolsConfigId} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{config.toolName}</span>
                                                    <Badge variant="secondary">{config.httpMethod}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono truncate">{config.endpoint}</p>
                                                <p className="text-xs text-muted-foreground">Client: {config.clientConfig?.clientName || config.clientConfigId}</p>
                                                <Badge variant={config.isActive ? "default" : "destructive"} className="mt-1">
                                                    {config.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Param Configs Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Parameter Configurations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {toolsParamConfigs.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No param configs</p>
                                    ) : (
                                        toolsParamConfigs.map((config) => (
                                            <div key={config.toolsParamConfigId} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{config.paramName}</span>
                                                    <Badge variant="secondary">{config.paramType}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Type: {config.dataType} | Required: {config.isRequired ? "Yes" : "No"}</p>
                                                <p className="text-xs text-muted-foreground">Tool: {config.toolsConfig?.toolName || config.toolsConfigId}</p>
                                                <Badge variant={config.isActive ? "default" : "destructive"} className="mt-1">
                                                    {config.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Client Configs Tab */}
                <TabsContent value="clients" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Client Configurations</h2>
                        <Button variant="outline" size="sm" onClick={loadClientConfigs} disabled={loadingClientConfigs}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loadingClientConfigs ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="cursor-pointer" onClick={() => handleClientConfigSort("clientConfigId")}>
                                                ID {clientConfigSort?.key === "clientConfigId" && (clientConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleClientConfigSort("clientName")}>
                                                Client Name {clientConfigSort?.key === "clientName" && (clientConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleClientConfigSort("connectionUrl")}>
                                                Connection URL {clientConfigSort?.key === "connectionUrl" && (clientConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleClientConfigSort("healthCheckPath")}>
                                                                                            Health Check {clientConfigSort?.key === "healthCheckPath" && (clientConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleClientConfigSort("isActive")}>
                                                Status {clientConfigSort?.key === "isActive" && (clientConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleClientConfigSort("createdAt")}>
                                                Created {clientConfigSort?.key === "createdAt" && (clientConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleClientConfigSort("updatedAt")}>
                                                Updated {clientConfigSort?.key === "updatedAt" && (clientConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingClientConfigs ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : getSortedClientConfigs().length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">No client configs found</TableCell>
                                            </TableRow>
                                        ) : (
                                            getSortedClientConfigs().map((config) => (
                                                <TableRow key={config.clientConfigId}>
                                                    <TableCell>{config.clientConfigId}</TableCell>
                                                    <TableCell className="font-medium">{config.clientName}</TableCell>
                                                    <TableCell className="font-mono text-sm truncate max-w-[250px]">{config.connectionUrl}</TableCell>
                                                                                                    <TableCell className="font-mono text-sm truncate max-w-[200px]">{config.healthCheckPath}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={config.isActive ? "default" : "destructive"}>
                                                            {config.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{new Date(config.createdAt).toLocaleString()}</TableCell>
                                                    <TableCell className="text-sm">{new Date(config.updatedAt).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tools Configs Tab */}
                <TabsContent value="tools" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Tools Configurations</h2>
                        <div className="flex items-center gap-2">
                            <Select value={selectedClientForTools?.toString() || ""} onValueChange={(v) => setSelectedClientForTools(v ? parseInt(v) : null)}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filter by client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Clients</SelectItem>
                                    {activeClientConfigs.map(c => (
                                        <SelectItem key={c.clientConfigId} value={c.clientConfigId.toString()}>{c.clientName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => loadToolsConfigs(selectedClientForTools || undefined)} disabled={loadingToolsConfigs}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${loadingToolsConfigs ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="cursor-pointer" onClick={() => handleToolsConfigSort("toolsConfigId")}>
                                                ID {toolsConfigSort?.key === "toolsConfigId" && (toolsConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleToolsConfigSort("toolName")}>
                                                Tool Name {toolsConfigSort?.key === "toolName" && (toolsConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleToolsConfigSort("endpoint")}>
                                                Endpoint {toolsConfigSort?.key === "endpoint" && (toolsConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleToolsConfigSort("httpMethod")}>
                                                Method {toolsConfigSort?.key === "httpMethod" && (toolsConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleToolsConfigSort("isActive")}>
                                                Status {toolsConfigSort?.key === "isActive" && (toolsConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleToolsConfigSort("createdAt")}>
                                                Created {toolsConfigSort?.key === "createdAt" && (toolsConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleToolsConfigSort("updatedAt")}>
                                                Updated {toolsConfigSort?.key === "updatedAt" && (toolsConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingToolsConfigs ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : getSortedToolsConfigs().length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8">No tools configs found</TableCell>
                                            </TableRow>
                                        ) : (
                                            getSortedToolsConfigs().map((config) => (
                                                <TableRow key={config.toolsConfigId}>
                                                    <TableCell>{config.toolsConfigId}</TableCell>
                                                    <TableCell className="font-medium">{config.toolName}</TableCell>
                                                    <TableCell className="font-mono text-sm truncate max-w-[250px]">{config.endpoint}</TableCell>
                                                    <TableCell><Badge variant="secondary">{config.httpMethod}</Badge></TableCell>
                                                    <TableCell>{config.clientConfig?.clientName || config.clientConfigId}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={config.isActive ? "default" : "destructive"}>
                                                            {config.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{new Date(config.createdAt).toLocaleString()}</TableCell>
                                                    <TableCell className="text-sm">{new Date(config.updatedAt).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Param Configs Tab */}
                <TabsContent value="params" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Parameter Configurations</h2>
                        <div className="flex items-center gap-2">
                            <Select value={selectedToolForParams?.toString() || ""} onValueChange={(v) => setSelectedToolForParams(v ? parseInt(v) : null)}>
                                <SelectTrigger className="w-[250px]">
                                    <SelectValue placeholder="Filter by tool" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Tools</SelectItem>
                                    {activeToolsConfigs.map(t => (
                                        <SelectItem key={t.toolsConfigId} value={t.toolsConfigId.toString()}>{t.toolName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => loadToolsParamConfigs(selectedToolForParams || undefined)} disabled={loadingToolsParamConfigs}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${loadingToolsParamConfigs ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("toolsParamConfigId")}>
                                                ID {paramConfigSort?.key === "toolsParamConfigId" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("paramName")}>
                                                Param Name {paramConfigSort?.key === "paramName" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("paramType")}>
                                                Type {paramConfigSort?.key === "paramType" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("dataType")}>
                                                Data Type {paramConfigSort?.key === "dataType" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("isRequired")}>
                                                Required {paramConfigSort?.key === "isRequired" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead>Tool</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("isActive")}>
                                                Status {paramConfigSort?.key === "isActive" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("createdAt")}>
                                                Created {paramConfigSort?.key === "createdAt" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleParamConfigSort("updatedAt")}>
                                                Updated {paramConfigSort?.key === "updatedAt" && (paramConfigSort.direction === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingToolsParamConfigs ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : getSortedParamConfigs().length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8">No param configs found</TableCell>
                                            </TableRow>
                                        ) : (
                                            getSortedParamConfigs().map((config) => (
                                                <TableRow key={config.toolsParamConfigId}>
                                                    <TableCell>{config.toolsParamConfigId}</TableCell>
                                                    <TableCell className="font-medium">{config.paramName}</TableCell>
                                                    <TableCell><Badge variant="secondary">{config.paramType}</Badge></TableCell>
                                                    <TableCell><Badge variant="outline">{config.dataType}</Badge></TableCell>
                                                    <TableCell>{config.isRequired ? "Yes" : "No"}</TableCell>
                                                    <TableCell>{config.toolsConfig?.toolName || config.toolsConfigId}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={config.isActive ? "default" : "destructive"}>
                                                            {config.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{new Date(config.createdAt).toLocaleString()}</TableCell>
                                                    <TableCell className="text-sm">{new Date(config.updatedAt).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Configuration Dialog */}
            <NexusBuddyConfigurationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    );
}