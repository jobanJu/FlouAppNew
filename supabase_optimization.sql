-- ============================================
-- OPTIMISATION FLOU - VERSION SAFE
-- Ajoute uniquement les index et fonctions manquants
-- (ignore les policies existantes)
-- ============================================

-- ==================== INDEX (IF NOT EXISTS = safe) ====================

-- Index sur users
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_seeking ON users(seeking);
CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(updated_at DESC);

-- Index composite pour matching rapide
CREATE INDEX IF NOT EXISTS idx_users_active_profiles ON users(gender, seeking, age) 
  WHERE photo_url IS NOT NULL;

-- Index sur matches
CREATE INDEX IF NOT EXISTS idx_matches_user_status ON matches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_liked_status ON matches(liked_user_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_pair ON matches(user_id, liked_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched ON matches(status) WHERE status = 'matched';

-- Index sur messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read) WHERE read = false;

-- Index sur lives (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lives') THEN
    CREATE INDEX IF NOT EXISTS idx_lives_active ON lives(status) WHERE status = 'active';
    CREATE INDEX IF NOT EXISTS idx_lives_host ON lives(host_id, status);
    CREATE INDEX IF NOT EXISTS idx_lives_created ON lives(created_at DESC);
  END IF;
END $$;

-- Index sur live_participants (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'live_participants') THEN
    CREATE INDEX IF NOT EXISTS idx_live_participants_live ON live_participants(live_id);
    CREATE INDEX IF NOT EXISTS idx_live_participants_user ON live_participants(user_id);
  END IF;
END $$;


-- ==================== FONCTIONS UTILITAIRES ====================

-- Fonction pour calculer la distance entre deux points (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 6371;
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
    u.id != p_user_id
    AND u.photo_url IS NOT NULL
    AND (
      (v_user.seeking = 'Les deux' OR v_user.seeking = u.gender)
      AND
      (u.seeking = 'Les deux' OR u.seeking = v_user.gender)
    )
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.user_id = p_user_id AND m.liked_user_id = u.id
    )
    AND (
      v_user.latitude IS NULL 
      OR u.latitude IS NULL
      OR calculate_distance(v_user.latitude, v_user.longitude, u.latitude, u.longitude) <= p_max_distance
    )
  ORDER BY
    COALESCE(
      CARDINALITY(ARRAY(SELECT unnest(v_user.interests) INTERSECT SELECT unnest(u.interests))),
      0
    ) DESC,
    distance ASC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;


-- ==================== TRIGGER updated_at ====================

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


-- ==================== CONFIRMATION ====================
DO $$
BEGIN
  RAISE NOTICE '✅ Optimisation terminée !';
  RAISE NOTICE '   - Index créés';
  RAISE NOTICE '   - Fonction calculate_distance() ajoutée';
  RAISE NOTICE '   - Fonction get_compatible_profiles() ajoutée';
  RAISE NOTICE '   - Trigger updated_at configuré';
END $$;
