"use client";

import React, { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Settings, Server, Code, Database, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getNexusBuddyClientConfigs,
    getNexusBuddyActiveClientConfigs,
    createNexusBuddyClientConfig,
    updateNexusBuddyClientConfig,
    deactivateNexusBuddyClientConfig,
    getNexusBuddyToolsConfigs,
    getNexusBuddyActiveToolsConfigs,
    getNexusBuddyToolsConfigsByClientConfigId,
    createNexusBuddyToolsConfig,
    updateNexusBuddyToolsConfig,
    deactivateNexusBuddyToolsConfig,
    getNexusBuddyToolsParamConfigs,
    getNexusBuddyActiveToolsParamConfigs,
    getNexusBuddyToolsParamConfigsByToolsConfigId,
    createNexusBuddyToolsParamConfig,
    updateNexusBuddyToolsParamConfig,
    deactivateNexusBuddyToolsParamConfig,
} from "@/lib/auth-service";
import type {
    NexusBuddyClientConfig,
    NexusBuddyClientConfigRequest,
    NexusBuddyToolsConfig,
    NexusBuddyToolsConfigRequest,
    NexusBuddyToolsParamConfig,
    NexusBuddyToolsParamConfigRequest,
} from "@/types/nexus-buddy";

interface NexusBuddyConfigurationDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    smallButton?: boolean;
}

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const paramTypes = ["QUERY", "PATH", "HEADER", "BODY"];
const dataTypes = ["STRING", "NUMBER", "BOOLEAN", "OBJECT", "ARRAY"];

