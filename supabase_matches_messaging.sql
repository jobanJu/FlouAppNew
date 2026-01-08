-- ============================================
-- MATCHES & MESSAGERIE - VERSION SAFE
-- Gère les objets déjà existants
-- ============================================

-- 1. Table des likes/matches
CREATE TABLE IF NOT EXISTS matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  liked_user_id uuid references auth.users not null,
  status text default 'pending' check (status in ('pending', 'matched')),
  matched_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, liked_user_id)
);

-- Index pour matches (IF NOT EXISTS = safe)
CREATE INDEX IF NOT EXISTS idx_matches_user ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_liked ON matches(liked_user_id);

-- RLS pour matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policies matches (DROP puis CREATE pour éviter les erreurs)
DROP POLICY IF EXISTS "Users can view their matches" ON matches;
CREATE POLICY "Users can view their matches"
ON matches FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = liked_user_id);

DROP POLICY IF EXISTS "Users can create matches" ON matches;
CREATE POLICY "Users can create matches"
ON matches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- 2. Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid not null,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Index pour messages
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, read);

-- RLS pour messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies messages (DROP puis CREATE)
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);


-- 3. Fonction pour détecter les matches mutuels
CREATE OR REPLACE FUNCTION check_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the liked user already liked back
  UPDATE matches
  SET status = 'matched', matched_at = now()
  WHERE user_id = NEW.liked_user_id 
    AND liked_user_id = NEW.user_id 
    AND status = 'pending';
  
  -- Mark current like as matched if mutual
  IF FOUND THEN
    NEW.status = 'matched';
    NEW.matched_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (DROP puis CREATE)
DROP TRIGGER IF EXISTS on_new_like ON matches;
CREATE TRIGGER on_new_like
  BEFORE INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION check_mutual_match();


-- ==================== CONFIRMATION ====================
DO $$
BEGIN
  RAISE NOTICE '✅ Matches & Messagerie configurés !';
  RAISE NOTICE '   - Table matches créée/vérifiée';
  RAISE NOTICE '   - Table messages créée/vérifiée';
  RAISE NOTICE '   - Policies RLS configurées';
  RAISE NOTICE '   - Trigger match mutuel actif';
END $$;
