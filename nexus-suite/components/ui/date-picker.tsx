'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
    date?: Date;
    onDateChange?: (date: Date | undefined) => void;
    disabled?: (date: Date) => boolean;
    placeholder?: string;
    /** When true, also capture a time of day. */
    withTime?: boolean;
    className?: string;
    /** Allow selecting dates before today. Defaults to false. */
    allowPast?: boolean;
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

export function DatePicker({
    date,
    onDateChange,
    disabled,
    placeholder = 'Pick a date',
    withTime = false,
    className,
    allowPast = false,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const timeValue = date
        ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
        : '';

    const handleSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            onDateChange?.(undefined);
            if (!withTime) setOpen(false);
            return;
        }
        const next = new Date(selectedDate);
        if (date) {
            next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        } else if (withTime) {
            next.setHours(0, 0, 0, 0);
        } else {
            next.setHours(0, 0, 0, 0);
        }
        onDateChange?.(next);
        if (!withTime) setOpen(false);
    };

    const handleTimeChange = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const base = date ?? new Date();
        const next = new Date(base);
        next.setHours(
            Number.isFinite(h) ? h : 0,
            Number.isFinite(m) ? m : 0,
            0,
            0
        );
        onDateChange?.(next);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal py-4.5',
                        !date && 'text-muted-foreground',
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                        withTime
                            ? date.toLocaleString('en-US', {
                                  month: 'short',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: '2-digit',
                                  year: 'numeric',
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
                    startMonth={new Date(2000, 0)}
                    endMonth={new Date(new Date().getFullYear() + 25, 11)}
                    disabled={(d) => {
                        if (!allowPast) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (d < today) return true;
                        }
                        return disabled ? disabled(d) : false;
                    }}
                />
                {withTime && (
                    <div className="grid gap-2 border-t p-3 w-full">
                        <Input
                            type="time"
                            value={timeValue}
                            onChange={(e) => handleTimeChange(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                                onClick={() => onDateChange?.(undefined)}
                            >
                                Clear
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="flex-1"
                                onClick={() => setOpen(false)}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}