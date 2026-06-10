"use client";

import EventOnboardDialog from "@/components/EventOnboardDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { eventData as eventDataTemp, perticularEventData } from "./event-data";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { HtmlEditorPreview } from "@/components/HtmlEditorPreview";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import {
  CreateEventTemplateResponse,
  getEventTemplateById,
  getEventTemplateByName,
  getEventTemplates,
  ShortEventTemplateResponse
} from "@/lib/auth-service";
import { Skeleton } from "@/components/ui/skeleton";

enum ParamType {
  BODY_PARAM = "BODY_PARAM",
  TITLE_PARAM = "TITLE_PARAM"
}

interface EventParam {
  key: string;
  defaultValue: string;
  paramType: ParamType;
  isRequired: boolean;
}

const EMPTY_PAIR: EventParam = {
  key: "",
  defaultValue: "",
  paramType: ParamType.BODY_PARAM,
  isRequired: false
};

const INITIAL_EVENT = {
  eventName: "",
  eventType: "",
  params: [] as EventParam[],
  // ← initialise with boilerplate so the editor is never empty
  templateHtml: ""
};

export default function Onboarding() {
  const { orgId } = useUserMetadata();
  const [searchName, setSearchName] = useState("");
  const [shortEventTemplates, setShortEventTemplates] = useState<
    ShortEventTemplateResponse[]
  >([]);
  const [eventData, setEventData] = useState(
    null as unknown as typeof INITIAL_EVENT
  );
  const [loading, setLoading] = useState({
    templates: false,
    particularTemplate: false,
    search: false
  });

  const [pairs, setPairs] = useState(
    perticularEventData.templateParams.map((param) => ({
      key: param.paramName,
      defaultValue: param.paramDefaultValue,
      paramType: param.templateParamType as ParamType,
      isRequired: param.isRequired
    }))
  );

  const addPair = () => setPairs((p) => [...p, { ...EMPTY_PAIR }]);

  const removePair = (index: number) => {
    if (pairs.length === 1) {
      setPairs([{ ...EMPTY_PAIR }]);
      return;
    }
    setPairs((p) => p.filter((_, i) => i !== index));
  };

  const updatePair = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    setPairs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // update eventData
    setEventData((prev) => {
      const nextParams = [...prev.params];
      nextParams[index] = { ...nextParams[index], [field]: value };
      return { ...prev, params: nextParams };
    });
  };

  const updateEventData = (field: string, value: string) =>
    setEventData((prev) => ({ ...prev, [field]: value }));

  const handleSubmitSearchByName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, search: true }));
    try {
      // Implement search logic here, e.g., filter shortEventTemplates based on eventData.eventName
      const response = await getEventTemplateByName(searchName, Number(orgId));
      if (response) {
        setShortEventTemplates([response]);
      }
    } catch (error) {
      console.error("Error searching event template by name:", error);
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  const handleSelectperticularEvent = async (templateId: number) => {
    try {
      setEventData(null as unknown as typeof INITIAL_EVENT);
      setLoading((prev) => ({ ...prev, particularTemplate: true }));
      const response: CreateEventTemplateResponse =
        await getEventTemplateById(templateId);
      if (response) {
        // update eventData with the selected template details
        setEventData((prev) => ({
          ...prev,
          eventName: response.templateName,
          eventType: response.eventTemplateType,
          params: response.templateParams.map((param) => ({
            key: param.paramName,
            defaultValue: param.paramDefaultValue,
            paramType: param.templateParamType as ParamType,
            isRequired: param.isRequired
          }))
        }));
        if (response.templateHtmlUrl) {
          const htmlResponse = await fetch(response.templateHtmlUrl);
          const html = await htmlResponse.text();
          setEventData((prev) => ({ ...prev, templateHtml: html }));
        }
      }
    } catch (error) {
      console.error("Error fetching event template by ID:", error);
    } finally {
      setLoading((prev) => ({ ...prev, particularTemplate: false }));
    }
  };

  useEffect(() => {
    const fetchEventTemplates = async () => {
      try {
        setLoading((prev) => ({ ...prev, templates: true }));
        const response = await getEventTemplates(Number(orgId));
        setShortEventTemplates(response);
      } catch (error) {
        console.error("Error fetching event templates:", error);
      } finally {
        setLoading((prev) => ({ ...prev, templates: false }));
      }
    };
    fetchEventTemplates();
  }, [orgId]);

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-3 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Onboarding</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Create and manage event templates for emails and internal
            communications.
          </p>
        </div>
        <EventOnboardDialog smallButton={true} />
      </section>
      <section>
        <Card className="p-4">
          <form
            action=""
            className=" flex justify-between items-end gap-2"
            onSubmit={handleSubmitSearchByName}
          >
            <div className="space-y-4 w-[90%]">
              <Label>Search for Event Templates</Label>
              <Input
                type="text"
                placeholder="Search by event name, type, or other criteria"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="w-[10%]">
              <Button className="w-full" type="submit">
                Search
              </Button>
            </div>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template ID</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>No. of Params</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortEventTemplates &&
                shortEventTemplates.length > 0 &&
                shortEventTemplates?.map((data) => (
                  <TableRow
                    key={data.eventTemplateId}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() =>
                      handleSelectperticularEvent(data.eventTemplateId)
                    }
                  >
                    <TableCell className="font-medium">
                      {data.eventTemplateId}
                    </TableCell>
                    <TableCell>{data.templateName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(data.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(data.updatedAt)}
                    </TableCell>
                    <TableCell>
                      {data.eventTemplateType === "EXTERNAL_MAIL_EVENT" ? (
                        <Badge variant="outline">External Mail Event</Badge>
                      ) : (
                        <Badge variant="outline">Internal Event</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {data.numberOfParams}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {eventData ? (
        <section>
          <Card className="p-4">
            <h3 className=" font-semibold mb-4">Event Template Details</h3>
            {/* Param pairs */}
            <div className="flex-1 space-y-3">
              <Label>Add template param pairs</Label>
              {pairs.map((pair, index) => (
                <div
                  key={index}
                  className="group relative rounded-md border border-border p-3 transition-colors hover:border-muted-foreground/50"
                >
                  <button
                    type="button"
                    onClick={() => removePair(index)}
                    disabled={pairs.length === 1}
                    aria-label="Remove row"
                    className="absolute -right-2.5 -top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm opacity-0 transition-opacity hover:border-destructive hover:text-destructive group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
                  >
                    <Minus className="h-3 w-3" />
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Param"
                      value={pair.key}
                      className="min-w-30 flex-1"
                      onChange={(e) => updatePair(index, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Default Value"
                      value={pair.defaultValue}
                      className="min-w-30 flex-1"
                      onChange={(e) =>
                        updatePair(index, "defaultValue", e.target.value)
                      }
                    />
                    <Select
                      value={pair.paramType}
                      onValueChange={(v) => updatePair(index, "paramType", v)}
                    >
                      <SelectTrigger className="min-w-40 flex-1">
                        <SelectValue placeholder="Select parameter type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ParamType.BODY_PARAM}>
                          Body Parameter
                        </SelectItem>
                        <SelectItem value={ParamType.TITLE_PARAM}>
                          Title Parameter
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`switch-${index}`}
                        checked={pair.isRequired}
                        onCheckedChange={(v) =>
                          updatePair(index, "isRequired", v)
                        }
                      />
                      <Label htmlFor={`switch-${index}`}>Required</Label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addPair}
                    aria-label="Add row below"
                    className="absolute -bottom-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm opacity-0 transition-opacity hover:border-primary hover:text-primary group-hover:opacity-100"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* HTML editor — controlled, pre-seeded with boilerplate */}
            <HtmlEditorPreview
              value={eventData.templateHtml}
              onChange={(html) => updateEventData("templateHtml", html)}
            />
          </Card>
        </section>
      ) : loading.particularTemplate ? (
        <SkeletonEventTemplateCard />
      ) : (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">
            Select an event template to view details
          </p>
        </div>
      )}
    </div>
  );
}

const SkeletonEventTemplateCard = () => (
  <Card className="p-4 animate-pulse">
    <Skeleton className="h-4 bg-muted rounded w-1/3 mb-2"></Skeleton>
    <Skeleton className="h-3 bg-muted rounded w-1/2 mb-1"></Skeleton>
    <Skeleton className="h-3 bg-muted rounded w-1/4 mb-1"></Skeleton>
    <Skeleton className="h-3 bg-muted rounded w-1/5"></Skeleton>
  </Card>
);
