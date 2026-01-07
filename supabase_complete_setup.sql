-- ================================
-- FLOU - CONFIGURATION COMPLÈTE SUPABASE
-- ================================
-- Exécute ce script dans SQL Editor Supabase
-- Il va SUPPRIMER et RECRÉER toutes les tables, policies, triggers et fonctions

-- ================================
-- 0. NETTOYAGE (DROP existant)
-- ================================
-- Drop policies
drop policy if exists "Users can mark messages as read" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Users can view their messages" on public.messages;
drop policy if exists "Users can create matches" on public.matches;
drop policy if exists "Users can view their matches" on public.matches;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can create their profile" on public.users;
drop policy if exists "Anyone can view users profiles" on public.users;

-- Drop trigger et fonction
drop trigger if exists on_new_like on public.matches;
drop function if exists check_mutual_match();

-- Drop tables (cascade supprime aussi les contraintes)
drop table if exists public.messages cascade;
drop table if exists public.matches cascade;
-- Ne pas drop users car ça pourrait contenir des données

-- Si tu veux VRAIMENT tout réinitialiser (ATTENTION: supprime tous les profils):
-- drop table if exists public.users cascade;

-- ================================
-- 1. TABLE USERS
-- ================================
create table if not exists public.users (
  id uuid references auth.users primary key,
  firstname text not null,
  age integer not null,
  city text,
  latitude float,
  longitude float,
  gender text not null check (gender in ('Homme', 'Femme')),
  sexuality text not null check (sexuality in ('Hétérosexuel', 'Gay', 'Lesbienne', 'Bisexuel')),
  interests text[] not null,
  email text unique not null,
  photo_url text,
  created_at timestamptz default now()
);

-- Ajouter la colonne interests si elle n'existe pas (pour mise à jour)
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'users' 
                 and column_name = 'interests') then
    alter table public.users add column interests text[] not null default '{}';
  end if;
end $$;

-- Index pour performance
create index if not exists idx_users_gender on public.users(gender);
create index if not exists idx_users_sexuality on public.users(sexuality);
create index if not exists idx_users_location on public.users(latitude, longitude);

-- RLS pour users
alter table public.users enable row level security;

-- Tout le monde peut lire les profils (pour le matching)
create policy "Anyone can view users profiles"
on public.users for select
to authenticated
using (true);

-- Les utilisateurs authentifiés peuvent créer leur profil
create policy "Users can create their profile"
on public.users for insert
to authenticated
with check (true);

-- Les utilisateurs peuvent modifier leur propre profil
create policy "Users can update their own profile"
on public.users for update
to authenticated
using (auth.uid() = id);

-- ================================
-- 2. TABLE MATCHES (avec matched_at pour déflouttage)
-- ================================
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  liked_user_id uuid references auth.users not null,
  status text default 'pending' check (status in ('pending', 'matched')),
  matched_at timestamptz, -- Date du match mutuel pour calcul de déflouttage progressif
  created_at timestamptz default now(),
  unique(user_id, liked_user_id)
);

-- Index pour performance
create index if not exists idx_matches_user on public.matches(user_id);
create index if not exists idx_matches_liked on public.matches(liked_user_id);
create index if not exists idx_matches_status on public.matches(status);

-- RLS pour matches
alter table public.matches enable row level security;

create policy "Users can view their matches"
on public.matches for select
to authenticated
using (auth.uid() = user_id or auth.uid() = liked_user_id);

create policy "Users can create matches"
on public.matches for insert
to authenticated
with check (auth.uid() = user_id);

-- ================================
-- 3. TABLE MESSAGES
-- ================================
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid not null,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Index pour performance
create index if not exists idx_messages_match on public.messages(match_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id, read);
create index if not exists idx_messages_created on public.messages(created_at desc);

-- RLS pour messages
alter table public.messages enable row level security;

create policy "Users can view their messages"
on public.messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
on public.messages for insert
to authenticated
with check (auth.uid() = sender_id);

create policy "Users can mark messages as read"
on public.messages for update
to authenticated
using (auth.uid() = receiver_id);

-- ================================
-- 4. FONCTION POUR DÉTECTER LES MATCHES MUTUELS
-- ================================
create or replace function check_mutual_match()
returns trigger as $$
begin
  -- Vérifie si l'autre utilisateur a déjà liké en retour
  update public.matches
  set status = 'matched', matched_at = now()
  where user_id = new.liked_user_id 
    and liked_user_id = new.user_id 
    and status = 'pending';
  
  -- Si trouvé, marque le like actuel comme matched aussi
  if found then
    new.status = 'matched';
    new.matched_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger sur insertion de match
drop trigger if exists on_new_like on public.matches;
create trigger on_new_like
  before insert on public.matches
  for each row
  execute function check_mutual_match();

-- ================================
-- 5. STORAGE BUCKET POUR PHOTOS
-- ================================
-- Va dans Storage > Create bucket
-- Nom: user-photos
-- Public: OUI
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Policies de storage (à exécuter après création du bucket):
-- create policy "Public Access"
-- on storage.objects for select
-- using (bucket_id = 'user-photos');

-- create policy "Authenticated users can upload"
-- on storage.objects for insert
-- to authenticated
-- with check (bucket_id = 'user-photos');

-- ================================
-- 6. VÉRIFICATIONS
-- ================================
-- Vérifie que tout est bien créé:
select 
  'users' as table_name, 
  count(*) as row_count 
from public.users
union all
select 
  'matches' as table_name, 
  count(*) as row_count 
from public.matches
union all
select 
  'messages' as table_name, 
  count(*) as row_count 
from public.messages;

-- Liste les policies RLS:
select 
  schemaname,
  tablename,
  policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
