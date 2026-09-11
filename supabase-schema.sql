create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  bio text not null default '',
  location text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Inloggade kan läsa profiler"
on public.profiles for select to authenticated
using (true);

create policy "Användare kan skapa sin egen profil"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Användare kan ändra sin egen profil"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Inloggade kan läsa följningar"
on public.follows for select to authenticated
using (true);

create policy "Användare kan följa"
on public.follows for insert to authenticated
with check (auth.uid() = follower_id);

create policy "Användare kan sluta följa"
on public.follows for delete to authenticated
using (auth.uid() = follower_id);
