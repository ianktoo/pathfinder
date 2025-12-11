import { Itinerary, UserProfile, ItineraryItem } from "../types/index";
import { logError } from "../lib/utils";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Mock data for fallback/demo
const MOCK_COMMUNITY_DATA: Itinerary[] = [
  {
    id: 'c1',
    title: 'Neon Nights in Tokyo',
    date: '2024-03-15',
    mood: 'Adventure',
    author: 'Kenji S.',
    likes: 1242,
    verified_community: true,
    tags: ['Nightlife', 'Foodie', 'Cyberpunk'],
    items: [
      {
        time: '19:00',
        activity: 'Dinner',
        locationName: 'Omoide Yokocho',
        description: 'Atmospheric alleyway with yakitori stalls.',
        verified: true,
        category: 'Food',
        rating: 4.5,
        reviewCount: 1200,
        price: '$$',
        imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop'
      }
    ]
  }
];

// Helper to validate UUIDs
const isValidUUID = (uuid: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

export const BackendService = {
  
  // --- ITINERARIES ---

  saveItinerary: async (itinerary: Itinerary): Promise<boolean> => {
    try {
      // Ensure we have a valid UUID. If legacy ID or missing, generate one.
      const validId = isValidUUID(itinerary.id) ? itinerary.id : crypto.randomUUID();
      const itineraryToSave = { ...itinerary, id: validId };

      // 1. Always save to Local Storage (Cache/Offline)
      const existing = JSON.parse(localStorage.getItem('saved_itineraries') || '[]');
      const filtered = existing.filter((i: Itinerary) => i.id !== itinerary.id); // Filter out old ID
      localStorage.setItem('saved_itineraries', JSON.stringify([itineraryToSave, ...filtered]));

      // 2. Try Supabase
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          const { error } = await supabase!
            .from('itineraries')
            .upsert({
              id: validId,
              user_id: user.id,
              title: itineraryToSave.title,
              date: itineraryToSave.date,
              mood: itineraryToSave.mood,
              tags: itineraryToSave.tags,
              items: itineraryToSave.items, // JSONB column stores activities
              is_public: itineraryToSave.shared || false,
              likes_count: itineraryToSave.likes || 0,
              verified_community: itineraryToSave.verified_community || false
            }, { onConflict: 'id' });

          if (error) {
            logError("Supabase upsert failed:", error);
            throw error;
          }
        }
      }
      return true;
    } catch (e) {
      logError("Storage failed", e);
      return false; 
    }
  },

  getSavedItineraries: async (): Promise<Itinerary[]> => {
    let itineraries: Itinerary[] = [];

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          const { data, error } = await supabase!
            .from('itineraries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          if (data) {
            itineraries = data.map(row => ({
              id: row.id,
              title: row.title,
              date: row.date,
              mood: row.mood,
              tags: row.tags || [],
              items: row.items as ItineraryItem[],
              likes: row.likes_count,
              shared: row.is_public,
              verified_community: row.verified_community
            }));
          }
        }
      } catch (e) {
        logError("Supabase fetch failed, falling back to local", e);
      }
    }

    // 2. Merge/Fallback to Local Storage if Supabase returned nothing or failed
    if (itineraries.length === 0) {
      try {
        const local = JSON.parse(localStorage.getItem('saved_itineraries') || '[]');
        if (local.length > 0) return local;
      } catch (e) {
        return [];
      }
    }

    return itineraries;
  },

  getCommunityItineraries: async (): Promise<Itinerary[]> => {
    if (isSupabaseConfigured()) {
      try {
        // Fetch public itineraries with profile info
        const { data, error } = await supabase!
          .from('itineraries')
          .select('*, profiles(name)')
          .eq('is_public', true)
          .order('likes_count', { ascending: false })
          .limit(20);

        if (!error && data) {
          return data.map(row => ({
            id: row.id,
            title: row.title,
            date: row.date,
            mood: row.mood,
            tags: row.tags || [],
            items: row.items as ItineraryItem[],
            author: row.profiles?.name || 'Explorer',
            likes: row.likes_count,
            shared: true,
            verified_community: row.verified_community
          }));
        }
      } catch (e) {
        logError("Community fetch failed", e);
      }
    }

    // Fallback
    const localCommunity = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
    return [...localCommunity, ...MOCK_COMMUNITY_DATA];
  },

  publishItinerary: async (itinerary: Itinerary, authorName: string): Promise<boolean> => {
    // 1. Local Update (Optimistic)
    try {
        // Ensure ID is UUID before publishing
        const validId = isValidUUID(itinerary.id) ? itinerary.id : crypto.randomUUID();
        const publishedItinerary = { ...itinerary, id: validId, shared: true, author: authorName };
        
        const existing = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
        localStorage.setItem('community_itineraries', JSON.stringify([publishedItinerary, ...existing]));
    } catch(e) {}

    // 2. Supabase Update
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) return false;

        const validId = isValidUUID(itinerary.id) ? itinerary.id : crypto.randomUUID();

        const { error } = await supabase!
            .from('itineraries')
            .upsert({
                id: validId,
                user_id: user.id,
                title: itinerary.title,
                date: itinerary.date,
                mood: itinerary.mood,
                tags: itinerary.tags,
                items: itinerary.items,
                is_public: true, 
                likes_count: itinerary.likes || 0,
                verified_community: itinerary.verified_community || false
            });
        
        return !error;
      } catch (e) {
        logError("Publish failed", e);
        return false;
      }
    }
    return true;
  },

  // --- USER PROFILES ---

  getUser: async (): Promise<UserProfile | null> => {
    let profile: UserProfile | null = null;

    if (isSupabaseConfigured()) {
        try {
            const { data: { user } } = await supabase!.auth.getUser();
            if (user) {
                const { data } = await supabase!
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (data) {
                    profile = {
                        name: data.name,
                        email: data.email,
                        city: data.city,
                        personality: data.personality
                    };
                }
            }
        } catch (e) {
            logError("User fetch failed", e);
        }
    }

    // Fallback to local
    if (!profile) {
        const cached = localStorage.getItem('user_profile');
        if (cached) return JSON.parse(cached);
    }

    return profile;
  },

  saveUser: async (user: UserProfile) => {
    // Local Cache
    localStorage.setItem('user_profile', JSON.stringify(user));

    // Supabase Sync
    if (isSupabaseConfigured()) {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            if (session?.user) {
                await supabase!
                    .from('profiles')
                    .upsert({
                        id: session.user.id,
                        email: user.email,
                        name: user.name,
                        city: user.city,
                        personality: user.personality
                    });
            }
        } catch (e) {
            logError("Profile sync failed", e);
        }
    }
  },

  clearUser: async () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('saved_itineraries');
  }
};