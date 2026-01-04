-- 🚀 FLOU V2 - QUICK DEPLOYMENT SCRIPT
-- Paste this entire script into Supabase SQL Editor
-- Then execute: Click "RUN" button

-- ============================================================================
-- STEP 1: Create test users in auth.users
-- ============================================================================

-- Create Alice user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '00000000-0000-0000-0000-000000000000',
  'alice@test.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name":"Alice","avatar":"https://via.placeholder.com/400x600?text=Alice"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Create Bob user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '00000000-0000-0000-0000-000000000000',
  'bob@test.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name":"Bob","avatar":"https://via.placeholder.com/400x600?text=Bob"}'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 2: Create profiles linked to users
-- ============================================================================

INSERT INTO public.profiles (
  id,
  username,
  age,
  bio,
  gender,
  location,
  instagram,
  snapchat,
  avatar_url
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'alice_test',
  24,
  'Aventurière à cœur ☀️',
  'F',
  'Paris',
  'alice_official',
  'alice.snap',
  'https://via.placeholder.com/400x600?text=Alice'
) ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (
  id,
  username,
  age,
  bio,
  gender,
  location,
  instagram,
  snapchat,
  avatar_url
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'bob_test',
  26,
  'Je crois aux vraies connexions 💜',
  'M',
  'Paris',
  'bob_official',
  'bob.snap',
  'https://via.placeholder.com/400x600?text=Bob'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 3: Create photos for each user
-- ============================================================================

INSERT INTO public.photos (
  user_id,
  storage_url,
  face_detected,
  blur_level_default,
  position,
  is_primary
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'https://via.placeholder.com/400x600?text=Alice',
  true,
  100,
  0,
  true
) ON CONFLICT DO NOTHING;

INSERT INTO public.photos (
  user_id,
  storage_url,
  face_detected,
  blur_level_default,
  position,
  is_primary
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'https://via.placeholder.com/400x600?text=Bob',
  true,
  100,
  0,
  true
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Create match between Alice and Bob
-- ============================================================================

INSERT INTO public.matches (
  user_1,
  user_2,
  status,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  'day1',
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after executing the above to verify everything worked

-- Check users created
SELECT id, email FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;

-- Check profiles created
SELECT id, username, age, bio FROM public.profiles WHERE username LIKE '%_test' ORDER BY username;

-- Check photos created
SELECT user_id, storage_url, blur_level_default FROM public.photos WHERE user_id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002'
);

-- Check match created
SELECT 
  id,
  user_1,
  user_2,
  status,
  messages_count_user_1,
  messages_count_user_2,
  total_messages,
  created_at
FROM public.matches 
WHERE user_1 = '550e8400-e29b-41d4-a716-446655440001' 
  OR user_2 = '550e8400-e29b-41d4-a716-446655440001';

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- ============================================================================
-- NEXT STEPS:
-- 1. ✅ Execute this script
-- 2. ✅ Verify queries pass (no errors)
-- 3. Go to app and login as alice@test.com / Password123!
-- 4. Go to Swipe tab - you should see Bob's photo (100% blurred)
-- 5. Go to Messages, send 3 messages to Bob
-- 6. Status should change to day2 (50% blur)
-- 7. Logout, login as Bob, send 3 messages back
-- 8. Both reach 6 messages, status becomes day3 (clear photo)
-- 9. Social request modal should appear! 🎉
-- ============================================================================
