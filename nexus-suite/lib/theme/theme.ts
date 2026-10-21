/**
 * Theme model + CSS generation for the appearance customizer.
 *
 * Mirrors the options offered by https://ui.shadcn.com/create: a style (radius
 * + font), a base (surface) color, a theme (primary) color and a chart color.
 * Selecting any of these writes semantic CSS variables scoped to `:root` and
 * `.dark`, computed from the same OKLCH scales shadcn/ui ships.
 */

import {
    ACCENT_SCALES,
    BASE_SCALES,
    CHART_DARK,
    CHART_LIGHT,
    RED,
    type BaseColorId,
    type Scale,
    type ScaleStep,
    type ThemeColorId,
} from './colors';

export type FontId = 'geist' | 'system' | 'serif' | 'mono';

/** Accent hues (every theme color except the monochrome `default`). */
export type AccentColorId = Exclude<ThemeColorId, 'default'>;

/** Source of the five `--chart-*` tokens. `theme` follows the theme color. */
export type ChartColorId = 'theme' | BaseColorId | AccentColorId;

export type ThemeState = {
    /** Surface / neutral palette. */
    base: BaseColorId;
    /** Primary color. `default` keeps the monochrome (base) primary. */
    theme: ThemeColorId;
    /** Palette backing `--chart-1` … `--chart-5`. */
    chart: ChartColorId;
    /** Base corner radius, in rem. */
    radius: number;
    /** Body font family. */
    font: FontId;
};

export const DEFAULT_THEME_STATE: ThemeState = {
    base: 'neutral',
    theme: 'default',
    chart: 'theme',
    radius: 0.625,
    font: 'geist',
};

export const MIN_RADIUS = 0;
export const MAX_RADIUS = 1.5;
export const RADIUS_STEP = 0.025;

export type FontOption = {
    id: FontId;
    label: string;
    description: string;
    /** CSS font stack, `null` keeps the app default (Geist via next/font). */
    sans: string | null;
    mono: string;
};

