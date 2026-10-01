'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CounterpartyPod } from '@/lib/services/counterparty-docs-service';

interface PodSectionProps {
    fetchPod: () => Promise<CounterpartyPod | null>;
}

function field(label: string, value: string) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right break-all">{value}</span>
        </div>
    );
}

export default function PodSection({ fetchPod }: PodSectionProps) {
    const [pod, setPod] = useState<CounterpartyPod | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await fetchPod().catch(() => null);
                if (active) setPod(data);
            } catch {
                if (active) setFailed(true);
            } finally {
                if (active) setIsLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [fetchPod]);

    if (isLoading) return <Skeleton className="h-40 w-full" />;

    if (!pod || failed) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Proof of Delivery</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No POD captured yet</p>
                </CardContent>
            </Card>
        );
    }

    const receiver =
        pod.receiverName ?? pod.receivedByName ?? pod.receivedBy ?? '—';
    const signature = pod.signatureUrl ?? pod.signature ?? '—';
    const coordinates =
        pod.latitude != null && pod.longitude != null
            ? `${pod.latitude}, ${pod.longitude}`
            : '—';
    const condition = pod.condition ?? pod.conditionNotes ?? '—';
    const timestamp = pod.capturedAt ?? pod.deliveredAt ?? pod.createdAt ?? '—';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Proof of Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {field('Receiver', receiver)}
                {field('Signature', signature)}
                {field('Coordinates', coordinates)}
                {field('Condition', condition)}
                {field(
                    'Timestamp',
                    timestamp !== '—'
                        ? new Date(timestamp).toLocaleString()
                        : '—'
                )}
                {pod.notes ? field('Notes', pod.notes) : null}
            </CardContent>
        </Card>
    );
}
