# Pathfinder Backend Setup Guide

This guide details the exact steps to configure Supabase as your backend for Pathfinder.

## 1. Environment Variables

Create a file named `.env` in your project root. You need these keys to connect the frontend to Supabase and Google Gemini.

```env
# Google Gemini AI (Required for Itinerary Generation)
# NOTE: In a production app, this should be proxied through a backend to keep it secret.
API_KEY=your_google_gemini_api_key_here

# Supabase Configuration (Required for Database & Auth)
# Find these in your Supabase Dashboard -> Project Settings -> API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 2. Database Schema (SQL)

Run the following SQL scripts in your Supabase **SQL Editor** to create the necessary tables.

### A. Create Tables

```sql
-- 1. PROFILES
-- Extends the default auth.users table with application specific data
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  city text,
  personality text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ITINERARIES
-- Stores the AI generated plans. 
-- 'items' is a JSONB column to flexibly store the list of activities and embedded reviews.
create table public.itineraries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  date text, -- Stored as string to match frontend format
  mood text,
  tags text[],
  items jsonb default '[]'::jsonb, -- Stores the array of ItineraryItems
  is_public boolean default false, -- Determines if it shows in Community Feed
  verified_community boolean default false, -- Admin flag for "Verified" badge
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. LIKES (Community Pulse)
-- Tracks which users liked which itinerary
create table public.itinerary_likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  itinerary_id uuid references public.itineraries(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, itinerary_id)
);

-- 4. BOOKMARKS
-- Allows users to save itineraries to their library
create table public.itinerary_bookmarks (
  user_id uuid references public.profiles(id) on delete cascade not null,
  itinerary_id uuid references public.itineraries(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, itinerary_id)
);
```

### B. Row Level Security (RLS) Policies

These policies ensure users can only see what they are supposed to see.

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_likes enable row level security;
alter table public.itinerary_bookmarks enable row level security;

-- PROFILES POLICIES
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

-- ITINERARIES POLICIES
create policy "Public itineraries are viewable by everyone" 
  on public.itineraries for select using (is_public = true);

create policy "Users can see their own itineraries (even private ones)" 
  on public.itineraries for select using (auth.uid() = user_id);

create policy "Users can insert their own itineraries" 
  on public.itineraries for insert with check (auth.uid() = user_id);

create policy "Users can update their own itineraries" 
  on public.itineraries for update using (auth.uid() = user_id);

create policy "Users can delete their own itineraries" 
  on public.itineraries for delete using (auth.uid() = user_id);

-- LIKES POLICIES
create policy "Likes are viewable by everyone" 
  on public.itinerary_likes for select using (true);

create policy "Users can create their own likes" 
  on public.itinerary_likes for insert with check (auth.uid() = user_id);

create policy "Users can delete their own likes" 
  on public.itinerary_likes for delete using (auth.uid() = user_id);

-- BOOKMARKS POLICIES
create policy "Users can see their own bookmarks" 
  on public.itinerary_bookmarks for select using (auth.uid() = user_id);

create policy "Users can create their own bookmarks" 
  on public.itinerary_bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks" 
  on public.itinerary_bookmarks for delete using (auth.uid() = user_id);
```

### C. Database Functions (Optional but Recommended)

To handle the "Likes Count" efficiently, allow Supabase to auto-increment/decrement the `likes_count` on the itinerary table when a like is added or removed.

```sql
-- Function to handle new likes
create or replace function public.handle_new_like()
returns trigger as $$
begin
  update public.itineraries
  set likes_count = likes_count + 1
  where id = new.itinerary_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new likes
create trigger on_like_created
  after insert on public.itinerary_likes
  for each row execute procedure public.handle_new_like();

-- Function to handle removed likes
create or replace function public.handle_removed_like()
returns trigger as $$
begin
  update public.itineraries
  set likes_count = likes_count - 1
  where id = old.itinerary_id;
  return old;
end;
$$ language plpgsql security definer;

-- Trigger for removed likes
create trigger on_like_deleted
  after delete on public.itinerary_likes
  for each row execute procedure public.handle_removed_like();
```

---

## 3. Integrating with the Frontend

Currently, `services/storage.ts` uses `localStorage`. To connect to Supabase:

1.  Install the client: `npm install @supabase/supabase-js`
2.  Create `services/supabaseClient.ts`:
    ```typescript
    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    export const supabase = createClient(supabaseUrl, supabaseKey)
    ```
3.  Update `services/storage.ts` to replace `localStorage` calls with `supabase.from('itineraries').select(...)` etc.
