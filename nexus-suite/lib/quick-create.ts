'use client';

import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// Quick Create intent bus.
//
// The sidebar's Quick Create button opens a portal-aware menu.
// Picking an option navigates to the canonical page and, when the
// creation UI on that page is a dialog, carries an intent that the
// target page consumes on mount to auto-open it.
//
// The intent travels primarily in memory (synchronous, works even
// when browser storage is blocked) with sessionStorage as a backup
// for full page loads. No URL params, so no Suspense requirements.
//
// Menu → setQuickCreateIntent(intent) + router.push(href)
// Page → useQuickCreateIntent(intent, () => setXOpen(true))
//
// IMPORTANT: pages with several create dialogs register one hook
// per dialog. Hooks must PEEK (not consume) so a non-matching hook
// never destroys another dialog's intent — only the matching hook
// clears it.
// ─────────────────────────────────────────────────────────────

const INTENT_KEY = 'nexus:quick-create-intent';

export const QUICK_CREATE_MENU_EVENT = 'nexus:quick-create-menu';

export function requestQuickCreateMenu(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(QUICK_CREATE_MENU_EVENT));
    }
}

let memoryIntent: string | null = null;

export function setQuickCreateIntent(intent: string): void {
    memoryIntent = intent;
    try {
        sessionStorage.setItem(INTENT_KEY, intent);
    } catch {
        // storage unavailable — in-memory intent still works in-app
    }
}

/** Read without destroying — safe for non-matching hooks. */
function peekQuickCreateIntent(): string | null {
    if (memoryIntent) return memoryIntent;
    try {
        return sessionStorage.getItem(INTENT_KEY);
    } catch {
        return null;
    }
}

function clearQuickCreateIntent(): void {
    memoryIntent = null;
    try {
        sessionStorage.removeItem(INTENT_KEY);
    } catch {
        // ignore
    }
}

/** Open the create dialog on mount when this page was reached via Quick Create. */
export function useQuickCreateIntent(intent: string, open: () => void): void {
    const openRef = useRef(open);
    openRef.current = open;
    useEffect(() => {
        if (peekQuickCreateIntent() === intent) {
            clearQuickCreateIntent();
            openRef.current();
        }
    }, [intent]);
}
