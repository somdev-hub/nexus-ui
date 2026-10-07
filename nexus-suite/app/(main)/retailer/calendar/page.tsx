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
            subtitle="Purchase orders, invoice due dates and goods receipts per day. Delivery is handled by suppliers — this calendar tracks your ordering and receiving. Switch between month, week, day and agenda."
            kinds={RETAILER_CALENDAR_KINDS}
            fetchActivities={getRetailerCalendarActivities}
            links={[
                { label: 'Purchase Orders', href: '/retailer/purchase-orders' },
                { label: 'Goods Receipts', href: '/retailer/procurement/goods-receipts' },
                { label: 'Invoices', href: '/retailer/procurement/invoices' },
            ]}
        />
    );
}
