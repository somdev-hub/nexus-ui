'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { useTheme } from 'next-themes';

import { useAuth } from '@/lib/auth-context';
import {
    APPEARANCE_SETTING,
    getUserPreferences,
} from '@/lib/services/user-preferences-service';

import {
    DEFAULT_THEME_STATE,
    FONTS,
    coerceThemeState,
    isDefaultTheme,
    themeToCss,
    type ThemeState,
} from './theme';
import {
    ANONYMOUS_OWNER,
    readActiveThemeOwner,
    readStoredTheme,
    THEME_STYLE_ID,
    themeStorageKeys,
    writeActiveThemeOwner,
} from './storage';

type ThemeConfigContextValue = {
    /** Current theme configuration. */
    state: ThemeState;
    /** Merge a partial update into the current configuration. */
    update: (patch: Partial<ThemeState>) => void;
    /** Replace the whole configuration (used by presets / imports). */
    setState: (next: ThemeState) => void;
    /** Restore the default theme. */
    reset: () => void;
    /**
     * True once the app has picked which preferences to use for the current
     * user (local cache or backend). The appearance page uses this to snapshot
     * the "saved" baseline for its dirty indicator.
     */
    preferencesResolved: boolean;
};

// ---------------------------------------------------------------------------
// External store (localStorage-backed) so React can read it via
// useSyncExternalStore without a hydration mismatch or setState-in-effect.
// ---------------------------------------------------------------------------

let currentState: ThemeState = DEFAULT_THEME_STATE;
/**
 * Owner whose cached state is currently loaded. `null` until the first client
 * read, which mirrors the pre-paint script (the last active owner).
 */
let currentOwner: string | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): ThemeState {
    if (currentOwner === null) {
        currentOwner = readActiveThemeOwner();
        currentState =
            readStoredTheme(currentOwner) ?? DEFAULT_THEME_STATE;
    }
    return currentState;
}

function getServerSnapshot(): ThemeState {
    return DEFAULT_THEME_STATE;
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function writeState(next: ThemeState) {
    currentState = next;
    listeners.forEach((listener) => listener());
}

/**
 * Point the cache at `owner` and return that owner's cached state (`null` when
 * they have nothing cached yet).
 */
function activateOwner(owner: string): ThemeState | null {
    currentOwner = owner;
    writeActiveThemeOwner(owner);
    return readStoredTheme(owner);
}

/** The owner whose cache writes should target. */
function activeOwner(): string {
    return currentOwner ?? readActiveThemeOwner();
}

// ---------------------------------------------------------------------------
// DOM side effects
// ---------------------------------------------------------------------------

function applyStyleElement(css: string) {
    if (typeof document === 'undefined') return;
    let el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!css) {
        if (el) el.remove();
        return;
    }
    if (!el) {
        el = document.createElement('style');
        el.id = THEME_STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = css;
}

function applyFont(fontId: ThemeState['font']) {
    if (typeof document === 'undefined') return;
    const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
    const root = document.documentElement;
    const body = document.body;
    const keys = [
        '--font-sans',
        '--font-mono',
        '--default-font-family',
        '--default-mono-font-family',
        '--font-geist-sans',
        '--font-geist-mono',
    ];

    if (!font.sans) {
        keys.forEach((key) => {
            root.style.removeProperty(key);
            body.style.removeProperty(key);
        });
        return;
    }

    root.style.setProperty('--font-sans', font.sans);
    root.style.setProperty('--default-font-family', font.sans);
    root.style.setProperty('--font-mono', font.mono);
    root.style.setProperty('--font-geist-sans', font.sans);
    root.style.setProperty('--font-geist-mono', font.mono);
    // next/font sets these on <body>; override there too for `font-sans` users.
    body.style.setProperty('--font-geist-sans', font.sans);
    body.style.setProperty('--font-geist-mono', font.mono);
}

function persist(state: ThemeState, css: string) {
    const keys = themeStorageKeys(activeOwner());
    try {
        // Always keep the state (even the defaults) so we know this owner has
        // already been resolved locally and can skip the backend call.
        window.localStorage.setItem(keys.state, JSON.stringify(state));
        if (css) {
            window.localStorage.setItem(keys.css, css);
        } else {
            window.localStorage.removeItem(keys.css);
        }
    } catch {
        // Storage unavailable (private mode) — the in-memory theme still works.
    }
}

const ThemeConfigContext = createContext<ThemeConfigContextValue | null>(null);

export function ThemeConfigProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const state = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    );
    const { user } = useAuth();
    const { setTheme } = useTheme();

    const [preferencesResolved, setPreferencesResolved] = useState(false);
    const resolvedForRef = useRef<string | null>(null);

    // IAM keys preferences by the numeric user id.
    const userId = user?.id && /^\d+$/.test(user.id) ? user.id : undefined;

    const update = useCallback((patch: Partial<ThemeState>) => {
        writeState({ ...getSnapshot(), ...patch });
    }, []);

    const setState = useCallback((next: ThemeState) => {
        writeState({ ...DEFAULT_THEME_STATE, ...next });
    }, []);

    const reset = useCallback(() => {
        writeState(DEFAULT_THEME_STATE);
    }, []);

    /**
     * Resolve appearance preferences whenever the signed-in user changes.
     *
     * Each user (and the anonymous bucket) has its own local cache, so:
     * 1. The current owner's cached theme always wins — no backend call.
     * 2. Only when that owner has no cache yet, a signed-in user is fetched
     *    once from the backend; the result (including "defaults") is then
     *    cached locally, so repeated loads never hit the backend.
     * 3. Switching/losing the user switches the cache bucket, so another
     *    account never inherits the previous user's theme.
     */
    useEffect(() => {
        const owner = userId ?? ANONYMOUS_OWNER;
        if (resolvedForRef.current === owner) return;
        resolvedForRef.current = owner;

        const resolve = async () => {
            setPreferencesResolved(false);
            try {
                const cached = activateOwner(owner);
                if (cached) {
                    // Local cache wins for this user — no backend call.
                    writeState(cached);
                    return;
                }

                // No cache for this owner: drop whatever the previous owner
                // had applied before we know this user's preferences.
                writeState(DEFAULT_THEME_STATE);
                if (!userId) return;

                const preferences = await getUserPreferences(
                    APPEARANCE_SETTING,
                    userId
                );
                // Superseded by a different user while fetching.
                if (resolvedForRef.current !== owner) return;
                writeState(coerceThemeState(preferences));
                const mode =
                    typeof preferences.mode === 'string'
                        ? preferences.mode
                        : null;
                if (mode) setTheme(mode);
            } catch {
                // Backend unavailable — keep the local/default theme.
            } finally {
                if (resolvedForRef.current === owner) {
                    setPreferencesResolved(true);
                }
            }
        };
        resolve();
    }, [userId, setTheme]);

    const css = useMemo(
        () => (isDefaultTheme(state) ? '' : themeToCss(state)),
        [state]
    );

    // Synchronize the DOM + storage with the current theme (external system).
    useEffect(() => {
        applyStyleElement(css);
        applyFont(state.font);
        persist(state, css);
    }, [state, css]);

    const value = useMemo(
        () => ({ state, update, setState, reset, preferencesResolved }),
        [state, update, setState, reset, preferencesResolved]
    );

    return (
        <ThemeConfigContext.Provider value={value}>
            {children}
        </ThemeConfigContext.Provider>
    );
}

export function useThemeConfig(): ThemeConfigContextValue {
    const ctx = useContext(ThemeConfigContext);
    if (!ctx) {
        throw new Error(
            'useThemeConfig must be used within a ThemeConfigProvider'
        );
    }
    return ctx;
}
