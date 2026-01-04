-- FLOU V2 ONBOARDING SCHEMA
-- Complete onboarding flow with 7 steps

-- Extend profiles table with onboarding data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1; -- 1-7
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- Step 1: Identity
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT; -- 'woman', 'man', 'non-binary', 'other', 'prefer-not-to-say'

-- Step 2: Orientation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orientation TEXT; -- 'hetero', 'gay', 'bi', 'pan', 'other'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for TEXT; -- 'women', 'men', 'all'

-- Step 3: Location
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE;

-- Step 4: Interests (junction table)
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, interest_id)
);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interests" ON user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interests" ON user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" ON user_interests
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Values & Intentions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS value_matters_to_me TEXT; -- Open-ended: "Qu'est-ce qui compte vraiment pour toi ?"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS value_seeking_here TEXT; -- Open-ended: "Que recherches-tu ici ?"

-- Step 6: Photo (main profile photo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_blur_progression INTEGER DEFAULT 0; -- 0-100 (100 = fully blurred)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP;

-- Step 7: Consent
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_blur_mechanics BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_physical_not_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_respect_others BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_at TIMESTAMP;

-- Table for predefined interests
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- emoji or icon name
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view interests" ON interests
  FOR SELECT USING (true);

-- Insert predefined interests
INSERT INTO interests (name, icon) VALUES
  ('Musique', '🎵'),
  ('Voyages', '✈️'),
  ('Spiritualité', '🕉️'),
  ('Sport', '⚽'),
  ('Cinéma', '🎬'),
  ('Cuisine', '🍽️'),
  ('Entrepreneuriat', '💼'),
  ('Nature', '🌲'),
  ('Art', '🎨'),
  ('Développement', '💻'),
  ('Photographie', '📸'),
  ('Lecture', '📚'),
  ('Yoga', '🧘'),
  ('Gaming', '🎮'),
  ('Danse', '💃'),
  ('Philosophie', '🤔'),
  ('Méditation', '🧘‍♀️'),
  ('Fashion', '👗'),
  ('Musées', '🏛️'),
  ('Fitness', '💪')
ON CONFLICT (name) DO NOTHING;

-- Track onboarding progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, step)
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track their own progress" ON onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to check if user completed onboarding
CREATE OR REPLACE FUNCTION check_onboarding_complete(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT onboarding_completed
    FROM profiles
    WHERE id = user_uuid
  ) = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically mark onboarding complete when all steps done
CREATE OR REPLACE FUNCTION mark_onboarding_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.onboarding_step = 7 
     AND NEW.consent_blur_mechanics = TRUE 
     AND NEW.consent_physical_not_priority = TRUE 
     AND NEW.consent_respect_others = TRUE
  THEN
    NEW.onboarding_completed = TRUE;
    NEW.onboarding_completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF NOT EXISTS on_onboarding_complete ON profiles;
CREATE TRIGGER on_onboarding_complete
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION mark_onboarding_complete();
