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
      // Ensure we have a valid UUID.
      const validId = isValidUUID(itinerary.id) ? itinerary.id : crypto.randomUUID();
      const itineraryToSave = { ...itinerary, id: validId };

      // 1. Always save to Local Storage (Cache/Offline)
      // Note: Local storage keeps the denormalized JSON structure for ease of offline use
      const existing = JSON.parse(localStorage.getItem('saved_itineraries') || '[]');
      const filtered = existing.filter((i: Itinerary) => i.id !== itinerary.id);
      localStorage.setItem('saved_itineraries', JSON.stringify([itineraryToSave, ...filtered]));

      // 2. Try Supabase (Relational Save)
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          
          // A. Save the Itinerary Header
          const { error: itinError } = await supabase!
            .from('itineraries')
            .upsert({
              id: validId,
              user_id: user.id,
              title: itineraryToSave.title,
              date: itineraryToSave.date,
              mood: itineraryToSave.mood,
              tags: itineraryToSave.tags,
              is_public: itineraryToSave.shared || false,
              likes_count: itineraryToSave.likes || 0,
              verified_community: itineraryToSave.verified_community || false
            }, { onConflict: 'id' });

          if (itinError) throw itinError;

          // B. Handle Items & Places Normalization
          if (itineraryToSave.items && itineraryToSave.items.length > 0) {
            
            // 1. Upsert Places (Businesses)
            // We use locationName as a key constraint. In a real app, use Yelp ID.
            for (const item of itineraryToSave.items) {
               await supabase!
                 .from('places')
                 .upsert({
                    name: item.locationName,
                    category: item.category,
                    rating: item.rating,
                    review_count: item.reviewCount,
                    price: item.price,
                    image_url: item.imageUrl,
                    verified: item.verified
                 }, { onConflict: 'name' }); 
            }

            // 2. Clear existing items for this itinerary to prevent duplicates
            await supabase!
              .from('itinerary_items')
              .delete()
              .eq('itinerary_id', validId);

            // 3. Link Places to Itinerary via itinerary_items
            // Fetch the place IDs we just upserted.
            const newLinks = [];
            for (let i = 0; i < itineraryToSave.items.length; i++) {
                const item = itineraryToSave.items[i];
                
                // Get the place ID for this item
                const { data: placeData } = await supabase!
                    .from('places')
                    .select('id')
                    .eq('name', item.locationName)
                    .single();

                if (placeData) {
                    newLinks.push({
                        itinerary_id: validId,
                        place_id: placeData.id,
                        time: item.time,
                        activity: item.activity,
                        description: item.description,
                        order_index: i,
                        completed: item.completed || false,
                        user_review: item.userReview // JSONB for the review itself
                    });
                }
            }

            if (newLinks.length > 0) {
                const { error: linkError } = await supabase!
                    .from('itinerary_items')
                    .insert(newLinks);
                
                if (linkError) console.error("Link error", linkError);
            }
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
          // Fetch Itineraries with joined Items and Places
          // This relational query reconstructs the full object
          const { data, error } = await supabase!
            .from('itineraries')
            .select(`
                *,
                itinerary_items (
                    time,
                    activity,
                    description,
                    order_index,
                    completed,
                    user_review,
                    places (
                        name,
                        category,
                        rating,
                        review_count,
                        price,
                        image_url,
                        verified
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          if (data) {
            itineraries = data.map((row: any) => {
                // Map the joined relational data back to the flat ItineraryItem structure
                const items = (row.itinerary_items || [])
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((link: any) => ({
                        time: link.time,
                        activity: link.activity,
                        description: link.description,
                        completed: link.completed,
                        userReview: link.user_review,
                        // Flatten place data
                        locationName: link.places?.name || 'Unknown',
                        category: link.places?.category,
                        rating: link.places?.rating,
                        reviewCount: link.places?.review_count,
                        price: link.places?.price,
                        imageUrl: link.places?.image_url,
                        verified: link.places?.verified
                    }));

                return {
                    id: row.id,
                    title: row.title,
                    date: row.date,
                    mood: row.mood,
                    tags: row.tags || [],
                    items: items,
                    likes: row.likes_count,
                    shared: row.is_public,
                    verified_community: row.verified_community,
                    bookmarked: false 
                };
            });
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
        // Relational query for community feed
        const { data, error } = await supabase!
          .from('itineraries')
          .select(`
            *,
            profiles(name),
            itinerary_items (
                time,
                activity,
                description,
                order_index,
                places (
                    name,
                    category,
                    rating,
                    review_count,
                    price,
                    image_url,
                    verified
                )
            )
          `)
          .eq('is_public', true)
          .order('likes_count', { ascending: false })
          .limit(20);

        if (!error && data) {
          return data.map((row: any) => {
             const items = (row.itinerary_items || [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((link: any) => ({
                    time: link.time,
                    activity: link.activity,
                    description: link.description,
                    locationName: link.places?.name,
                    category: link.places?.category,
                    rating: link.places?.rating,
                    reviewCount: link.places?.review_count,
                    price: link.places?.price,
                    imageUrl: link.places?.image_url,
                    verified: link.places?.verified
                }));

             return {
                id: row.id,
                title: row.title,
                date: row.date,
                mood: row.mood,
                tags: row.tags || [],
                items: items,
                author: row.profiles?.name || 'Explorer',
                likes: row.likes_count,
                shared: true,
                verified_community: row.verified_community
             };
          });
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
        const validId = isValidUUID(itinerary.id) ? itinerary.id : crypto.randomUUID();
        const publishedItinerary = { ...itinerary, id: validId, shared: true, author: authorName };
        const existing = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
        localStorage.setItem('community_itineraries', JSON.stringify([publishedItinerary, ...existing]));
    } catch(e) {}

    // 2. Supabase Update
    if (isSupabaseConfigured()) {
        const itinToPublish = { ...itinerary, shared: true };
        return await BackendService.saveItinerary(itinToPublish);
    }
    return true;
  },

  // --- USER PROFILES ---

  getUser: async (): Promise<UserProfile | null> => {
    let profile: UserProfile | null = null;

    if (isSupabaseConfigured()) {
        try {
            // Use getSession (local check) instead of getUser (remote check) for speed
            const { data: { session } } = await supabase!.auth.getSession();
            
            if (session?.user) {
                // Fetch profile with strict timeout (2s) to prevent "sleeping db" hang
                const profilePromise = supabase!
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('DB Timeout')), 2000)
                );

                const { data } = await Promise.race([profilePromise, timeoutPromise]) as any;
                
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
            logError("User fetch failed or timed out", e);
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