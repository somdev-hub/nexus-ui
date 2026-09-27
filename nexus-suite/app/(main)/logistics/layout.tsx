'use client';
import { ProtectedRoute } from '@/lib/protected-route';

export default function LogisticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requiredOrgType="LOGISTICS">{children}</ProtectedRoute>
    );
}
