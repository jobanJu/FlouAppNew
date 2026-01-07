-- ================================
-- FLOU - AJOUT SYSTÈME DE MONÉTISATION
-- ================================
-- Migration pour ajouter les colonnes d'abonnements et Brumes
-- Ce script peut être exécuté sans détruire les données existantes

-- Ajouter les colonnes pour la monétisation si elles n'existent pas
do $$ 
begin
  -- Brumes (monnaie virtuelle)
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'users' 
                 and column_name = 'brumes_balance') then
    alter table public.users add column brumes_balance integer default 10;
    -- Donner 10 Brumes gratuites aux utilisateurs existants
    update public.users set brumes_balance = 10 where brumes_balance is null;
  end if;
  
  -- Tier d'abonnement (classique/kama/cupidon)
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'users' 
                 and column_name = 'subscription_tier') then
    alter table public.users add column subscription_tier text default 'classique';
    -- Ajouter la contrainte CHECK séparément
    alter table public.users add constraint check_subscription_tier 
      check (subscription_tier in ('classique', 'kama', 'cupidon'));
  end if;
  
  -- Date de début d'abonnement
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'users' 
                 and column_name = 'subscription_start') then
    alter table public.users add column subscription_start timestamptz;
  end if;
  
  -- Phrase d'accroche (courte, visible sur swipe)
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'users' 
                 and column_name = 'catchphrase') then
    alter table public.users add column catchphrase text;
  end if;
  
  -- Description / Bio (longue, visible dans profil détaillé)
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'users' 
                 and column_name = 'bio') then
    alter table public.users add column bio text;
  end if;
end $$;

-- ================================
-- TABLE TRANSACTIONS (historique achats)
-- ================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('subscription', 'brumes_purchase', 'brumes_spend')),
  amount numeric(10,2), -- Montant en euros (pour achats)
  brumes_change integer, -- Variation de Brumes (+100, -50, etc.)
  description text,
  subscription_tier text, -- Pour les abonnements
  created_at timestamptz default now()
);

-- Index pour performance
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_created on public.transactions(created_at);

-- RLS pour transactions
alter table public.transactions enable row level security;

-- Les utilisateurs peuvent voir leurs propres transactions
create policy "Users can view their transactions"
on public.transactions for select
to authenticated
using (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres transactions
create policy "Users can create their transactions"
on public.transactions for insert
to authenticated
with check (auth.uid() = user_id);

-- ================================
-- FONCTION: Enregistrer une transaction
-- ================================
create or replace function record_transaction(
  p_user_id uuid,
  p_type text,
  p_amount numeric default null,
  p_brumes_change integer default null,
  p_description text default null,
  p_subscription_tier text default null
) returns uuid
language plpgsql
security definer
as $$
declare
  v_transaction_id uuid;
begin
  insert into public.transactions (user_id, type, amount, brumes_change, description, subscription_tier)
  values (p_user_id, p_type, p_amount, p_brumes_change, p_description, p_subscription_tier)
  returning id into v_transaction_id;
  
  return v_transaction_id;
end;
$$;

-- ================================
-- FONCTION: Dépenser des Brumes
-- ================================
create or replace function spend_brumes(
  p_user_id uuid,
  p_amount integer,
  p_description text
) returns boolean
language plpgsql
security definer
as $$
declare
  v_current_balance integer;
begin
  -- Vérifier le solde actuel
  select brumes_balance into v_current_balance
  from public.users
  where id = p_user_id;
  
  -- Vérifier si suffisamment de Brumes
  if v_current_balance < p_amount then
    raise exception 'Solde insuffisant: % Brumes disponibles, % requis', v_current_balance, p_amount;
  end if;
  
  -- Débiter le compte
  update public.users
  set brumes_balance = brumes_balance - p_amount
  where id = p_user_id;
  
  -- Enregistrer la transaction
  perform record_transaction(
    p_user_id,
    'brumes_spend',
    null,
    -p_amount,
    p_description,
    null
  );
  
  return true;
end;
$$;

-- Afficher un message de succès
do $$
begin
  raise notice '✅ Migration monétisation complétée avec succès!';
  raise notice '📊 Colonnes ajoutées: brumes_balance, subscription_tier, subscription_start';
  raise notice '📊 Colonnes ajoutées: catchphrase (phrase d''accroche), bio (description)';
  raise notice '📊 Table créée: transactions';
  raise notice '⚙️ Fonctions créées: record_transaction, spend_brumes';
end $$;
