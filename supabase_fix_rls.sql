-- SCRIPT DE NETTOYAGE COMPLET DES POLICIES RLS
-- Copie ce code dans SQL Editor Supabase et clique RUN

-- 1. Désactive temporairement RLS
alter table users disable row level security;

-- 2. Supprime TOUTES les policies (ignore les erreurs si elles n'existent pas)
do $$ 
declare
  pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'users' and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.users', pol.policyname);
  end loop;
end $$;

-- 3. Réactive RLS
alter table users enable row level security;

-- 4. Crée les 3 policies propres
create policy "allow_read_all"
on public.users
for select
to authenticated, anon
using (true);

create policy "allow_insert_authenticated"
on public.users
for insert
to authenticated
with check (true);

create policy "allow_update_own"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- 5. Vérifie que tout est bon
select 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies 
where tablename = 'users';
