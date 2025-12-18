# Pathfinder Project Submission

## Inspiration

Travel planning is broken. We've all been there—spending hours scrolling through endless reviews, switching between apps, and still ending up with a generic itinerary that doesn't match our vibe. We wanted to build something that feels like having a local friend who *gets* you—someone who can instantly craft the perfect day based on your mood, budget, and preferences. With the rise of generative AI and rich local business data from Yelp, we saw an opportunity to transform travel planning from a chore into an exciting, personalized experience.

## What it does

**Pathfinder** is an AI-powered itinerary planner that creates hyper-local, personalized day trips in seconds. Here's how it works:

- **Smart Personalization**: Users select their mood (adventurous, relaxed, romantic), budget, group size, and duration. Our AI uses Google Gemini to generate custom itineraries that match their exact preferences.
- **Yelp Integration**: Each itinerary features real local businesses with ratings, reviews, and pricing—no generic recommendations.
- **Offline-First Design**: Itineraries are cached locally, so you can access your plans even without internet connectivity—perfect for travelers in areas with spotty service.
- **Community Sharing**: Users can publish their itineraries to a community feed, where others can like, clone, or remix them for their own adventures.
- **Full Authentication & Persistence**: Built on Supabase with secure user profiles, allowing users to save unlimited itineraries and access them across devices.

## How we built it

We built Pathfinder with a modern, resilient tech stack:

- **Frontend**: React 19 with TypeScript, styled with Tailwind CSS for a mobile-first, dark-mode-enabled interface
- **AI Engine**: Google Gemini (2.0 Flash for speed, 1.5 Pro for deep reasoning) with structured JSON output for reliable itinerary generation
- **Backend**: Supabase for authentication, PostgreSQL database, and Row-Level Security (RLS) policies
- **Architecture**: Modular service layer pattern with dedicated services for AI (`ai.ts`), storage (`storage.ts`), authentication (`auth.ts`), and location (`location.ts`)
- **Data Model**: Normalized database schema separating Places (businesses) from Itineraries, allowing efficient data reuse and community sharing
- **Build Tool**: Vite for lightning-fast development and optimized production builds
- **Deployment**: Vercel with SPA routing configuration

We implemented a **LangChain-inspired pattern** for AI interactions, making it easy to swap AI providers in the future. The app uses **localStorage as a resilience layer**, ensuring users never lose their data even if the backend is temporarily unavailable.

## Challenges we ran into

1. **AI Consistency**: Getting Gemini to consistently output structured JSON was tricky. We solved this by implementing strict response schemas and fallback parsing logic to handle edge cases.

2. **Supabase Timeouts**: Complex database queries occasionally timed out. We refactored to use RPC functions (`get_itinerary_options`, `upsert_itinerary_option`) and implemented parallel fetching for better performance.

3. **Offline Resilience**: Balancing between local caching and server sync was challenging. We built a hybrid system where data is immediately saved to localStorage, then synced to Supabase in the background.

4. **Image Loading & CORS**: Initially struggled with image sourcing. We integrated Unsplash API for high-quality, royalty-free images and implemented proper CORS handling.

5. **RLS Policies**: Crafting the right Row-Level Security policies to allow community sharing while protecting private itineraries required careful thought about access patterns.

## Accomplishments that we're proud of

- **End-to-End AI Integration**: Successfully implemented a production-ready AI pipeline that generates structured, actionable itineraries with real business data
- **Resilient Architecture**: Built a system that gracefully handles offline scenarios, API failures, and network issues
- **Beautiful UX**: Created a premium, mobile-first interface with smooth animations, dark mode, and intuitive navigation
- **Community Features**: Implemented a full social layer where users can discover, share, and remix each other's itineraries
- **Scalable Data Model**: Designed a normalized database schema that efficiently handles thousands of places and itineraries without duplication
- **Security First**: Implemented comprehensive RLS policies, secure authentication, and proper environment variable management

## What we learned

- **AI Prompt Engineering**: Learned how to craft effective prompts that balance creativity with structure, and how to use JSON schemas to enforce output formats
- **Supabase Best Practices**: Gained deep knowledge of RLS policies, database functions, and optimizing queries for performance
- **Offline-First Design**: Understood the complexities of building resilient apps that work seamlessly with or without connectivity
- **React 19 Features**: Explored the latest React patterns including improved hooks, concurrent rendering, and better TypeScript integration
- **Modular Architecture**: Reinforced the importance of separation of concerns—our service layer made debugging and feature additions much easier

## What's next for Pathfinder

1. **Real Yelp API Integration**: Replace AI-generated business data with live Yelp API calls for real-time ratings, photos, and availability
2. **Smart Routing**: Add Google Maps integration to optimize travel time between locations and provide turn-by-turn navigation
3. **Collaborative Planning**: Allow groups to co-create itineraries in real-time with voting on activities
4. **AI Refinement**: Implement conversational follow-ups ("make it more budget-friendly", "swap the restaurant") using multi-turn AI interactions
5. **Mobile App**: Build native iOS/Android apps with push notifications for itinerary reminders
6. **Advanced Personalization**: Learn from user behavior (completed activities, reviews) to improve future recommendations
7. **Multi-Day Trips**: Extend beyond single-day itineraries to full vacation planning with hotel recommendations
8. **Monetization**: Partner with local businesses for featured placements and reservation integration

## Current Status & How to Run

⚠️ **Honest Update**: We're incredibly proud of what we've built in this short time, but we want to be transparent—some features are still in beta and you might encounter bugs. We are actively squashing them!

If you'd like to experience the full potential of Pathfinder (including the generative AI features), the best way is to run it locally:

1.  **Clone the Repository**: Download the code from our GitHub.
2.  **Configure Environment**: We've provided an `.env.example` file. You'll need to create a `.env` file and populate it with your own API keys (Google Gemini & Supabase) to enable the backend services.
3.  **Run Dev Server**: `npm install` && `npm run dev`

Thank you for checking us out—we're trying our best to build the future of travel planning! 🚀
