#!/bin/bash

# 🚀 FLOU V2 DEPLOYMENT CHECKLIST
# Copy paste this to track your deployment progress!

echo "
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║          🎯 FLOU V2 - DEPLOYMENT CHECKLIST (Production Ready)            ║
║                                                                           ║
║                 Follow these steps in order. ~2 hours total.             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════
PHASE 1: DATABASE DEPLOYMENT (5 minutes)
═══════════════════════════════════════════════════════════════════════════

[ ] STEP 1.1: Go to Supabase Dashboard
    URL: https://app.supabase.com
    
[ ] STEP 1.2: Select your FLOU project
    
[ ] STEP 1.3: Open SQL Editor (left sidebar)
    
[ ] STEP 1.4: Click 'New Query'
    
[ ] STEP 1.5: Copy entire content from:
    File: supabase/schema-v2.sql
    
[ ] STEP 1.6: Paste into SQL Editor
    
[ ] STEP 1.7: Click 'RUN' button
    ✓ Expected: \"Success\" message
    ✓ Expected: 347 lines executed
    
[ ] STEP 1.8: Verify tables created
    Run in SQL Editor:
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name;
    
    ✓ Should see:
      - matches
      - messages
      - match_social_requests
      - photos
      - profiles

═══════════════════════════════════════════════════════════════════════════
PHASE 2: CREATE TEST DATA (5 minutes)
═══════════════════════════════════════════════════════════════════════════

[ ] STEP 2.1: In SQL Editor, create new query
    
[ ] STEP 2.2: Copy entire content from:
    File: supabase/test-data.sql
    
[ ] STEP 2.3: Paste into SQL Editor
    
[ ] STEP 2.4: Click 'RUN' button
    ✓ Expected: \"Success\" message
    ✓ Expected: Test users created
    
[ ] STEP 2.5: Verify test users
    Run in SQL Editor:
    SELECT id, email FROM auth.users WHERE email LIKE '%@test.com';
    
    ✓ Should see:
      - alice@test.com
      - bob@test.com

[ ] STEP 2.6: Verify test profiles
    Run in SQL Editor:
    SELECT id, username, age, bio FROM public.profiles 
    WHERE username LIKE '%_test' ORDER BY username;
    
    ✓ Should see:
      - alice_test, 24 years old
      - bob_test, 26 years old

[ ] STEP 2.7: Verify test match
    Run in SQL Editor:
    SELECT id, status, created_at FROM public.matches LIMIT 1;
    
    ✓ Should see:
      - 1 match with status='day1'

═══════════════════════════════════════════════════════════════════════════
PHASE 3: ENVIRONMENT CONFIGURATION (2 minutes)
═══════════════════════════════════════════════════════════════════════════

[ ] STEP 3.1: Create .env.local file in project root
    Command: touch .env.local
    
[ ] STEP 3.2: Get Supabase credentials
    Go to: Supabase Dashboard > Settings > API
    
[ ] STEP 3.3: Copy Project URL
    Format: https://your-project-id.supabase.co
    
[ ] STEP 3.4: Copy Anon Key
    Format: eyJhbGc... (long string)
    
[ ] STEP 3.5: Add to .env.local
    Content:
    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    
    ⚠️  DO NOT include any spaces or quotes!
    
[ ] STEP 3.6: Save file
    Command: Ctrl+S (or Cmd+S on Mac)

═══════════════════════════════════════════════════════════════════════════
PHASE 4: START APPLICATION (1 minute)
═══════════════════════════════════════════════════════════════════════════

[ ] STEP 4.1: Open terminal in project root
    
[ ] STEP 4.2: Run npm start
    Command: npm start
    
[ ] STEP 4.3: Wait for Expo to load
    ✓ You should see QR code in terminal
    
[ ] STEP 4.4: Select your platform
    Press 'i' for iOS Simulator
    Press 'a' for Android Emulator
    
[ ] STEP 4.5: Wait for app to launch
    ✓ Should see FLOU splash screen

