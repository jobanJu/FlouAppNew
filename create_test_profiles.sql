-- SCRIPT POUR CRÉER 3 PROFILS DE TEST COMPLETS
-- Exécute ce script dans SQL Editor Supabase

-- Étape 1: Créer les comptes auth (avec mot de passe: Test1234!)
-- Note: Supabase n'autorise pas l'insertion directe dans auth.users via SQL
-- Tu dois soit:
-- A) Les créer via l'interface Supabase Dashboard > Authentication > Users > Add User
-- B) Utiliser l'API signup depuis l'app
-- C) Utiliser cette approche avec des UUID existants

-- Étape 2: Insérer les profils dans la table users
-- Remplace les UUID ci-dessous par les vrais UUID de auth.users après création

-- PROFIL 1: Sophie - Femme Hétérosexuelle
insert into public.users (
  id, 
  firstname, 
  age, 
  city, 
  latitude, 
  longitude, 
  gender, 
  sexuality, 
  interests, 
  email, 
  photo_url,
  created_at
) values (
  '11111111-1111-1111-1111-111111111111', -- Remplace par UUID réel
  'Sophie',
  25,
  'Paris',
  48.8566,
  2.3522,
  'Femme',
  'Hétérosexuel',
  ARRAY['Voyage', 'Cuisine', 'Musique', 'Photographie'],
  'sophie.test@flou.app',
  'https://i.pravatar.cc/400?img=47',
  now()
) on conflict (id) do update set
  firstname = excluded.firstname,
  age = excluded.age,
  city = excluded.city,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  gender = excluded.gender,
  sexuality = excluded.sexuality,
  interests = excluded.interests,
  photo_url = excluded.photo_url;

-- PROFIL 2: Marc - Homme Hétérosexuel
insert into public.users (
  id,
  firstname,
  age,
  city,
  latitude,
  longitude,
  gender,
  sexuality,
  interests,
  email,
  photo_url,
  created_at
) values (
  '22222222-2222-2222-2222-222222222222', -- Remplace par UUID réel
  'Marc',
  28,
  'Lyon',
  45.7640,
  4.8357,
  'Homme',
  'Hétérosexuel',
  ARRAY['Sport', 'Cinéma', 'Gaming', 'Technologie'],
  'marc.test@flou.app',
  'https://i.pravatar.cc/400?img=12',
  now()
) on conflict (id) do update set
  firstname = excluded.firstname,
  age = excluded.age,
  city = excluded.city,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  gender = excluded.gender,
  sexuality = excluded.sexuality,
  interests = excluded.interests,
  photo_url = excluded.photo_url;

-- PROFIL 3: Julie - Femme Bisexuelle
insert into public.users (
  id,
  firstname,
  age,
  city,
  latitude,
  longitude,
  gender,
  sexuality,
  interests,
  email,
  photo_url,
  created_at
) values (
  '33333333-3333-3333-3333-333333333333', -- Remplace par UUID réel
  'Julie',
  23,
  'Marseille',
  43.2965,
  5.3698,
  'Femme',
  'Bisexuel',
  ARRAY['Art', 'Lecture', 'Yoga', 'Nature'],
  'julie.test@flou.app',
  'https://i.pravatar.cc/400?img=38',
  now()
) on conflict (id) do update set
  firstname = excluded.firstname,
  age = excluded.age,
  city = excluded.city,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  gender = excluded.gender,
  sexuality = excluded.sexuality,
  interests = excluded.interests,
  photo_url = excluded.photo_url;

-- Vérification
select id, firstname, age, city, gender, sexuality, array_length(interests, 1) as nb_interests
from public.users
where email like '%.test@flou.app'
order by created_at desc;
