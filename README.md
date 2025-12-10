# Pathfinder: AI Itinerary Planner

**Pathfinder** is a "Resilient Hub" application designed to curate hyper-local, personalized itineraries using Generative AI (Google Gemini). It features a mobile-first design, offline capabilities, and a mock integration with Yelp data.

## Features

*   **AI Engine**: Uses Gemini 2.5 Flash (Speed) or Gemini 3 Pro (Deep Reasoning) to generate structured plans.
*   **Resilience**: Itineraries are cached to `localStorage` for offline access.
*   **Modular Architecture**: Built with scalable React components and isolated services.
*   **Theming**: Mobile-first, Dark Mode supported, "Solar Flare" orange aesthetic.

## Project Structure

```
/
├── components/
│   ├── ui/             # Reusable "shadcn-like" primitives (Button, Input, Badge)
│   └── views/          # Smart feature components (Dashboard, LandingPage)
├── services/
│   ├── ai.ts           # AI Provider Logic (LangChain pattern)
│   └── storage.ts      # LocalStorage persistence wrapper
├── lib/
│   └── utils.ts        # Tailwind class merger (cn)
├── types/
│   └── index.ts        # Shared TypeScript interfaces
├── index.tsx           # Main application entry & router
└── index.html          # Base HTML
```

## How to Extend (Plug & Play)

### 1. Connecting a Real Backend
Navigate to `services/storage.ts`. currently, `BackendService` writes to `localStorage`.
To connect Supabase or Firebase:
1.  Update the functions `saveItinerary` and `getSavedItineraries` to call your API.
2.  The UI components (`Dashboard.tsx`) allow `isLoading` states, so you can easily swap synchronous local storage for async API calls.

### 2. Integrating Real Yelp API
Navigate to `components/views/CreateItineraryView.tsx`.
Currently, the AI **hallucinates** realistic Yelp data (Ratings, Price) as a mock.
To use real data:
1.  In the `generateItinerary` function, after getting the AI response, iterate through `data.items`.
2.  Call your backend proxy (to avoid CORS) which queries `https://api.yelp.com/v3/businesses/search`.
3.  Merge the real Yelp data (image_url, rating) into the `ItineraryItem` object before saving.

### 3. Adding New AI Models
Navigate to `services/ai.ts`.
The `GeminiProvider` class implements a standard `BaseLLM` interface.
To add OpenAI or Anthropic:
1.  Create a new class `OpenAIProvider extends BaseLLM`.
2.  Update `ModelRegistry` to allow selecting this new provider.

## Tech Stack
*   **Framework**: React 19
*   **Build**: Vite (Simulated ES Modules)
*   **Styling**: Tailwind CSS + clsx/tailwind-merge
*   **AI**: @google/genai SDK
*   **Icons**: Lucide React
