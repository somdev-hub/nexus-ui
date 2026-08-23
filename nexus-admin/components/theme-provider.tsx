"use client";

import * as React from "react";

type Theme = "light" | "dark";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

function getInitialTheme(storageKey: string, defaultTheme: Theme): Theme {
    if (typeof window === "undefined") return defaultTheme;
    try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored === "light" || stored === "dark") return stored;
    } catch {
        // ignore storage errors
    }
    return defaultTheme;
}

export function ThemeProvider({
    children,
    defaultTheme = "light",
    storageKey = "theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = React.useState<Theme>(() => getInitialTheme(storageKey, defaultTheme));
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        try {
            window.localStorage.setItem(storageKey, theme);
        } catch {
            // ignore storage errors
        }
    }, [theme, storageKey]);

    const value = React.useMemo(
        () => ({
            theme,
            setTheme: (next: Theme) => setTheme(next),
        }),
        [theme]
    );

    // Avoid rendering with a mismatched theme before hydration/mount
    if (!mounted) {
        return <>{children}</>;
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}