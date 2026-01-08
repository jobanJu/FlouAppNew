-- ============================================
-- SÉCURITÉ RENFORCÉE - Tables et Policies
-- Rapport de sécurité Flou App
-- ============================================

-- 1. TABLE DES LOGS DE SÉCURITÉ
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);

-- 2. TABLE TRUST SCORE UTILISATEUR
CREATE TABLE IF NOT EXISTS public.user_trust_scores (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 100 CHECK (score >= 0 AND score <= 150),
  violations_count INTEGER DEFAULT 0,
  last_violation_at TIMESTAMPTZ,
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  shadow_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES VIOLATIONS
CREATE TABLE IF NOT EXISTS public.user_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
  details TEXT,
  penalty_applied INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_violations_user_id ON public.user_violations(user_id);

-- 4. TABLE DES SIGNALEMENTS
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'spam', 'fake_profile', 'inappropriate_content', 'scam', 'other')),
  description TEXT,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 5. TABLE DES BLOCAGES
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- 6. TABLE RATE LIMIT PERSISTANT
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, action_type)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);

-- 7. TABLE CONSENTEMENTS RGPD
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consented BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  consent_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);

-- 8. TABLE SUPPRESSION RGPD (droit à l'oubli)
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('data_export', 'account_deletion', 'data_rectification')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Security Logs - Admin only read
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read security logs" ON public.security_logs;
CREATE POLICY "Admin can read security logs" ON public.security_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
CREATE POLICY "System can insert security logs" ON public.security_logs
  FOR INSERT WITH CHECK (true);

-- Trust Scores - User can read own, system can update
ALTER TABLE public.user_trust_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own trust score" ON public.user_trust_scores;
CREATE POLICY "Users can read own trust score" ON public.user_trust_scores
  FOR SELECT USING (auth.uid() = user_id);

-- Reports - User can create and read own
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
CREATE POLICY "Users can read own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- User Blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own blocks" ON public.user_blocks;
CREATE POLICY "Users can manage own blocks" ON public.user_blocks
  FOR ALL USING (auth.uid() = blocker_id);

-- User Consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own consents" ON public.user_consents;
CREATE POLICY "Users can manage own consents" ON public.user_consents
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FONCTIONS DE SÉCURITÉ
-- ============================================

-- Fonction pour mettre à jour le trust score
CREATE OR REPLACE FUNCTION update_user_trust_score(
  p_user_id UUID,
  p_change INTEGER,
  p_reason TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER;
BEGIN
  INSERT INTO public.user_trust_scores (user_id, score)
  VALUES (p_user_id, 100 + p_change)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    score = GREATEST(0, LEAST(150, user_trust_scores.score + p_change)),
    violations_count = CASE WHEN p_change < 0 THEN user_trust_scores.violations_count + 1 ELSE user_trust_scores.violations_count END,
    last_violation_at = CASE WHEN p_change < 0 THEN NOW() ELSE user_trust_scores.last_violation_at END,
    updated_at = NOW()
  RETURNING score INTO new_score;
  
  -- Log si violation
  IF p_change < 0 THEN
    INSERT INTO public.user_violations (user_id, violation_type, severity, details, penalty_applied)
    VALUES (
      p_user_id,
      p_reason,
      CASE 
        WHEN p_change <= -50 THEN 'critical'
        WHEN p_change <= -30 THEN 'severe'
        WHEN p_change <= -15 THEN 'moderate'
        ELSE 'minor'
      END,
      p_reason,
      ABS(p_change)
    );
  END IF;
  
  -- Shadow ban automatique si score < 20
  IF new_score < 20 THEN
    UPDATE public.user_trust_scores
    SET shadow_banned = TRUE
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur peut contacter un autre
CREATE OR REPLACE FUNCTION can_contact_user(
  p_from_user UUID,
  p_to_user UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier si bloqué
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = p_to_user AND blocked_id = p_from_user)
       OR (blocker_id = p_from_user AND blocked_id = p_to_user)
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si shadow banned
  IF EXISTS (
    SELECT 1 FROM public.user_trust_scores
    WHERE user_id = p_from_user AND shadow_banned = TRUE
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le trust score à l'inscription
CREATE OR REPLACE FUNCTION create_initial_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_trust_scores (user_id, score)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_created_trust_score ON public.users;
CREATE TRIGGER on_user_created_trust_score
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_trust_score();

-- ============================================
-- NETTOYAGE AUTOMATIQUE
-- ============================================

-- Fonction pour nettoyer les données expirées
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Supprimer les logs de sécurité > 90 jours (sauf critical)
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days' 
    AND severity != 'critical';
  
  -- Supprimer les rate limits expirés (> 1 jour)
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AJOUTER COLONNE ROLE AUX USERS (si pas présente)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- ============================================
-- POLITIQUE RLS RENFORCÉE POUR MESSAGES
-- ============================================

-- Empêcher les utilisateurs bloqués de voir les messages
DROP POLICY IF EXISTS "Users can view messages in their matches only" ON public.messages;
CREATE POLICY "Users can view messages in their matches only" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE b.blocked_id = auth.uid() AND b.blocker_id = sender_id
    )
  );

-- Index de performance supplémentaires
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON public.matches(user2_id);

SELECT 'Sécurité renforcée installée avec succès!' AS status;
