-- ============================================
-- OPTIMISATION BASE DE DONNÉES FLOU
-- Index, RLS renforcé, performances
-- ============================================

-- ==================== INDEX CRITIQUES ====================

-- Index sur users pour le matching rapide
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_seeking ON users(seeking);
CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_active_profiles ON users(gender, seeking, age) WHERE photo_url IS NOT NULL;

-- Index composite pour recherche de profils compatibles
CREATE INDEX IF NOT EXISTS idx_users_matching ON users(gender, seeking, age, city) 
  WHERE photo_url IS NOT NULL;

-- Index sur matches pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_mutual ON matches(user1_id, user2_id, is_mutual);
CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);

-- Index sur messages
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(match_id, read) WHERE read = false;

-- Index sur lives
CREATE INDEX IF NOT EXISTS idx_lives_active ON lives(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lives_host ON lives(host_id, status);
CREATE INDEX IF NOT EXISTS idx_lives_created ON lives(created_at DESC);

-- Index sur live_participants
CREATE INDEX IF NOT EXISTS idx_live_participants_live ON live_participants(live_id);
CREATE INDEX IF NOT EXISTS idx_live_participants_user ON live_participants(user_id);

-- Index sur notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) 
  WHERE read = false;

-- Index sur blocked_users
CREATE INDEX IF NOT EXISTS idx_blocked_pair ON blocked_users(blocker_id, blocked_id);


-- ==================== RLS RENFORCÉ ====================

-- Activer RLS sur toutes les tables (si pas déjà fait)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_participants ENABLE ROW LEVEL SECURITY;

-- Policies pour users (voir son profil + profils publics pour matching)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view other profiles for matching" ON users;
CREATE POLICY "Users can view other profiles for matching" ON users
  FOR SELECT USING (
    -- Profil public (a une photo, est actif)
    photo_url IS NOT NULL
    -- Et n'est pas bloqué par l'utilisateur courant
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE (blocker_id = auth.uid() AND blocked_id = users.id)
         OR (blocked_id = auth.uid() AND blocker_id = users.id)
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour matches (voir uniquement ses propres matches)
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create matches" ON matches;
CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

DROP POLICY IF EXISTS "Users can update own matches" ON matches;
CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policies pour messages (uniquement messages de ses matches)
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND matches.is_mutual = true
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
CREATE POLICY "Users can send messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND matches.is_mutual = true
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Policies pour lives
DROP POLICY IF EXISTS "Anyone can view active lives" ON lives;
CREATE POLICY "Anyone can view active lives" ON lives
  FOR SELECT USING (status = 'active' OR host_id = auth.uid());

DROP POLICY IF EXISTS "Users can create lives" ON lives;
CREATE POLICY "Users can create lives" ON lives
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their lives" ON lives;
CREATE POLICY "Hosts can update their lives" ON lives
  FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their lives" ON lives;
CREATE POLICY "Hosts can delete their lives" ON lives
  FOR DELETE USING (auth.uid() = host_id);


-- ==================== FONCTIONS UTILITAIRES ====================

-- Fonction pour calculer la distance entre deux points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 6371; -- Rayon de la Terre en km
  dLat DOUBLE PRECISION;
  dLon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  
  a := SIN(dLat / 2) * SIN(dLat / 2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon / 2) * SIN(dLon / 2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour obtenir des profils compatibles (optimisée)
CREATE OR REPLACE FUNCTION get_compatible_profiles(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_max_distance INTEGER DEFAULT 100
) RETURNS TABLE (
  id UUID,
  firstname VARCHAR,
  age INTEGER,
  city VARCHAR,
  gender VARCHAR,
  photo_url TEXT,
  interests TEXT[],
  catchphrase TEXT,
  distance DOUBLE PRECISION
) AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Récupérer les infos de l'utilisateur courant
  SELECT u.gender, u.seeking, u.age, u.latitude, u.longitude, u.interests
  INTO v_user
  FROM users u
  WHERE u.id = p_user_id;

  RETURN QUERY
  SELECT 
    u.id,
    u.firstname,
    u.age,
    u.city,
    u.gender,
    u.photo_url,
    u.interests,
    u.catchphrase,
    CASE 
      WHEN v_user.latitude IS NOT NULL AND u.latitude IS NOT NULL 
      THEN calculate_distance(v_user.latitude, v_user.longitude, u.latitude, u.longitude)
      ELSE NULL
    END as distance
  FROM users u
  WHERE 
    -- Pas soi-même
    u.id != p_user_id
    -- A une photo
    AND u.photo_url IS NOT NULL
    -- Compatibilité genre/recherche
    AND (
      (v_user.seeking = 'Les deux' OR v_user.seeking = u.gender)
      AND
      (u.seeking = 'Les deux' OR u.seeking = v_user.gender)
    )
    -- Pas bloqué
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users bu
      WHERE (bu.blocker_id = p_user_id AND bu.blocked_id = u.id)
         OR (bu.blocked_id = p_user_id AND bu.blocker_id = u.id)
    )
    -- Pas déjà liké/passé
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.user1_id = p_user_id AND m.user2_id = u.id
    )
    -- Distance (si coordonnées disponibles)
    AND (
      v_user.latitude IS NULL 
      OR u.latitude IS NULL
      OR calculate_distance(v_user.latitude, v_user.longitude, u.latitude, u.longitude) <= p_max_distance
    )
  ORDER BY
    -- Priorité aux profils proches et avec intérêts communs
    COALESCE(
      CARDINALITY(ARRAY(SELECT unnest(v_user.interests) INTERSECT SELECT unnest(u.interests))),
      0
    ) DESC,
    distance ASC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;


-- ==================== TRIGGERS ====================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ==================== VACUUM & ANALYZE ====================
-- À exécuter régulièrement pour maintenir les performances

-- VACUUM ANALYZE users;
-- VACUUM ANALYZE matches;
-- VACUUM ANALYZE messages;
-- VACUUM ANALYZE lives;


-- ==================== CONFIRMATION ====================
DO $$
BEGIN
  RAISE NOTICE 'Optimisation de la base de données terminée !';
  RAISE NOTICE 'Index créés, RLS renforcé, fonctions utilitaires ajoutées.';
END $$;
