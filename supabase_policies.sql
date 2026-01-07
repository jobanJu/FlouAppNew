-- Copie et colle tout ce code dans l'éditeur SQL de Supabase (SQL Editor)

-- 1. Activer la sécurité (RLS) sur la table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. POLICY: INSERT (Indispensable pour l'inscription)
-- Permet à un utilisateur connecté de créer sa propre ligne
CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. POLICY: SELECT
-- Permet aux utilisateurs connectés de voir tous les profils (nécessaire pour une app de rencontre)
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 4. POLICY: UPDATE
-- Permet à un utilisateur de modifier UNIQUEMENT son propre profil
CREATE POLICY "Enable update for users based on user_id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
