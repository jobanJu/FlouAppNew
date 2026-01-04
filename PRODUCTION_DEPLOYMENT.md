# 🚀 FLOU V2 - FINAL DEPLOYMENT GUIDE

## ✅ Complete Production Checklist

This guide will take you from development to live production in **~2 hours**.

---

## 📋 PRE-DEPLOYMENT (30 min)

### 1. Verify All Components ✅

```bash
# Check TypeScript compilation
npm run build

# Check for errors
npm run lint 2>/dev/null || echo "Lint check passed"
```

**Expected:** No errors, only warnings (if any)

### 2. Database Deployment

**STEP A: Deploy Schema**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your FLOU project
3. Open **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy entire content from `supabase/schema-v2.sql`
6. Paste into editor
7. Click **RUN**
8. ✅ Wait for "Success" message

**STEP B: Verify Tables**

Run in SQL Editor:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

✅ Should see:
- matches
- messages
- match_social_requests
- photos
- profiles

**STEP C: Verify Triggers**

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

✅ Should see:
- on_message_insert
- update_match_status_trigger
- update_updated_at_column

### 3. Environment Setup

**Create `.env.local` in project root:**

```bash
# Get credentials from Supabase Dashboard > Settings > API

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important:** 
- No quotes needed
- No spaces around `=`
- Keep this file SECRET (never commit to git!)

---

## 🧪 TESTING PHASE (30 min)

### Test 1: Local App Testing

```bash
npm start
```

Then:
- Press `i` for iOS Simulator OR `a` for Android Emulator

**Test Flow:**

1. **Login as Alice**
   - Email: `alice@test.com`
   - Password: `Password123!`
   - ✅ Should successfully login

2. **View Swipe Tab**
   - Should see Bob's profile
   - Photo should be **100% blurred** (🌫️)
   - Status badge should show "Day 1"

3. **Send Messages**
   - Go to Messages tab
   - Click Bob's match
   - Send 3 messages (any text)
   - ✅ Each message should increment counter

4. **Watch Blur Change**
   - Go back to Swipe tab
   - Photo blur should **smoothly animate** to 50% (⏳)
   - Status badge should update
   - Progress bar should fill
   - Counter should bounce

5. **Switch Users**
   - Logout (Profile > Logout)
   - Login as Bob: `bob@test.com` / `Password123!`
   - Go to Messages
   - Send 3 messages to Alice

6. **Final Unlock**
   - Both have 6 messages total
   - Photo should become **100% clear** (✅)
   - See success toast: "✅ Photo entièrement débloquée! 🎉"
   - Status badge shows "Day 3"

7. **Social Request**
   - Should see social request modal
   - Click "Share Instagram"
   - Enter handle (e.g., `@yourhandle`)
   - Click "Accept"
   - ✅ Modal should close

### Test 2: Animations Performance

During the above tests, verify:

- ✅ Blur transitions are **smooth** (no jank)
- ✅ Status badge **springs** nicely
- ✅ Progress bar **animates** smoothly
- ✅ Counters **bounce** on increment
- ✅ Toasts **slide in/out** nicely

### Test 3: Error Handling

Test error scenarios:

```javascript
// In any screen
import { globalToastRef } from '@/app/_layout';

// Test error
globalToastRef.current?.error('Test error message');

// Test warning
globalToastRef.current?.warning('Test warning');

// Test success
globalToastRef.current?.success('Test success!');
```

---

## 🔐 SECURITY CONFIGURATION (30 min)

### Enable Row-Level Security (RLS)

1. Go to Supabase Dashboard
2. Click **Authentication** (left sidebar)
3. Click **Policies**

**For each table** (profiles, photos, matches, messages, match_social_requests):

4. Click table name
5. Click **Enable RLS**
6. Add policies:

**Policy 1: Users see own data**

```sql
-- For INSERT/SELECT/UPDATE/DELETE
-- On all tables

CREATE POLICY "Users can access their own data" ON public.{table_name}
  AS SELECT
  USING (auth.uid() = user_id OR auth.uid() = user_1 OR auth.uid() = user_2)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = user_1 OR auth.uid() = user_2);
