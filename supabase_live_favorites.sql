-- Table pour les favoris de Live (qui suit qui)
-- user_id = l'utilisateur qui ajoute en favori
-- favorite_user_id = l'utilisateur ajouté en favori (le host qu'on suit)
CREATE TABLE IF NOT EXISTS public.live_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  favorite_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, favorite_user_id)
);

-- RLS pour live_favorites
ALTER TABLE public.live_favorites ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les favoris (pour compter les fans)
DROP POLICY IF EXISTS "Anyone can view live_favorites" ON public.live_favorites;
CREATE POLICY "Anyone can view live_favorites" ON public.live_favorites
  FOR SELECT USING (true);

-- Les utilisateurs peuvent ajouter des favoris
DROP POLICY IF EXISTS "Users can add live_favorites" ON public.live_favorites;
CREATE POLICY "Users can add live_favorites" ON public.live_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs favoris
DROP POLICY IF EXISTS "Users can remove their live_favorites" ON public.live_favorites;
CREATE POLICY "Users can remove their live_favorites" ON public.live_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_live_favorites_user_id ON public.live_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_live_favorites_favorite_user_id ON public.live_favorites(favorite_user_id);
