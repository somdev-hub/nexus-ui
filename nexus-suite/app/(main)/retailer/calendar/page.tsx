'use client';

import SuiteCalendarPage from '@/components/suite-calendar-page';
import '@/app/suite-calendar.css';
import {
    RETAILER_CALENDAR_KINDS,
    getRetailerCalendarActivities,
} from '@/lib/services/calendar-service';

export default function RetailerCalendarRoutePage() {
    return (
        <SuiteCalendarPage
            title="Retailer Calendar"
            subtitle="Purchase orders, inbound deliveries, dock appointments, invoice due dates and goods receipts per day. Switch between month, week, day and agenda."
            kinds={RETAILER_CALENDAR_KINDS}
            fetchActivities={getRetailerCalendarActivities}
            links={[
                { label: 'Purchase Orders', href: '/retailer/purchase-orders' },
                { label: 'Shipments', href: '/retailer/shipments' },
                { label: 'Invoices', href: '/retailer/procurement/invoices' },
            ]}
        />
    );
}
