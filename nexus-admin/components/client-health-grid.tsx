"use client";

import { ClientHealthCard } from "@/components/client-health-card";
import { ClientHealthResponse } from "@/types/nexus-buddy-dashboard";

interface ClientHealthGridProps {
    clients: ClientHealthResponse[];
    onClientClick?: (client: ClientHealthResponse) => void;
}

export function ClientHealthGrid({ clients, onClientClick }: ClientHealthGridProps) {
    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="text-lg font-medium mb-2">No clients found</div>
                <div className="text-sm">Add client configurations to see health metrics</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {clients.map((client) => (
                <ClientHealthCard
                    key={client.clientConfigId}
                    client={client}
                    onClick={() => onClientClick?.(client)}
                />
            ))}
        </div>
    );
}