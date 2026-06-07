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
import { HtmlEditorPreview } from "./HtmlEditorPreview";

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

const EventOnboardDialog = () => {
  const [eventData, setEventData] = useState<{
    eventName: string;
    eventType: string;
    params: EventParam[];
  }>({
    eventName: "",
    eventType: "",
    params: []
  });
  const [open, setOpen] = useState(false);
  const [pairs, setPairs] = useState<
    {
      key: string;
      defaultValue: string;
      paramType: ParamType;
      isRequired: boolean;
    }[]
  >([
    {
      key: "",
      defaultValue: "",
      paramType: ParamType.BODY_PARAM,
      isRequired: false
    }
  ]);
  const addPair = () => {
    setPairs([
      ...pairs,
      {
        key: "",
        defaultValue: "",
        paramType: ParamType.BODY_PARAM,
        isRequired: false
      }
    ]);
  };
  const removePair = (index: number) => {
    if (pairs.length === 1) {
      setPairs([
        {
          key: "",
          defaultValue: "",
          paramType: ParamType.BODY_PARAM,
          isRequired: false
        }
      ]);
      return;
    }
    const newPairs = [...pairs];
    newPairs.splice(index, 1);
    setPairs(newPairs);
  };
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const updateEventData = (field: string, value: any) => {
    setEventData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Card className="p-4 items-center justify-center gap-2 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
            <PartyPopper />
            <p className="font-medium">Onboard Event</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90dvh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Onboard Event</DialogTitle>
          <DialogDescription>Welcome to the onboard event!</DialogDescription>
        </DialogHeader>
        <form className="space-y-5">
          <div className="flex justify-between item-center gap-6 w-full">
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
                onValueChange={(value) => updateEventData("eventType", value)}
              >
                <SelectTrigger className="w-full">
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
          <div className="flex-1 space-y-3">
            <Label>Add template param pairs</Label>

            {pairs.map((pair, index) => (
              <div
                key={index}
                className="group relative rounded-md border border-border p-3 transition-colors hover:border-muted-foreground/50"
              >
                {/* ── Minus button — top-right corner, shown on hover ── */}
                <button
                  type="button"
                  onClick={() => removePair(index)}
                  disabled={pairs.length === 1}
                  aria-label="Remove row"
                  className="
              absolute -right-2.5 -top-2.5 z-10
              flex h-5 w-5 items-center justify-center
              rounded-full border border-border bg-background
              text-muted-foreground shadow-sm
              opacity-0 transition-opacity
              hover:border-destructive hover:text-destructive
              group-hover:opacity-100
              disabled:pointer-events-none disabled:opacity-0
            "
                >
                  <Minus className="h-3 w-3" />
                </button>

                {/* ── Row contents ── */}
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Param"
                    value={pair.key}
                    className="min-w-30 flex-1"
                    //   onChange={(e) => updatePair(index, "key", e.target.value)}
                  />
                  <Input
                    placeholder="Default Value"
                    value={pair.defaultValue}
                    className="min-w-30 flex-1"
                    //   onChange={(e) =>
                    //     updatePair(index, "defaultValue", e.target.value)
                    //   }
                  />
                  <Select
                  //   value={pair.type}
                  //   onValueChange={(v) => updatePair(index, "type", v)}
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
                      // checked={pair.required}
                      // onCheckedChange={(v) => updatePair(index, "required", v)}
                    />
                    <Label htmlFor={`switch-${index}`}>Required</Label>
                  </div>
                </div>

                {/* ── Plus button — bottom-center border, shown on hover ── */}
                <button
                  type="button"
                  onClick={addPair}
                  aria-label="Add row below"
                  className="
              absolute -bottom-2.5 left-1/2 z-10
              flex h-5 w-5 -translate-x-1/2 items-center justify-center
              rounded-full border border-border bg-background
              text-muted-foreground shadow-sm
              opacity-0 transition-opacity
              hover:border-primary hover:text-primary
              group-hover:opacity-100
            "
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <HtmlEditorPreview />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventOnboardDialog;
