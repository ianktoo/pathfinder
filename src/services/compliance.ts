
import { supabase } from './supabaseClient';
import { BackendService } from './storage';
import { OptionService } from './options';
import { UserProfile, Itinerary } from '../types';

export interface UserDataExport {
    profile: UserProfile | null;
    itineraries: Itinerary[];
    preferences: Record<string, any>;
    timestamp: string;
    version: string;
}

export interface PrivacySettings {
    marketing_opt_in: boolean;
    ai_processing_opt_in: boolean;
    analytics_opt_in: boolean;
}

export const ComplianceService = {

    /**
     * Fetch user privacy settings
     */
    getSettings: async (): Promise<PrivacySettings | null> => {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('user_privacy_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            // If missing, return defaults (and maybe create row?)
            return {
                marketing_opt_in: false,
                ai_processing_opt_in: true,
                analytics_opt_in: true
            };
        }

        return data as PrivacySettings;
    },

    /**
     * Update user privacy settings
     */
    updateSettings: async (settings: Partial<PrivacySettings>): Promise<boolean> => {
        if (!supabase) return false;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('user_privacy_settings')
            .upsert({
                user_id: user.id,
                ...settings,
                updated_at: new Date().toISOString()
            });

        return !error;
    },

    /**
     * Mocks a check for user's region to determine applicable regulations.
     * In a real app, this would use IP geolocation or user settings.
     */
    detectRegulation: async (): Promise<'GDPR' | 'CCPA' | 'GENERIC'> => {
        // Mocking a check - for POC we assume Generic or let user toggle
        return 'CCPA'; // Defaulting to California as per user context
    },

    /**
     * exports all user data as a JSON object using server-side aggregation
     */
    exportUserData: async (): Promise<UserDataExport | null> => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase.rpc('export_user_data');

            if (error) {
                console.error("Export RPC failed:", error);
                // Fallback to client-side collection if RPC fails
                return await ComplianceService.clientSideExportFallback();
            }

            return data as UserDataExport;
        } catch (e) {
            console.error("Export failed", e);
            return null;
        }
    },

    /**
     * Fallback if RPC is not available
     */
    clientSideExportFallback: async (): Promise<UserDataExport> => {
        const profile = await BackendService.getUser();
        const itineraries = await BackendService.getSavedItineraries();

        return {
            profile,
            itineraries,
            preferences: { theme: localStorage.getItem('theme') },
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    },

    /**
     * Deletes user account and all associated data.
     */
    deleteUserAccount: async (): Promise<boolean> => {
        try {
            if (!supabase) return false;

            // 1. Server-side data wipe via RPC
            const { error } = await supabase.rpc('delete_user_account_data');

            if (error) {
                console.error("Delete RPC failed", error);
                // Attempt manual delete if RPC fails (fallback)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('itineraries').delete().eq('user_id', user.id);
                    await supabase.from('profiles').delete().eq('id', user.id);
                }
            }

            // 2. Clear Local Storage
            localStorage.clear();

            // 3. Sign Out
            await supabase.auth.signOut();

            return true;
        } catch (error) {
            console.error("Compliance: Delete Account Failed", error);
            return false;
        }
    },

    /**
     * Download the exported data as a file
     */
    downloadDataPackage: async () => {
        try {
            const data = await ComplianceService.exportUserData();
            if (!data) throw new Error("No data returned");

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pathfinder_data_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return true;
        } catch (e) {
            console.error("Download failed", e);
            return false;
        }
    }
};
