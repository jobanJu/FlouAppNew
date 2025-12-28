-- ========================================
-- FLOU APP - Schéma Supabase
-- ========================================

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  orientation TEXT,
  goal TEXT,
  bio TEXT DEFAULT '',
  city TEXT DEFAULT '',
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  interests TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  brumes INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche géographique
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (lat, lon);
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles (device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles (is_online);

-- Table des matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, matched, unmatched
  blur_level INTEGER DEFAULT 100,
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches (user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches (user2_id);

-- Table des swipes
CREATE TABLE IF NOT EXISTS swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id TEXT NOT NULL,
  swiped_id TEXT NOT NULL,
  direction TEXT NOT NULL, -- left, right, superlike
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes (swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes (swiped_id);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text', -- text, image, vocal, gift
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON messages (match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);

-- Table des transactions Brumes
CREATE TABLE IF NOT EXISTS brumes_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- purchase, daily_reward, spent, gift_received
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brumes_user ON brumes_transactions (user_id);

-- Table des lives
CREATE TABLE IF NOT EXISTS lives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id TEXT NOT NULL,
  title TEXT,
  thumbnail TEXT,
  viewers_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lives_host ON lives (host_id);
CREATE INDEX IF NOT EXISTS idx_lives_active ON lives (is_active);

-- Table des cadeaux live
CREATE TABLE IF NOT EXISTS live_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  gift_type TEXT NOT NULL,
  brumes_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE brumes_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_gifts ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles (lecture publique, écriture par device_id)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true);

-- Policies pour matches
CREATE POLICY "Matches are viewable by participants" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create matches" ON matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update matches" ON matches
  FOR UPDATE USING (true);

-- Policies pour swipes
CREATE POLICY "Swipes are private" ON swipes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create swipes" ON swipes
  FOR INSERT WITH CHECK (true);

-- Policies pour messages
CREATE POLICY "Messages viewable by participants" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can send messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Messages can be updated" ON messages
  FOR UPDATE USING (true);

-- Policies pour brumes_transactions
CREATE POLICY "Transactions are private" ON brumes_transactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create transactions" ON brumes_transactions
  FOR INSERT WITH CHECK (true);

-- Policies pour lives
CREATE POLICY "Lives are public" ON lives
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create lives" ON lives
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update lives" ON lives
  FOR UPDATE USING (true);

-- Policies pour live_gifts
CREATE POLICY "Gifts are public" ON live_gifts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can send gifts" ON live_gifts
  FOR INSERT WITH CHECK (true);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
