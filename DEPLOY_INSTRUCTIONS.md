# 🚀 FLOU V2 - Deployment Instructions

## Phase 1: Database Setup (5 minutes)

### Step 1.1: Deploy Schema to Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your FLOU project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy entire content from [`supabase/schema-v2.sql`](./supabase/schema-v2.sql)
6. Paste into SQL Editor
7. Click **Run** (top right)
8. Wait for ✅ "Success"

### Step 1.2: Verify Tables Created

In SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- ✅ matches
- ✅ messages
- ✅ match_social_requests
- ✅ photos
- ✅ profiles

### Step 1.3: Verify Triggers Created

Run this in SQL Editor:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

You should see:
- ✅ on_message_insert
- ✅ update_match_status_trigger
- ✅ update_updated_at_column

---

## Phase 2: Create Test Users (10 minutes)

### Step 2.1: Create Auth Users

In SQL Editor, run:
```sql
-- Create test user 1: alice
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
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'alice@test.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name":"Alice"}'::jsonb
) RETURNING id;

-- Create test user 2: bob
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
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'bob@test.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name":"Bob"}'::jsonb
) RETURNING id;
```

**⚠️ COPY THE IDs** (you'll need them next)

### Step 2.2: Create Profiles

Replace `USER_1_ID` and `USER_2_ID` with IDs from above:

```sql
-- Create Alice's profile
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
  'USER_1_ID',
  'alice_test',
  24,
  'Aventurière à cœur ☀️',
  'F',
  'Paris',
  'alice_official',
  'alice.snap',
  'https://via.placeholder.com/400x600?text=Alice'
);

-- Create Bob's profile
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
  'USER_2_ID',
  'bob_test',
  26,
  'Je crois aux vraies connexions 💜',
  'M',
  'Paris',
  'bob_official',
  'bob.snap',
  'https://via.placeholder.com/400x600?text=Bob'
);
```

### Step 2.3: Create a Match

```sql
INSERT INTO public.matches (
  user_1,
  user_2,
  status,
  created_at
) VALUES (
  'USER_1_ID',
  'USER_2_ID',
  'day1',
  NOW()
);
```

---

## Phase 3: Environment Setup (5 minutes)

### Step 3.1: Create `.env.local`

Create file at project root: `.env.local`

```env
# Get these from Supabase Dashboard > Settings > API
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Where to find these:
1. Go to Supabase Dashboard
2. Click **Settings** (bottom left)
3. Click **API**
4. Copy **Project URL** (without /rest/v1)
5. Copy **Anon Key** (under "Project API Keys")

---

## Phase 4: Test the System (15 minutes)

### Step 4.1: Run the App

```bash
npm start
```

Select platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator

### Step 4.2: Login Test

1. Log in as Alice: `alice@test.com` / `Password123!`
2. Go to **Swipe** tab (index)
3. You should see Bob's photo with **🌫️ (100% blur)**
4. Badge shows "Day 1 - Complete J1 pour débloquer"

### Step 4.3: Send Messages

In the **Messages** tab:
1. Click on Bob's match
2. Send 3 messages (any content)
3. Watch for status change to "Day 2" (⏳ 50% blur)

Then logout and login as Bob, send 3 more messages back.

After both send 3 each (6 total):
- Photo should become 0% blur (✅)
- Status should show "Day 3 - Unlocked!"
- Social request should appear

### Step 4.4: Test Social Request

1. Click "Share Instagram" button
2. Enter your Instagram handle
3. Click "Accept"
4. Verify request appears in database:

```sql
SELECT * FROM public.match_social_requests WHERE status = 'accepted';
```

---

## Phase 5: Deployment to Production

### Prerequisites
- ✅ Schema deployed and verified
- ✅ Test flow works (blur progression)
- ✅ Environment variables set
- ✅ RLS policies enabled

### Step 5.1: Enable RLS Policies

In Supabase Dashboard > **Authentication** > **Policies**:

For each table (profiles, matches, messages, match_social_requests):
1. Click table name
2. Click **Enable RLS**
3. Add policies from `DEPLOYMENT_GUIDE.md`

### Step 5.2: Configure Realtime

In Supabase Dashboard:
1. Go to **Realtime** (left sidebar)
2. Click **Sources**
3. Enable for:
   - `matches` table
   - `messages` table
   - `match_social_requests` table

### Step 5.3: Deploy App

```bash
eas build --platform ios --auto-submit
# or
eas build --platform android --auto-submit
```

---

## Troubleshooting

### "Table does not exist"
→ Run schema-v2.sql again (Step 1.1)

### "Permission denied on table"
→ Enable RLS policies (Step 5.1)

### "No realtime updates"
→ Enable Realtime source (Step 5.2)

### "Blur not changing on messages"
→ Check triggers exist (Step 1.3)
→ Verify message INSERT goes to correct match_id

### Login fails
→ Check auth.users table has your test users
→ Verify password was hashed with crypt()

### Photos still 100% blur
→ Check messages_count in matches table
→ Verify trigger on_message_insert fired
→ Run: `SELECT * FROM matches WHERE id = 'YOUR_MATCH_ID';`

---

## Quick Commands Reference

```bash
# View your matches
curl -X GET \
  'https://your-project.supabase.co/rest/v1/matches?select=*' \
  -H "Authorization: Bearer ANON_KEY"

# View messages for a match
curl -X GET \
  'https://your-project.supabase.co/rest/v1/messages?match_id=eq.MATCH_ID&select=*' \
  -H "Authorization: Bearer ANON_KEY"

# Check trigger logs
SELECT * FROM pg_stat_user_functions WHERE funcname LIKE 'on_message%';
```

---

## ✅ Deployment Checklist

- [ ] Schema deployed (5 tables + triggers exist)
- [ ] Test users created (alice + bob)
- [ ] Profiles linked to users
- [ ] Match created between alice + bob
- [ ] .env.local configured
- [ ] App starts without errors
- [ ] Login works
- [ ] Swipe shows blurred photo (🌫️)
- [ ] Sending messages increments counter
- [ ] Status changes after threshold (day1→day2→day3)
- [ ] Social request appears on day3
- [ ] RLS policies enabled
- [ ] Realtime enabled
- [ ] Ready for production! 🚀

---

## Support

If something breaks:
1. Check [Deployment Troubleshooting](./DEPLOYMENT_GUIDE.md#troubleshooting)
2. Run verification queries in SQL Editor
3. Check browser console for errors (`npm start`)
4. Check Supabase logs in Dashboard > Logs
