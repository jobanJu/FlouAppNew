-- TABLES POUR MATCHES ET MESSAGERIE
-- Exécute ce script dans SQL Editor Supabase

-- 1. Table des likes/matches
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  liked_user_id uuid references auth.users not null,
  status text default 'pending' check (status in ('pending', 'matched')),
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
  set status = 'matched'
  where user_id = new.liked_user_id 
    and liked_user_id = new.user_id 
    and status = 'pending';
  
  -- Mark current like as matched if mutual
  if found then
    new.status = 'matched';
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger on_new_like
  before insert on matches
  for each row
  execute function check_mutual_match();
