-- ============================================
-- FIX: Ajout colonne SEEKING pour le frontend
-- La table users a "sexuality" mais le frontend utilise "seeking"
-- Cette migration ajoute seeking et copie les données
-- ============================================

-- 1. Ajouter la colonne seeking si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'seeking'
  ) THEN
    ALTER TABLE public.users ADD COLUMN seeking TEXT;
    RAISE NOTICE 'Colonne seeking ajoutée';
  ELSE
    RAISE NOTICE 'Colonne seeking existe déjà';
  END IF;
END $$;

-- 2. Migrer les données de sexuality vers seeking (si seeking est vide)
UPDATE public.users 
SET seeking = CASE 
  WHEN sexuality = 'Hétérosexuel' AND gender = 'Homme' THEN 'Femme'
  WHEN sexuality = 'Hétérosexuel' AND gender = 'Femme' THEN 'Homme'
  WHEN sexuality = 'Gay' THEN 'Homme'
  WHEN sexuality = 'Lesbienne' THEN 'Femme'
  WHEN sexuality = 'Bisexuel' THEN 'Les deux'
  ELSE 'Les deux'
END
WHERE seeking IS NULL AND sexuality IS NOT NULL;

-- 3. Ajouter la colonne updated_at si manquante (pour l'optimisation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Colonne updated_at ajoutée';
  END IF;
END $$;

-- 4. Vérifier les colonnes
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('seeking', 'updated_at');
  
  RAISE NOTICE '✅ Migration terminée - % nouvelles colonnes vérifiées', col_count;
END $$;