═══════════════════════════════════════════════════════════════════════════
PHASE 5: TEST THE BLUR PROGRESSION (15 minutes)
═══════════════════════════════════════════════════════════════════════════

TEST 5.1: Day 1 - Initial Blur (🌫️)
  [ ] Login as Alice
      Email: alice@test.com
      Password: Password123!
      
  [ ] Navigate to Swipe tab
      ✓ You should see Bob's profile
      ✓ Photo should be 100% blurred (🌫️)
      ✓ Status badge should show \"Day 1\"
      
  [ ] Go to Messages tab
      ✓ Match with Bob should appear
      ✓ Empty conversation (no messages yet)

TEST 5.2: Send Messages - Trigger Day 2 Unlock (⏳)
  [ ] In Messages tab, click on Bob's match
      
  [ ] Send 3 messages (any text is fine)
      Message 1: ✓
      Message 2: ✓
      Message 3: ✓ TRIGGER FIRES!
      
  [ ] Verify counter in database
      SQL: SELECT messages_count_user_1, status FROM matches WHERE user_1='...';
      ✓ messages_count_user_1 should be 3
      ✓ status should still be 'day1' (waiting for Bob)
      
  [ ] Go back to Swipe tab
      ✓ Photo blur should DECREASE to 50% (⏳)
      ✓ Status badge should show \"Day 2 (Waiting for Bob)\"

TEST 5.3: Switch User & Send Messages
  [ ] Logout
      Go to Profile > Logout
      
  [ ] Login as Bob
      Email: bob@test.com
      Password: Password123!
      
  [ ] Navigate to Messages
      ✓ Match with Alice should appear
      ✓ Should see Alice's 3 messages
      
  [ ] Send 3 messages back
      Message 1: ✓
      Message 2: ✓
      Message 3: ✓ TRIGGER FIRES AGAIN!
      
  [ ] Verify both counters updated
      SQL: SELECT messages_count_user_1, messages_count_user_2, status, 
                  day2_unlocked_at, day3_unlocked_at FROM matches LIMIT 1;
      ✓ messages_count_user_1 = 3 (Alice)
      ✓ messages_count_user_2 = 3 (Bob)
      ✓ status should be 'day3' ← Auto-upgraded by trigger!
      ✓ day2_unlocked_at should have timestamp
      ✓ day3_unlocked_at should have timestamp

TEST 5.4: Day 3 Unlock (✅)
  [ ] Go to Swipe tab
      ✓ Photo should be 0% blur (fully visible) ✅
      ✓ Status badge should show \"Day 3 (Unlocked!)\"
      
  [ ] Verify social request table
      SQL: SELECT * FROM match_social_requests WHERE status='pending';
      ✓ Should have 1 record
      ✓ social_platform should be 'instagram' or 'snapchat'

TEST 5.5: Social Request Modal (🎉)
  [ ] Go to Messages tab
      ✓ Should see modal or notification
      ✓ Modal should ask \"Share Instagram?\" or similar
      
  [ ] Click \"Accept\" or \"Share\"
      
  [ ] Enter Instagram handle
      Example: @bob_official
      
  [ ] Click \"Confirm\" or \"Send\"
      ✓ Modal should close
      ✓ Database should update
      
  [ ] Verify in database
      SQL: SELECT * FROM match_social_requests WHERE status='accepted';
      ✓ Should have 1 record
      ✓ social_handle should contain your Instagram handle
      ✓ answered_at should have timestamp

═══════════════════════════════════════════════════════════════════════════
PHASE 6: VERIFICATION & FINAL CHECKS (5 minutes)
═══════════════════════════════════════════════════════════════════════════

[ ] VERIFY: All triggers fired
    SQL: SELECT funcname, calls FROM pg_stat_user_functions 
         WHERE funcname LIKE 'on_message%';
    ✓ Should show 'calls' > 0
    
[ ] VERIFY: Realtime subscriptions working
    Browser console (F12): Look for \"Connected to realtime\"
    ✓ Should appear without errors
    
[ ] VERIFY: No TypeScript errors
    Terminal: Check for red errors
    ✓ Should only see \"npm start\" running
    
