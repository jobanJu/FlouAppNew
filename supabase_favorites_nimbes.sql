-- Table pour les favoris (utilisateurs qu'on suit)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- Table pour les Nimbes permanents (modérateurs de ses lives)
CREATE TABLE IF NOT EXISTS public.user_nimbes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nimbe_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, nimbe_user_id)
);

-- RLS pour favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their favorites" ON public.favorites;
CREATE POLICY "Users can remove their favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- RLS pour user_nimbes
ALTER TABLE public.user_nimbes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their nimbes" ON public.user_nimbes;
CREATE POLICY "Users can view their nimbes" ON public.user_nimbes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add nimbes" ON public.user_nimbes;
CREATE POLICY "Users can add nimbes" ON public.user_nimbes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their nimbes" ON public.user_nimbes;
CREATE POLICY "Users can remove their nimbes" ON public.user_nimbes
  FOR DELETE USING (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_target_user_id ON public.favorites(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_nimbes_user_id ON public.user_nimbes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nimbes_nimbe_user_id ON public.user_nimbes(nimbe_user_id);
