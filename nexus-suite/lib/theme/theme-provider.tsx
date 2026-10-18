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
    hasStoredThemeState,
    readResolvedThemeOwner,
    THEME_CSS_STORAGE_KEY,
    THEME_STORAGE_KEY,
    THEME_STYLE_ID,
    writeResolvedThemeOwner,
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
let hydrated = false;
const listeners = new Set<() => void>();

function readStoredState(): ThemeState {
    if (typeof window === 'undefined') return DEFAULT_THEME_STATE;
    try {
        const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (!raw) return DEFAULT_THEME_STATE;
        const parsed = JSON.parse(raw) as Partial<ThemeState>;
        return { ...DEFAULT_THEME_STATE, ...parsed };
    } catch {
        return DEFAULT_THEME_STATE;
    }
}

function getSnapshot(): ThemeState {
    if (!hydrated) {
        currentState = readStoredState();
        hydrated = true;
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
    hydrated = true;
    listeners.forEach((listener) => listener());
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
    try {
        if (!css) {
            window.localStorage.removeItem(THEME_STORAGE_KEY);
            window.localStorage.removeItem(THEME_CSS_STORAGE_KEY);
        } else {
            window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state));
            window.localStorage.setItem(THEME_CSS_STORAGE_KEY, css);
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
     * Resolve appearance preferences once per user:
     *
     * 1. A theme cached in this browser always wins — no backend call. This is
     *    what makes the app instant and keeps preference traffic off the API.
     * 2. Only when nothing is cached locally, the user is signed in, and we have
     *    not already resolved for them, do we fetch once from the backend,
     *    apply the result and cache it locally (including the "default" result,
     *    via the owner marker, so we never re-fetch for it).
     */
    useEffect(() => {
        const key = userId ?? '';
        // Already resolved (or in flight) for this user.
        if (resolvedForRef.current === key) return;
        resolvedForRef.current = key;

        const resolve = async () => {
            setPreferencesResolved(false);
            try {
                const owner = readResolvedThemeOwner();
                const hasLocalTheme = hasStoredThemeState();
                // Local data is trusted when it is anonymous or belongs to the
                // current user; another user's cached theme is not.
                const localBelongsToUser =
                    !userId || owner === null || owner === userId;

                if (hasLocalTheme && localBelongsToUser) {
                    if (userId) writeResolvedThemeOwner(userId);
                    return;
                }
                if (!userId) return;
                if (owner === userId) return;

                const preferences = await getUserPreferences(
                    APPEARANCE_SETTING,
                    userId
                );
                // Superseded by a different user while fetching.
                if (resolvedForRef.current !== key) return;
                setState(coerceThemeState(preferences));
                const mode =
                    typeof preferences.mode === 'string'
                        ? preferences.mode
                        : null;
                if (mode) setTheme(mode);
                writeResolvedThemeOwner(userId);
            } catch {
                // Backend unavailable — keep the local/default theme.
            } finally {
                if (resolvedForRef.current === key) {
                    setPreferencesResolved(true);
                }
            }
        };
        resolve();
    }, [userId, setState, setTheme]);

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
