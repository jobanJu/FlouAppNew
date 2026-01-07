-- ================================
-- FLOU - MODE LIVE (GROUPE + DATE)
-- ================================
-- Script de migration pour ajouter les fonctionnalités Live
-- Exécute ce script dans SQL Editor Supabase

-- ================================
-- 1. TABLE LIVES
-- ================================
create table if not exists public.lives (
  id uuid default gen_random_uuid() primary key,
  host_id uuid references auth.users not null,
  type text not null check (type in ('groupe', 'date')),
  title text not null,
  description text,
  status text default 'waiting' check (status in ('waiting', 'active', 'ended')),
  max_participants integer default 4, -- 4 pour groupe, 1 pour date
  room_url text, -- URL de la room Daily.co
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Ajouter room_url si la table existe déjà
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'lives' 
                 and column_name = 'room_url') then
    alter table public.lives add column room_url text;
  end if;
end $$;

-- Index pour performance
create index if not exists idx_lives_host on public.lives(host_id);
create index if not exists idx_lives_status on public.lives(status);
create index if not exists idx_lives_type on public.lives(type);
create index if not exists idx_lives_created on public.lives(created_at desc);

-- RLS pour lives
alter table public.lives enable row level security;

-- Drop policies existantes
drop policy if exists "Anyone can view active lives" on public.lives;
drop policy if exists "Users can create lives" on public.lives;
drop policy if exists "Hosts can update their lives" on public.lives;

create policy "Anyone can view active lives"
on public.lives for select
to authenticated
using (true);

create policy "Users can create lives"
on public.lives for insert
to authenticated
with check (auth.uid() = host_id);

create policy "Hosts can update their lives"
on public.lives for update
to authenticated
using (auth.uid() = host_id);

-- ================================
-- 2. TABLE LIVE_PARTICIPANTS
-- ================================
create table if not exists public.live_participants (
  id uuid default gen_random_uuid() primary key,
  live_id uuid references public.lives on delete cascade not null,
  user_id uuid references auth.users not null,
  role text not null check (role in ('host', 'participant', 'spectator')),
  pseudo text not null, -- Pseudo unique pour ce Live
  is_speaking boolean default false, -- Pour gérer qui parle (participant)
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique(live_id, user_id)
);

-- Index pour performance
create index if not exists idx_live_participants_live on public.live_participants(live_id);
create index if not exists idx_live_participants_user on public.live_participants(user_id);
create index if not exists idx_live_participants_role on public.live_participants(role);

-- RLS pour live_participants
alter table public.live_participants enable row level security;

-- Drop policies existantes
drop policy if exists "Anyone can view live participants" on public.live_participants;
drop policy if exists "Users can join lives" on public.live_participants;
drop policy if exists "Users can leave lives" on public.live_participants;

create policy "Anyone can view live participants"
on public.live_participants for select
to authenticated
using (true);

create policy "Users can join lives"
on public.live_participants for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can leave lives"
on public.live_participants for update
to authenticated
using (auth.uid() = user_id);

-- ================================
-- 3. TABLE LIVE_MESSAGES (CHAT)
-- ================================
create table if not exists public.live_messages (
  id uuid default gen_random_uuid() primary key,
  live_id uuid references public.lives on delete cascade not null,
  user_id uuid references auth.users not null,
  pseudo text not null, -- Pseudo utilisé dans ce Live
  content text not null,
  created_at timestamptz default now()
);

-- Index pour performance
create index if not exists idx_live_messages_live on public.live_messages(live_id, created_at desc);
create index if not exists idx_live_messages_user on public.live_messages(user_id);

-- RLS pour live_messages
alter table public.live_messages enable row level security;

-- Drop policies existantes
drop policy if exists "Anyone can view live messages" on public.live_messages;
drop policy if exists "Users can send live messages" on public.live_messages;

create policy "Anyone can view live messages"
on public.live_messages for select
to authenticated
using (true);

create policy "Users can send live messages"
on public.live_messages for insert
to authenticated
with check (auth.uid() = user_id);

-- ================================
-- 4. TABLE LIVE_GIFTS (BRUMES)
-- ================================
create table if not exists public.live_gifts (
  id uuid default gen_random_uuid() primary key,
  live_id uuid references public.lives on delete cascade not null,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null, -- L'hôte ou un participant
  amount integer not null check (amount > 0),
  message text,
  created_at timestamptz default now()
);

-- Index pour performance
create index if not exists idx_live_gifts_live on public.live_gifts(live_id);
create index if not exists idx_live_gifts_sender on public.live_gifts(sender_id);
create index if not exists idx_live_gifts_receiver on public.live_gifts(receiver_id);

-- RLS pour live_gifts
alter table public.live_gifts enable row level security;

-- Drop policies existantes
drop policy if exists "Anyone can view live gifts" on public.live_gifts;
drop policy if exists "Users can send live gifts" on public.live_gifts;

