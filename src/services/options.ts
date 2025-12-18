import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ItineraryOption } from '../types';

export const OptionService = {
    /**
     * Fetches itinerary options using the secure 'get_itinerary_options' RPC.
     * If category is null, fetches all known categories in parallel.
     */
    async getOptions(category?: string): Promise<ItineraryOption[]> {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn("OptionService: Supabase not configured.");
            return [];
        }

        const start = Date.now();
        console.log(`OptionService: Fetching options for ${category || 'ALL'}...`);

        try {
            // Force auth check to ensure valid session for RLS/RPC
            await supabase.auth.getUser();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out after 10s')), 10000)
            );

            let data: ItineraryOption[] = [];

            if (category) {
                // Single Category Fetch (Secure RPC)
                const rpcCall = supabase.rpc('get_itinerary_options', { p_category: category });

                const { data: result, error } = await Promise.race([
                    rpcCall,
                    timeoutPromise
                ]) as any;

                if (error) throw error;
                data = result || [];
            } else {
                // Fetch All Categories (Fast Direct Select)
                // We use direct select here for performance (1 query vs 5 RPC calls)
                // The 'get_itinerary_options' RPC strictly requires a category parameter.
                const { data: result, error } = await Promise.race([
                    supabase
                        .from('itinerary_options')
                        .select('*')
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true }),
                    timeoutPromise
                ]) as any;

                if (error) throw error;
                data = result || [];
            }

            console.log(`OptionService: Fetch complete in ${Date.now() - start}ms. Items: ${data.length}`);
            return data;
        } catch (err) {
            console.error(`OptionService: Fetch failed after ${Date.now() - start}ms`, err);
            throw err;
        }
    },

    /**
     * Saves (creates or updates) an itinerary option using 'upsert_itinerary_option' RPC.
     */
    async saveOption(option: Partial<ItineraryOption>): Promise<boolean> {
        if (!isSupabaseConfigured() || !supabase) return false;

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            // RPC parameters mapping
            // Note: Explicitly use null for ID if undefined so Postgres receives NULL
            // Also ensure all other optional fields send NULL instead of undefined to match RPC signature
            const params = {
                p_id: option.id || null,
                p_category: option.category || null,
                p_label: option.label || null,
                p_value: option.value || null,
                p_sort_order: option.sort_order || 0,
                p_icon: option.icon || null,
                p_is_active: option.is_active !== undefined ? option.is_active : true
            };

            const { error } = await Promise.race([
                supabase.rpc('upsert_itinerary_option', params),
                timeoutPromise
            ]) as any;

            if (error) {
                console.error("OptionService: Save Error", error);
                return false;
            }

            return true;
        } catch (err) {
            console.error("OptionService: Save failed", err);
            return false;
        }
    },

    /**
     * Deletes an itinerary option by ID.
     */
    async deleteOption(id: string): Promise<boolean> {
        if (!isSupabaseConfigured() || !supabase) return false;

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            const { error } = await Promise.race([
                supabase.from('itinerary_options').delete().eq('id', id),
                timeoutPromise
            ]) as any;

            if (error) {
                console.error("OptionService: Delete Error", error);
                return false;
            }

            return true;
        } catch (err) {
            console.error("OptionService: Delete failed", err);
            return false;
        }
    }
};
