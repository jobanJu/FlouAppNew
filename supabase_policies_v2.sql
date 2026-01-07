-- Copie ce code dans Supabase SQL Editor
-- Il utilise "DROP POLICY IF EXISTS" pour éviter les erreurs si tu as déjà des règles

-- 1. Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Nettoyer les anciennes règles (au cas où)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Logged in users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 3. Créer la Règle INSERT (CRITIQUE pour l'inscription)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Créer la Règle SELECT (Lecture pour tous les connectés)
CREATE POLICY "Logged in users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 5. Créer la Règle UPDATE (Modif perso uniquement)
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Grant basic rights (Sécurité supplémentaire parfois nécessaire)
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO service_role;