create policy "Anyone can view live gifts"
on public.live_gifts for select
to authenticated
using (true);

create policy "Users can send live gifts"
on public.live_gifts for insert
to authenticated
with check (auth.uid() = sender_id);

-- ================================
-- 5. TABLE LIVE_FAVORITES
-- ================================
create table if not exists public.live_favorites (
  id uuid default gen_random_uuid() primary key,
  live_id uuid references public.lives on delete cascade not null,
  host_id uuid references auth.users not null, -- L'hôte qui ajoute aux favoris
  user_id uuid references auth.users not null, -- Participant/spectateur ajouté
  created_at timestamptz default now(),
  unique(live_id, user_id)
);

-- Index pour performance
create index if not exists idx_live_favorites_live on public.live_favorites(live_id);
create index if not exists idx_live_favorites_host on public.live_favorites(host_id);

-- RLS pour live_favorites
alter table public.live_favorites enable row level security;

-- Drop policies existantes
drop policy if exists "Hosts can view their favorites" on public.live_favorites;
drop policy if exists "Hosts can add favorites" on public.live_favorites;
drop policy if exists "Hosts can remove favorites" on public.live_favorites;

create policy "Hosts can view their favorites"
on public.live_favorites for select
to authenticated
using (auth.uid() = host_id);

create policy "Hosts can add favorites"
on public.live_favorites for insert
to authenticated
with check (auth.uid() = host_id);

create policy "Hosts can remove favorites"
on public.live_favorites for delete
to authenticated
using (auth.uid() = host_id);

-- ================================
-- 6. TABLE LIVE_DATE_ANSWERS (pour phase Versus)
-- ================================
create table if not exists public.live_date_answers (
  id uuid default gen_random_uuid() primary key,
  live_id uuid references public.lives on delete cascade not null,
  user_id uuid references auth.users not null,
  question text not null,
  answer text not null,
  created_at timestamptz default now(),
  unique(live_id, user_id, question)
);

-- Index pour performance
create index if not exists idx_live_date_answers_live on public.live_date_answers(live_id);
create index if not exists idx_live_date_answers_user on public.live_date_answers(user_id);

-- RLS pour live_date_answers
alter table public.live_date_answers enable row level security;

-- Drop policies existantes
drop policy if exists "Live participants can view answers" on public.live_date_answers;
drop policy if exists "Users can submit their answers" on public.live_date_answers;

create policy "Live participants can view answers"
on public.live_date_answers for select
to authenticated
using (
  live_id in (
    select live_id from public.live_participants where user_id = auth.uid()
  )
);

create policy "Users can submit their answers"
on public.live_date_answers for insert
to authenticated
with check (auth.uid() = user_id);

-- ================================
-- 7. FONCTION POUR ENVOYER UN CADEAU BRUMES
-- ================================
create or replace function send_live_gift(
  p_live_id uuid,
  p_receiver_id uuid,
  p_amount integer,
  p_message text default null
)
returns json as $$
declare
  v_sender_id uuid;
  v_sender_balance integer;
  v_gift_id uuid;
begin
  v_sender_id := auth.uid();
  
  -- Vérifier le solde de Brumes
  select brumes_balance into v_sender_balance
  from public.users
  where id = v_sender_id;
  
  if v_sender_balance < p_amount then
    return json_build_object(
      'success', false,
      'error', 'Solde de Brumes insuffisant'
    );
  end if;
  
  -- Débiter les Brumes de l'expéditeur
  update public.users
  set brumes_balance = brumes_balance - p_amount
  where id = v_sender_id;
  
  -- Créditer les Brumes au destinataire
  update public.users
  set brumes_balance = brumes_balance + p_amount
  where id = p_receiver_id;
  
  -- Enregistrer le cadeau
  insert into public.live_gifts (live_id, sender_id, receiver_id, amount, message)
  values (p_live_id, v_sender_id, p_receiver_id, p_amount, p_message)
  returning id into v_gift_id;
  
  return json_build_object(
    'success', true,
    'gift_id', v_gift_id,
    'new_balance', v_sender_balance - p_amount
  );
end;
$$ language plpgsql security definer;

-- ================================
-- 8. VÉRIFICATIONS
-- ================================
select 
  'lives' as table_name, 
  count(*) as row_count 
from public.lives
union all
select 
  'live_participants' as table_name, 
  count(*) as row_count 
from public.live_participants
union all
select 
  'live_messages' as table_name, 
  count(*) as row_count 
from public.live_messages
union all
select 
  'live_gifts' as table_name, 
  count(*) as row_count 
from public.live_gifts
union all
select 
  'live_favorites' as table_name, 
  count(*) as row_count 
from public.live_favorites
union all
select 
  'live_date_answers' as table_name, 
  count(*) as row_count 
from public.live_date_answers;
