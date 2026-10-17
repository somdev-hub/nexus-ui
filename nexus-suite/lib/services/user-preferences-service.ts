import apiClient from '@/lib/api-client';

/** Setting group used by the appearance page. */
export const APPEARANCE_SETTING = 'appearance';

export type UserPreference = {
    userPreferenceId: number;
    userId: number;
    settingName: string;
    key: string;
    value: unknown;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type UserPreferenceInput = {
    key: string;
    value: unknown;
};

/**
 * Fetches a user's stored preferences for a setting group as a `key -> value`
 * map. Keys that were never saved are absent, so the caller can fall back to
 * its own defaults per feature.
 */
export async function getUserPreferences(
    settingName: string,
    userId?: string | number
): Promise<Record<string, unknown>> {
    const params = new URLSearchParams({ settingName });
    if (userId != null) {
        params.set('userId', String(userId));
    }

    const response = await apiClient.get<Record<string, unknown>>(
        `/iam/user-preferences?${params.toString()}`
    );
    return response.data ?? {};
}

/** Inserts or updates the given preferences for a setting group. */
export async function saveUserPreferences(
    settingName: string,
    preferences: UserPreferenceInput[],
    userId?: string | number
): Promise<UserPreference[]> {
    const params = new URLSearchParams();
    if (userId != null) {
        params.set('userId', String(userId));
    }
    const query = params.toString();

    const response = await apiClient.post<UserPreference[]>(
        `/iam/user-preferences${query ? `?${query}` : ''}`,
        { settingName, preferences }
    );
    return response.data ?? [];
}
