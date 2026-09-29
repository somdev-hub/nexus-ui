'use client';

import SuiteCalendarPage from '@/components/suite-calendar-page';
import '@/app/suite-calendar.css';
import {
    LOGISTICS_CALENDAR_KINDS,
    getLogisticsCalendarActivities,
} from '@/lib/services/calendar-service';

export default function LogisticsCalendarRoutePage() {
    return (
        <SuiteCalendarPage
            title="Logistics Calendar"
            subtitle="Every trackable activity per day — pickups, deliveries, stops, appointments, maintenance, exceptions and capacity. Switch between month, week, day and agenda."
            kinds={LOGISTICS_CALENDAR_KINDS}
            fetchActivities={getLogisticsCalendarActivities}
            links={[
                { label: 'Shipments', href: '/logistics/shipments' },
                { label: 'Routing', href: '/logistics/routing' },
            ]}
        />
    );
}
