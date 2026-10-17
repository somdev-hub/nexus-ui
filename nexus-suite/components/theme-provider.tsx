'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { ThemeConfigProvider } from '@/lib/theme/theme-provider';

/**
 * Combines light/dark/system handling (next-themes) with the runtime appearance
 * customizer (base color, accent, radius and font).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ThemeConfigProvider>{children}</ThemeConfigProvider>
        </NextThemesProvider>
    );
}
