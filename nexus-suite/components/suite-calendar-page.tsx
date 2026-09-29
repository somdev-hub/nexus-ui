'use client';

import { useCallback, useMemo, useRef, useState, type ElementRef } from 'react';
import Link from 'next/link';
import type FullCalendar from '@fullcalendar/react';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { CalendarDays, ExternalLink, ListFilter } from 'lucide-react';
import SuiteCalendar from '@/components/suite-calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer';
import type {
	CalendarActivity,
	CalendarKindMeta,
} from '@/lib/services/calendar-service';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────
// SuiteCalendarPage — shared day/week/month agenda calendar used
// by the logistics, supplier and retailer portals. Each portal
// passes its own title, activity kinds, fetcher and nav links.
// ─────────────────────────────────────────────────────────────

const KIND_DOT: Record<string, string> = {
	pickup: 'bg-blue-600',
	delivery: 'bg-green-600',
	eta: 'bg-teal-600',
	stop: 'bg-purple-600',
	appointment: 'bg-orange-600',
	maintenance: 'bg-yellow-600',
	incident: 'bg-red-600',
	capacity: 'bg-slate-500',
	order: 'bg-blue-600',
	quotation: 'bg-amber-600',
	forecast: 'bg-purple-600',
	cert: 'bg-red-600',
	purchase: 'bg-blue-600',
	invoice: 'bg-yellow-600',
	receipt: 'bg-emerald-600',
};

function dotFor(kind: string): string {
	return KIND_DOT[kind] ?? 'bg-slate-400';
}

function formatWhen(a: CalendarActivity): string {
	const start = new Date(a.start);
	const date = start.toLocaleDateString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
	if (a.allDay) return `${date} · all day`;
	const time = start.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	});
	if (a.end) {
		const endTime = new Date(a.end).toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
		});
		return `${date} · ${time} – ${endTime}`;
	}
	return `${date} · ${time}`;
}

export interface SuiteCalendarPageProps {
	title: string;
	subtitle: string;
	kinds: CalendarKindMeta[];
	fetchActivities: (start: Date, end: Date) => Promise<CalendarActivity[]>;
	links: { label: string; href: string }[];
}

