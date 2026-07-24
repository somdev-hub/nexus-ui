"use client";

import {
    NexusBuddyClientConfigDialog,
    NexusBuddyToolsConfigDialog,
    NexusBuddyToolsParamConfigDialog,
} from "@/components/nexus-buddy-config-dialogs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    createNexusBuddyClientConfig,
    createNexusBuddyToolsConfig,
    createNexusBuddyToolsParamConfig,
    deactivateNexusBuddyClientConfig,
    deactivateNexusBuddyToolsConfig,
    deactivateNexusBuddyToolsParamConfig,
    getNexusBuddyActiveClientConfigs,
    getNexusBuddyActiveToolsConfigs,
    getNexusBuddyClientConfigs,
    getNexusBuddyToolsConfigsByClientConfigId,
    getNexusBuddyToolsParamConfigsByToolsConfigId,
    updateNexusBuddyClientConfig,
    updateNexusBuddyToolsConfig,
    updateNexusBuddyToolsParamConfig,
} from "@/lib/auth-service";
import type {
    NexusBuddyClientConfig,
    NexusBuddyClientConfigRequest,
    NexusBuddyClientConfigResponse,
    NexusBuddyToolsConfig,
    NexusBuddyToolsConfigRequest,
    NexusBuddyToolsConfigResponse,
    NexusBuddyToolsParamConfig,
    NexusBuddyToolsParamConfigRequest,
    NexusBuddyToolsParamConfigResponse,
} from "@/types/nexus-buddy";
import { ChevronDown, ChevronUp, Code, Database, Pencil, Plus, RefreshCw, Server, Trash2 } from "lucide-react";
import React, { useCallback, useState } from "react";

const PAGE_SIZE = 5;

