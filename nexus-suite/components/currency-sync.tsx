'use client';

import {
    normalizeCurrency,
    setDisplayCurrency,
} from '@/lib/currency';
import { getOrganizationDetails } from '@/lib/services/organization-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useEffect } from 'react';

/**
 * Keeps the display-currency mirror in sync with the organization's saved
 * default. The mirror (localStorage) is what every money format reads, but
 * it only persisted when the user happened to visit Organization Settings —
 * so a saved INR default still rendered "$" everywhere else. This mounts
 * once at the app root next to AuthProvider and restores the saved default
 * on every session.
 */
export function CurrencySync() {
    const { orgId, isAuthenticated, isLoading } = useUserMetadata();

    useEffect(() => {
        if (!isAuthenticated || isLoading || !orgId) return;
        let active = true;
        getOrganizationDetails(orgId)
            .then((org) => {
                if (!active) return;
                const code = normalizeCurrency(org?.defaultCurrency);
                // Only write when it differs: avoids clobbering a manual,
                // not-yet-saved choice on the fast path.
                const current = normalizeCurrency(
                    typeof window !== 'undefined'
                        ? localStorage.getItem('nexus:display-currency')
                        : null
                );
                if (code && code !== current) setDisplayCurrency(code);
            })
            .catch(() => {
                // Currency stays at its last-known value when the lookup fails.
            });
        return () => {
            active = false;
        };
    }, [orgId, isAuthenticated, isLoading]);

    return null;
}