export default function SuiteCalendarPage({
	title,
	subtitle,
	kinds,
	fetchActivities,
	links,
}: SuiteCalendarPageProps) {
	const { toast } = useToast();
	const calendarRef = useRef<ElementRef<typeof FullCalendar>>(null);
	const lastRangeKey = useRef<string | null>(null);
	const [activities, setActivities] = useState<CalendarActivity[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeKinds, setActiveKinds] = useState<Set<string>>(
		() => new Set(kinds.map((k) => k.value))
	);
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<CalendarActivity | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	const loadRange = useCallback(
		async (start: Date, end: Date) => {
			const key = `${start.toISOString()}_${end.toISOString()}`;
			if (lastRangeKey.current === key) return;
			lastRangeKey.current = key;
			setLoading(true);
			try {
				setActivities(await fetchActivities(start, end));
			} catch (e: unknown) {
				toast({
					title: e instanceof Error ? e.message : String(e),
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		},
		[fetchActivities, toast]
	);

	const handleDatesSet = useCallback(
		(arg: DatesSetArg) => {
			void loadRange(arg.start, arg.end);
		},
		[loadRange]
	);

	const handleEventClick = useCallback((arg: EventClickArg) => {
		const activity = arg.event.extendedProps as CalendarActivity;
		setSelected({ ...activity, title: arg.event.title });
		setDetailOpen(true);
	}, []);

	const handleDateClick = useCallback((arg: DateClickArg) => {
		calendarRef.current?.getApi().changeView('timeGridDay', arg.dateStr);
	}, []);

	const toggleKind = useCallback((kind: string) => {
		setActiveKinds((prev) => {
			const next = new Set(prev);
			if (next.has(kind)) next.delete(kind);
			else next.add(kind);
			return next;
		});
	}, []);

	const resetFilters = useCallback(() => {
		setActiveKinds(new Set(kinds.map((k) => k.value)));
		setSearch('');
	}, [kinds]);

	const counts = useMemo(() => {
		const map = new Map<string, number>();
		for (const a of activities) map.set(a.kind, (map.get(a.kind) ?? 0) + 1);
		return map;
	}, [activities]);

	const events: EventInput[] = useMemo(() => {
		const q = search.trim().toLowerCase();
		return activities
			.filter((a) => activeKinds.has(a.kind))
			.filter((a) =>
				q
					? `${a.title} ${a.shipmentNumber ?? ''} ${a.description ?? ''} ${a.location ?? ''}`
						.toLowerCase()
						.includes(q)
					: true
			)
			.map((a) => ({
				id: a.id,
				title: a.title,
				start: a.start,
				end: a.end,
				allDay: a.allDay,
				extendedProps: { ...a },
			}));
	}, [activities, activeKinds, search]);

	const todayCount = useMemo(() => {
		const today = new Date().toDateString();
		return activities.filter(
			(a) => new Date(a.start).toDateString() === today
		).length;
	}, [activities]);

	const kindLabel = (kind: string) =>
		kinds.find((k) => k.value === kind)?.label ?? kind;

	return (
		<div className="p-4 lg:p-6 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold flex items-center gap-2">
						<CalendarDays className="h-6 w-6 text-muted-foreground" />
						{title}
					</h1>
					<p className="text-sm text-muted-foreground">{subtitle}</p>
				</div>
				<div className="flex gap-2">
					{links.map((l) => (
						<Button
							key={l.href}
							asChild
							variant="outline"
							size="sm"
						>
							<Link href={l.href}>{l.label}</Link>
						</Button>
					))}
				</div>
			</div>

			<Card className="p-3 gap-0">
				<CardContent className="p-0 flex flex-wrap items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<ListFilter className="mr-2 h-3.5 w-3.5" />
								Filters
								<Badge
									variant="secondary"
									className="ml-2 text-xs"
								>
									{activeKinds.size}/{kinds.length}
								</Badge>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-60">
							<DropdownMenuLabel>
								Activity types
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{kinds.map((k) => (
								<DropdownMenuCheckboxItem
									key={k.value}
									checked={activeKinds.has(k.value)}
									onCheckedChange={() =>
										toggleKind(k.value)
									}
								>
									<span
										className={`mr-1 h-2 w-2 rounded-full ${dotFor(k.value)}`}
									/>
									{k.label}
									<span className="ml-auto text-xs text-muted-foreground">
										{counts.get(k.value) ?? 0}
									</span>
								</DropdownMenuCheckboxItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={resetFilters}>
								Reset all filters
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Input
						placeholder="Search activities…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-8 max-w-55"
					/>
					<span className="ml-auto text-xs text-muted-foreground">
						{loading
							? 'Loading…'
							: `${events.length} shown · ${todayCount} today`}
					</span>
				</CardContent>
			</Card>

			{/* NOTE: the calendar must always be mounted — its `datesSet`
                callback is what triggers the activity fetch. */}
			<div className="relative h-[calc(100dvh-16rem)] min-h-135">
				{loading && (
					<div className="absolute inset-x-0 top-0 z-10 h-1 overflow-hidden rounded-t-lg bg-muted">
						<div className="h-full w-full origin-left animate-pulse bg-primary/70" />
					</div>
				)}
				<SuiteCalendar
					ref={calendarRef}
					events={events}
					loading={loading}
					onDatesSet={handleDatesSet}
					onEventClick={handleEventClick}
					onDateClick={handleDateClick}
				/>
			</div>

			<Drawer
				swipeDirection="right"
				open={detailOpen}
				onOpenChange={setDetailOpen}
			>
				<DrawerContent className="sm:max-w-md m-2 rounded-xl">
					<DrawerHeader>
						<DrawerTitle>{selected?.title}</DrawerTitle>
						<DrawerDescription>
							{selected && formatWhen(selected)}
						</DrawerDescription>
					</DrawerHeader>
					{/* <div className="flex flex-col h-full justify-between"> */}
						{selected && (
							<div className="grid gap-3 px-4 text-sm flex-1 overflow-y-auto min-h-0 pb-2 content-start">
								<div className="flex flex-wrap gap-2">
									<Badge variant="outline">
										{kindLabel(selected.kind)}
									</Badge>
									{selected.status && (
										<Badge
											variant={
												selected.kind === 'incident' ||
													selected.kind === 'cert'
													? 'destructive'
													: 'secondary'
											}
										>
											{selected.status}
										</Badge>
									)}
								</div>
								{selected.shipmentNumber && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Shipment
										</span>
										<span className="font-medium">
											{selected.shipmentNumber}
											{selected.shipmentId != null &&
												` · #${selected.shipmentId}`}
										</span>
									</div>
								)}
								{selected.location && (
									<div className="flex justify-between gap-4">
										<span className="text-muted-foreground">
											Location
										</span>
										<span className="font-medium text-right">
											{selected.location}
										</span>
									</div>
								)}
								{selected.description && (
									<div>
										<span className="text-muted-foreground">
											Details
										</span>
										<div className="font-medium">
											{selected.description}
										</div>
									</div>
								)}
							</div>
						)}
						<DrawerFooter className="shrink-0 border-t">
							{selected?.href && (
								<Button
									asChild
									variant="outline"
									size="sm"
									className="w-full"
								>
									<Link href={selected.href}>
										<ExternalLink className="mr-2 h-3 w-3" />
										Open in{' '}
										{selected.href
											.split('/')
											.pop()
											?.replace('-', ' ')}
									</Link>
								</Button>
							)}
							<DrawerClose asChild>
								<Button variant="outline" className="w-full">
									Close
								</Button>
							</DrawerClose>
						</DrawerFooter>
					{/* </div> */}
				</DrawerContent>
			</Drawer>
		</div>
	);
}