export const FONTS: FontOption[] = [
    {
        id: 'geist',
        label: 'Geist',
        description: 'Default sans',
        sans: null,
        mono: 'var(--font-geist-mono)',
    },
    {
        id: 'system',
        label: 'System',
        description: 'Native UI font',
        sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    {
        id: 'serif',
        label: 'Serif',
        description: 'Editorial serif',
        sans: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    {
        id: 'mono',
        label: 'Mono',
        description: 'Monospaced',
        sans: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
];

export const ACCENT_IDS = Object.keys(ACCENT_SCALES) as AccentColorId[];

/**
 * Scale steps shadcn/ui draws each accent primary from. Most hues use a 700 in
 * light mode and an 800 in dark mode, but yellow/lime step down to 400/500 so
 * they stay legible.
 */
const PRIMARY_STEPS: Record<
    AccentColorId,
    { light: ScaleStep; dark: ScaleStep }
> = {
    red: { light: 700, dark: 800 },
    orange: { light: 700, dark: 800 },
    amber: { light: 700, dark: 800 },
    yellow: { light: 400, dark: 500 },
    lime: { light: 400, dark: 500 },
    green: { light: 700, dark: 800 },
    emerald: { light: 700, dark: 800 },
    teal: { light: 700, dark: 800 },
    cyan: { light: 700, dark: 800 },
    sky: { light: 700, dark: 800 },
    blue: { light: 700, dark: 800 },
    indigo: { light: 700, dark: 800 },
    violet: { light: 700, dark: 800 },
    purple: { light: 700, dark: 800 },
    fuchsia: { light: 700, dark: 800 },
    pink: { light: 700, dark: 800 },
    rose: { light: 700, dark: 800 },
};

/** Foreground step for accent primaries. Defaults to 50. */
const PRIMARY_FG_STEPS: Partial<Record<AccentColorId, ScaleStep>> = {
    yellow: 900,
    lime: 900,
};

/** Dark-mode `--sidebar-primary-foreground` step for lighter hues. Defaults to 50. */
const DARK_SIDEBAR_FG_STEPS: Partial<Record<AccentColorId, ScaleStep>> = {
    amber: 950,
    yellow: 950,
    lime: 950,
    emerald: 950,
    teal: 950,
    cyan: 950,
    sky: 950,
};

/** The five scale steps shadcn/ui uses for every chart palette. */
const CHART_STEPS: ScaleStep[] = [300, 500, 600, 700, 800];

export const BASE_COLOR_OPTIONS: { id: BaseColorId; label: string }[] = [
    { id: 'neutral', label: 'Neutral' },
    { id: 'stone', label: 'Stone' },
    { id: 'zinc', label: 'Zinc' },
    { id: 'mauve', label: 'Mauve' },
    { id: 'olive', label: 'Olive' },
    { id: 'mist', label: 'Mist' },
    { id: 'taupe', label: 'Taupe' },
];

export const THEME_COLOR_OPTIONS: { id: ThemeColorId; label: string }[] = [
    { id: 'default', label: 'Default' },
    ...ACCENT_IDS.map((id) => ({
        id: id as ThemeColorId,
        label: capitalize(id),
    })),
];

export const CHART_COLOR_OPTIONS: { id: ChartColorId; label: string }[] = [
    { id: 'theme', label: 'Theme' },
    ...BASE_COLOR_OPTIONS.map((option) => ({
        id: option.id as ChartColorId,
        label: option.label,
    })),
    ...ACCENT_IDS.map((id) => ({
        id: id as ChartColorId,
        label: capitalize(id),
    })),
];

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function baseScale(base: BaseColorId): Scale {
    return BASE_SCALES[base] ?? BASE_SCALES.neutral;
}

/** Swatch color used to preview a base scale in the UI. */
export function baseSwatch(base: BaseColorId): string {
    return baseScale(base)[500];
}

/** Swatch color used to preview a theme (primary) color in the UI. */
export function themeSwatch(theme: ThemeColorId, base: BaseColorId): string {
    if (theme === 'default') {
        return baseScale(base)[900];
    }
    const scale = ACCENT_SCALES[theme] ?? ACCENT_SCALES.blue;
    return scale[(PRIMARY_STEPS[theme] ?? { light: 700 }).light];
}

/** The five chart colors backing a chart-color option in the UI. */
export function chartSwatch(
    chart: ChartColorId,
    state: Pick<ThemeState, 'base' | 'theme'>
): string[] {
    if (chart === 'theme') {
        return state.theme === 'default'
            ? [...CHART_LIGHT]
            : chartPalette(state.theme);
    }
    return chartPalette(chart);
}

// ---------------------------------------------------------------------------
// Token resolution
// ---------------------------------------------------------------------------

type Tokens = Record<string, string>;

function chartPalette(source: BaseColorId | AccentColorId): string[] {
    const scale =
        source in BASE_SCALES
            ? baseScale(source as BaseColorId)
            : (ACCENT_SCALES[source as AccentColorId] ?? ACCENT_SCALES.blue);
    return CHART_STEPS.map((step) => scale[step]);
}

function accentTokens(accent: AccentColorId, mode: 'light' | 'dark'): Tokens {
    const scale = ACCENT_SCALES[accent] ?? ACCENT_SCALES.blue;
    const primaryStep = (PRIMARY_STEPS[accent] ?? { light: 700, dark: 800 })[
        mode
    ];
    const fgStep = PRIMARY_FG_STEPS[accent] ?? 50;
    const sidebarStep: ScaleStep = mode === 'light' ? 600 : 500;
    const sidebarFgStep: ScaleStep =
        mode === 'dark' ? (DARK_SIDEBAR_FG_STEPS[accent] ?? 50) : 50;

    return {
        primary: scale[primaryStep],
        'primary-foreground': scale[fgStep],
        'sidebar-primary': scale[sidebarStep],
        'sidebar-primary-foreground': scale[sidebarFgStep],
    };
}

function resolveTokens(state: ThemeState): { light: Tokens; dark: Tokens } {
    const b = baseScale(state.base);

    const light: Tokens = {
        background: 'oklch(1 0 0)',
        foreground: b[950],
        card: 'oklch(1 0 0)',
        'card-foreground': b[950],
        popover: 'oklch(1 0 0)',
        'popover-foreground': b[950],
        secondary: b[100],
        'secondary-foreground': b[900],
        muted: b[100],
        'muted-foreground': b[500],
        accent: b[100],
        'accent-foreground': b[900],
        destructive: RED[600],
        border: b[200],
        input: b[200],
        ring: b[400],
        sidebar: b[50],
        'sidebar-foreground': b[950],
        'sidebar-accent': b[100],
        'sidebar-accent-foreground': b[900],
        'sidebar-border': b[200],
        'sidebar-ring': b[400],
    };

    const dark: Tokens = {
        background: b[950],
        foreground: b[50],
        card: b[900],
        'card-foreground': b[50],
        popover: b[900],
        'popover-foreground': b[50],
        secondary: b[800],
        'secondary-foreground': b[50],
        muted: b[800],
        'muted-foreground': b[400],
        accent: b[800],
        'accent-foreground': b[50],
        destructive: RED[400],
        border: 'oklch(1 0 0 / 10%)',
        input: 'oklch(1 0 0 / 15%)',
        ring: b[500],
        sidebar: b[900],
        'sidebar-foreground': b[50],
        'sidebar-accent': b[800],
        'sidebar-accent-foreground': b[50],
        'sidebar-border': 'oklch(1 0 0 / 10%)',
        'sidebar-ring': b[500],
    };

    if (state.theme === 'default') {
        light.primary = b[900];
        light['primary-foreground'] = b[50];
        light['sidebar-primary'] = b[900];
        light['sidebar-primary-foreground'] = b[50];
        dark.primary = b[200];
        dark['primary-foreground'] = b[900];
        dark['sidebar-primary'] = b[200];
        dark['sidebar-primary-foreground'] = b[900];
    } else {
        Object.assign(light, accentTokens(state.theme, 'light'));
        Object.assign(dark, accentTokens(state.theme, 'dark'));
    }

    const charts =
        state.chart === 'theme'
            ? state.theme === 'default'
                ? { light: [...CHART_LIGHT], dark: [...CHART_DARK] }
                : {
                      light: chartPalette(state.theme),
                      dark: chartPalette(state.theme),
                  }
            : {
                  light: chartPalette(state.chart),
                  dark: chartPalette(state.chart),
              };

    charts.light.forEach((value, i) => {
        light[`chart-${i + 1}`] = value;
    });
    charts.dark.forEach((value, i) => {
        dark[`chart-${i + 1}`] = value;
    });

    return { light, dark };
}

function tokensToBlock(tokens: Tokens, indent = '    ') {
    return Object.entries(tokens)
        .map(([key, value]) => `${indent}--${key}: ${value};`)
        .join('\n');
}

/**
 * Serializes a theme state to a CSS string with `:root` (light) and `.dark`
 * variable blocks. Fonts are applied via a `:root body` rule so they win over
 * the Tailwind theme defaults.
 */
export function themeToCss(state: ThemeState): string {
    const { light, dark } = resolveTokens(state);
    const font = FONTS.find((f) => f.id === state.font) ?? FONTS[0];

    if (font.sans) {
        Object.assign(light, {
            'font-sans': font.sans,
            'default-font-family': font.sans,
            'font-mono': font.mono,
            'default-mono-font-family': font.mono,
            'font-geist-sans': font.sans,
            'font-geist-mono': font.mono,
        });
    }

    const blocks = [
        `:root {\n    --radius: ${state.radius}rem;\n${tokensToBlock(light)}\n}`,
        `.dark {\n${tokensToBlock(dark)}\n}`,
    ];

    if (font.sans) {
        // next/font declares --font-geist-sans on <body>, so override it there
        // too (with higher specificity) for elements that use `font-sans`.
        blocks.push(
            `:root body {\n    --font-geist-sans: ${font.sans};\n    --font-geist-mono: ${font.mono};\n}`
        );
    }

    return `${blocks.join('\n')}\n`;
}

/** True when the state matches the shipped defaults and needs no override. */
export function isDefaultTheme(state: ThemeState): boolean {
    return (
        state.base === DEFAULT_THEME_STATE.base &&
        state.theme === DEFAULT_THEME_STATE.theme &&
        state.chart === DEFAULT_THEME_STATE.chart &&
        Math.abs(state.radius - DEFAULT_THEME_STATE.radius) < 0.001 &&
        state.font === DEFAULT_THEME_STATE.font
    );
}

export function themeEquals(a: ThemeState, b: ThemeState): boolean {
    return (
        a.base === b.base &&
        a.theme === b.theme &&
        a.chart === b.chart &&
        a.font === b.font &&
        Math.abs(a.radius - b.radius) < 0.001
    );
}

// ---------------------------------------------------------------------------
// Persistence helpers (per-user preferences)
// ---------------------------------------------------------------------------

const BASE_IDS = Object.keys(BASE_SCALES) as BaseColorId[];
const THEME_IDS: ThemeColorId[] = ['default', ...ACCENT_IDS];
const CHART_IDS: ChartColorId[] = ['theme', ...BASE_IDS, ...ACCENT_IDS];
const FONT_IDS: FontId[] = FONTS.map((font) => font.id);

export function isBaseColorId(value: unknown): value is BaseColorId {
    return typeof value === 'string' && BASE_IDS.includes(value as BaseColorId);
}

export function isThemeColorId(value: unknown): value is ThemeColorId {
    return (
        typeof value === 'string' && THEME_IDS.includes(value as ThemeColorId)
    );
}

export function isChartColorId(value: unknown): value is ChartColorId {
    return (
        typeof value === 'string' && CHART_IDS.includes(value as ChartColorId)
    );
}

export function isFontId(value: unknown): value is FontId {
    return typeof value === 'string' && FONT_IDS.includes(value as FontId);
}

/**
 * Builds a theme state from a raw preference map (as returned by the IAM
 * `t_user_preferences` table), falling back to the shipped default for every
 * option that is missing or invalid.
 */
export function coerceThemeState(
    raw: Record<string, unknown> | null | undefined
): ThemeState {
    const source = raw ?? {};
    const radius =
        typeof source.radius === 'number' && Number.isFinite(source.radius)
            ? Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, source.radius))
            : DEFAULT_THEME_STATE.radius;

    return {
        base: isBaseColorId(source.base)
            ? source.base
            : DEFAULT_THEME_STATE.base,
        theme: isThemeColorId(source.theme)
            ? source.theme
            : DEFAULT_THEME_STATE.theme,
        chart: isChartColorId(source.chart)
            ? source.chart
            : DEFAULT_THEME_STATE.chart,
        radius,
        font: isFontId(source.font) ? source.font : DEFAULT_THEME_STATE.font,
    };
}

/**
 * Serializes a theme state into the key/value preference pairs persisted for a
 * user under the `appearance` setting.
 */
export function themeStateToPreferences(
    state: ThemeState
): { key: string; value: string | number }[] {
    return [
        { key: 'base', value: state.base },
        { key: 'theme', value: state.theme },
        { key: 'chart', value: state.chart },
        { key: 'radius', value: state.radius },
        { key: 'font', value: state.font },
    ];
}
