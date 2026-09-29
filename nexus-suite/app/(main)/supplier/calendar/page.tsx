'use client';

import SuiteCalendarPage from '@/components/suite-calendar-page';
import '@/app/suite-calendar.css';
import {
    SUPPLIER_CALENDAR_KINDS,
    getSupplierCalendarActivities,
} from '@/lib/services/calendar-service';

export default function SupplierCalendarRoutePage() {
    return (
        <SuiteCalendarPage
            title="Supplier Calendar"
            subtitle="Order deliveries, quotation validity, production capacity, demand forecasts and certificate expiries per day. Switch between month, week, day and agenda."
            kinds={SUPPLIER_CALENDAR_KINDS}
            fetchActivities={getSupplierCalendarActivities}
            links={[
                { label: 'Orders', href: '/supplier/orders' },
                { label: 'Capacity', href: '/supplier/capacity' },
                { label: 'Quotations', href: '/supplier/quotations' },
            ]}
        />
    );
}
