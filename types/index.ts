
export interface UserProfile {
  name: string;
  email: string;
  city: string;
  personality: 'Adventurous' | 'Chill' | 'Foodie' | 'Cultural' | 'Party';
}

export interface YelpData {
  rating: number;
  reviewCount: number;
  price: '$' | '$$' | '$$$' | '$$$$';
  imageUrl?: string;
}

export interface ItineraryItem extends YelpData {
  time: string;
  activity: string;
  locationName: string;
  description: string;
  verified: boolean;
  category: 'Food' | 'Activity' | 'Nightlife';
}

export interface Itinerary {
  id: string;
  title: string;
  date: string;
  items: ItineraryItem[];
  mood: string;
  tags: string[];
  author?: string;
  likes?: number;
  shared?: boolean;
}

export type ModelID = 'gemini-2.5-flash' | 'gemini-3-pro-preview';
export type ViewState = 'home' | 'auth' | 'onboarding' | 'dashboard' | 'create' | 'about' | 'privacy' | 'community' | 'profile' | 'library';
