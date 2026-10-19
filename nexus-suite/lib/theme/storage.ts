/**
 * Shared theme storage constants + the pre-paint script.
 *
 * Appearance preferences are cached **per user** so switching accounts on the
 * same browser restores the right theme. Logged-out usage is cached under the
 * {@link ANONYMOUS_OWNER} bucket.
 *
 * Kept in a plain (non-client) module so the server root layout can import the
 * init script string directly without going through a `'use client'` boundary.
 */

import { DEFAULT_THEME_STATE, type ThemeState } from './theme';

/** Key prefix for the cached theme state (one entry per owner). */
export const THEME_STORAGE_PREFIX = 'nexus-ui-theme';
/** Key prefix for the cached CSS (one entry per owner). */
export const THEME_CSS_STORAGE_PREFIX = 'nexus-ui-theme-css';
/** Id of the injected <style> element. */
export const THEME_STYLE_ID = 'nexus-ui-theme';
/** Records which owner's cache the pre-paint script should use. */
export const THEME_ACTIVE_OWNER_KEY = 'nexus-ui-theme-active';

/** Cache bucket used while no user is signed in. */
export const ANONYMOUS_OWNER = 'anonymous';

/** localStorage keys for an owner's cached theme. */
export function themeStorageKeys(owner: string): {
    state: string;
    css: string;
} {
    return {
        state: `${THEME_STORAGE_PREFIX}:${owner}`,
        css: `${THEME_CSS_STORAGE_PREFIX}:${owner}`,
    };
}

/** The owner whose cache should be used before auth resolves. */
export function readActiveThemeOwner(): string {
    if (typeof window === 'undefined') return ANONYMOUS_OWNER;
    try {
        return (
            window.localStorage.getItem(THEME_ACTIVE_OWNER_KEY) ||
            ANONYMOUS_OWNER
        );
    } catch {
        return ANONYMOUS_OWNER;
    }
}

/** Records which owner's cache is active (also used by the pre-paint script). */
export function writeActiveThemeOwner(owner: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(THEME_ACTIVE_OWNER_KEY, owner);
    } catch {
        // Storage unavailable — the active owner falls back to anonymous.
    }
}

/** Reads the cached theme state for an owner, or null when nothing is cached. */
export function readStoredTheme(owner: string): ThemeState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(themeStorageKeys(owner).state);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<ThemeState>;
        return { ...DEFAULT_THEME_STATE, ...parsed };
    } catch {
        return null;
    }
}

/**
 * Inline script injected before paint. It re-applies the last generated theme
 * CSS for the active owner so the customized theme is present on first render
 * (mirrors how next-themes avoids a flash for light/dark mode).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var o=localStorage.getItem('${THEME_ACTIVE_OWNER_KEY}')||'${ANONYMOUS_OWNER}';var c=localStorage.getItem('${THEME_CSS_STORAGE_PREFIX}:'+o);if(!c)return;var s=document.getElementById('${THEME_STYLE_ID}');if(!s){s=document.createElement('style');s.id='${THEME_STYLE_ID}';document.head.appendChild(s);}s.textContent=c;}catch(e){}})();`;
