-- FLOU APP - SUPABASE SCHEMA
-- MVP Phase 1: Auth, Profils, Photos, Matches, Messages, Défloutage

-- ============================================================================
-- 1️⃣ USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Profil
  username TEXT UNIQUE NOT NULL,
  age INTEGER NOT NULL,
  bio TEXT,
  gender TEXT CHECK (gender IN ('M', 'F', 'NB')),
  location TEXT,
  
  -- Subscription & Verification
  subscription TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'kama', 'cupidon')),
  verified BOOLEAN DEFAULT FALSE,
  
  -- Wallet
  brumes_balance INTEGER DEFAULT 0,
  
  -- Preferences
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 50,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ============================================================================
-- 2️⃣ PHOTOS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  user_id UUID NOT NULL,
  
  -- Image metadata
  storage_url TEXT NOT NULL,
  face_detected BOOLEAN DEFAULT FALSE,
  blur_level_default INTEGER DEFAULT 100 CHECK (blur_level_default >= 0 AND blur_level_default <= 100),
  
  -- Ordering
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_primary ON public.photos(user_id, is_primary);

-- ============================================================================
-- 3️⃣ MATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Users
  user_1 UUID NOT NULL,
  user_2 UUID NOT NULL,
  
  -- Match status
  status TEXT DEFAULT 'day1' CHECK (status IN ('day1', 'day2', 'day3', 'unmatched', 'blocked')),
  
  -- Message counter
  messages_count INTEGER DEFAULT 0,
  
  -- Blur progression tracking
  day1_unblurred_at TIMESTAMP WITH TIME ZONE,
  day2_unblurred_at TIMESTAMP WITH TIME ZONE,
  day3_unblurred_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE
);

-- Unique constraint: prevent duplicates (user_1 < user_2)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique ON public.matches(
  LEAST(user_1, user_2),
  GREATEST(user_1, user_2)
);

-- Indexes
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
  match_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- State
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_match_sender ON public.messages(match_id, sender_id);

-- ============================================================================
-- 5️⃣ LIVE ROOMS TABLE (Pour audio groupé)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.live_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Host & Room info
  host_id UUID NOT NULL,
  room_name TEXT UNIQUE NOT NULL,
  
  -- Room settings
  max_participants INTEGER DEFAULT 4,
  current_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_live_rooms_host_id ON public.live_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_is_active ON public.live_rooms(is_active);

-- ============================================================================
-- 6️⃣ LOVE DATE TABLE (Pour 1v1 avec questions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.love_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Users
  initiator_id UUID NOT NULL,
  target_id UUID NOT NULL,
  
  -- Love Date settings
  room_name TEXT UNIQUE NOT NULL,
  question_index INTEGER DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'declined')),
  result TEXT CHECK (result IN ('match', 'nomatch', null)),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_love_dates_initiator_id ON public.love_dates(initiator_id);
CREATE INDEX IF NOT EXISTS idx_love_dates_target_id ON public.love_dates(target_id);
CREATE INDEX IF NOT EXISTS idx_love_dates_status ON public.love_dates(status);

-- ============================================================================
-- 7️⃣ GIFTS TABLE (Pour les cadeaux Brumes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  
  -- Gift info
  gift_type TEXT NOT NULL,
  brumes_cost INTEGER NOT NULL DEFAULT 10,
  
  -- Context
  match_id UUID,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gifts_sender_id ON public.gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient_id ON public.gifts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON public.gifts(created_at);

-- ============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

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

-- Trigger: users.updated_at
CREATE TRIGGER IF NOT EXISTS users_update_timestamp BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: matches.updated_at
CREATE TRIGGER IF NOT EXISTS matches_update_timestamp BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- 🌫️ BLUR PROGRESSION TRIGGERS (Day 1 → Day 2 → Day 3)
-- ============================================================================

-- Fonction: Débloquer J2 (50% blur) après 6 messages
CREATE OR REPLACE FUNCTION check_day2_unlock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.messages_count >= 6 AND OLD.messages_count < 6 AND NEW.status = 'day1' THEN
    NEW.status := 'day2';
    NEW.day2_unblurred_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Vérifier seuil J2 à chaque update de messages_count
CREATE TRIGGER IF NOT EXISTS trigger_check_day2_unlock
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION check_day2_unlock();

-- Fonction: Débloquer J3 (0% blur) après 12 messages
CREATE OR REPLACE FUNCTION check_day3_unlock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.messages_count >= 12 AND OLD.messages_count < 12 AND NEW.status = 'day2' THEN
    NEW.status := 'day3';
    NEW.day3_unblurred_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Vérifier seuil J3 à chaque update de messages_count
CREATE TRIGGER IF NOT EXISTS trigger_check_day3_unlock
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION check_day3_unlock();

-- ============================================================================
-- 🎁 BRUMES WALLET TRIGGERS
-- ============================================================================

-- Table: Brumes wallet (solde par utilisateur)
CREATE TABLE IF NOT EXISTS public.brumes_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bonus_brumes INTEGER DEFAULT 0,
  cash_brumes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brumes_wallet_user_id ON public.brumes_wallet(user_id);

-- Table: Brumes transactions (audit trail)
CREATE TABLE IF NOT EXISTS public.brumes_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  origin TEXT CHECK (origin IN ('purchase', 'bonus', 'gift', 'love_date')),
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brumes_transactions_user_id ON public.brumes_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_brumes_transactions_created_at ON public.brumes_transactions(created_at);

-- Fonction: Créer un wallet automatiquement quand un utilisateur est créé
CREATE OR REPLACE FUNCTION create_wallet_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.brumes_wallet (user_id, bonus_brumes, cash_brumes)
  VALUES (NEW.id, 10, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Création automatique du wallet
CREATE TRIGGER IF NOT EXISTS on_user_signup
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_on_signup();

-- Fonction: Empêcher les bonus brumes d'être utilisés pour les live gifts
CREATE OR REPLACE FUNCTION prevent_bonus_for_live_gift()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.context = 'live_gift' AND NEW.origin = 'bonus' THEN
    RAISE EXCEPTION 'Bonus brumes cannot be used for live gifts';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validation des transactions de brumes
CREATE TRIGGER IF NOT EXISTS validate_brumes_transaction
BEFORE INSERT ON public.brumes_transactions
FOR EACH ROW
EXECUTE FUNCTION prevent_bonus_for_live_gift();

-- ============================================================================
-- 📊 MESSAGE COUNTER TRIGGER
-- ============================================================================

-- Fonction: Incrémenter le compteur de messages du match
CREATE OR REPLACE FUNCTION increment_messages_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.matches
  SET messages_count = messages_count + 1,
      last_message_at = NOW()
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Incrémenter quand un message est créé
CREATE TRIGGER IF NOT EXISTS on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION increment_messages_count();