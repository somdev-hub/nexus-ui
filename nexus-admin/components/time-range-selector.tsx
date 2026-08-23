"use client";

import * as React from "react";
import { Calendar, ChevronDown } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Calendar as CalendarComponent,
} from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export type TimeRange = "24h" | "7d" | "30d" | "custom";

export interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
    customRange?: { from: Date; to: Date } | null;
    onCustomRangeChange?: (range: { from: Date; to: Date }) => void;
    className?: string;
}

const timeRangeOptions: { value: TimeRange; label: string; description: string }[] = [
    { value: "24h", label: "Last 24 hours", description: "Hourly granularity" },
    { value: "7d", label: "Last 7 days", description: "Daily granularity" },
    { value: "30d", label: "Last 30 days", description: "Daily granularity" },
    { value: "custom", label: "Custom range", description: "Select specific dates" },
];

export function TimeRangeSelector({
    value,
    onChange,
    customRange,
    onCustomRangeChange,
    className,
}: TimeRangeSelectorProps) {
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const [hoveredDate, setHoveredDate] = React.useState<Date | undefined>();

    const handleCustomRangeSelect = (dateRange: { from: Date | undefined; to?: Date | undefined } | undefined) => {
        if (!dateRange || !customRange) return;

        const { from, to } = dateRange;

        if (from && to) {
            onCustomRangeChange?.({ from, to });
            setPopoverOpen(false);
        }
    };

    const getCustomRangeLabel = () => {
        if (!customRange?.from) return "Select range";
        if (customRange.from && !customRange.to) return "Select end date";
        return `${format(customRange.from, "MMM d, yyyy")} - ${format(customRange.to, "MMM d, yyyy")}`;
    };

    const isDateInRange = (date: Date) => {
        if (!customRange?.from) return false;
        if (!customRange.to) return format(date, "yyyy-MM-dd") === format(customRange.from, "yyyy-MM-dd");
        return (
            startOfDay(date) >= startOfDay(customRange.from) &&
            startOfDay(date) <= startOfDay(customRange.to)
        );
    };

    const isDateHovered = (date: Date) => {
        if (!hoveredDate || !customRange?.from || customRange.to) return false;
        const start = startOfDay(customRange.from) < startOfDay(hoveredDate) ? customRange.from : hoveredDate;
        const end = startOfDay(customRange.from) < startOfDay(hoveredDate) ? hoveredDate : customRange.from;
        return startOfDay(date) >= startOfDay(start) && startOfDay(date) <= startOfDay(end);
    };

    return (
        <div className={`flex items-center gap-2 ${className || ""}`}>
            {/* Quick Select - Toggle Group for common ranges */}
            <ToggleGroup multiple={false} value={value ? [value] : undefined} onValueChange={(v) => onChange(v[0] as TimeRange)} className="hidden sm:flex">
                {timeRangeOptions.slice(0, 3).map((option) => (
                    <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3 py-1.5 text-sm gap-1"
                        aria-label={option.description}
                    >
                        {option.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>

            {/* Mobile Select Dropdown */}
            <Select value={value} onValueChange={(v) => v && onChange(v as TimeRange)}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                    {timeRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Custom Range Picker */}
            {value === "custom" && (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger>
                        <Button
                            variant="outline"
                            className="h-9 px-3 text-sm gap-1 min-w-50 justify-start"
                        >
                            <Calendar className="h-4 w-4" />
                            <span>{getCustomRangeLabel()}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" sideOffset={5}>
                        <CalendarComponent
                            mode="range"
                            selected={customRange ?? undefined}
                            onSelect={handleCustomRangeSelect}
                            numberOfMonths={2}
                            className="rounded-md border"
                        />
                    </PopoverContent>
                </Popover>
            )}

            {/* Desktop: Show custom range as button when not in custom mode */}
            {value !== "custom" && (
                <Button
                    variant="outline"
                    className="h-9 px-3 text-sm gap-1 hidden sm:flex"
                    onClick={() => onChange("custom")}
                >
                    <Calendar className="h-4 w-4" />
                    <span>Custom range</span>
                </Button>
            )}
        </div>
    );
}

// Helper to get date range from TimeRange
export function getDateRangeFromTimeRange(range: TimeRange): { from: Date; to: Date } {
    const now = new Date();
    const to = endOfDay(now);

    switch (range) {
        case "24h":
            return { from: startOfDay(subDays(now, 1)), to };
        case "7d":
            return { from: startOfDay(subDays(now, 7)), to };
        case "30d":
            return { from: startOfDay(subDays(now, 30)), to };
        default:
            return { from: startOfDay(subDays(now, 7)), to };
    }
}