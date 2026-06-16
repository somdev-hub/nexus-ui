"use client";

import { Card, CardContent } from "./ui/card";
import { Minus, PartyPopper, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "./ui/dialog";
import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "./ui/select";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
    HtmlEditorPreview,
    BOILERPLATE as HTML_BOILERPLATE
} from "./HtmlEditorPreview";
import { createEventTemplate } from "@/lib/auth-service";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "./ui/spinner";

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
    subject: "",
    params: [] as EventParam[],
    // ← initialise with boilerplate so the editor is never empty
    templateHtml: HTML_BOILERPLATE
};

const EventOnboardDialog = ({ smallButton }: { smallButton?: boolean }) => {
    const { userId, orgId } = useUserMetadata();
    const { toast } = useToast();
    const [eventData, setEventData] = useState(INITIAL_EVENT);
    const [open, setOpen] = useState(false);
    const [pairs, setPairs] = useState<EventParam[]>([{ ...EMPTY_PAIR }]);
    const [loading, setLoading] = useState({
        saveTemplate: false,
    });

    const addPair = () => setPairs((p) => [...p, { ...EMPTY_PAIR }]);

    const removePair = (index: number) => {
        if (pairs.length === 1) {
            setPairs([{ ...EMPTY_PAIR }]);
            return;
        }
        setPairs((p) => p.filter((_, i) => i !== index));
    };

    const updateEventData = (field: string, value: string) =>
        setEventData((prev) => ({ ...prev, [field]: value }));

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

    const onClose = () => {
        setOpen(false);
        setEventData(INITIAL_EVENT);
        setPairs([{ ...EMPTY_PAIR }]);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Event Data:", eventData);
        console.log("Parameter Pairs:", pairs);
        try {
            setLoading({ ...loading, saveTemplate: true });
            const response = await createEventTemplate({
                templateName: eventData.eventName,
                eventTemplateType: eventData.eventType,
                eventSubject: eventData.subject,
                orgId: Number(orgId),
                templateParams: pairs.map((pair) => ({
                    paramName: pair.key,
                    paramDefaultValue: pair.defaultValue,
                    templateParamType: pair.paramType,
                    isRequired: pair.isRequired
                })),
                templateHtml: eventData.templateHtml
            });
            if (response) {
                toast({
                    title: "Event Created",
                    description: "The event template has been created successfully.",
                    variant: "default"
                });
                onClose();
            }
        } catch (e) {
            console.error("Error submitting event data:", e);
            toast({
                title: "Error",
                description: "Failed to create event template.",
                variant: "destructive"
            });
        }
        finally {
            setLoading({ ...loading, saveTemplate: false });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {smallButton ? (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" >
                        Onboard Event
                    </Button>
                </DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Card className="p-4 items-center justify-center gap-2 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
                        <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
                            <PartyPopper />
                            <p className="font-medium">Onboard Event</p>
                        </CardContent>
                    </Card>
                </DialogTrigger>
            )}

            <DialogContent className="max-w-6xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                    <DialogTitle>Onboard Event</DialogTitle>
                    <DialogDescription>Welcome to the onboard event!</DialogDescription>
                </DialogHeader>

                <form className="space-y-5" onSubmit={onSubmit}>
                    {/* Event name + type row */}
                    <div className="flex justify-between items-center gap-6 w-full">
                        <div className="flex-1 space-y-3">
                            <Label htmlFor="event-name">Event Name</Label>
                            <Input
                                id="event-name"
                                placeholder="Enter event name"
                                value={eventData.eventName}
                                onChange={(e) => updateEventData("eventName", e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-3">
                            <Label htmlFor="event-type">Event Type</Label>
                            <Select
                                value={eventData.eventType}
                                onValueChange={(v) => updateEventData("eventType", v)}
                            >
                                <SelectTrigger className="w-full mb-0">
                                    <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXTERNAL_MAIL_TEMPLATE">
                                        External Mail Template
                                    </SelectItem>
                                    <SelectItem value="INTERNAL_NOTIFICATION_TEMPLATE">
                                        Internal Notification Template
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="">
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input
                                placeholder="Enter the subject of the email"
                                value={eventData.subject ?? ""}
                                onChange={(e) => updateEventData("subject", e.target.value)}
                            />
                        </div>
                    </div>

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

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading.saveTemplate}>
                            {loading.saveTemplate ? <Spinner /> : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EventOnboardDialog;
