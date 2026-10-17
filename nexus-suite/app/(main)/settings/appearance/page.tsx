'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
    ChartColumn,
    Check,
    Loader2,
    Monitor,
    Moon,
    Paintbrush,
    Palette,
    RotateCcw,
    Save,
    Sun,
    Type,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    BASE_COLOR_OPTIONS,
    CHART_COLOR_OPTIONS,
    DEFAULT_THEME_STATE,
    FONTS,
    MAX_RADIUS,
    MIN_RADIUS,
    RADIUS_STEP,
    THEME_COLOR_OPTIONS,
    baseSwatch,
    chartSwatch,
    coerceThemeState,
    themeEquals,
    themeStateToPreferences,
    themeSwatch,
    type ChartColorId,
    type FontId,
    type ThemeState,
} from '@/lib/theme/theme';
import { useThemeConfig } from '@/lib/theme/theme-provider';
import {
    APPEARANCE_SETTING,
    getUserPreferences,
    saveUserPreferences,
} from '@/lib/services/user-preferences-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { cn } from '@/lib/utils';

const MODE_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
] as const;

const RADIUS_PRESETS = [0, 0.3, 0.5, 0.625, 0.75, 1.0];

/** Row of circular swatches used by the base + theme color pickers. */
function SwatchGrid<T extends string>({
    options,
    value,
    onChange,
    color,
}: {
    options: { id: T; label: string }[];
    value: T;
    onChange: (id: T) => void;
    color: (id: T) => string;
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {options.map((option) => {
                const active = value === option.id;
                return (
                    <Tooltip key={option.id}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={option.label}
                                onClick={() => onChange(option.id)}
                                className={cn(
                                    'relative size-8 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110',
                                    active &&
                                        'ring-2 ring-primary ring-offset-2 ring-offset-background'
                                )}
                                style={{ background: color(option.id) }}
                            >
                                {active && (
                                    <Check className="absolute inset-0 m-auto size-4 text-white mix-blend-difference" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {option.label}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}

/** Chart colors are previewed as a small five-bar palette. */
function ChartSwatchGrid({
    options,
    value,
    onChange,
    colors,
}: {
    options: { id: ChartColorId; label: string }[];
    value: ChartColorId;
    onChange: (id: ChartColorId) => void;
    colors: (id: ChartColorId) => string[];
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {options.map((option) => {
                const active = value === option.id;
                return (
                    <Tooltip key={option.id}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={`${option.label} charts`}
                                onClick={() => onChange(option.id)}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors hover:bg-accent',
                                    active
                                        ? 'border-primary ring-1 ring-primary'
                                        : 'border-border'
                                )}
                            >
                                <span className="flex shrink-0 items-end gap-0.5">
                                    {colors(option.id).map((swatch, i) => (
                                        <span
                                            key={i}
                                            className="block h-4 w-1.5 rounded-sm"
                                            style={{ background: swatch }}
                                        />
                                    ))}
                                </span>
                                <span className="truncate">
                                    {option.label}
                                </span>
                                {active && (
                                    <Check className="ml-auto size-4 text-primary" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {option.label} charts
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}

export default function AppearanceSettingsPage() {
    const { state, update, setState, reset } = useThemeConfig();
    const { theme, setTheme } = useTheme();
    const { userId } = useUserMetadata();

    // IAM stores preferences per numeric user id.
    const persistUserId =
        userId && /^\d+$/.test(userId) ? userId : undefined;

    const [savedState, setSavedState] = useState<ThemeState | null>(null);
    const [savedMode, setSavedMode] = useState<string | null>(null);
    const [loadingPreferences, setLoadingPreferences] = useState(false);
    const [saving, setSaving] = useState(false);
    const loadedRef = useRef(false);

    const activeMode = theme ?? '';

    // Load the user's saved preferences once we know who they are. Every option
    // that is missing from the database falls back to the shipped default.
    useEffect(() => {
        if (loadedRef.current) return;

        let active = true;
        const load = async () => {
            if (!persistUserId) return;
            loadedRef.current = true;
            setLoadingPreferences(true);
            try {
                const preferences = await getUserPreferences(
                    APPEARANCE_SETTING,
                    persistUserId
                );
                if (!active) return;
                const next = coerceThemeState(preferences);
                setState(next);
                const mode =
                    typeof preferences.mode === 'string'
                        ? preferences.mode
                        : null;
                if (mode) setTheme(mode);
                setSavedState(next);
                setSavedMode(mode ?? theme ?? 'system');
            } catch {
                if (!active) return;
                setSavedState(DEFAULT_THEME_STATE);
                setSavedMode(theme ?? 'system');
            } finally {
                if (active) setLoadingPreferences(false);
            }
        };
        load();

        return () => {
            active = false;
        };
    }, [persistUserId, setState, setTheme, theme]);

    const currentMode = theme ?? 'system';
    const dirty =
        savedState !== null &&
        (!themeEquals(state, savedState) ||
            currentMode !== (savedMode ?? 'system'));

    const handleReset = () => {
        reset();
        setTheme('system');
        toast.success('Appearance reset to default');
    };

    const handleSave = async () => {
        if (!persistUserId) {
            toast.error('Sign in to save your appearance');
            return;
        }
        setSaving(true);
        try {
            await saveUserPreferences(
                APPEARANCE_SETTING,
                [
                    ...themeStateToPreferences(state),
                    { key: 'mode', value: currentMode },
                ],
                persistUserId
            );
            setSavedState(state);
            setSavedMode(currentMode);
            toast.success('Appearance saved');
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Could not save appearance'
            );
        } finally {
            setSaving(false);
        }
    };

    const baseLabel =
        BASE_COLOR_OPTIONS.find((option) => option.id === state.base)?.label ??
        'Custom';
    const themeLabel =
        THEME_COLOR_OPTIONS.find((option) => option.id === state.theme)?.label ??
        'Custom';
    const chartLabel =
        CHART_COLOR_OPTIONS.find((option) => option.id === state.chart)?.label ??
        'Custom';

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">Appearance</h2>
                        <p className="text-sm text-muted-foreground">
                            Personalize the look of the suite. Changes are
                            previewed live and saved to your account.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {loadingPreferences ? (
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                Loading saved preferences…
                            </span>
                        ) : (
                            persistUserId &&
                            savedState !== null && (
                                <span className="hidden text-xs text-muted-foreground sm:inline">
                                    {dirty
                                        ? 'Unsaved changes'
                                        : 'All changes saved'}
                                </span>
                            )
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                        >
                            <RotateCcw className="size-4" />
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || loadingPreferences || !dirty}
                        >
                            {saving ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Save
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    {/* Controls */}
                    <div className="space-y-6">
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle className="flex items-center gap-2">
                                    <Sun className="size-4" />
                                    Mode
                                </CardTitle>
                                <CardDescription>
                                    Choose between light, dark, or matching your
                                    system.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ToggleGroup
                                    type="single"
                                    value={activeMode}
                                    onValueChange={(value) =>
                                        value && setTheme(value)
                                    }
                                    variant="outline"
                                    className="w-full"
                                >
                                    {MODE_OPTIONS.map((option) => (
                                        <ToggleGroupItem
                                            key={option.value}
                                            value={option.value}
                                            className="flex-1 gap-2"
                                        >
                                            <option.icon className="size-4" />
                                            {option.label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </CardContent>
                        </Card>

                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle className="flex items-center gap-2">
                                    <Type className="size-4" />
                                    Style
                                </CardTitle>
                                <CardDescription>
                                    Adjust the corner radius and typography.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="radius">Radius</Label>
                                        <span className="text-sm tabular-nums text-muted-foreground">
                                            {state.radius.toFixed(3)}rem
                                        </span>
                                    </div>
                                    <input
                                        id="radius"
                                        type="range"
                                        min={MIN_RADIUS}
                                        max={MAX_RADIUS}
                                        step={RADIUS_STEP}
                                        value={state.radius}
                                        onChange={(e) =>
                                            update({
                                                radius: Number(e.target.value),
                                            })
                                        }
                                        className="w-full cursor-pointer accent-primary"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {RADIUS_PRESETS.map((value) => (
                                            <Button
                                                key={value}
                                                type="button"
                                                size="xs"
                                                variant={
                                                    Math.abs(
                                                        state.radius - value
                                                    ) < 0.001
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    update({ radius: value })
                                                }
                                            >
                                                {value === 0
                                                    ? 'None'
                                                    : `${value}rem`}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label>Font</Label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {FONTS.map((font) => {
                                            const active =
                                                state.font === font.id;
                                            return (
                                                <button
                                                    key={font.id}
                                                    type="button"
                                                    onClick={() =>
                                                        update({
                                                            font: font.id as FontId,
                                                        })
                                                    }
                                                    className={cn(
                                                        'rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                                                        active
                                                            ? 'border-primary ring-1 ring-primary'
                                                            : 'border-border'
                                                    )}
                                                >
                                                    <span
                                                        className="block text-base leading-none"
                                                        style={{
                                                            fontFamily:
                                                                font.sans ??
                                                                undefined,
                                                        }}
                                                    >
                                                        Ag
                                                    </span>
                                                    <span className="mt-2 block text-xs text-muted-foreground">
                                                        {font.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="size-4" />
                                    Base color
                                </CardTitle>
                                <CardDescription>
                                    The neutral surface used for backgrounds,
                                    borders and muted text.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <SwatchGrid
                                    options={BASE_COLOR_OPTIONS}
                                    value={state.base}
                                    onChange={(base) => update({ base })}
                                    color={baseSwatch}
                                />
                            </CardContent>
                        </Card>

                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle className="flex items-center gap-2">
                                    <Paintbrush className="size-4" />
                                    Theme
                                </CardTitle>
                                <CardDescription>
                                    The primary color used for buttons, links
                                    and focus states.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <SwatchGrid
                                    options={THEME_COLOR_OPTIONS}
                                    value={state.theme}
                                    onChange={(next) =>
                                        update({ theme: next })
                                    }
                                    color={(id) => themeSwatch(id, state.base)}
                                />
                            </CardContent>
                        </Card>

                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle className="flex items-center gap-2">
                                    <ChartColumn className="size-4" />
                                    Chart color
                                </CardTitle>
                                <CardDescription>
                                    The palette used by charts and data
                                    visualizations.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ChartSwatchGrid
                                    options={CHART_COLOR_OPTIONS}
                                    value={state.chart}
                                    onChange={(chart) => update({ chart })}
                                    colors={(id) => chartSwatch(id, state)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Live preview */}
                    <div>
                        <Card className="p-4 gap-2 lg:sticky lg:top-6">
                            <CardHeader className="p-0">
                                <CardTitle>Preview</CardTitle>
                                <CardDescription>
                                    {baseLabel} · {themeLabel} · {chartLabel}{' '}
                                    charts
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-5">
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm">Primary</Button>
                                    <Button size="sm" variant="secondary">
                                        Secondary
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        Outline
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                        Ghost
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge>Badge</Badge>
                                    <Badge variant="secondary">
                                        Secondary
                                    </Badge>
                                    <Badge variant="outline">Outline</Badge>
                                    <Badge variant="destructive">
                                        Destructive
                                    </Badge>
                                </div>

                                <div className="rounded-lg border bg-card p-4">
                                    <p className="text-sm font-medium">
                                        Card title
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        A sample card surface using the card and
                                        muted tokens.
                                    </p>
                                    <Separator className="my-3" />
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="preview-switch">
                                            Notifications
                                        </Label>
                                        <Switch
                                            id="preview-switch"
                                            defaultChecked
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end gap-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <div
                                            key={n}
                                            className="w-full rounded-t"
                                            style={{
                                                height: `${24 + n * 8}px`,
                                                background: `var(--chart-${n})`,
                                            }}
                                        />
                                    ))}
                                </div>

                                <Tabs defaultValue="overview">
                                    <TabsList className="w-full">
                                        <TabsTrigger value="overview">
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="activity">
                                            Activity
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent
                                        value="overview"
                                        className="pt-2"
                                    >
                                        <Progress value={64} />
                                    </TabsContent>
                                    <TabsContent
                                        value="activity"
                                        className="pt-2 text-xs text-muted-foreground"
                                    >
                                        No recent activity.
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