export default function NexusBuddyPage() {
    const { toast } = useToast();

    // Client state
    const [clientPage, setClientPage] = useState(0);
    const [clientResponse, setClientResponse] = useState<NexusBuddyClientConfigResponse | null>(null);
    const [loadingClients, setLoadingClients] = useState(false);
    const [expandedClientIds, setExpandedClientIds] = useState<string[]>([]);

    // Tools state per client
    const [toolsPages, setToolsPages] = useState<Record<number, number>>({});
    const [toolsResponses, setToolsResponses] = useState<Record<number, NexusBuddyToolsConfigResponse>>({});
    const [loadingTools, setLoadingTools] = useState<Record<number, boolean>>({});
    const [expandedToolIds, setExpandedToolIds] = useState<string[]>([]);

    // Params state per tool
    const [paramsPages, setParamsPages] = useState<Record<number, number>>({});
    const [paramsResponses, setParamsResponses] = useState<Record<number, NexusBuddyToolsParamConfigResponse>>({});
    const [loadingParams, setLoadingParams] = useState<Record<number, boolean>>({});

    // Active configs for dropdowns
    const [activeClientConfigs, setActiveClientConfigs] = useState<NexusBuddyClientConfig[]>([]);
    const [activeToolsConfigs, setActiveToolsConfigs] = useState<NexusBuddyToolsConfig[]>([]);

    // Dialog states
    const [clientDialogOpen, setClientDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<NexusBuddyClientConfig | null>(null);
    const [clientForm, setClientForm] = useState<NexusBuddyClientConfigRequest>({
        clientName: "",
        connectionUrl: "",
        healthCheckPath: "",
        isActive: true,
    });
    const [submittingClient, setSubmittingClient] = useState(false);

    const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<NexusBuddyToolsConfig | null>(null);
    const [toolsForm, setToolsForm] = useState<NexusBuddyToolsConfigRequest>({
        toolName: "",
        toolDescription: "",
        endpoint: "",
        httpMethod: "GET",
        isActive: true,
        clientConfigId: 0,
        paramConfigs: [],
    });
    const [submittingTool, setSubmittingTool] = useState(false);
    const [selectedClientForTool, setSelectedClientForTool] = useState<number | null>(null);

    const [paramsDialogOpen, setParamsDialogOpen] = useState(false);
    const [editingParam, setEditingParam] = useState<NexusBuddyToolsParamConfig | null>(null);
    const [paramsForm, setParamsForm] = useState<NexusBuddyToolsParamConfigRequest>({
        paramName: "",
        paramType: "QUERY",
        dataType: "STRING",
        isRequired: false,
        defaultValue: "",
        requestBodyJson: "",
        description: "",
        isActive: true,
        toolsConfigId: 0,
        clientConfigId: 0,
    });
    const [submittingParam, setSubmittingParam] = useState(false);
    const [selectedClientForParam, setSelectedClientForParam] = useState<number | null>(null);

    const loadClients = useCallback(async () => {
        setLoadingClients(true);
        try {
            const response = await getNexusBuddyClientConfigs(clientPage, PAGE_SIZE, "clientConfigId", "asc");
            setClientResponse(response);
        } catch (error) {
            console.error("Failed to load client configs:", error);
            toast({ title: "Error", description: "Failed to load client configs", variant: "destructive" });
        } finally {
            setLoadingClients(false);
        }
    }, [clientPage, toast]);

    const loadActiveConfigs = useCallback(async () => {
        try {
            const [activeClients, activeTools] = await Promise.all([
                getNexusBuddyActiveClientConfigs(0, 100, "clientConfigId", "asc"),
                getNexusBuddyActiveToolsConfigs(0, 100, "toolsConfigId", "asc"),
            ]);
            setActiveClientConfigs(activeClients.content || []);
            setActiveToolsConfigs(activeTools.content || []);
        } catch (error) {
            console.error("Failed to load active configs:", error);
        }
    }, []);

    const loadTools = useCallback(async (clientConfigId: number) => {
        console.log("loadTools called for clientConfigId:", clientConfigId);
        setLoadingTools(prev => ({ ...prev, [clientConfigId]: true }));
        try {
            const page = toolsPages[clientConfigId] || 0;
            const response = await getNexusBuddyToolsConfigsByClientConfigId(clientConfigId, page, PAGE_SIZE, "toolsConfigId", "asc");
            console.log("loadTools response:", response);
            setToolsResponses(prev => ({ ...prev, [clientConfigId]: response }));
        } catch (error) {
            console.error("Failed to load tools configs:", error);
            toast({ title: "Error", description: "Failed to load tools configs", variant: "destructive" });
        } finally {
            setLoadingTools(prev => ({ ...prev, [clientConfigId]: false }));
        }
    }, [toolsPages, toast]);

    const loadParams = useCallback(async (toolsConfigId: number) => {
        setLoadingParams(prev => ({ ...prev, [toolsConfigId]: true }));
        try {
            const page = paramsPages[toolsConfigId] || 0;
            const response = await getNexusBuddyToolsParamConfigsByToolsConfigId(toolsConfigId, page, PAGE_SIZE, "toolsParamConfigId", "asc");
            setParamsResponses(prev => ({ ...prev, [toolsConfigId]: response }));
        } catch (error) {
            console.error("Failed to load param configs:", error);
            toast({ title: "Error", description: "Failed to load parameter configs", variant: "destructive" });
        } finally {
            setLoadingParams(prev => ({ ...prev, [toolsConfigId]: false }));
        }
    }, [paramsPages, toast]);

    React.useEffect(() => {
        const initialize = async () => {
            loadClients();
            loadActiveConfigs();
        }

        initialize();
    }, [loadClients, loadActiveConfigs]);

    const toggleClientExpanded = (clientConfigId: number) => {
        console.log("toggleClientExpanded called for:", clientConfigId);
        setExpandedClientIds(prev => {
            const next = new Set(prev);
            const idStr = clientConfigId.toString();
            if (next.has(idStr)) {
                next.delete(idStr);
            } else {
                next.add(idStr);
                if (!toolsResponses[clientConfigId]) {
                    console.log("Loading tools for client:", clientConfigId);
                    loadTools(clientConfigId);
                }
            }
            return Array.from(next);
        });
    };

    const toggleToolExpanded = (clientConfigId: number, toolsConfigId: number) => {
        console.log("toggleToolExpanded called for:", toolsConfigId);
        setExpandedToolIds(prev => {
            const next = new Set(prev);
            const idStr = toolsConfigId.toString();
            if (next.has(idStr)) {
                next.delete(idStr);
            } else {
                next.add(idStr);
                if (!paramsResponses[toolsConfigId]) {
                    console.log("Loading params for tool:", toolsConfigId);
                    loadParams(toolsConfigId);
                }
            }
            return Array.from(next);
        });
    };

    const handleClientPageChange = (page: number) => {
        setClientPage(page);
    };

    const handleToolsPageChange = (clientConfigId: number, page: number) => {
        setToolsPages(prev => ({ ...prev, [clientConfigId]: page }));
        loadTools(clientConfigId);
    };

    const handleParamsPageChange = (toolsConfigId: number, page: number) => {
        setParamsPages(prev => ({ ...prev, [toolsConfigId]: page }));
        loadParams(toolsConfigId);
    };

    const handleCreateClient = () => {
        setEditingClient(null);
        setClientForm({ clientName: "", connectionUrl: "", healthCheckPath: "", isActive: true });
        setClientDialogOpen(true);
    };

    const handleEditClient = (client: NexusBuddyClientConfig) => {
        setEditingClient(client);
        setClientForm({
            clientName: client.clientName,
            connectionUrl: client.connectionUrl,
            healthCheckPath: client.healthCheckPath,
            isActive: client.isActive,
        });
        setClientDialogOpen(true);
    };

    const handleSubmitClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingClient(true);
        try {
            if (editingClient) {
                await updateNexusBuddyClientConfig(editingClient.clientConfigId, clientForm);
                toast({ title: "Success", description: "Client config updated successfully" });
            } else {
                await createNexusBuddyClientConfig(clientForm);
                toast({ title: "Success", description: "Client config created successfully" });
            }
            setClientDialogOpen(false);
            loadClients();
            loadActiveConfigs();
        } catch (error) {
            console.error("Failed to save client config:", error);
            toast({ title: "Error", description: "Failed to save client config", variant: "destructive" });
        } finally {
            setSubmittingClient(false);
        }
    };

    const handleDeleteClient = async (clientConfigId: number) => {
        if (!confirm("Are you sure you want to deactivate this client config?")) return;
        try {
            await deactivateNexusBuddyClientConfig(clientConfigId);
            toast({ title: "Success", description: "Client config deactivated successfully" });
            loadClients();
            loadActiveConfigs();
        } catch (error) {
            console.error("Failed to deactivate client config:", error);
            toast({ title: "Error", description: "Failed to deactivate client config", variant: "destructive" });
        }
    };

    const handleCreateTool = (clientConfigId: number) => {
        setEditingTool(null);
        setSelectedClientForTool(clientConfigId);
        setToolsForm({
            toolName: "",
            toolDescription: "",
            endpoint: "",
            httpMethod: "GET",
            isActive: true,
            clientConfigId,
            paramConfigs: [],
        });
        setToolsDialogOpen(true);
    };

    const handleEditTool = (tool: NexusBuddyToolsConfig) => {
        setEditingTool(tool);
        setSelectedClientForTool(tool.clientConfigId);
        setToolsForm({
            toolName: tool.toolName,
            toolDescription: tool.toolDescription || "",
            endpoint: tool.endpoint,
            httpMethod: tool.httpMethod,
            isActive: tool.isActive,
            clientConfigId: tool.clientConfigId,
            paramConfigs: tool.paramConfigs || [],
        });
        setToolsDialogOpen(true);
    };

    const handleSubmitTool = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingTool(true);
        try {
            if (editingTool) {
                await updateNexusBuddyToolsConfig(editingTool.toolsConfigId, toolsForm);
                toast({ title: "Success", description: "Tool config updated successfully" });
            } else {
                await createNexusBuddyToolsConfig(toolsForm);
                toast({ title: "Success", description: "Tool config created successfully" });
            }
            setToolsDialogOpen(false);
            if (selectedClientForTool) {
                loadTools(selectedClientForTool);
            }
            loadActiveConfigs();
        } catch (error) {
            console.error("Failed to save tool config:", error);
            toast({ title: "Error", description: "Failed to save tool config", variant: "destructive" });
        } finally {
            setSubmittingTool(false);
        }
    };

    const handleDeleteTool = async (toolsConfigId: number, clientConfigId: number) => {
        if (!confirm("Are you sure you want to deactivate this tool config?")) return;
        try {
            await deactivateNexusBuddyToolsConfig(toolsConfigId);
            toast({ title: "Success", description: "Tool config deactivated successfully" });
            loadTools(clientConfigId);
            loadActiveConfigs();
        } catch (error) {
            console.error("Failed to deactivate tool config:", error);
            toast({ title: "Error", description: "Failed to deactivate tool config", variant: "destructive" });
        }
    };

    const handleCreateParam = (toolsConfigId: number, clientConfigId: number) => {
        setEditingParam(null);
        setSelectedClientForParam(clientConfigId);
        setParamsForm({
            paramName: "",
            paramType: "QUERY",
            dataType: "STRING",
            isRequired: false,
            defaultValue: "",
            requestBodyJson: "",
            description: "",
            isActive: true,
            toolsConfigId,
            clientConfigId,
        });
        setParamsDialogOpen(true);
    };

    const handleEditParam = (param: NexusBuddyToolsParamConfig) => {
        setEditingParam(param);
        setSelectedClientForParam(param.clientConfigId || 0);
        setParamsForm({
            paramName: param.paramName,
            paramType: param.paramType,
            dataType: param.dataType,
            isRequired: param.isRequired,
            defaultValue: param.defaultValue || "",
            requestBodyJson: param.requestBodyJson || "",
            description: param.description || "",
            isActive: param.isActive,
            toolsConfigId: param.toolsConfigId,
            clientConfigId: param.clientConfigId || 0,
        });

        setParamsDialogOpen(true);
    };

    const handleSubmitParam = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingParam(true);
        try {
            if (editingParam) {
                await updateNexusBuddyToolsParamConfig(editingParam.toolsParamConfigId, paramsForm);
                toast({ title: "Success", description: "Parameter config updated successfully" });
            } else {
                await createNexusBuddyToolsParamConfig(paramsForm);
                toast({ title: "Success", description: "Parameter config created successfully" });
            }
            setParamsDialogOpen(false);
            if (paramsForm.toolsConfigId) {
                loadParams(paramsForm.toolsConfigId);
            }
            loadActiveConfigs();
        } catch (error) {
            console.error("Failed to save param config:", error);
            toast({ title: "Error", description: "Failed to save parameter config", variant: "destructive" });
        } finally {
            setSubmittingParam(false);
        }
    };

    const handleDeleteParam = async (toolsParamConfigId: number, toolsConfigId: number) => {
        if (!confirm("Are you sure you want to deactivate this parameter config?")) return;
        try {
            await deactivateNexusBuddyToolsParamConfig(toolsParamConfigId);
            toast({ title: "Success", description: "Parameter config deactivated successfully" });
            loadParams(toolsConfigId);
            loadActiveConfigs();
        } catch (error) {
            console.error("Failed to deactivate param config:", error);
            toast({ title: "Error", description: "Failed to deactivate parameter config", variant: "destructive" });
        }
    };

    const handleRefresh = () => {
        loadClients();
        loadActiveConfigs();
        Object.keys(toolsResponses).forEach(clientId => {
            loadTools(Number(clientId));
        });
        Object.keys(paramsResponses).forEach(toolId => {
            loadParams(Number(toolId));
        });
    };

    const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
        if (totalPages <= 1) return null;
        return (
            <Pagination className="mt-4">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                            className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i).map(page => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                onClick={() => onPageChange(page)}
                                isActive={page === currentPage}
                                className="cursor-pointer"
                            >
                                {page + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                            className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
    };

    const clients = clientResponse?.content || [];
    const totalClientPages = clientResponse?.totalPages || 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">NexusBuddy Configuration</h1>
                    <p className="text-muted-foreground">Manage client configs, tools, and parameter configurations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingClients}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loadingClients ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleCreateClient}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
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
                        <div className="text-2xl font-bold">{clientResponse?.totalElements || 0}</div>
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
                        <div className="text-2xl font-bold">{activeToolsConfigs.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeToolsConfigs.filter(t => t.isActive).length} active
                        </p>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Param Configs</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold">
                            {Object.values(paramsResponses).reduce((sum, r) => sum + (r.totalElements || 0), 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all tools
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Clients Accordion */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Client Configurations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingClients ? (
                        <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
                    ) : clients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No client configs found</div>
                    ) : (
                        <>
                            <Accordion type="multiple" value={expandedClientIds} onValueChange={(values: string[]) => {
                                setExpandedClientIds(values);
                                values.forEach(id => {
                                    const clientId = Number(id);
                                    if (!toolsResponses[clientId]) {
                                        loadTools(clientId);
                                    }
                                });
                            }} className="space-y-2">
                                {clients.map((client) => {
                                    console.log("[CLIENT]", client);
                                    console.log("[TOOL RESPONSES]", toolsResponses);
                                    const toolsResponse = toolsResponses[client.clientConfigId];
                                    console.log("[TOOLS RESPONSE]", client.clientConfigId, toolsResponse);
                                    const tools = toolsResponse?.content || [];
                                    console.log("[TOOLS]", client.clientConfigId, tools);
                                    const totalToolsPages = toolsResponse?.totalPages || 0;
                                    const isClientExpanded = expandedClientIds.includes(client.clientConfigId.toString());

                                    return (
                                        <AccordionItem key={client.clientConfigId} value={client.clientConfigId.toString()} className="border rounded-lg px-4">
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <Server className="h-4 w-4" />
                                                        <span className="font-medium">{client.clientName}</span>
                                                        <Badge variant={client.isActive ? "default" : "destructive"}>
                                                            {client.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground font-mono truncate max-w-50">
                                                            {client.connectionUrl}
                                                        </span>
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditClient(client);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    handleEditClient(client);
                                                                }
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </span>
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClient(client.clientConfigId);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    handleDeleteClient(client.clientConfigId);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-4 pt-2">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-sm font-semibold">Tools Configuration</h4>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleCreateTool(client.clientConfigId)}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add Tool
                                                        </Button>
                                                    </div>

                                                    {loadingTools[client.clientConfigId] ? (
                                                        <div className="text-center py-4 text-muted-foreground">Loading tools...</div>
                                                    ) : tools.length === 0 ? (
                                                        <div className="text-center py-4 text-muted-foreground">No tools configured</div>
                                                    ) : (
                                                        <>
                                                            <div className="overflow-x-auto border rounded-lg">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>ID</TableHead>
                                                                            <TableHead>Tool Name</TableHead>
                                                                            <TableHead>Endpoint</TableHead>
                                                                            <TableHead>Method</TableHead>
                                                                            <TableHead>Status</TableHead>
                                                                            <TableHead className="text-right">Actions</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {tools.map((tool) => {
                                                                            const isToolExpanded = expandedToolIds.includes(tool.toolsConfigId.toString());
                                                                            const paramsResponse = paramsResponses[tool.toolsConfigId];
                                                                            const params = paramsResponse?.content || [];
                                                                            const totalParamsPages = paramsResponse?.totalPages || 0;

                                                                            return (
                                                                                <React.Fragment key={tool.toolsConfigId}>
                                                                                    <TableRow>
                                                                                        <TableCell>{tool.toolsConfigId}</TableCell>
                                                                                        <TableCell className="font-medium">{tool.toolName}</TableCell>
                                                                                        <TableCell className="text-xs text-muted-foreground">{tool.endpoint}</TableCell>
                                                                                        <TableCell>
                                                                                            <Badge variant="secondary">{tool.httpMethod}</Badge>
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <Badge variant={tool.isActive ? "default" : "destructive"}>
                                                                                                {tool.isActive ? "Active" : "Inactive"}
                                                                                            </Badge>
                                                                                        </TableCell>
                                                                                        <TableCell className="text-right">
                                                                                            <div className="flex justify-end gap-1">
                                                                                                <span
                                                                                                    role="button"
                                                                                                    tabIndex={0}
                                                                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                                                                    onClick={() => toggleToolExpanded(client.clientConfigId, tool.toolsConfigId)}
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                                                            e.preventDefault();
                                                                                                            toggleToolExpanded(client.clientConfigId, tool.toolsConfigId);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    {isToolExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                                                </span>
                                                                                                <span
                                                                                                    role="button"
                                                                                                    tabIndex={0}
                                                                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                                                                    onClick={() => handleEditTool(tool)}
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                                                            e.preventDefault();
                                                                                                            handleEditTool(tool);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <Pencil className="h-4 w-4" />
                                                                                                </span>
                                                                                                <span
                                                                                                    role="button"
                                                                                                    tabIndex={0}
                                                                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-destructive"
                                                                                                    onClick={() => handleDeleteTool(tool.toolsConfigId, client.clientConfigId)}
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                                                            e.preventDefault();
                                                                                                            handleDeleteTool(tool.toolsConfigId, client.clientConfigId);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <Trash2 className="h-4 w-4" />
                                                                                                </span>
                                                                                            </div>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                    {isToolExpanded && (
                                                                                        <TableRow>
                                                                                            <TableCell colSpan={6} className="p-0">
                                                                                                <div className="px-4 py-3 bg-muted/30 border-t">
                                                                                                    <div className="flex justify-between items-center mb-2">
                                                                                                        <h5 className="text-sm font-semibold">Parameters</h5>
                                                                                                        <Button
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            onClick={() => handleCreateParam(tool.toolsConfigId, client.clientConfigId)}
                                                                                                        >
                                                                                                            <Plus className="mr-2 h-4 w-4" />
                                                                                                            Add Parameter
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                    {loadingParams[tool.toolsConfigId] ? (
                                                                                                        <div className="text-center py-2 text-muted-foreground">Loading parameters...</div>
                                                                                                    ) : params.length === 0 ? (
                                                                                                        <div className="text-center py-2 text-muted-foreground">No parameters configured</div>
                                                                                                    ) : (
                                                                                                        <>
                                                                                                            <div className="overflow-x-auto border rounded-lg">
                                                                                                                <Table>
                                                                                                                    <TableHeader>
                                                                                                                        <TableRow>
                                                                                                                            <TableHead>ID</TableHead>
                                                                                                                            <TableHead>Param Name</TableHead>
                                                                                                                            <TableHead>Type</TableHead>
                                                                                                                            <TableHead>Data Type</TableHead>
                                                                                                                            <TableHead>Required</TableHead>
                                                                                                                            <TableHead>Status</TableHead>
                                                                                                                            <TableHead className="text-right">Actions</TableHead>
                                                                                                                        </TableRow>
                                                                                                                    </TableHeader>
                                                                                                                    <TableBody>
                                                                                                                        {params.map((param) => (
                                                                                                                            <TableRow key={param.toolsParamConfigId}>
                                                                                                                                <TableCell>{param.toolsParamConfigId}</TableCell>
                                                                                                                                <TableCell className="font-medium">{param.paramName}</TableCell>
                                                                                                                                <TableCell className="text-xs text-muted-foreground">{param.description || "-"}</TableCell>
                                                                                                                                <TableCell>
                                                                                                                                    <Badge variant="secondary">{param.paramType}</Badge>
                                                                                                                                </TableCell>
                                                                                                                                <TableCell>{param.isRequired ? "Yes" : "No"}</TableCell>
                                                                                                                                <TableCell>
                                                                                                                                    <Badge variant={param.isActive ? "default" : "destructive"}>
                                                                                                                                        {param.isActive ? "Active" : "Inactive"}
                                                                                                                                    </Badge>
                                                                                                                                </TableCell>
                                                                                                                                <TableCell className="text-right">
                                                                                                                                    <div className="flex justify-end gap-1">
                                                                                                                                        <span
                                                                                                                                            role="button"
                                                                                                                                            tabIndex={0}
                                                                                                                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                                                                                                            onClick={() => handleEditParam(param)}
                                                                                                                                            onKeyDown={(e) => {
                                                                                                                                                if (e.key === "Enter" || e.key === " ") {
                                                                                                                                                    e.preventDefault();
                                                                                                                                                    handleEditParam(param);
                                                                                                                                                }
                                                                                                                                            }}
                                                                                                                                        >
                                                                                                                                            <Pencil className="h-4 w-4" />
                                                                                                                                        </span>
                                                                                                                                        <span
                                                                                                                                            role="button"
                                                                                                                                            tabIndex={0}
                                                                                                                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-destructive"
                                                                                                                                            onClick={() => handleDeleteParam(param.toolsParamConfigId, tool.toolsConfigId)}
                                                                                                                                            onKeyDown={(e) => {
                                                                                                                                                if (e.key === "Enter" || e.key === " ") {
                                                                                                                                                    e.preventDefault();
                                                                                                                                                    handleDeleteParam(param.toolsParamConfigId, tool.toolsConfigId);
                                                                                                                                                }
                                                                                                                                            }}
                                                                                                                                        >
                                                                                                                                            <Trash2 className="h-4 w-4" />
                                                                                                                                        </span>
                                                                                                                                    </div>
                                                                                                                                </TableCell>
                                                                                                                            </TableRow>
                                                                                                                        ))}
                                                                                                                    </TableBody>
                                                                                                                </Table>
                                                                                                            </div>
                                                                                                            {renderPagination(paramsResponse?.number || 0, totalParamsPages, (page) => handleParamsPageChange(tool.toolsConfigId, page))}
                                                                                                        </>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                            {renderPagination(toolsResponse?.number || 0, totalToolsPages, (page) => handleToolsPageChange(client.clientConfigId, page))}
                                                        </>
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                            {renderPagination(clientPage, totalClientPages, handleClientPageChange)}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <NexusBuddyClientConfigDialog
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
                editingConfig={editingClient}
                form={clientForm}
                submitting={submittingClient}
                onFormChange={setClientForm}
                onSubmit={handleSubmitClient}
            />

            <NexusBuddyToolsConfigDialog
                open={toolsDialogOpen}
                onOpenChange={setToolsDialogOpen}
                editingConfig={editingTool}
                form={toolsForm}
                submitting={submittingTool}
                activeClientConfigs={activeClientConfigs}
                onFormChange={setToolsForm}
                onSubmit={handleSubmitTool}
            />

            <NexusBuddyToolsParamConfigDialog
                open={paramsDialogOpen}
                onOpenChange={setParamsDialogOpen}
                editingConfig={editingParam}
                form={paramsForm}
                submitting={submittingParam}
                activeClientConfigs={activeClientConfigs}
                activeToolsConfigs={activeToolsConfigs}
                onFormChange={setParamsForm}
                onSubmit={handleSubmitParam}
            />
        </div>
    );
}
