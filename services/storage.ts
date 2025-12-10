import { Itinerary, UserProfile } from "../types/index";

// Mock data to seed the community view
const MOCK_COMMUNITY_DATA: Itinerary[] = [
  {
    id: 'c1',
    title: 'Neon Nights in Tokyo',
    date: '2024-03-15',
    mood: 'Adventure',
    author: 'Kenji S.',
    likes: 342,
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
      },
      {
        time: '21:00',
        activity: 'Drinks',
        locationName: 'Golden Gai',
        description: 'Tiny bars packed with character.',
        verified: true,
        category: 'Nightlife',
        rating: 4.7,
        reviewCount: 890,
        price: '$$',
        imageUrl: 'https://images.unsplash.com/photo-1554797589-7241bb691973?q=80&w=1000&auto=format&fit=crop'
      }
    ]
  },
  {
    id: 'c2',
    title: 'Brooklyn Hipster Crawl',
    date: '2024-04-02',
    mood: 'Chill',
    author: 'Sarah Jenkins',
    likes: 156,
    tags: ['Coffee', 'Vintage', 'Art'],
    items: [
      {
        time: '10:00',
        activity: 'Brunch',
        locationName: 'Five Leaves',
        description: 'Australian cafe famous for ricotta pancakes.',
        verified: true,
        category: 'Food',
        rating: 4.4,
        reviewCount: 2100,
        price: '$$',
        imageUrl: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=1000&auto=format&fit=crop'
      },
      {
        time: '12:00',
        activity: 'Shopping',
        locationName: 'Beacon\'s Closet',
        description: 'Legendary vintage clothing store.',
        verified: true,
        category: 'Activity',
        rating: 4.2,
        reviewCount: 500,
        price: '$$',
        imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop'
      }
    ]
  },
  {
    id: 'c3',
    title: 'Parisian Art & Wine',
    date: '2024-05-10',
    mood: 'Cultural',
    author: 'Jean-Pierre',
    likes: 890,
    tags: ['Romantic', 'Museums', 'Wine'],
    items: [
      {
        time: '14:00',
        activity: 'Culture',
        locationName: 'Musée d\'Orsay',
        description: 'Impressionist art in a converted railway station.',
        verified: true,
        category: 'Activity',
        rating: 4.8,
        reviewCount: 15000,
        price: '$$',
        imageUrl: 'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?q=80&w=1000&auto=format&fit=crop'
      }
    ]
  }
];

export const BackendService = {
  saveItinerary: (itinerary: Itinerary) => {
    try {
      const existing = JSON.parse(localStorage.getItem('saved_itineraries') || '[]');
      // Avoid duplicates
      const filtered = existing.filter((i: Itinerary) => i.id !== itinerary.id);
      localStorage.setItem('saved_itineraries', JSON.stringify([itinerary, ...filtered]));
    } catch (e) {
      console.error("Storage failed", e);
    }
  },

  getSavedItineraries: (): Itinerary[] => {
    try {
      return JSON.parse(localStorage.getItem('saved_itineraries') || '[]');
    } catch (e) {
      return [];
    }
  },

  getCommunityItineraries: (): Itinerary[] => {
    try {
        const localCommunity = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
        return [...localCommunity, ...MOCK_COMMUNITY_DATA];
    } catch (e) {
        return MOCK_COMMUNITY_DATA;
    }
  },

  publishItinerary: (itinerary: Itinerary, authorName: string) => {
    try {
        const publishedItinerary = {
            ...itinerary,
            id: `pub_${Date.now()}`,
            author: authorName,
            likes: 0
        };
        const existing = JSON.parse(localStorage.getItem('community_itineraries') || '[]');
        localStorage.setItem('community_itineraries', JSON.stringify([publishedItinerary, ...existing]));
        return true;
    } catch (e) {
        console.error("Publish failed", e);
        return false;
    }
  },

  getUser: (): UserProfile | null => {
    const cached = localStorage.getItem('user_profile');
    return cached ? JSON.parse(cached) : null;
  },

  saveUser: (user: UserProfile) => {
    localStorage.setItem('user_profile', JSON.stringify(user));
  },

  clearUser: () => {
    localStorage.removeItem('user_profile');
  }
};