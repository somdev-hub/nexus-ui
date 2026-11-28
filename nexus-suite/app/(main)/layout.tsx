'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { NexusBuddyFloatingChat } from '@/components/nexus-buddy-chat';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function RouteLoadingBar() {
    const [isNavigating, setIsNavigating] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsNavigating(false);
        }, 400);

        return () => clearTimeout(timeout);
    }, []);

    if (!isNavigating) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 top-0 z-50 h-1">
            <div
                className="h-full w-full bg-blue-500/90"
                style={{
                    animation: 'loading-bar 1.2s ease-in-out infinite',
                }}
            />
        </div>
    );
}

// Pages where floating chat should be disabled
const DISABLE_CHAT_PAGES = ['/login', '/signup', '/forgot-password'];

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Don't show floating chat on auth pages
    const shouldShowChat = !DISABLE_CHAT_PAGES.some((path) =>
        pathname.startsWith(path)
    );

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <RouteLoadingBar key={pathname} />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                {children}
            </SidebarInset>

            {/* Nexus Buddy Floating Chat - only on main app pages */}
            {shouldShowChat && (
                <NexusBuddyFloatingChat
                    context="nexus-suite"
                    allowedTools={[
                        'get_products',
                        'get_product_details',
                        'get_stock_levels',
                        'get_purchase_orders',
                        'get_purchase_order_details',
                        'get_suppliers',
                        'get_supplier_details',
                        'get_shipments',
                        'get_shipment_details',
                    ]}
                />
            )}
        </SidebarProvider>
    );
}
