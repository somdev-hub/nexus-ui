"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { NexusBuddyClientConfig, NexusBuddyClientConfigRequest, NexusBuddyToolsConfig, NexusBuddyToolsConfigRequest, NexusBuddyToolsParamConfig, NexusBuddyToolsParamConfigRequest } from "@/types/nexus-buddy";

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const paramTypes = ["QUERY", "PATH", "HEADER", "BODY"];
const dataTypes = ["STRING", "NUMBER", "BOOLEAN", "OBJECT", "ARRAY"];

interface NexusBuddyClientConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingConfig: NexusBuddyClientConfig | null;
    form: NexusBuddyClientConfigRequest;
    submitting: boolean;
    onFormChange: (form: NexusBuddyClientConfigRequest) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const NexusBuddyClientConfigDialog = ({
    open,
    onOpenChange,
    editingConfig,
    form,
    submitting,
    onFormChange,
    onSubmit,
}: NexusBuddyClientConfigDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingConfig ? "Edit Client Config" : "Create Client Config"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientName">Client Name *</Label>
                            <Input
                                id="clientName"
                                value={form.clientName}
                                onChange={(e) => onFormChange({ ...form, clientName: e.target.value })}
                                placeholder="Enter client name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="connectionUrl">Connection URL</Label>
                            <Input
                                id="connectionUrl"
                                value={form.connectionUrl || ""}
                                onChange={(e) => onFormChange({ ...form, connectionUrl: e.target.value })}
                                placeholder="https://api.example.com"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="healthCheckPath">Health Check Path</Label>
                            <Input
                                id="healthCheckPath"
                                value={form.healthCheckPath || ""}
                                onChange={(e) => onFormChange({ ...form, healthCheckPath: e.target.value })}
                                placeholder="/health"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-y-2">
                        <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={form.isActive}
                                onChange={(e) => onFormChange({ ...form, isActive: e.target.checked })}
                                className="rounded border-input"
                            />
                            Active
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : (editingConfig ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

interface NexusBuddyToolsConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingConfig: NexusBuddyToolsConfig | null;
    form: NexusBuddyToolsConfigRequest;
    submitting: boolean;
    activeClientConfigs: NexusBuddyClientConfig[];
    onFormChange: (form: NexusBuddyToolsConfigRequest) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const NexusBuddyToolsConfigDialog = ({
    open,
    onOpenChange,
    editingConfig,
    form,
    submitting,
    activeClientConfigs,
    onFormChange,
    onSubmit,
}: NexusBuddyToolsConfigDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingConfig ? "Edit Tools Config" : "Create Tools Config"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="toolName">Tool Name *</Label>
                            <Input
                                id="toolName"
                                value={form.toolName}
                                onChange={(e) => onFormChange({ ...form, toolName: e.target.value })}
                                placeholder="Enter tool name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endpoint">Endpoint *</Label>
                            <Input
                                id="endpoint"
                                value={form.endpoint}
                                onChange={(e) => onFormChange({ ...form, endpoint: e.target.value })}
                                placeholder="/api/v1/resource"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="toolDescription">Tool Description</Label>
                        <Textarea
                            id="toolDescription"
                            value={form.toolDescription || ""}
                            onChange={(e) => onFormChange({ ...form, toolDescription: e.target.value })}
                            placeholder="Optional description"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="httpMethod">HTTP Method</Label>
                            <Select value={form.httpMethod} onValueChange={(v) => onFormChange({ ...form, httpMethod: v || "GET" })}>
                                <SelectTrigger id="httpMethod" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {httpMethods.map((m) => (
                                        <SelectItem key={m} value={m}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientConfigId">Client Config *</Label>
                            <Select
                                value={form.clientConfigId > 0 ? activeClientConfigs.find(c => c.clientConfigId === form.clientConfigId)?.clientName : ""}
                                onValueChange={(v) => onFormChange({ ...form, clientConfigId: v ? parseInt(v) : 0 })}
                            >
                                <SelectTrigger id="clientConfigId" className="w-full">
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeClientConfigs.map((c) => (
                                        <SelectItem key={c.clientConfigId} value={c.clientConfigId.toString()}>
                                            {c.clientName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-y-2">
                        <Label htmlFor="toolsIsActive" className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                id="toolsIsActive"
                                checked={form.isActive}
                                onChange={(e) => onFormChange({ ...form, isActive: e.target.checked })}
                                className="rounded border-input"
                            />
                            Active
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : (editingConfig ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

interface NexusBuddyToolsParamConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingConfig: NexusBuddyToolsParamConfig | null;
    form: NexusBuddyToolsParamConfigRequest;
    submitting: boolean;
    activeClientConfigs: NexusBuddyClientConfig[];
    activeToolsConfigs: NexusBuddyToolsConfig[];
    onFormChange: (form: NexusBuddyToolsParamConfigRequest) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const NexusBuddyToolsParamConfigDialog = ({
    open,
    onOpenChange,
    editingConfig,
    form,
    submitting,
    activeClientConfigs,
    activeToolsConfigs,
    onFormChange,
    onSubmit,
}: NexusBuddyToolsParamConfigDialogProps) => {
    // Filter tools based on selected client
    console.log("[ACTIVE TOOLS CONFIGS]", activeToolsConfigs);
    const filteredToolsConfigs = (form.clientConfigId || 0) > 0
        ? activeToolsConfigs.filter(t => t.clientConfigId === (form.clientConfigId || 0))
        : activeToolsConfigs;
    console.log("[FILTERED TOOLS CONFIGS]", filteredToolsConfigs);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingConfig ? "Edit Parameter Config" : "Create Parameter Config"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="paramName">Parameter Name *</Label>
                            <Input
                                id="paramName"
                                value={form.paramName}
                                onChange={(e) => onFormChange({ ...form, paramName: e.target.value })}
                                placeholder="Enter parameter name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paramType">Parameter Type</Label>
                            <Select value={form.paramType} onValueChange={(v) => onFormChange({ ...form, paramType: v || "QUERY" })}>
                                <SelectTrigger id="paramType" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {paramTypes.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dataType">Data Type</Label>
                            <Select value={form.dataType} onValueChange={(v) => onFormChange({ ...form, dataType: v || "STRING" })}>
                                <SelectTrigger id="dataType" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {dataTypes.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientConfigId">Client Config</Label>
                            <Select
                                value={form.clientConfigId ? activeClientConfigs.find(c => c.clientConfigId === form.clientConfigId)?.clientName.toString() : ""}
                                onValueChange={(v) => onFormChange({ ...form, clientConfigId: v ? parseInt(v) : 0, toolsConfigId: 0 })}
                            >
                                <SelectTrigger id="clientConfigId" className="w-full">
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Select a client</SelectItem>
                                    {activeClientConfigs.map((c) => (
                                        <SelectItem key={c.clientConfigId} value={c.clientConfigId.toString()}>
                                            {c.clientName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="toolsConfigId">Tool *</Label>
                        <Select
                            value={form.toolsConfigId > 0 ? filteredToolsConfigs.find(t => t.toolsConfigId === form.toolsConfigId)?.toolName.toString() : ""}
                            onValueChange={(v) => onFormChange({ ...form, toolsConfigId: v ? parseInt(v) : 0 })}
                        >
                            <SelectTrigger id="toolsConfigId" className="w-full">
                                <SelectValue placeholder="Select tool" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Select a tool</SelectItem>
                                {filteredToolsConfigs.map((t) => (
                                    <SelectItem key={t.toolsConfigId} value={t.toolsConfigId.toString()}>
                                        {t.toolName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="defaultValue">Default Value</Label>
                        <Input
                            id="defaultValue"
                            value={form.defaultValue || ""}
                            onChange={(e) => onFormChange({ ...form, defaultValue: e.target.value })}
                            placeholder="Default value"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="requestBodyJson">Request Body JSON</Label>
                        <Textarea
                            id="requestBodyJson"
                            value={form.requestBodyJson || ""}
                            onChange={(e) => onFormChange({ ...form, requestBodyJson: e.target.value })}
                            placeholder='{"key": "value"}'
                            rows={2}
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={form.description || ""} onChange={(e) => onFormChange({ ...form, description: e.target.value })} placeholder="Describe what this parameter is for" rows={2} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-y-2">
                            <Label htmlFor="isRequired" className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="isRequired"
                                    checked={form.isRequired}
                                    onChange={(e) => onFormChange({ ...form, isRequired: e.target.checked })}
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
                                    checked={form.isActive}
                                    onChange={(e) => onFormChange({ ...form, isActive: e.target.checked })}
                                    className="rounded border-input"
                                />
                                Active
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : (editingConfig ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
