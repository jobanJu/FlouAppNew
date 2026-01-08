-- ============================================
-- MISE À JOUR POUR LE SYSTÈME DE MODÉRATION DES LIVES
-- ============================================

-- Ajouter les colonnes de modération à live_participants
ALTER TABLE live_participants 
ADD COLUMN IF NOT EXISTS kicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS slot_number INTEGER CHECK (slot_number >= 1 AND slot_number <= 4);

-- Créer la table des utilisateurs bloqués
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Créer la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'favorite_live', 'fan_message', 'match', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- Index pour les utilisateurs bloqués
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- RLS pour blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can create blocks" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their blocks" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- RLS pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Mise à jour terminée : modération des lives, notifications et blocage';
END $$;
