/**
 * Shared theme storage constants + the pre-paint script.
 *
 * Kept in a plain (non-client) module so the server root layout can import the
 * init script string directly without going through a `'use client'` boundary.
 */

/** Persisted theme state (JSON). Only written for non-default themes. */
export const THEME_STORAGE_KEY = 'nexus-ui-theme';
/** Precomputed CSS, read by the pre-paint script to avoid a flash. */
export const THEME_CSS_STORAGE_KEY = 'nexus-ui-theme-css';
/** Id of the injected <style> element. */
export const THEME_STYLE_ID = 'nexus-ui-theme';
/**
 * Id of the user whose appearance preferences this browser has already
 * resolved. Lets us keep the "default" result (which stores no theme) cached
 * without calling the backend again on every load.
 */
export const THEME_OWNER_STORAGE_KEY = 'nexus-ui-theme-owner';

/** True when a non-default theme state is cached in this browser. */
export function hasStoredThemeState(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(THEME_STORAGE_KEY) !== null;
    } catch {
        return false;
    }
}

/** The user id whose preferences this browser last resolved, if any. */
export function readResolvedThemeOwner(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(THEME_OWNER_STORAGE_KEY);
    } catch {
        return null;
    }
}

/** Records the user id whose preferences this browser has resolved. */
export function writeResolvedThemeOwner(userId: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(THEME_OWNER_STORAGE_KEY, userId);
    } catch {
        // Storage unavailable — the fetch guard simply re-evaluates next time.
    }
}

/**
 * Inline script injected before paint. It re-applies the last generated theme
 * CSS so the customized theme is present on first render (mirrors how
 * next-themes avoids a flash for light/dark mode).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_CSS_STORAGE_KEY}');if(!c)return;var s=document.getElementById('${THEME_STYLE_ID}');if(!s){s=document.createElement('style');s.id='${THEME_STYLE_ID}';document.head.appendChild(s);}s.textContent=c;}catch(e){}})();`;