[ ] VERIFY: Photos loading
    Both Alice and Bob's profiles should show placeholder images
    ✓ Images should load within 2 seconds
    
[ ] VERIFY: Messages syncing
    When Bob sends message, Alice should see it in real-time
    ✓ No need to refresh or re-login
    
[ ] VERIFY: UI responsive
    Try different screen sizes
    ✓ Components should adapt
    
[ ] VERIFY: No crashes
    Perform full test flow twice
    ✓ No app restarts or freezes

═══════════════════════════════════════════════════════════════════════════
PHASE 7: PRODUCTION READINESS (Optional)
═══════════════════════════════════════════════════════════════════════════

[ ] Enable RLS Policies (Security)
    Go to: Supabase Dashboard > Authentication > Policies
    For each table: Enable RLS
    ✓ Users can only see their own data
    
[ ] Enable Realtime (Live updates)
    Go to: Supabase Dashboard > Realtime > Sources
    Enable for: matches, messages, match_social_requests
    
[ ] Backup Database
    Supabase Dashboard > Backups > Create Manual Backup
    
[ ] Setup Monitoring
    Supabase Dashboard > Logs > Monitor
    Watch for errors and slow queries
    
[ ] Plan Scaling
    As users grow, monitor:
    - Database connections
    - Realtime message throughput
    - Storage usage

═══════════════════════════════════════════════════════════════════════════
PHASE 8: TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Problem: \"Table does not exist\"
   ✓ Solution: Re-run schema-v2.sql in SQL Editor

❌ Problem: \"Permission denied\"
   ✓ Solution: Enable RLS policies for tables (Phase 7)

❌ Problem: \"Blur not changing on messages\"
   ✓ Solution: Check if on_message_insert trigger exists
   ✓ Verify messages_count in matches table

❌ Problem: \"No realtime updates\"
   ✓ Solution: Enable Realtime in Supabase > Realtime > Sources
   ✓ Check browser console for connection errors

❌ Problem: \"Login fails\"
   ✓ Solution: Verify .env.local has correct Supabase credentials
   ✓ Check if test users exist in auth.users table

❌ Problem: \"Photos don't load\"
   ✓ Solution: Images are placeholders - should load from placeholder.com
   ✓ Check internet connection

═══════════════════════════════════════════════════════════════════════════
✅ ALL TESTS PASSED! YOU'RE READY FOR PRODUCTION!
═══════════════════════════════════════════════════════════════════════════

Summary of what you've deployed:

  ✅ Database with 5 tables (profiles, photos, matches, messages, requests)
  ✅ SQL triggers for auto message counting & status unlocks
  ✅ RLS policies for security
  ✅ Test data (Alice + Bob + match)
  ✅ Frontend components (BlurredPhotoCard, SocialRequestModal)
  ✅ React hooks (useMatches, useSocialRequests)
  ✅ Realtime subscriptions (automatic UI updates)

System features:
  ✅ Photo blur progression (100% → 50% → 0%)
  ✅ Fair interaction (3 msgs per person per phase)
  ✅ Automatic unlocks (triggered by SQL)
  ✅ Real-time sync (across all devices)
  ✅ Social sharing (Instagram/Snapchat)
  ✅ Complete security (RLS policies)

Next steps:
  1. Test with more users (create more test profiles)
  2. Add animations (blur transitions, notifications)
  3. Connect payment system (Stripe for Brumes)
  4. Deploy to App Store & Google Play

═══════════════════════════════════════════════════════════════════════════

Questions? Check these files:
  - DEPLOY_INSTRUCTIONS.md (detailed deployment)
  - QUICK_START.md (quick reference)
  - supabase/schema-v2.sql (database comments)

Questions about the architecture?
  - All components are in components/ folder
  - All hooks are in hooks/ folder
  - All utilities are in lib/ folder
  - TypeScript types are inline

You're done! 🚀 Enjoy your dating app! 💜

═══════════════════════════════════════════════════════════════════════════
"
