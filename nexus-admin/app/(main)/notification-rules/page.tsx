"use client";

import * as React from "react";
import { Loader2, RefreshCw, Plus, Pencil, Trash2, Bell, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deactivatePolicy,
  EVENT_TYPE_LABELS,
  SEVERITY_OPTIONS,
  ADDRESS_TO_OPTIONS,
  PLACEHOLDERS,
  ENTITY_STATUSES,
  type NotificationPolicyRule,
  type PaginatedPolicies,
} from "@/lib/notification-policies";

// ---------------------------------------------------------------------------
// Reusable pagination controls
// ---------------------------------------------------------------------------

function TablePagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (p: number) => void;
}) {
  if (totalElements === 0) return null;
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <span className="text-sm text-muted-foreground">
        {totalElements} total
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-sm">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NotificationRulesPage() {
  const [entityPage, setEntityPage] = React.useState(0);
  const [entityPageSize] = React.useState(5);
  const [entities, setEntities] = React.useState<
    { eventType: string; total: number; active: number; inactive: number; policies: NotificationPolicyRule[]; expanded: boolean }[]
  >([]);
  const [expandedEntity, setExpandedEntity] = React.useState<string | null>(null);
  const [transitionPage, setTransitionPage] = React.useState<Record<string, number>>({});
  const [transitionData, setTransitionData] = React.useState<Record<string, PaginatedPolicies>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<NotificationPolicyRule | null>(null);

  // Form state
  const [formEventType, setFormEventType] = React.useState("");
  const [formPrevStatus, setFormPrevStatus] = React.useState("");
  const [formNewStatus, setFormNewStatus] = React.useState("");
  const [formSeverity, setFormSeverity] = React.useState("INFO");
  const [formAddressTo, setFormAddressTo] = React.useState("COUNTERPARTY");
  const [formTitle, setFormTitle] = React.useState("");
  const [formBody, setFormBody] = React.useState("");
  const [formActive, setFormActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Fetch all policies to build entity summary (entities are few, ~7)
  const loadEntities = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPolicies(0, 1000);
      // Group by eventType
      const grouped: Record<string, NotificationPolicyRule[]> = {};
      for (const p of result.content) {
        if (!grouped[p.eventType]) grouped[p.eventType] = [];
        grouped[p.eventType].push(p);
      }
      const entityList = Object.entries(grouped).map(([eventType, policies]) => ({
        eventType,
        total: policies.length,
        active: policies.filter((p) => p.isActive).length,
        inactive: policies.filter((p) => !p.isActive).length,
        policies,
        expanded: false,
      }));
      setEntities(entityList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // Fetch transitions for an entity when expanded or page changes
  const loadTransitions = React.useCallback(async (eventType: string, page: number) => {
    try {
      const result = await fetchPolicies(page, 10, eventType);
      setTransitionData((prev) => ({ ...prev, [eventType]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transitions");
    }
  }, []);

  const toggleExpand = (eventType: string) => {
    setEntities((prev) =>
      prev.map((e) =>
        e.eventType === eventType ? { ...e, expanded: !e.expanded } : e
      )
    );
    if (!transitionData[eventType]) {
      setTransitionPage((prev) => ({ ...prev, [eventType]: 0 }));
      loadTransitions(eventType, 0);
    }
  };

  const handleTransitionPageChange = (eventType: string, newPage: number) => {
    setTransitionPage((prev) => ({ ...prev, [eventType]: newPage }));
    loadTransitions(eventType, newPage);
  };

  const openCreate = () => {
    setEditingPolicy(null);
    setFormEventType("");
    setFormPrevStatus("");
    setFormNewStatus("");
    setFormSeverity("INFO");
    setFormAddressTo("COUNTERPARTY");
    setFormTitle("");
    setFormBody("");
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (p: NotificationPolicyRule) => {
    setEditingPolicy(p);
    setFormEventType(p.eventType);
    setFormPrevStatus(p.previousStatus || "");
    setFormNewStatus(p.newStatus);
    setFormSeverity(p.severity);
    setFormAddressTo(p.addressTo);
    setFormTitle(p.titleTemplate);
    setFormBody(p.bodyTemplate || "");
    setFormActive(p.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        eventType: formEventType,
        previousStatus: formPrevStatus || null,
        newStatus: formNewStatus,
        severity: formSeverity,
        addressing: "ORG",
        addressTo: formAddressTo,
        titleTemplate: formTitle,
        bodyTemplate: formBody,
        isActive: formActive,
      };
      if (editingPolicy) {
        await updatePolicy(editingPolicy.policyId, payload);
      } else {
        await createPolicy(payload);
      }
      setDialogOpen(false);
      await loadEntities();
      // Refresh expanded entity transitions
      if (expandedEntity) {
        const pg = transitionPage[expandedEntity] || 0;
        await loadTransitions(expandedEntity, pg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await deactivatePolicy(id);
      await loadEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivate failed");
    }
  };

  const insertPlaceholder = (placeholder: string, target: "title" | "body") => {
    if (target === "title") setFormTitle((t) => t + placeholder);
    else setFormBody((t) => t + placeholder);
  };

  const placeholders = PLACEHOLDERS[formEventType] || [];
  const entityStatuses = ENTITY_STATUSES[formEventType] || [];

  // Paginate entities client-side
  const totalEntityPages = Math.ceil(entities.length / entityPageSize);
  const pagedEntities = entities.slice(entityPage * entityPageSize, (entityPage + 1) * entityPageSize);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Rules</h1>
          <p className="text-muted-foreground mt-1">
            Master control: configure which notifications are sent, to whom, and what they say
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Rule
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <>

      {/* Parent Entity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Entities</CardTitle>
          <CardDescription>
            {entities.length} entity types with notification rules. Click a row to expand transitions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="text-right">Total Transitions</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Inactive</TableHead>
                <TableHead>Entity Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedEntities.map((entity) => (
                <React.Fragment key={entity.eventType}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(entity.eventType)}
                  >
                    <TableCell>
                      {entity.expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {EVENT_TYPE_LABELS[entity.eventType] || entity.eventType}
                    </TableCell>
                    <TableCell className="text-right">{entity.total}</TableCell>
                    <TableCell className="text-right text-green-600">{entity.active}</TableCell>
                    <TableCell className="text-right text-red-600">{entity.inactive}</TableCell>
                    <TableCell>
                      <Badge variant={entity.active > 0 ? "default" : "outline"}>
                        {entity.active > 0 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {entity.expanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 bg-muted/20">
                        <div className="p-4">
                          <h4 className="text-sm font-semibold mb-2">
                            Transitions for {EVENT_TYPE_LABELS[entity.eventType] || entity.eventType}
                          </h4>
                          {transitionData[entity.eventType] ? (
                            <>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Transition</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Notify</TableHead>
                                    <TableHead>Title Template</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transitionData[entity.eventType].content.map((p) => (
                                    <TableRow key={p.policyId}>
                                      <TableCell className="text-xs">
                                        {p.previousStatus ? `${p.previousStatus} → ` : "Any → "}{p.newStatus}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={p.severity === "CRITICAL" ? "destructive" : p.severity === "WARNING" ? "secondary" : "outline"}>
                                          {p.severity}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs">{p.addressTo}</TableCell>
                                      <TableCell className="max-w-[200px] truncate text-xs">{p.titleTemplate}</TableCell>
                                      <TableCell>
                                        <Badge variant={p.isActive ? "default" : "outline"}>
                                          {p.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          {p.isActive && (
                                            <Button size="sm" variant="ghost" onClick={() => handleDeactivate(p.policyId)}>
                                              <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              <TablePagination
                                page={transitionPage[entity.eventType] || 0}
                                totalPages={transitionData[entity.eventType].totalPages}
                                totalElements={transitionData[entity.eventType].totalElements}
                                onPageChange={(p) => handleTransitionPageChange(entity.eventType, p)}
                              />
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-20">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={entityPage}
            totalPages={totalEntityPages}
            totalElements={entities.length}
            onPageChange={setEntityPage}
          />
        </CardContent>
      </Card>
      </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Edit Notification Rule" : "New Notification Rule"}</DialogTitle>
            <DialogDescription>
              Configure when and how a notification is sent
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Entity Type</Label>
                <Select value={formEventType} onValueChange={(v) => setFormEventType(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v ?? "INFO")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Previous Status (optional)</Label>
                <Select value={formPrevStatus} onValueChange={(v) => setFormPrevStatus(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Any previous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any previous</SelectItem>
                    {(ENTITY_STATUSES[formEventType] || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>New Status (required)</Label>
                <Select value={formNewStatus} onValueChange={(v) => setFormNewStatus(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {(ENTITY_STATUSES[formEventType] || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notify (Address To)</Label>
              <Select value={formAddressTo} onValueChange={(v) => setFormAddressTo(v ?? "COUNTERPARTY")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADDRESS_TO_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title Template</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Order {poNumber} acknowledged"
              />
              {placeholders.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {placeholders.map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted/80"
                      onClick={() => insertPlaceholder(ph, "title")}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Body Template</Label>
              <Textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="e.g. {supplierName} acknowledged order {poNumber}..."
                rows={3}
              />
              {placeholders.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {placeholders.map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted/80"
                      onClick={() => insertPlaceholder(ph, "body")}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formActive} onCheckedChange={(v) => setFormActive(v === true)} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formEventType || !formNewStatus || !formTitle}>
              {saving ? "Saving..." : editingPolicy ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}