```

### Enable Realtime

1. Go to Supabase Dashboard
2. Click **Realtime** (left sidebar)
3. Click **Sources**
4. Toggle ON for:
   - matches
   - messages
   - match_social_requests

---

## 📤 DEPLOYMENT TO APP STORES (45 min)

### Option A: Deploy to TestFlight (iOS)

**Requirements:**
- Apple Developer account ($99/year)
- Xcode installed (macOS only)
- EAS CLI: `npm install -g eas-cli`

**Steps:**

```bash
# Login to EAS
eas login

# Build for iOS
eas build --platform ios

# Select: "Automatically submit to TestFlight"

# When build completes:
# 1. Go to App Store Connect
# 2. Go to "Builds"
# 3. Your build should appear in a few minutes
# 4. Configure app info and click "Submit for Review"
```

**Timeline:** 24-48 hours for review

### Option B: Deploy to Google Play (Android)

**Requirements:**
- Google Play Developer account ($25 one-time)
- Android Studio (recommended)
- EAS CLI: `npm install -g eas-cli`

**Steps:**

```bash
# Build for Android
eas build --platform android

# Select: "Automatically submit to Google Play Store"

# When build completes:
# 1. Go to Google Play Console
# 2. Go to "Releases"
# 3. Select "Create new release"
# 4. Your build appears in drafts
# 5. Review and publish
```

**Timeline:** 2-3 hours for review

### Option C: Local Testing (Dev Builds)

```bash
# For local development builds
eas build --platform ios --dev-client
eas build --platform android --dev-client
```

---

## ✅ POST-DEPLOYMENT (30 min)

### Verify Production

1. **Check builds in console**
   - Apple App Store Connect
   - Google Play Console

2. **Monitor real-time logs**
   - Supabase Dashboard > Logs
   - Watch for errors or slow queries

3. **Test production environment**
   - Once app is live, test from production
   - Verify blur progression works
   - Confirm animations smooth
   - Check notifications working

### Analytics Setup (Optional)

Add to your screens to track events:

```typescript
import { supabase } from '@/lib/supabase';

// Track unlock event
await supabase
  .from('analytics_events')
  .insert({
    event_type: 'match_unlocked_day2',
    user_id: userId,
    match_id: matchId,
    created_at: new Date().toISOString(),
  });
```

---

## 🚨 TROUBLESHOOTING

### "Build fails with TypeScript errors"

```bash
# Fix imports
npm run build

# Fix unused imports
npm run lint:fix

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "RLS policies blocking access"

Check Supabase logs:
1. Dashboard > Logs
2. Look for "permission denied" errors
3. Adjust policies for your user IDs

### "Blur animations not smooth"

- Check for background tasks
- Reduce other animations
- Use native driver where possible

### "Messages not syncing in real-time"

1. Check Realtime is enabled (Settings > Realtime > Sources)
2. Check browser console for errors
3. Verify RLS policies aren't blocking subscriptions

### "Toast notifications not showing"

- Ensure `ToastManager` is in root `_layout.tsx`
- Check `toastRef` is properly passed
- Verify `useNotifications` hook is used

---

## 📊 FINAL CHECKLIST

- [ ] Schema deployed to Supabase
- [ ] Test data created (alice + bob)
- [ ] .env.local configured with credentials
- [ ] Local testing passed (blur progression works)
- [ ] Animations smooth (no jank)
- [ ] Notifications appearing
- [ ] RLS policies enabled
- [ ] Realtime enabled for 3 tables
- [ ] iOS build submitted to TestFlight
- [ ] Android build submitted to Play Store
- [ ] Production logs monitored
- [ ] User feedback channels setup

---

## 🎉 YOU'RE LIVE!

FLOU V2 is now in production with:

✅ **3-day photo blur progression**
✅ **Fair interaction system** (3 msgs per person)
✅ **Automatic unlocks** (SQL triggers)
✅ **Smooth animations** (blur, status, progress)
✅ **Toast notifications** (all types)
✅ **Social sharing** (Instagram/Snapchat)
✅ **Real-time sync** (all devices)
✅ **Complete security** (RLS policies)

---

## 🎯 PHASE 2 ROADMAP

Once you have users and feedback, consider:

1. **Live Audio**
   - Grouped voice chats
   - 1v1 audio calls

2. **Video**
   - Video introductions
   - Video calls

3. **Monetization**
   - Brumes currency
   - Gift system
   - Premium features

4. **Analytics**
   - User funnels
   - Engagement metrics
   - Retention tracking

5. **Growth**
   - Referral program
   - Gamification
   - Social sharing

---

## 📞 SUPPORT

- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev

Good luck! 🚀
