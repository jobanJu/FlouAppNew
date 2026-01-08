-- ============================================================
-- SYSTÈME BRUMES COMPLET POUR FLOU
-- Monnaie virtuelle, cadeaux Live, conversion créateurs
-- ============================================================

-- Table des transactions Brumes
CREATE TABLE IF NOT EXISTS public.brumes_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('achat', 'don', 'recu', 'conversion', 'bonus_abonnement', 'cadeau_live')),
  amount INTEGER NOT NULL,
  description TEXT,
  related_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  live_id UUID REFERENCES public.lives(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des cadeaux disponibles en Live
CREATE TABLE IF NOT EXISTS public.live_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  price INTEGER NOT NULL, -- en Brumes
  animation_type TEXT DEFAULT 'bounce', -- bounce, float, explode, rain
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des cadeaux envoyés en Live
CREATE TABLE IF NOT EXISTS public.live_gift_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_id UUID NOT NULL REFERENCES public.lives(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES public.live_gifts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Brumes dépensées
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des revenus créateurs (Brumes reçues convertissables)
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  brumes_earned INTEGER DEFAULT 0, -- Total brumes reçues
  brumes_converted INTEGER DEFAULT 0, -- Brumes déjà converties
  brumes_pending INTEGER DEFAULT 0, -- Brumes en attente de conversion
  euros_total DECIMAL(10,2) DEFAULT 0, -- Total euros gagnés
  euros_paid DECIMAL(10,2) DEFAULT 0, -- Euros déjà payés
  euros_pending DECIMAL(10,2) DEFAULT 0, -- Euros en attente de paiement
  last_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table des demandes de paiement créateurs
CREATE TABLE IF NOT EXISTS public.creator_payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  brumes_amount INTEGER NOT NULL, -- Brumes à convertir
  euros_amount DECIMAL(10,2) NOT NULL, -- Équivalent en euros
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verification', 'approved', 'rejected', 'paid')),
  bank_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  phone_call_done BOOLEAN DEFAULT false,
  agreement_signed BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  admin_notes TEXT,
  stripe_payout_id TEXT,
  revolut_payment_id TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Table des informations bancaires créateurs (chiffrées)
CREATE TABLE IF NOT EXISTS public.creator_bank_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Stockage chiffré - ne pas stocker en clair
  encrypted_iban TEXT,
  encrypted_bic TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  -- Vérification
  identity_document_url TEXT, -- URL CNI stockée de manière sécurisée
  identity_verified BOOLEAN DEFAULT false,
  identity_verified_at TIMESTAMPTZ,
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMPTZ,
  agreement_signed BOOLEAN DEFAULT false,
  agreement_signed_at TIMESTAMPTZ,
  agreement_document_url TEXT,
  -- Revolut
  revolut_account_id TEXT,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Insérer les cadeaux par défaut
INSERT INTO public.live_gifts (name, emoji, price, animation_type) VALUES
  ('Coeur', '❤️', 5, 'float'),
  ('Rose', '🌹', 10, 'float'),
  ('Bisou', '💋', 15, 'bounce'),
  ('Étoile', '⭐', 20, 'explode'),
  ('Diamant', '💎', 50, 'explode'),
  ('Couronne', '👑', 100, 'rain'),
  ('Arc-en-ciel', '🌈', 75, 'rain'),
  ('Champagne', '🍾', 150, 'explode'),
  ('Fusée', '🚀', 200, 'float'),
  ('Licorne', '🦄', 300, 'rain')
ON CONFLICT DO NOTHING;

-- Fonction pour envoyer un cadeau en Live
CREATE OR REPLACE FUNCTION send_live_gift(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_live_id UUID,
  p_gift_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_gift_price INTEGER;
  v_sender_balance INTEGER;
  v_gift_name TEXT;
  v_gift_emoji TEXT;
BEGIN
  -- Récupérer le prix du cadeau
  SELECT price, name, emoji INTO v_gift_price, v_gift_name, v_gift_emoji
  FROM public.live_gifts WHERE id = p_gift_id AND is_active = true;
  
  IF v_gift_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cadeau invalide');
  END IF;
  
  -- Vérifier le solde
  SELECT brumes_balance INTO v_sender_balance
  FROM public.users WHERE id = p_sender_id;
  
  IF v_sender_balance < v_gift_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solde insuffisant', 'required', v_gift_price, 'balance', v_sender_balance);
  END IF;
  
  -- Débiter l'expéditeur
  UPDATE public.users SET brumes_balance = brumes_balance - v_gift_price WHERE id = p_sender_id;
  
  -- Créditer le receveur (80% - 20% commission Flou)
  UPDATE public.users SET brumes_balance = brumes_balance + (v_gift_price * 0.8)::INTEGER WHERE id = p_receiver_id;
  
  -- Enregistrer la transaction
  INSERT INTO public.live_gift_transactions (live_id, sender_id, receiver_id, gift_id, amount)
  VALUES (p_live_id, p_sender_id, p_receiver_id, p_gift_id, v_gift_price);
  
  -- Enregistrer dans l'historique expéditeur
  INSERT INTO public.brumes_transactions (user_id, type, amount, description, related_user_id, live_id)
  VALUES (p_sender_id, 'cadeau_live', -v_gift_price, 'Cadeau ' || v_gift_name || ' envoyé', p_receiver_id, p_live_id);
  
  -- Enregistrer dans l'historique receveur
  INSERT INTO public.brumes_transactions (user_id, type, amount, description, related_user_id, live_id)
  VALUES (p_receiver_id, 'recu', (v_gift_price * 0.8)::INTEGER, 'Cadeau ' || v_gift_name || ' reçu', p_sender_id, p_live_id);
  
  -- Mettre à jour les gains créateur
  INSERT INTO public.creator_earnings (user_id, brumes_earned, brumes_pending)
  VALUES (p_receiver_id, (v_gift_price * 0.8)::INTEGER, (v_gift_price * 0.8)::INTEGER)
  ON CONFLICT (user_id) DO UPDATE SET
    brumes_earned = creator_earnings.brumes_earned + (v_gift_price * 0.8)::INTEGER,
    brumes_pending = creator_earnings.brumes_pending + (v_gift_price * 0.8)::INTEGER,
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'gift_name', v_gift_name,
    'gift_emoji', v_gift_emoji,
    'amount', v_gift_price,
    'receiver_gets', (v_gift_price * 0.8)::INTEGER
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour convertir Brumes en Euros (taux: 100 Brumes = 0.50€)
CREATE OR REPLACE FUNCTION request_brumes_conversion(
  p_user_id UUID,
  p_brumes_amount INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_pending_brumes INTEGER;
  v_euros_amount DECIMAL(10,2);
  v_min_conversion INTEGER := 1000; -- Minimum 1000 Brumes (5€)
BEGIN
  -- Vérifier le minimum
  IF p_brumes_amount < v_min_conversion THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum 1000 Brumes requis (5€)', 'minimum', v_min_conversion);
  END IF;
  
  -- Récupérer les Brumes en attente
  SELECT brumes_pending INTO v_pending_brumes
  FROM public.creator_earnings WHERE user_id = p_user_id;
  
  IF v_pending_brumes IS NULL OR v_pending_brumes < p_brumes_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Brumes insuffisantes', 'available', COALESCE(v_pending_brumes, 0), 'requested', p_brumes_amount);
  END IF;
  
  -- Calculer les euros (100 Brumes = 0.50€)
  v_euros_amount := (p_brumes_amount::DECIMAL / 100) * 0.50;
  
  -- Créer la demande de paiement
  INSERT INTO public.creator_payout_requests (user_id, brumes_amount, euros_amount, status)
  VALUES (p_user_id, p_brumes_amount, v_euros_amount, 'pending');
  
  -- Déduire des Brumes en attente
  UPDATE public.creator_earnings 
  SET brumes_pending = brumes_pending - p_brumes_amount,
      euros_pending = euros_pending + v_euros_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'brumes_converted', p_brumes_amount,
    'euros_amount', v_euros_amount,
    'status', 'pending',
    'message', 'Demande de conversion créée. Vous serez contacté pour la vérification.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.brumes_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_bank_info ENABLE ROW LEVEL SECURITY;

-- Policies brumes_transactions
CREATE POLICY "Users view own transactions" ON public.brumes_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policies live_gifts (tout le monde peut voir)
CREATE POLICY "Anyone can view live gifts" ON public.live_gifts
  FOR SELECT USING (is_active = true);

-- Policies live_gift_transactions
CREATE POLICY "Users view own gift transactions" ON public.live_gift_transactions
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policies creator_earnings
CREATE POLICY "Users view own earnings" ON public.creator_earnings
  FOR SELECT USING (auth.uid() = user_id);

-- Policies creator_payout_requests
CREATE POLICY "Users view own payout requests" ON public.creator_payout_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create payout requests" ON public.creator_payout_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies creator_bank_info
CREATE POLICY "Users view own bank info" ON public.creator_bank_info
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own bank info" ON public.creator_bank_info
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bank info" ON public.creator_bank_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_brumes_transactions_user ON public.brumes_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_brumes_transactions_created ON public.brumes_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_gift_transactions_live ON public.live_gift_transactions(live_id);
CREATE INDEX IF NOT EXISTS idx_live_gift_transactions_sender ON public.live_gift_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_live_gift_transactions_receiver ON public.live_gift_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_user ON public.creator_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_payout_requests_user ON public.creator_payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_payout_requests_status ON public.creator_payout_requests(status);
