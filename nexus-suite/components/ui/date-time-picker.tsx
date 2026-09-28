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

interface DateTimePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Pick date & time',
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);

    const timeValue = value ? `${pad(value.getHours())}:${pad(value.getMinutes())}` : '';

    const handleDateSelect = (selected: Date | undefined) => {
        if (!selected) {
            onChange?.(undefined);
            return;
        }
        const next = new Date(selected);
        if (value) {
            next.setHours(value.getHours(), value.getMinutes(), 0, 0);
        } else {
            next.setHours(0, 0, 0, 0);
        }
        onChange?.(next);
    };

    const handleTimeChange = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const base = value ?? new Date();
        const next = new Date(base);
        next.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
        onChange?.(next);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'w-52 justify-start text-left font-normal',
                        !value && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                        value.toLocaleString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    defaultMonth={value}
                    onSelect={handleDateSelect}
                    captionLayout="dropdown"
                />
                <div className="grid gap-2 border-t p-3">
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
                            onClick={() => onChange?.(undefined)}
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
            </PopoverContent>
        </Popover>
    );
}
