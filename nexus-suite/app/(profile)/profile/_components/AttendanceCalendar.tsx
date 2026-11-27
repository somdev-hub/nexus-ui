'use client';

import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { AttendanceRecord } from '@/lib/services/user-profile-service';

export function AttendanceCalendar({ records }: { records: AttendanceRecord[] }) {
	const calendarEvents = useMemo(
		() =>
			records.map((record) => {
				const status = record.status || 'UNKNOWN';
				const kind = status.toLowerCase();

				return {
					title: status.charAt(0) + status.slice(1).toLowerCase(),
					start: record.date,
					allDay: true,
					extendedProps: {
						kind,
						checkIn: record.checkInTime || '—',
						checkOut: record.checkOutTime || '—',
						hours: record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '—',
					},
				};
			}),
		[records]
	);

	return (
		<div className="suite-calendar profile-attendance-calendar">
			<div className="profile-attendance-legend" role="group" aria-label="Attendance status legend">
				<span><span className="profile-attendance-dot profile-attendance-dot-present" />Present</span>
				<span><span className="profile-attendance-dot profile-attendance-dot-absent" />Absent</span>
				<span><span className="profile-attendance-dot profile-attendance-dot-late" />Late</span>
				<span><span className="profile-attendance-dot profile-attendance-dot-unknown" />Unknown</span>
			</div>
			<FullCalendar
				plugins={[dayGridPlugin, interactionPlugin]}
				initialView="dayGridMonth"
				headerToolbar={{
					left: 'prev,next today',
					center: 'title',
					right: '',
				}}
				events={calendarEvents}
				height="auto"
				weekends={true}
				selectable={false}
				fixedWeekCount={false}
				dayMaxEvents={3}
				eventDidMount={(info) => {
					const kind = (info.event.extendedProps as Record<string, string>).kind;
					if (kind) {
						info.el.setAttribute('data-kind', kind);
					}
				}}
				eventClick={(info) => {
					const event = info.event;
					const extended = event.extendedProps as Record<string, string>;
					alert(
						`Date: ${event.start?.toLocaleDateString()}\nStatus: ${event.title}\nCheck-in: ${extended.checkIn}\nCheck-out: ${extended.checkOut}\nHours: ${extended.hours}`
					);
				}}
				locale="en"
				buttonText={{
					today: 'Today',
				}}
			/>
		</div>
	);
}