export const NexusBuddyConfigurationDialog = ({ open, onOpenChange, smallButton }: NexusBuddyConfigurationDialogProps) => {
    const { toast } = useToast();

    // State for Client Configs
    const [clientConfigs, setClientConfigs] = React.useState<NexusBuddyClientConfig[]>([]);
    const [activeClientConfigs, setActiveClientConfigs] = React.useState<NexusBuddyClientConfig[]>([]);
    const [loadingClientConfigs, setLoadingClientConfigs] = React.useState(false);
    const [showClientConfigForm, setShowClientConfigForm] = React.useState(false);
    const [editingClientConfig, setEditingClientConfig] = React.useState<NexusBuddyClientConfig | null>(null);
    const [clientConfigForm, setClientConfigForm] = React.useState<NexusBuddyClientConfigRequest>({
        clientName: "",
        connectionUrl: "",
        healthCheckPath: "",
        isActive: true,
    });

    // State for Tools Configs
    const [toolsConfigs, setToolsConfigs] = React.useState<NexusBuddyToolsConfig[]>([]);
    const [activeToolsConfigs, setActiveToolsConfigs] = React.useState<NexusBuddyToolsConfig[]>([]);
    const [loadingToolsConfigs, setLoadingToolsConfigs] = React.useState(false);
    const [showToolsConfigForm, setShowToolsConfigForm] = React.useState(false);
    const [editingToolsConfig, setEditingToolsConfig] = React.useState<NexusBuddyToolsConfig | null>(null);
    const [toolsConfigForm, setToolsConfigForm] = React.useState<NexusBuddyToolsConfigRequest>({
        toolName: "",
        toolDescription: "",
        endpoint: "",
        httpMethod: "GET",
        isActive: true,
        clientConfigId: 0,
    });
    const [selectedClientForTools, setSelectedClientForTools] = React.useState<number | null>(null);

    // State for Tools Param Configs
    const [toolsParamConfigs, setToolsParamConfigs] = React.useState<NexusBuddyToolsParamConfig[]>([]);
    const [activeToolsParamConfigs, setActiveToolsParamConfigs] = React.useState<NexusBuddyToolsParamConfig[]>([]);
    const [loadingToolsParamConfigs, setLoadingToolsParamConfigs] = React.useState(false);
    const [showToolsParamConfigForm, setShowToolsParamConfigForm] = React.useState(false);
    const [editingToolsParamConfig, setEditingToolsParamConfig] = React.useState<NexusBuddyToolsParamConfig | null>(null);
    const [toolsParamConfigForm, setToolsParamConfigForm] = React.useState<NexusBuddyToolsParamConfigRequest>({
        paramName: "",
        paramType: "QUERY",
        dataType: "STRING",
        isRequired: false,
        defaultValue: "",
        requestBodyJson: "",
        isActive: true,
        toolsConfigId: 0,
    });
    const [selectedToolForParams, setSelectedToolForParams] = React.useState<number | null>(null);

    // Load data functions
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
            toast({ title: "Error", description: "Failed to load client configs", variant: "destructive" });
        } finally {
            setLoadingClientConfigs(false);
        }
    }, [toast]);

    const loadToolsConfigs = useCallback(async (clientConfigId?: number) => {
        setLoadingToolsConfigs(true);
        try {
            let allResponse, activeResponse;
            if (clientConfigId) {
                const byClient = await getNexusBuddyToolsConfigsByClientConfigId(clientConfigId);
                allResponse = { content: byClient };
                activeResponse = byClient.filter(c => c.isActive);
            } else {
                [allResponse, activeResponse] = await Promise.all([
                    getNexusBuddyToolsConfigs(),
                    getNexusBuddyActiveToolsConfigs(),
                ]);
            }
            setToolsConfigs(allResponse.content || []);
            setActiveToolsConfigs(activeResponse || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load tools configs", variant: "destructive" });
        } finally {
            setLoadingToolsConfigs(false);
        }
    }, [toast]);

    const loadToolsParamConfigs = useCallback(async (toolsConfigId?: number) => {
        setLoadingToolsParamConfigs(true);
        try {
            let allResponse, activeResponse;
            if (toolsConfigId) {
                const byTool = await getNexusBuddyToolsParamConfigsByToolsConfigId(toolsConfigId);
                allResponse = { content: byTool };
                activeResponse = byTool.filter(c => c.isActive);
            } else {
                [allResponse, activeResponse] = await Promise.all([
                    getNexusBuddyToolsParamConfigs(),
                    getNexusBuddyActiveToolsParamConfigs(),
                ]);
            }
            setToolsParamConfigs(allResponse.content || []);
            setActiveToolsParamConfigs(activeResponse || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load tools param configs", variant: "destructive" });
        } finally {
            setLoadingToolsParamConfigs(false);
        }
    }, [toast]);

    // Client Config Handlers
    const handleClientConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClientConfig) {
                await updateNexusBuddyClientConfig(editingClientConfig.clientConfigId, clientConfigForm);
                toast({ title: "Success", description: "Client config updated successfully" });
            } else {
                await createNexusBuddyClientConfig(clientConfigForm);
                toast({ title: "Success", description: "Client config created successfully" });
            }
            setShowClientConfigForm(false);
            setEditingClientConfig(null);
            resetClientConfigForm();
            loadClientConfigs();
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const handleEditClientConfig = (config: NexusBuddyClientConfig) => {
        setEditingClientConfig(config);
        setClientConfigForm({
            clientName: config.clientName,
            connectionUrl: config.connectionUrl || "",
            healthCheckPath: config.healthCheckPath || "",
            isActive: config.isActive,
        });
        setShowClientConfigForm(true);
    };

    const handleDeactivateClientConfig = async (id: number) => {
        if (!confirm("Are you sure you want to deactivate this client config?")) return;
        try {
            await deactivateNexusBuddyClientConfig(id);
            toast({ title: "Success", description: "Client config deactivated" });
            loadClientConfigs();
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const resetClientConfigForm = () => {
        setClientConfigForm({
            clientName: "",
            connectionUrl: "",
            healthCheckPath: "",
            isActive: true,
        });
    };

    // Tools Config Handlers
    const handleToolsConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingToolsConfig) {
                await updateNexusBuddyToolsConfig(editingToolsConfig.toolsConfigId, toolsConfigForm);
                toast({ title: "Success", description: "Tools config updated successfully" });
            } else {
                await createNexusBuddyToolsConfig(toolsConfigForm);
                toast({ title: "Success", description: "Tools config created successfully" });
            }
            setShowToolsConfigForm(false);
            setEditingToolsConfig(null);
            resetToolsConfigForm();
            loadToolsConfigs(selectedClientForTools || undefined);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const handleEditToolsConfig = (config: NexusBuddyToolsConfig) => {
        setEditingToolsConfig(config);
        setToolsConfigForm({
            toolName: config.toolName,
            toolDescription: config.toolDescription || "",
            endpoint: config.endpoint,
            httpMethod: config.httpMethod,
            isActive: config.isActive,
            clientConfigId: config.clientConfigId,
        });
        setShowToolsConfigForm(true);
    };

    const handleDeactivateToolsConfig = async (id: number) => {
        if (!confirm("Are you sure you want to deactivate this tools config?")) return;
        try {
            await deactivateNexusBuddyToolsConfig(id);
            toast({ title: "Success", description: "Tools config deactivated" });
            loadToolsConfigs(selectedClientForTools || undefined);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const resetToolsConfigForm = () => {
        setToolsConfigForm({
            toolName: "",
            toolDescription: "",
            endpoint: "",
            httpMethod: "GET",
            isActive: true,
            clientConfigId: selectedClientForTools || 0,
        });
    };

    // Tools Param Config Handlers
    const handleToolsParamConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingToolsParamConfig) {
                await updateNexusBuddyToolsParamConfig(editingToolsParamConfig.toolsParamConfigId, toolsParamConfigForm);
                toast({ title: "Success", description: "Tools param config updated successfully" });
            } else {
                await createNexusBuddyToolsParamConfig(toolsParamConfigForm);
                toast({ title: "Success", description: "Tools param config created successfully" });
            }
            setShowToolsParamConfigForm(false);
            setEditingToolsParamConfig(null);
            resetToolsParamConfigForm();
            loadToolsParamConfigs(selectedToolForParams || undefined);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const handleEditToolsParamConfig = (config: NexusBuddyToolsParamConfig) => {
        setEditingToolsParamConfig(config);
        setToolsParamConfigForm({
            paramName: config.paramName,
            paramType: config.paramType,
            dataType: config.dataType,
            isRequired: config.isRequired,
            defaultValue: config.defaultValue || "",
            requestBodyJson: config.requestBodyJson || "",
            isActive: config.isActive,
            toolsConfigId: config.toolsConfigId,
        });
        setShowToolsParamConfigForm(true);
    };

    const handleDeactivateToolsParamConfig = async (id: number) => {
        if (!confirm("Are you sure you want to deactivate this param config?")) return;
        try {
            await deactivateNexusBuddyToolsParamConfig(id);
            toast({ title: "Success", description: "Tools param config deactivated" });
            loadToolsParamConfigs(selectedToolForParams || undefined);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const resetToolsParamConfigForm = () => {
        setToolsParamConfigForm({
            paramName: "",
            paramType: "QUERY",
            dataType: "STRING",
            isRequired: false,
            defaultValue: "",
            requestBodyJson: "",
            isActive: true,
            toolsConfigId: selectedToolForParams || 0,
        });
    };

    // Load initial data
    React.useEffect(() => {
        if (open) {
            setTimeout(() => {
                loadClientConfigs();
                loadToolsConfigs();
                loadToolsParamConfigs();
            }, 0);
        }
    }, [loadClientConfigs, loadToolsConfigs, loadToolsParamConfigs, open]);

    // Render onboarding card when smallButton is true
    if (smallButton) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Onboard Event
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>NexusBuddy Configuration</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="clients" className="h-[calc(100%-60px)] flex flex-col">
                        <TabsList className="mb-4">
                            <TabsTrigger value="clients">
                                <Server className="mr-2 h-4 w-4" />
                                Client Configs
                            </TabsTrigger>
                            <TabsTrigger value="tools">
                                <Code className="mr-2 h-4 w-4" />
                                Tools Configs
                            </TabsTrigger>
                            <TabsTrigger value="params">
                                <Database className="mr-2 h-4 w-4" />
                                Param Configs
                            </TabsTrigger>
                        </TabsList>
                        {/* Content tabs will be rendered here */}
                    </Tabs>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    NexusBuddy Configuration
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>NexusBuddy Configuration</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="clients" className="h-[calc(100%-60px)] flex flex-col">
                    <TabsList className="mb-4">
                        <TabsTrigger value="clients">
                            <Server className="mr-2 h-4 w-4" />
                            Client Configs
                        </TabsTrigger>
                        <TabsTrigger value="tools">
                            <Code className="mr-2 h-4 w-4" />
                            Tools Configs
                        </TabsTrigger>
                        <TabsTrigger value="params">
                            <Database className="mr-2 h-4 w-4" />
                            Param Configs
                        </TabsTrigger>
                    </TabsList>

                    {/* Client Configs Tab */}
                    <TabsContent value="clients" className="flex-1 overflow-auto p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Client Configurations</h3>
                            <Button onClick={() => { setEditingClientConfig(null); resetClientConfigForm(); setShowClientConfigForm(true); }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Client Config
                            </Button>
                        </div>

                        {showClientConfigForm && (
                            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                                <h4 className="font-medium mb-4">{editingClientConfig ? "Edit" : "Create"} Client Config</h4>
                                <form onSubmit={handleClientConfigSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="clientName">Client Name *</Label>
                                            <Input
                                                id="clientName"
                                                value={clientConfigForm.clientName}
                                                onChange={(e) => setClientConfigForm({ ...clientConfigForm, clientName: e.target.value })}
                                                placeholder="Enter client name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="connectionUrl">Connection URL</Label>
                                            <Input
                                                id="connectionUrl"
                                                value={clientConfigForm.connectionUrl || ""}
                                                onChange={(e) => setClientConfigForm({ ...clientConfigForm, connectionUrl: e.target.value })}
                                                placeholder="https://api.example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="healthCheckPath">Health Check Path</Label>
                                            <Input
                                                id="healthCheckPath"
                                                value={clientConfigForm.healthCheckPath || ""}
                                                onChange={(e) => setClientConfigForm({ ...clientConfigForm, healthCheckPath: e.target.value })}
                                                placeholder="/health"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-y-2">
                                        <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={clientConfigForm.isActive}
                                                onChange={(e) => setClientConfigForm({ ...clientConfigForm, isActive: e.target.checked })}
                                                className="rounded border-input"
                                            />
                                            Active
                                        </Label>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => { setShowClientConfigForm(false); setEditingClientConfig(null); resetClientConfigForm(); }}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">{editingClientConfig ? "Update" : "Create"}</Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Client Name</TableHead>
                                        <TableHead>Connection URL</TableHead>
                                        <TableHead>Auth Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingClientConfigs ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                        </TableRow>
                                    ) : clientConfigs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">No client configs found</TableCell>
                                        </TableRow>
                                    ) : (
                                        clientConfigs.map((config) => (
                                            <TableRow key={config.clientConfigId}>
                                                <TableCell>{config.clientConfigId}</TableCell>
                                                <TableCell className="font-medium">{config.clientName}</TableCell>
                                                <TableCell className="font-mono text-sm truncate max-w-50">{config.connectionUrl}</TableCell>
                                                <TableCell className="font-mono text-sm truncate max-w-50">{config.healthCheckPath}</TableCell>
                                                <TableCell>
                                                    <Badge variant={config.isActive ? "default" : "destructive"}>
                                                        {config.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{new Date(config.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClientConfig(config)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDeactivateClientConfig(config.clientConfigId)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Tools Configs Tab */}
                    <TabsContent value="tools" className="flex-1 overflow-auto p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Tools Configurations</h3>
                            <div className="flex items-center gap-2">
                                <Select value={selectedClientForTools?.toString() || ""} onValueChange={(v) => { setSelectedClientForTools(v ? parseInt(v) : null); loadToolsConfigs(v ? parseInt(v) : undefined); }}>
                                    <SelectTrigger className="w-50">
                                        <SelectValue placeholder="Filter by client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Clients</SelectItem>
                                        {activeClientConfigs.map(c => (
                                            <SelectItem key={c.clientConfigId} value={c.clientConfigId.toString()}>{c.clientName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => { setEditingToolsConfig(null); resetToolsConfigForm(); setShowToolsConfigForm(true); }} disabled={!selectedClientForTools}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Tools Config
                                </Button>
                            </div>
                        </div>

                        {showToolsConfigForm && (
                            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                                <h4 className="font-medium mb-4">{editingToolsConfig ? "Edit" : "Create"} Tools Config</h4>
                                <form onSubmit={handleToolsConfigSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="toolName">Tool Name *</Label>
                                            <Input
                                                id="toolName"
                                                value={toolsConfigForm.toolName}
                                                onChange={(e) => setToolsConfigForm({ ...toolsConfigForm, toolName: e.target.value })}
                                                placeholder="Enter tool name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="toolDescription">Tool Description</Label>
                                            <Input
                                                id="toolDescription"
                                                value={toolsConfigForm.toolDescription || ""}
                                                onChange={(e) => setToolsConfigForm({ ...toolsConfigForm, toolDescription: e.target.value })}
                                                placeholder="Optional description"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="endpoint">Endpoint *</Label>
                                            <Input
                                                id="endpoint"
                                                value={toolsConfigForm.endpoint}
                                                onChange={(e) => setToolsConfigForm({ ...toolsConfigForm, endpoint: e.target.value })}
                                                placeholder="/api/v1/resource"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="httpMethod">HTTP Method</Label>
                                            <Select value={toolsConfigForm.httpMethod} onValueChange={(v) => setToolsConfigForm({ ...toolsConfigForm, httpMethod: v || "GET" })}>
                                                <SelectTrigger id="httpMethod">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {httpMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clientConfigId">Client Config *</Label>
                                        <Select value={toolsConfigForm.clientConfigId.toString()} onValueChange={(v) => setToolsConfigForm({ ...toolsConfigForm, clientConfigId: v ? parseInt(v) : 0 })}>
                                            <SelectTrigger id="clientConfigId">
                                                <SelectValue placeholder="Select client" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {activeClientConfigs.map(c => (
                                                    <SelectItem key={c.clientConfigId} value={c.clientConfigId.toString()}>{c.clientName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-y-2">
                                        <Label htmlFor="toolsIsActive" className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="toolsIsActive"
                                                checked={toolsConfigForm.isActive}
                                                onChange={(e) => setToolsConfigForm({ ...toolsConfigForm, isActive: e.target.checked })}
                                                className="rounded border-input"
                                            />
                                            Active
                                        </Label>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => { setShowToolsConfigForm(false); setEditingToolsConfig(null); resetToolsConfigForm(); }}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">{editingToolsConfig ? "Update" : "Create"}</Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Tool Name</TableHead>
                                        <TableHead>Endpoint</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingToolsConfigs ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
                                    ) : toolsConfigs.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-8">No tools configs found</TableCell></TableRow>
                                    ) : (
                                        toolsConfigs.map((config) => (
                                            <TableRow key={config.toolsConfigId}>
                                                <TableCell>{config.toolsConfigId}</TableCell>
                                                <TableCell className="font-medium">{config.toolName}</TableCell>
                                                <TableCell className="font-mono text-sm truncate max-w-50">{config.endpoint}</TableCell>
                                                <TableCell><Badge variant="secondary">{config.httpMethod}</Badge></TableCell>
                                                <TableCell>{config.clientConfig?.clientName || config.clientConfigId}</TableCell>
                                                <TableCell>
                                                    <Badge variant={config.isActive ? "default" : "destructive"}>
                                                        {config.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{new Date(config.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditToolsConfig(config)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDeactivateToolsConfig(config.toolsConfigId)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Param Configs Tab */}
                    <TabsContent value="params" className="flex-1 overflow-auto p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Parameter Configurations</h3>
                            <div className="flex items-center gap-2">
                                <Select value={selectedToolForParams?.toString() || ""} onValueChange={(v) => { setSelectedToolForParams(v ? parseInt(v) : null); loadToolsParamConfigs(v ? parseInt(v) : undefined); }}>
                                    <SelectTrigger className="w-62.5">
                                        <SelectValue placeholder="Filter by tool" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Tools</SelectItem>
                                        {activeToolsConfigs.map(t => (
                                            <SelectItem key={t.toolsConfigId} value={t.toolsConfigId.toString()}>{t.toolName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => { setEditingToolsParamConfig(null); resetToolsParamConfigForm(); setShowToolsParamConfigForm(true); }} disabled={!selectedToolForParams}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Param Config
                                </Button>
                            </div>
                        </div>

                        {showToolsParamConfigForm && (
                            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                                <h4 className="font-medium mb-4">{editingToolsParamConfig ? "Edit" : "Create"} Parameter Config</h4>
                                <form onSubmit={handleToolsParamConfigSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paramName">Parameter Name *</Label>
                                            <Input
                                                id="paramName"
                                                value={toolsParamConfigForm.paramName}
                                                onChange={(e) => setToolsParamConfigForm({ ...toolsParamConfigForm, paramName: e.target.value })}
                                                placeholder="Enter parameter name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paramType">Parameter Type</Label>
                                            <Select value={toolsParamConfigForm.paramType} onValueChange={(v) => setToolsParamConfigForm({ ...toolsParamConfigForm, paramType: v || "QUERY" })}>
                                                <SelectTrigger id="paramType">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paramTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dataType">Data Type</Label>
                                            <Select value={toolsParamConfigForm.dataType} onValueChange={(v) => setToolsParamConfigForm({ ...toolsParamConfigForm, dataType: v || "STRING" })}>
                                                <SelectTrigger id="dataType">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dataTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="toolsConfigId">Tool *</Label>
                                            <Select value={toolsParamConfigForm.toolsConfigId.toString()} onValueChange={(v) => setToolsParamConfigForm({ ...toolsParamConfigForm, toolsConfigId: v ? parseInt(v) : 0 })}>
                                                <SelectTrigger id="toolsConfigId">
                                                    <SelectValue placeholder="Select tool" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeToolsConfigs.map(t => (
                                                        <SelectItem key={t.toolsConfigId} value={t.toolsConfigId.toString()}>{t.toolName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultValue">Default Value</Label>
                                        <Input
                                            id="defaultValue"
                                            value={toolsParamConfigForm.defaultValue || ""}
                                            onChange={(e) => setToolsParamConfigForm({ ...toolsParamConfigForm, defaultValue: e.target.value })}
                                            placeholder="Default value"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="requestBodyJson">Request Body JSON</Label>
                                        <Textarea
                                            id="requestBodyJson"
                                            value={toolsParamConfigForm.requestBodyJson || ""}
                                            onChange={(e) => setToolsParamConfigForm({ ...toolsParamConfigForm, requestBodyJson: e.target.value })}
                                            placeholder='{"key": "value"}'
                                            rows={2}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center space-y-2">
                                            <Label htmlFor="isRequired" className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="isRequired"
                                                    checked={toolsParamConfigForm.isRequired}
                                                    onChange={(e) => setToolsParamConfigForm({ ...toolsParamConfigForm, isRequired: e.target.checked })}
                                                    className="rounded border-input"
                                                />
                                                Required
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-y-2">
                                            <Label htmlFor="paramIsActive" className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="paramIsActive"
                                                    checked={toolsParamConfigForm.isActive}
                                                    onChange={(e) => setToolsParamConfigForm({ ...toolsParamConfigForm, isActive: e.target.checked })}
                                                    className="rounded border-input"
                                                />
                                                Active
                                            </Label>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => { setShowToolsParamConfigForm(false); setEditingToolsParamConfig(null); resetToolsParamConfigForm(); }}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">{editingToolsParamConfig ? "Update" : "Create"}</Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Param Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Data Type</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Tool</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingToolsParamConfigs ? (
                                        <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                                    ) : toolsParamConfigs.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} className="text-center py-8">No param configs found</TableCell></TableRow>
                                    ) : (
                                        toolsParamConfigs.map((config) => (
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
                                                <TableCell className="text-sm">{new Date(config.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditToolsParamConfig(config)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDeactivateToolsParamConfig(config.toolsParamConfigId)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default NexusBuddyConfigurationDialog;