import { supabase } from '../lib/supabaseClient';
import { SettingsState } from '../types';
import { defaultSettings } from '../store/slices/settingsSlice';

/**
 * Service object for interacting with user profile and settings data.
 * This service uses the `user_metadata` field in Supabase Auth to store settings,
 * which is more flexible and robust than relying on a separate `profiles` table.
 */
export const profileService = {
  /**
   * Fetches the user's combined profile and settings from the `user_metadata`.
   * If a user is new or has no settings, it gracefully handles the absence of data.
   * @returns A promise that resolves to an object containing the user's profile/settings data or an error.
   */
  async getProfileAndSettings() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return { data: null, error: userError };
    }
    if (!user) {
      return { data: null, error: new Error("User not authenticated.") };
    }

    const userMetadata = user.user_metadata || {};
    // Settings are stored under a 'settings' key in user_metadata
    const settings = userMetadata.settings as SettingsState | null;

    // Construct a response object that is backward-compatible with the old `profiles` select
    const responseData = {
      name: userMetadata.name || settings?.profile?.name, // `name` is also on user_metadata directly from signup
      phone: settings?.profile?.phone,
      locale: settings?.profile?.locale,
      preferredCurrency: settings?.profile?.preferredCurrency,
      avatar: settings?.profile?.avatar,
      settings: settings, // The full settings object
    };
    
    return { data: responseData, error: null };
  },

  /**
   * Updates the user's settings in the `user_metadata` field in Supabase Auth.
   * This overwrites the existing settings with the new object provided.
   * @param settings The complete `SettingsState` object to save.
   * @returns A promise that resolves to an object containing the updated settings data or an error.
   */
  async updateProfileAndSettings(settings: SettingsState) {
    const { data, error } = await supabase.auth.updateUser({
        data: {
            // Store the entire settings object under a 'settings' key
            settings: settings,
            // Also update the top-level name for consistency with signup
            name: settings.profile.name,
        }
    });

    if (error) {
      return { data: null, error };
    }

    // Return the updated settings object from the user response
    return { data: data.user?.user_metadata.settings, error: null };
  },
  
  // createInitialProfile is no longer needed as App.tsx will merge defaults if settings are not found.
};
