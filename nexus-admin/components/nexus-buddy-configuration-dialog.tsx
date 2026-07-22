"use client";

import React, { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Settings, Server, Code, Database, Sparkles } from "lucide-react";
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
import {
    NexusBuddyClientConfigDialog,
    NexusBuddyToolsConfigDialog,
    NexusBuddyToolsParamConfigDialog,
} from "@/components/nexus-buddy-config-dialogs";

interface NexusBuddyConfigurationDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    smallButton?: boolean;
}

export const NexusBuddyConfigurationDialog = ({ open, onOpenChange, smallButton }: NexusBuddyConfigurationDialogProps) => {
    const { toast } = useToast();

    // State for Client Configs
    const [clientConfigs, setClientConfigs] = React.useState<NexusBuddyClientConfig[]>([]);
    const [activeClientConfigs, setActiveClientConfigs] = React.useState<NexusBuddyClientConfig[]>([]);
    const [loadingClientConfigs, setLoadingClientConfigs] = React.useState(false);
    const [clientConfigDialogOpen, setClientConfigDialogOpen] = React.useState(false);
    const [editingClientConfig, setEditingClientConfig] = React.useState<NexusBuddyClientConfig | null>(null);
    const [clientConfigForm, setClientConfigForm] = React.useState<NexusBuddyClientConfigRequest>({
        clientName: "",
        connectionUrl: "",
        healthCheckPath: "",
        isActive: true,
    });
    const [submittingClientConfig, setSubmittingClientConfig] = React.useState(false);

    // State for Tools Configs
    const [toolsConfigs, setToolsConfigs] = React.useState<NexusBuddyToolsConfig[]>([]);
    const [activeToolsConfigs, setActiveToolsConfigs] = React.useState<NexusBuddyToolsConfig[]>([]);
    const [loadingToolsConfigs, setLoadingToolsConfigs] = React.useState(false);
    const [toolsConfigDialogOpen, setToolsConfigDialogOpen] = React.useState(false);
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
    const [submittingToolsConfig, setSubmittingToolsConfig] = React.useState(false);

    // State for Tools Param Configs
    const [toolsParamConfigs, setToolsParamConfigs] = React.useState<NexusBuddyToolsParamConfig[]>([]);
    const [activeToolsParamConfigs, setActiveToolsParamConfigs] = React.useState<NexusBuddyToolsParamConfig[]>([]);
    const [loadingToolsParamConfigs, setLoadingToolsParamConfigs] = React.useState(false);
    const [toolsParamConfigDialogOpen, setToolsParamConfigDialogOpen] = React.useState(false);
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
        clientConfigId: 0,
    });
    const [selectedToolForParams, setSelectedToolForParams] = React.useState<number | null>(null);
    const [submittingToolsParamConfig, setSubmittingToolsParamConfig] = React.useState(false);

    // Load data functions
    const loadClientConfigs = useCallback(async () => {
        setLoadingClientConfigs(true);
        try {
            const [allResponse, activeResponse] = await Promise.all([
                getNexusBuddyClientConfigs(),
                getNexusBuddyActiveClientConfigs(),
            ]);
            setClientConfigs(allResponse || []);
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
                allResponse = byClient;
                activeResponse = byClient.filter((c) => c.isActive);
            } else {
                [allResponse, activeResponse] = await Promise.all([
                    getNexusBuddyToolsConfigs(),
                    getNexusBuddyActiveToolsConfigs(),
                ]);
            }
            setToolsConfigs(allResponse || []);
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
                allResponse = byTool;
                activeResponse = byTool.filter((c) => c.isActive);
            } else {
                [allResponse, activeResponse] = await Promise.all([
                    getNexusBuddyToolsParamConfigs(),
                    getNexusBuddyActiveToolsParamConfigs(),
                ]);
            }
            setToolsParamConfigs(allResponse || []);
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
        setSubmittingClientConfig(true);
        try {
            if (editingClientConfig) {
                await updateNexusBuddyClientConfig(editingClientConfig.clientConfigId, clientConfigForm);
                toast({ title: "Success", description: "Client config updated successfully" });
            } else {
                await createNexusBuddyClientConfig(clientConfigForm);
                toast({ title: "Success", description: "Client config created successfully" });
            }
            setClientConfigDialogOpen(false);
            setEditingClientConfig(null);
            setClientConfigForm({ clientName: "", connectionUrl: "", healthCheckPath: "", isActive: true });
            loadClientConfigs();
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        } finally {
            setSubmittingClientConfig(false);
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
        setClientConfigDialogOpen(true);
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

    // Tools Config Handlers
    const handleToolsConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingToolsConfig(true);
        try {
            if (editingToolsConfig) {
                await updateNexusBuddyToolsConfig(editingToolsConfig.toolsConfigId, toolsConfigForm);
                toast({ title: "Success", description: "Tools config updated successfully" });
            } else {
                await createNexusBuddyToolsConfig(toolsConfigForm);
                toast({ title: "Success", description: "Tools config created successfully" });
            }
            setToolsConfigDialogOpen(false);
            setEditingToolsConfig(null);
            setToolsConfigForm({
                toolName: "",
                toolDescription: "",
                endpoint: "",
                httpMethod: "GET",
                isActive: true,
                clientConfigId: selectedClientForTools || 0,
            });
            loadToolsConfigs(selectedClientForTools || undefined);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        } finally {
            setSubmittingToolsConfig(false);
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
        setToolsConfigDialogOpen(true);
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

    // Tools Param Config Handlers
    const handleToolsParamConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingToolsParamConfig(true);
        try {
            if (editingToolsParamConfig) {
                await updateNexusBuddyToolsParamConfig(editingToolsParamConfig.toolsParamConfigId, toolsParamConfigForm);
                toast({ title: "Success", description: "Tools param config updated successfully" });
            } else {
                await createNexusBuddyToolsParamConfig(toolsParamConfigForm);
                toast({ title: "Success", description: "Tools param config created successfully" });
            }
            setToolsParamConfigDialogOpen(false);
            setEditingToolsParamConfig(null);
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
            loadToolsParamConfigs(selectedToolForParams || undefined);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        } finally {
            setSubmittingToolsParamConfig(false);
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
            clientConfigId: config.toolsConfig?.clientConfigId || 0,
        });
        setToolsParamConfigDialogOpen(true);
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
                <DialogContent id="nexus-buddy-dialog-content" className="max-w-6xl max-h-[90vh] overflow-hidden">
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
                        <TabsContent value="clients" className="flex-1 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Client Configurations</h3>
                                <Button onClick={() => { setEditingClientConfig(null); setClientConfigForm({ clientName: "", connectionUrl: "", healthCheckPath: "", isActive: true }); setClientConfigDialogOpen(true); }}>
                                    Add Client Config
                                </Button>
                            </div>

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
                                            <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : clientConfigs.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-8">No client configs found</TableCell></TableRow>
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
                        <TabsContent value="tools" className="flex-1 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Tools Configurations</h3>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={activeClientConfigs.find((c) => c.clientConfigId === selectedClientForTools)?.clientName || "Select a client"}
                                        onValueChange={(v) => {
                                            const id = v === "all" ? null : v != null ? parseInt(v) : null;
                                            setSelectedClientForTools(id);
                                            loadToolsConfigs(id ?? undefined);
                                        }}
                                    >
                                        <SelectTrigger className="w-50">
                                            <SelectValue placeholder="Filter by client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Clients</SelectItem>
                                            {activeClientConfigs.map((c) => (
                                                <SelectItem key={c.clientConfigId} value={c.clientConfigId.toString()}>
                                                    {c.clientName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={() => { setEditingToolsConfig(null); setToolsConfigForm({ toolName: "", toolDescription: "", endpoint: "", httpMethod: "GET", isActive: true, clientConfigId: selectedClientForTools || 0 }); setToolsConfigDialogOpen(true); }} disabled={!selectedClientForTools}>
                                        Add Tools Config
                                    </Button>
                                </div>
                            </div>

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
                        <TabsContent value="params" className="flex-1 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Parameter Configurations</h3>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={selectedToolForParams?.toString() || ""}
                                        onValueChange={(v) => {
                                            const id = v ? parseInt(v) : null;
                                            setSelectedToolForParams(id);
                                            loadToolsParamConfigs(id ?? undefined);
                                        }}
                                    >
                                        <SelectTrigger className="w-[250px]">
                                            <SelectValue placeholder="Filter by tool" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Tools</SelectItem>
                                            {activeToolsConfigs.map((t) => (
                                                <SelectItem key={t.toolsConfigId} value={t.toolsConfigId.toString()}>
                                                    {t.toolName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={() => { setEditingToolsParamConfig(null); setToolsParamConfigForm({ paramName: "", paramType: "QUERY", dataType: "STRING", isRequired: false, defaultValue: "", requestBodyJson: "", isActive: true, toolsConfigId: selectedToolForParams || 0 }); setToolsParamConfigDialogOpen(true); }} disabled={!selectedToolForParams}>
                                        Add Param Config
                                    </Button>
                                </div>
                            </div>

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

                    <NexusBuddyClientConfigDialog
                        open={clientConfigDialogOpen}
                        onOpenChange={setClientConfigDialogOpen}
                        editingConfig={editingClientConfig}
                        form={clientConfigForm}
                        submitting={submittingClientConfig}
                        onFormChange={setClientConfigForm}
                        onSubmit={handleClientConfigSubmit}
                    />

                    <NexusBuddyToolsConfigDialog
                        open={toolsConfigDialogOpen}
                        onOpenChange={setToolsConfigDialogOpen}
                        editingConfig={editingToolsConfig}
                        form={toolsConfigForm}
                        submitting={submittingToolsConfig}
                        activeClientConfigs={activeClientConfigs}
                        onFormChange={setToolsConfigForm}
                        onSubmit={handleToolsConfigSubmit}
                    />

                    <NexusBuddyToolsParamConfigDialog
                        open={toolsParamConfigDialogOpen}
                        onOpenChange={setToolsParamConfigDialogOpen}
                        editingConfig={editingToolsParamConfig}
                        form={toolsParamConfigForm}
                        submitting={submittingToolsParamConfig}
                        activeClientConfigs={activeClientConfigs}
                        activeToolsConfigs={activeToolsConfigs}
                        onFormChange={setToolsParamConfigForm}
                        onSubmit={handleToolsParamConfigSubmit}
                    />
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
            <DialogContent className="max-w-6xl">
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
                    <TabsContent value="clients" className="flex-1 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Client Configurations</h3>
                            <Button onClick={() => { setEditingClientConfig(null); setClientConfigForm({ clientName: "", connectionUrl: "", healthCheckPath: "", isActive: true }); setClientConfigDialogOpen(true); }}>
                                Add Client Config
                            </Button>
                        </div>

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
                    <TabsContent value="tools" className="flex-1 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Tools Configurations</h3>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={activeClientConfigs.find((c) => c.clientConfigId === selectedClientForTools)?.clientName || "Select a client"}
                                    onValueChange={(v) => {
                                        const id = v === "all" ? null : v != null ? parseInt(v) : null;
                                        setSelectedClientForTools(id);
                                        loadToolsConfigs(id ?? undefined);
                                    }}
                                >
                                    <SelectTrigger className="w-50">
                                        <SelectValue placeholder="Filter by client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Clients</SelectItem>
                                        {activeClientConfigs.map((c) => (
                                            <SelectItem key={c.clientConfigId} value={c.clientConfigId.toString()}>
                                                {c.clientName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => { setEditingToolsConfig(null); setToolsConfigForm({ toolName: "", toolDescription: "", endpoint: "", httpMethod: "GET", isActive: true, clientConfigId: selectedClientForTools || 0 }); setToolsConfigDialogOpen(true); }} disabled={!selectedClientForTools}>
                                    Add Tools Config
                                </Button>
                            </div>
                        </div>

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
                    <TabsContent value="params" className="flex-1 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Parameter Configurations</h3>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={selectedToolForParams?.toString() || ""}
                                    onValueChange={(v) => {
                                        const id = v ? parseInt(v) : null;
                                        setSelectedToolForParams(id);
                                        loadToolsParamConfigs(id ?? undefined);
                                    }}
                                >
                                    <SelectTrigger className="w-[250px]">
                                        <SelectValue placeholder="Filter by tool" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Tools</SelectItem>
                                        {activeToolsConfigs.map((t) => (
                                            <SelectItem key={t.toolsConfigId} value={t.toolsConfigId.toString()}>
                                                {t.toolName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => { setEditingToolsParamConfig(null); setToolsParamConfigForm({ paramName: "", paramType: "QUERY", dataType: "STRING", isRequired: false, defaultValue: "", requestBodyJson: "", isActive: true, toolsConfigId: selectedToolForParams || 0 }); setToolsParamConfigDialogOpen(true); }} disabled={!selectedToolForParams}>
                                    Add Param Config
                                </Button>
                            </div>
                        </div>

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

                <NexusBuddyClientConfigDialog
                    open={clientConfigDialogOpen}
                    onOpenChange={setClientConfigDialogOpen}
                    editingConfig={editingClientConfig}
                    form={clientConfigForm}
                    submitting={submittingClientConfig}
                    onFormChange={setClientConfigForm}
                    onSubmit={handleClientConfigSubmit}
                />

                <NexusBuddyToolsConfigDialog
                    open={toolsConfigDialogOpen}
                    onOpenChange={setToolsConfigDialogOpen}
                    editingConfig={editingToolsConfig}
                    form={toolsConfigForm}
                    submitting={submittingToolsConfig}
                    activeClientConfigs={activeClientConfigs}
                    onFormChange={setToolsConfigForm}
                    onSubmit={handleToolsConfigSubmit}
                />

                <NexusBuddyToolsParamConfigDialog
                    open={toolsParamConfigDialogOpen}
                    onOpenChange={setToolsParamConfigDialogOpen}
                    editingConfig={editingToolsParamConfig}
                    form={toolsParamConfigForm}
                    submitting={submittingToolsParamConfig}
                    activeClientConfigs={activeClientConfigs}
                    activeToolsConfigs={activeToolsConfigs}
                    onFormChange={setToolsParamConfigForm}
                    onSubmit={handleToolsParamConfigSubmit}
                />
            </DialogContent>
        </Dialog>
    );
}

export default NexusBuddyConfigurationDialog;
