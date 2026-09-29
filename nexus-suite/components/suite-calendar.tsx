'use client';

import { forwardRef, useEffect, useRef, type ElementRef, type Ref } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg } from '@fullcalendar/core';
import type { DatesSetArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';

// ─────────────────────────────────────────────────────────────
// SuiteCalendar — shared FullCalendar wrapper for every Nexus
// Suite portal (logistics, supplier, retailer), styled with the
// shadcn/ui theme (see app/suite-calendar.css).
// Per-activity-kind colors come from extendedProps.kind.
// Read-only: editable/selectable are off; clicks bubble up.
// ─────────────────────────────────────────────────────────────

interface SuiteCalendarProps {
    events: EventInput[];
    loading?: boolean;
    onDatesSet?: (arg: DatesSetArg) => void;
    onEventClick?: (arg: EventClickArg) => void;
    onDateClick?: (arg: DateClickArg) => void;
}

type CalendarApi = ElementRef<typeof FullCalendar>;

/** Stable empty source — real events are synced imperatively (see below). */
const EMPTY_EVENTS: EventInput[] = [];

const SuiteCalendar = forwardRef<CalendarApi, SuiteCalendarProps>(
    function SuiteCalendar({ events, onDatesSet, onEventClick, onDateClick }, ref) {
        const innerRef = useRef<CalendarApi>(null);

        // Merge the forwarded ref (page uses getApi() for day drill-down)
        // with the internal ref used for imperative event syncing.
        const setRefs = (instance: CalendarApi | null) => {
            innerRef.current = instance;
            const forwarded = ref as Ref<CalendarApi>;
            if (typeof forwarded === 'function') {
                forwarded(instance);
            } else if (forwarded && typeof forwarded === 'object') {
                (forwarded as { current: CalendarApi | null }).current = instance;
            }
        };

        // NOTE: filtered events (search, kind toggles) are applied through
        // the calendar API instead of relying on the `events` prop diffing
        // in resetOptions, which does not reliably rebuild array sources.
        useEffect(() => {
            const api = innerRef.current?.getApi();
            if (!api) return;
            api.removeAllEvents();
            if (events.length > 0) api.addEventSource(events);
        }, [events]);

        return (
            <div className="suite-calendar rounded-lg border bg-card p-2 sm:p-4 h-full">
                <FullCalendar
                    ref={setRefs}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,today,next',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                    }}
                    buttonText={{
                        today: 'Today',
                        month: 'Month',
                        week: 'Week',
                        day: 'Day',
                        list: 'Agenda',
                    }}
                    views={{
                        timeGridWeek: { dayMaxEvents: 6 },
                        timeGridDay: { dayMaxEvents: 8 },
                    }}
                    events={EMPTY_EVENTS}
                    datesSet={onDatesSet}
                    eventClick={onEventClick}
                    dateClick={onDateClick}
                    eventDidMount={(arg) => {
                        const kind = (arg.event.extendedProps as { kind?: string })
                            ?.kind;
                        if (kind) arg.el.setAttribute('data-kind', kind);
                    }}
                    navLinks
                    nowIndicator
                    dayMaxEvents={4}
                    eventMaxStack={4}
                    height="100%"
                    expandRows
                    editable={false}
                    selectable={false}
                    eventDisplay="block"
                    displayEventTime
                    fixedWeekCount={false}
                    showNonCurrentDates
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false,
                    }}
                />
            </div>
        );
    }
);

export default SuiteCalendar;
