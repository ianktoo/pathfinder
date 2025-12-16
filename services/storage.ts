import { Itinerary, UserProfile, ItineraryItem } from "../types/index";
import { logError } from "../lib/utils";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { AuthService } from "./auth";

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

          if (!error && data) {
            itineraries = data.map((row: any) => {
              const items = (row.itinerary_items || [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((link: any) => ({
                  time: link.time,
                  activity: link.activity,
                  description: link.description,
                  completed: link.completed,
                  userReview: link.user_review,
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

    // 2. Merge/Fallback to Local Storage
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

  getItineraryById: async (id: string): Promise<Itinerary | null> => {
    // 1. Check Local Storage first (fastest)
    const local = JSON.parse(localStorage.getItem('saved_itineraries') || '[]');
    const foundLocal = local.find((i: Itinerary) => i.id === id);
    if (foundLocal) return foundLocal;

    // 2. Check Community Local
    const communityLocal = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
    const foundCommunity = communityLocal.find((i: Itinerary) => i.id === id);
    if (foundCommunity) return foundCommunity;

    // 3. Try Supabase
    if (isSupabaseConfigured()) {
      try {
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
          .eq('id', id)
          .single();

        if (!error && data) {
          const items = (data.itinerary_items || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((link: any) => ({
              time: link.time,
              activity: link.activity,
              description: link.description,
              locationName: link.places?.name || 'Unknown',
              category: link.places?.category,
              rating: link.places?.rating,
              reviewCount: link.places?.review_count,
              price: link.places?.price,
              imageUrl: link.places?.image_url,
              verified: link.places?.verified,
              completed: link.completed,
              userReview: link.user_review
            }));

          return {
            id: data.id,
            title: data.title,
            date: data.date,
            mood: data.mood,
            tags: data.tags || [],
            items: items,
            likes: data.likes_count,
            shared: data.is_public,
            verified_community: data.verified_community,
            author: data.profiles?.name || 'Explorer'
          };
        }
      } catch (e) {
        logError("Failed to fetch itinerary by ID", e);
      }
    }
    return null;
  },

  getCommunityItineraries: async (): Promise<Itinerary[]> => {
    if (isSupabaseConfigured()) {
      try {
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

    const localCommunity = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
    return [...localCommunity, ...MOCK_COMMUNITY_DATA];
  },

  publishItinerary: async (itinerary: Itinerary, authorName: string): Promise<boolean> => {
    try {
      const validId = isValidUUID(itinerary.id) ? itinerary.id : crypto.randomUUID();
      const publishedItinerary = { ...itinerary, id: validId, shared: true, author: authorName };
      const existing = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
      localStorage.setItem('community_itineraries', JSON.stringify([publishedItinerary, ...existing]));
    } catch (e) { }

    if (isSupabaseConfigured()) {
      const itinToPublish = { ...itinerary, shared: true };
      return await BackendService.saveItinerary(itinToPublish);
    }
    return true;
  },

  // --- USER PROFILES ---

  getUser: async (explicitUser?: any): Promise<UserProfile | null> => {
    let profile: UserProfile | null = null;
    let sessionUser = explicitUser || null;

    if (isSupabaseConfigured()) {
      try {
        // 1. Get Session if not provided
        if (!sessionUser) {
          const { data: { session } } = await supabase!.auth.getSession();
          if (session?.user) {
            sessionUser = session.user;
          }
        }

        if (sessionUser) {
          // 2. Fetch profile with strict timeout
          const profilePromise = supabase!
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .single();

          // Only wait 1 second for DB. If it's sleeping, we use session data.
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DB Timeout')), 1000)
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
        // DB fail is okay, we fall back to session or local
      }
    }

    // 3. Fallback: Construct profile from Session Data if DB failed
    if (!profile && sessionUser) {
      const partial = AuthService.mapUserToProfile(sessionUser);
      // Try to pull city/personality from local storage to fill gaps
      const cached = localStorage.getItem('user_profile');
      const cachedObj = cached ? JSON.parse(cached) : {};

      profile = {
        ...partial,
        city: cachedObj.city || '',
        personality: cachedObj.personality || 'Adventurous'
      } as UserProfile;
    }

    // 4. Final Fallback: Local Storage only
    if (!profile) {
      const cached = localStorage.getItem('user_profile');
      if (cached) return JSON.parse(cached);
    }

    return profile;
  },

  saveUser: async (user: UserProfile) => {
    localStorage.setItem('user_profile', JSON.stringify(user));

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