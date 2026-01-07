-- TABLES POUR MATCHES ET MESSAGERIE
-- Exécute ce script dans SQL Editor Supabase

-- 1. Table des likes/matches
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  liked_user_id uuid references auth.users not null,
  status text default 'pending' check (status in ('pending', 'matched')),
  matched_at timestamptz, -- Date du match mutuel pour calcul de déflouttage
  created_at timestamptz default now(),
  unique(user_id, liked_user_id)
);

-- Index pour performance
create index if not exists idx_matches_user on matches(user_id);
create index if not exists idx_matches_liked on matches(liked_user_id);

-- RLS pour matches
alter table matches enable row level security;

create policy "Users can view their matches"
on matches for select
to authenticated
using (auth.uid() = user_id or auth.uid() = liked_user_id);

create policy "Users can create matches"
on matches for insert
to authenticated
with check (auth.uid() = user_id);

-- 2. Table des messages
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid not null,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Index pour performance
create index if not exists idx_messages_match on messages(match_id);
create index if not exists idx_messages_receiver on messages(receiver_id, read);

-- RLS pour messages
alter table messages enable row level security;

create policy "Users can view their messages"
on messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
on messages for insert
to authenticated
with check (auth.uid() = sender_id);

create policy "Users can mark messages as read"
on messages for update
to authenticated
using (auth.uid() = receiver_id);

-- 3. Fonction pour détecter les matches mutuels
create or replace function check_mutual_match()
returns trigger as $$
begin
  -- Check if the liked user already liked back
  update matches
  set status = 'matched', matched_at = now()
  where user_id = new.liked_user_id 
    and liked_user_id = new.user_id 
    and status = 'pending';
  
  -- Mark current like as matched if mutual
  if found then
    new.status = 'matched';
    new.matched_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger on_new_like
  before insert on matches
  for each row
  execute function check_mutual_match();

-- 4. PROFILS DE TEST
-- Insère 3 profils de test (tu dois d'abord créer les comptes auth manuellement ou utiliser ces UUIDs fictifs)

-- Note: Ces UUID sont fictifs. Pour des vrais profils de test, tu dois:
-- 1. Créer les comptes via l'interface Supabase Auth ou signup
-- 2. Récupérer leurs vrais UUID depuis auth.users
-- 3. Les utiliser dans ces INSERT

-- Exemple avec des UUID fictifs (remplace par de vrais UUID auth.users):
insert into users (id, firstname, age, city, latitude, longitude, gender, sexuality, interests, email, photo_url) values
  ('11111111-1111-1111-1111-111111111111', 'Sophie', 25, 'Paris', 48.8566, 2.3522, 'Femme', 'Hétérosexuel', ARRAY['Voyage', 'Cuisine', 'Musique'], 'sophie.test@flou.app', 'https://i.pravatar.cc/300?img=47'),
  ('22222222-2222-2222-2222-222222222222', 'Marc', 28, 'Lyon', 45.7640, 4.8357, 'Homme', 'Hétérosexuel', ARRAY['Sport', 'Cinéma', 'Gaming'], 'marc.test@flou.app', 'https://i.pravatar.cc/300?img=12'),
  ('33333333-3333-3333-3333-333333333333', 'Julie', 23, 'Marseille', 43.2965, 5.3698, 'Femme', 'Bisexuel', ARRAY['Art', 'Lecture', 'Yoga'], 'julie.test@flou.app', 'https://i.pravatar.cc/300?img=38')
on conflict (id) do nothing;
