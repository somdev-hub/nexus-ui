'use client';
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getShipmentPosition } from '@/lib/services/logistics-ops-service';
import type { ShipmentPosition } from '@/types/logistics-ops';
import { useToast } from '@/hooks/use-toast';

// Free vector tiles, no API key required. Swap for a self-hosted style when available.
const MAP_STYLE =
    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const POLL_MS = 5000;

function dot(color: string, size = 14): HTMLElement {
    const el = document.createElement('div');
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = '9999px';
    el.style.background = color;
    el.style.border = '2px solid #fff';
    el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.4)';
    return el;
}

export default function ShipmentMap({ shipmentId }: { shipmentId: number }) {
    const { toast } = useToast();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const [data, setData] = useState<ShipmentPosition | null>(null);

    // Poll live position; every poll advances the simulated GPS tick server-side
    useEffect(() => {
        let active = true;
        const fetchOnce = async () => {
            try {
                const pos = await getShipmentPosition(shipmentId);
                if (active) setData(pos);
            } catch (e: unknown) {
                if (active) {
                    toast({
                        title: e instanceof Error ? e.message : String(e),
                        variant: 'destructive',
                    });
                }
            }
        };
        fetchOnce();
        const t = setInterval(fetchOnce, POLL_MS);
        return () => {
            active = false;
            clearInterval(t);
        };
    }, [shipmentId]);

    // Init map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        mapRef.current = new maplibregl.Map({
            container: containerRef.current,
            style: MAP_STYLE,
            center: [72.8777, 19.076],
            zoom: 5,
            attributionControl: { compact: true },
        });
        mapRef.current.addControl(
            new maplibregl.NavigationControl(),
            'top-right'
        );
        return () => {
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Redraw markers + route on data change
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !data) return;
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        const origin: [number, number] = [
            data.origin.longitude,
            data.origin.latitude,
        ];
        const dest: [number, number] = [
            data.destination.longitude,
            data.destination.latitude,
        ];

        markersRef.current.push(
            new maplibregl.Marker({ element: dot('#16a34a') })
                .setLngLat(origin)
                .setPopup(
                    new maplibregl.Popup({ offset: 12 }).setText('Origin')
                )
                .addTo(map)
        );
        markersRef.current.push(
            new maplibregl.Marker({ element: dot('#dc2626') })
                .setLngLat(dest)
                .setPopup(
                    new maplibregl.Popup({ offset: 12 }).setText('Destination')
                )
                .addTo(map)
        );
        if (data.position) {
            const pos: [number, number] = [
                data.position.longitude,
                data.position.latitude,
            ];
            markersRef.current.push(
                new maplibregl.Marker({ element: dot('#0f172a', 18) })
                    .setLngLat(pos)
                    .setPopup(
                        new maplibregl.Popup({ offset: 12 }).setText(
                            `${data.assetNumber ?? 'Asset'} • ${data.progressPct}%`
                        )
                    )
                    .addTo(map)
            );
        }

        const routeGeoJson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [origin, dest],
                    },
                },
            ],
        };
        const draw = () => {
            const existing = map.getSource('shipment-route') as
                maplibregl.GeoJSONSource | undefined;
            if (existing) {
                existing.setData(routeGeoJson);
            } else {
                map.addSource('shipment-route', {
                    type: 'geojson',
                    data: routeGeoJson,
                });
                map.addLayer({
                    id: 'shipment-route-line',
                    type: 'line',
                    source: 'shipment-route',
                    paint: {
                        'line-color': '#0f172a',
                        'line-width': 3,
                        'line-dasharray': [2, 2],
                    },
                });
            }
            const bounds = new maplibregl.LngLatBounds(origin, origin).extend(
                dest
            );
            if (data.position)
                bounds.extend([
                    data.position.longitude,
                    data.position.latitude,
                ]);
            map.fitBounds(bounds, { padding: 60, maxZoom: 10 });
        };
        if (map.isStyleLoaded()) draw();
        else map.once('load', draw);
    }, [data]);

    return (
        <div className="grid gap-3">
            <div
                ref={containerRef}
                className="h-80 w-full overflow-hidden rounded-lg border"
            />
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Badge variant={data?.arrived ? 'default' : 'secondary'}>
                        {data?.status ?? '…'}
                    </Badge>
                    {data?.simulated && (
                        <Badge variant="outline">simulated GPS</Badge>
                    )}
                </div>
                <span className="font-medium">
                    {data?.progressPct ?? 0}% en route
                </span>
            </div>
            <Progress value={data?.progressPct ?? 0} />
            {!data?.position && data && (
                <div className="text-sm text-muted-foreground">
                    No asset assigned yet — assign a booking to start live
                    tracking.
                </div>
            )}
            {data?.position && (
                <div className="text-xs text-muted-foreground">
                    {data.assetNumber ?? 'Asset'} •{' '}
                    {data.position.latitude.toFixed(4)},{' '}
                    {data.position.longitude.toFixed(4)} • updated{' '}
                    {data.position.at
                        ? new Date(data.position.at).toLocaleTimeString()
                        : '—'}
                </div>
            )}
        </div>
    );
}
