-- ============================================================================
-- FLOU APP - SUPABASE SCHEMA V2
-- MVP Phase 1: Profils, Matches, Messages, Social Requests, Défloutage
-- ============================================================================

-- ============================================================================
-- 1️⃣ PROFILES TABLE (linked to auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  age INTEGER,
  bio TEXT,
  gender TEXT CHECK (gender IN ('M', 'F', 'NB')),
  location TEXT,
  
  -- Social profiles
  instagram TEXT,
  snapchat TEXT,
  
  -- Preferences
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 50,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- ============================================================================
-- 2️⃣ PHOTOS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Image metadata
  storage_url TEXT NOT NULL,
  face_detected BOOLEAN DEFAULT FALSE,
  blur_level_default INTEGER DEFAULT 100 CHECK (blur_level_default >= 0 AND blur_level_default <= 100),
  
  -- Ordering
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_primary ON public.photos(user_id, is_primary);

-- ============================================================================
-- 3️⃣ MATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Users
  user_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Match status
  status TEXT DEFAULT 'day1' CHECK (status IN ('day1', 'day2', 'day3', 'unmatched', 'blocked')),
  
  -- Message counters (by user)
  messages_count_user_1 INTEGER DEFAULT 0,
  messages_count_user_2 INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  
  -- Blur progression tracking
  day2_unlocked_at TIMESTAMP WITH TIME ZONE,
  day3_unlocked_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Unique constraint: prevent duplicates (user_1 < user_2)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique ON public.matches(
  LEAST(user_1, user_2),
  GREATEST(user_1, user_2)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_1 ON public.matches(user_1);
CREATE INDEX IF NOT EXISTS idx_matches_user_2 ON public.matches(user_2);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at);

-- ============================================================================
-- 4️⃣ MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- State
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_match_sender ON public.messages(match_id, sender_id);

-- ============================================================================
-- 5️⃣ MATCH_SOCIAL_REQUESTS TABLE (Instagram/Snapchat partage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.match_social_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Social request
  social_type TEXT NOT NULL CHECK (social_type IN ('instagram', 'snapchat')),
  social_value TEXT,
  
  -- Consent state
  -- null = waiting for response
  -- true = accepted
  -- false = declined
  consent BOOLEAN,
  
  -- Metadata
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_match_social_requests_match_id ON public.match_social_requests(match_id);
CREATE INDEX IF NOT EXISTS idx_match_social_requests_owner_user_id ON public.match_social_requests(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_match_social_requests_target_user_id ON public.match_social_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_match_social_requests_consent ON public.match_social_requests(consent);

-- ============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Profiles: users can read all, but only edit their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Photos: users can read all, edit their own
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read photos"
ON public.photos FOR SELECT
USING (true);

CREATE POLICY "Users can upload their own photos"
ON public.photos FOR INSERT
USING (auth.uid() = user_id);

-- Matches: users can only read their own matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their matches"
ON public.matches FOR SELECT
USING (
  auth.uid() = user_1 OR auth.uid() = user_2
);

-- Messages: users can send and read in their matches
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages in their matches"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = messages.match_id
    AND (matches.user_1 = auth.uid() OR matches.user_2 = auth.uid())
  )
);

CREATE POLICY "Users can read messages in their matches"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = messages.match_id
    AND (matches.user_1 = auth.uid() OR matches.user_2 = auth.uid())
  )
);

-- Social Requests: owner can read/update, target can read
ALTER TABLE public.match_social_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read & update own request"
ON public.match_social_requests
FOR ALL
USING (
  auth.uid() = owner_user_id OR 
  auth.uid() = target_user_id
)
WITH CHECK (
  auth.uid() = owner_user_id OR 
  auth.uid() = target_user_id
);

-- ============================================================================
-- 🔔 FUNCTIONS & TRIGGERS
-- ============================================================================

-- Fonction: Mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: profiles.updated_at
CREATE TRIGGER IF NOT EXISTS profiles_update_timestamp 
BEFORE UPDATE ON public.profiles
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: matches.updated_at
CREATE TRIGGER IF NOT EXISTS matches_update_timestamp 
BEFORE UPDATE ON public.matches
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 📨 MESSAGE COUNTER TRIGGER
-- ============================================================================

-- Fonction: Incrémenter les compteurs de messages
CREATE OR REPLACE FUNCTION increment_message_counters()
RETURNS TRIGGER AS $$
DECLARE
  v_user_1 UUID;
  v_user_2 UUID;
BEGIN
  -- Get match users
  SELECT user_1, user_2 INTO v_user_1, v_user_2
  FROM public.matches
  WHERE id = NEW.match_id;

  -- Increment corresponding counter
  IF NEW.sender_id = v_user_1 THEN
    UPDATE public.matches
    SET messages_count_user_1 = messages_count_user_1 + 1,
        total_messages = total_messages + 1,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.match_id;
  ELSE
    UPDATE public.matches
    SET messages_count_user_2 = messages_count_user_2 + 1,
        total_messages = total_messages + 1,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.match_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Incrémenter quand un message est créé
CREATE TRIGGER IF NOT EXISTS on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION increment_message_counters();

-- ============================================================================
-- 🌫️ BLUR PROGRESSION TRIGGERS (appelé par Edge Function)
-- ============================================================================

-- Fonction: Mettre à jour le statut du match selon les compteurs
CREATE OR REPLACE FUNCTION update_match_status_on_message_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we should unlock day2 (3 messages per user)
  IF NEW.status = 'day1' 
     AND NEW.messages_count_user_1 >= 3 
     AND NEW.messages_count_user_2 >= 3 THEN
    NEW.status := 'day2';
    NEW.day2_unlocked_at := NOW();
  END IF;

  -- Check if we should unlock day3 (6 messages per user)
  IF NEW.status = 'day2' 
     AND NEW.messages_count_user_1 >= 6 
     AND NEW.messages_count_user_2 >= 6 THEN
    NEW.status := 'day3';
    NEW.day3_unlocked_at := NOW();
    
    -- Create social requests for both users
    INSERT INTO public.match_social_requests (match_id, owner_user_id, target_user_id, social_type)
    VALUES 
      (NEW.id, NEW.user_1, NEW.user_2, 'instagram'),
      (NEW.id, NEW.user_2, NEW.user_1, 'instagram');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Vérifier les statuts à chaque update de compteurs
CREATE TRIGGER IF NOT EXISTS update_match_status_trigger
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION update_match_status_on_message_count();

