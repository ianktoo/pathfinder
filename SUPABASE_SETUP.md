# Pathfinder Backend Setup Guide

This guide details the exact steps to configure Supabase as your backend for Pathfinder.

## 1. Environment Variables

Create a file named `.env` in your project root. You need these keys to connect the frontend to Supabase and Google Gemini.

```env
# Google Gemini AI (Required for Itinerary Generation)
API_KEY=your_google_gemini_api_key_here

# Supabase Configuration (Required for Database & Auth)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 2. Database Schema (SQL)

Run the following SQL scripts in your Supabase **SQL Editor** to create the necessary tables. This structure normalizes **Places** (Businesses) so they can be shared across multiple **Itineraries**.

### A. Create Tables

```sql
-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  city text,
  personality text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PLACES (BUSINESSES)
-- Stores unique venues to avoid duplication across itineraries
create table public.places (
  id uuid default gen_random_uuid() primary key,
  name text not null unique, -- Using name as unique key for MVP, ideally use Yelp ID
  category text,
  rating numeric,
  review_count integer,
  price text,
  image_url text,
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ITINERARIES
-- The header for a trip (Owner, Title, Mood)
create table public.itineraries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  date text, 
  mood text,
  tags text[],
  is_public boolean default false, 
  verified_community boolean default false, 
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ITINERARY ITEMS (JOIN TABLE)
-- Links an Itinerary to a Place with specific trip details (Time, Activity)
create table public.itinerary_items (
  id uuid default gen_random_uuid() primary key,
  itinerary_id uuid references public.itineraries(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete cascade not null,
  time text,
  activity text,
  description text,
  order_index integer,
  completed boolean default false,
  user_review jsonb, -- Stores rating/text for the user's specific visit
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. LIKES
create table public.itinerary_likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  itinerary_id uuid references public.itineraries(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, itinerary_id)
);
```

### B. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.itineraries enable row level security;
alter table public.places enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.itinerary_likes enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- PLACES (Readable by all, insertable by auth users)
create policy "Places are viewable by everyone" on public.places for select using (true);
create policy "Authenticated users can insert places" on public.places for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update places" on public.places for update using (auth.role() = 'authenticated');

-- ITINERARIES
create policy "Public itineraries are viewable by everyone" on public.itineraries for select using (is_public = true);
create policy "Users can see their own itineraries" on public.itineraries for select using (auth.uid() = user_id);
create policy "Users can insert their own itineraries" on public.itineraries for insert with check (auth.uid() = user_id);
create policy "Users can update their own itineraries" on public.itineraries for update using (auth.uid() = user_id);
create policy "Users can delete their own itineraries" on public.itineraries for delete using (auth.uid() = user_id);

-- ITINERARY ITEMS (Visibility based on parent itinerary)
create policy "Items viewable if itinerary is viewable" on public.itinerary_items for select using (
  exists (select 1 from public.itineraries i where i.id = itinerary_items.itinerary_id and (i.is_public = true or i.user_id = auth.uid()))
);
create policy "Users can insert items for own itineraries" on public.itinerary_items for insert with check (
  exists (select 1 from public.itineraries i where i.id = itinerary_items.itinerary_id and i.user_id = auth.uid())
);
create policy "Users can update items for own itineraries" on public.itinerary_items for update using (
  exists (select 1 from public.itineraries i where i.id = itinerary_items.itinerary_id and i.user_id = auth.uid())
);
create policy "Users can delete items for own itineraries" on public.itinerary_items for delete using (
  exists (select 1 from public.itineraries i where i.id = itinerary_items.itinerary_id and i.user_id = auth.uid())
);

-- LIKES
create policy "Likes are viewable by everyone" on public.itinerary_likes for select using (true);
create policy "Users can create their own likes" on public.itinerary_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete their own likes" on public.itinerary_likes for delete using (auth.uid() = user_id);
```

### C. Likes Trigger (Optional)

```sql
create or replace function public.handle_new_like()
returns trigger as $$
begin
  update public.itineraries set likes_count = likes_count + 1 where id = new.itinerary_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_like_created after insert on public.itinerary_likes
  for each row execute procedure public.handle_new_like();

create or replace function public.handle_removed_like()
returns trigger as $$
begin
  update public.itineraries set likes_count = likes_count - 1 where id = old.itinerary_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_like_deleted after delete on public.itinerary_likes
  for each row execute procedure public.handle_removed_like();
```