"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";

interface DatePickerProps {
    date?: Date;
    onDateChange?: (date: Date | undefined) => void;
    disabled?: (date: Date) => boolean;
    placeholder?: string;
}

export function DatePicker({
    date,
    onDateChange,
    disabled,
    placeholder = "Pick a date"
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (selectedDate: Date | undefined) => {
        onDateChange?.(selectedDate);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "max(w-50,w-full) justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                        date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric"
                        })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={date}
                    defaultMonth={date}
                    onSelect={handleSelect}
                    captionLayout="dropdown"
                    disabled={disabled}
                />
            </PopoverContent>
        </Popover>
    );
}
