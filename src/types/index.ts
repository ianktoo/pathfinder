
export interface UserProfile {
  name: string;
  email: string;
  city: string;
  personality: 'Adventurous' | 'Chill' | 'Foodie' | 'Cultural' | 'Party';
  role?: 'user' | 'admin' | 'explorer';
  id?: string;
  created_at?: string;
}

export interface YelpData {
  rating: number;
  reviewCount: number;
  price: '$' | '$$' | '$$$' | '$$$$';
  imageUrl?: string;
}

export interface UserReview {
  rating: number;
  text: string;
  date: string;
  postedToYelp: boolean;
}

export interface ItineraryItem extends YelpData {
  time: string;
  activity: string;
  locationName: string;
  description: string;
  verified: boolean;
  category: 'Food' | 'Activity' | 'Nightlife';
  completed?: boolean;
  userReview?: UserReview;
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
  bookmarked?: boolean;
  verified_community?: boolean;
  featured?: boolean;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export type ModelID = 'gemini-1.5-flash-001' | 'gemini-1.5-pro-001' | 'gemini-2.0-flash-exp';
export type ViewState = 'home' | 'auth' | 'onboarding' | 'dashboard' | 'create' | 'about' | 'privacy' | 'community' | 'profile' | 'library' | 'configure';

export interface ItineraryOption {
  id: string;
  category: 'mood' | 'budget' | 'duration' | 'group' | 'type';
  label: string;
  value: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
}