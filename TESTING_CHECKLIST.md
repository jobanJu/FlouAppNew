# 🧪 FLOU V2 - TESTING CHECKLIST

## Before You Start
- [ ] Database schema deployed to Supabase ✅
- [ ] Test data created (alice + bob) ✅
- [ ] .env.local configured with credentials ✅
- [ ] All components built without errors ✅

---

## Test Session Setup

```bash
# Make test script executable
chmod +x scripts/test-complete.sh

# Run complete test suite
./scripts/test-complete.sh
```

OR manually:

```bash
npm start
# Then press 'i' for iOS or 'a' for Android
```

---

## Test Flow (30 minutes)

### ✅ TEST 1: Authentication

**Step 1.1:** Splash screen appears
- [ ] FLOU logo visible
- [ ] App loads without crashing

**Step 1.2:** Login screen
- [ ] Email field accepts input
- [ ] Password field hides characters
- [ ] Login button clickable

**Step 1.3:** Login as Alice
- [ ] Email: `alice@test.com`
- [ ] Password: `Password123!`
- [ ] Click "Login"
- [ ] ✅ Should successfully login

**Step 1.4:** Verify navigation
- [ ] Bottom tabs visible
- [ ] Can switch between tabs

---

### ✅ TEST 2: Swipe Screen Initial State

**Step 2.1:** Go to Swipe/Home tab
- [ ] Tab button highlights
- [ ] Screen loads

**Step 2.2:** Profile card visible
- [ ] Profile card appears
- [ ] Image loads (placeholder or real)
- [ ] No errors in console

**Step 2.3:** Check blur level
- [ ] Photo appears **100% blurred** 🌫️
- [ ] Blur effect visible (frosted glass appearance)
- [ ] Not clear at all

**Step 2.4:** Check status badge
- [ ] Badge visible in top-right
- [ ] Badge shows emoji: 🌫️
- [ ] Badge shows text: "Day 1"
- [ ] Badge color is orange/yellow

**Step 2.5:** Check progress bar
- [ ] Progress bar visible at bottom
- [ ] Shows 0% filled
- [ ] Gray background visible

---

### ✅ TEST 3: Messages & Counters

**Step 3.1:** Go to Messages tab
- [ ] Messages screen loads
- [ ] Bob's match visible in list
- [ ] No errors

**Step 3.2:** Open message chat
- [ ] Click on Bob's match
- [ ] Chat screen opens
- [ ] Previous messages visible (if any)

**Step 3.3:** Send first message
- [ ] Type a message (e.g., "Hello!")
- [ ] Click send button
- [ ] Message appears in chat
- [ ] ✅ Counter shows "1"

**Step 3.4:** Counter Animation
- [ ] Counter **bounces** when incrementing
- [ ] Scale animation visible (grows + shrinks)
- [ ] Color: RED (because < 3)

**Step 3.5:** Send 2nd message
- [ ] Type and send another message
- [ ] ✅ Counter shows "2"
- [ ] Counter bounces again
- [ ] Color still RED

**Step 3.6:** Send 3rd message (THRESHOLD!)
- [ ] Type and send 3rd message
- [ ] ✅ Counter shows "3"
- [ ] Counter bounces with more energy
- [ ] **Monitor: Toast notification**
  - [ ] Should appear: "⏳ Status Day 2 débloqué!"
  - [ ] Green toast slides in from top
  - [ ] Toast auto-dismisses after 3 seconds

---

### ✅ TEST 4: Blur Animation (Day 1 → Day 2)

**Step 4.1:** Go back to Swipe tab
- [ ] Click Swipe/Home tab
- [ ] Profile card still visible

**Step 4.2:** Watch blur change
- [ ] Photo blur **smoothly decreases**
- [ ] Animation duration ~600ms
- [ ] **Should look smooth**, not jerky
- [ ] Blur transitions from 100% → 50%

**Step 4.3:** Check blur level
- [ ] Photo now **50% blurred** ⏳
- [ ] Silhouette visible but not clear
- [ ] Frosted glass effect at 50%

**Step 4.4:** Check status badge
- [ ] Badge emoji changed: 🌫️ → ⏳
- [ ] Badge text: "Day 2"
- [ ] Badge color changed: Orange → Blue
- [ ] **Animation:** Badge should spring/bounce (scale animation)

**Step 4.5:** Check progress bar
- [ ] Progress bar **animated** to ~50%
- [ ] Fill animation smooth
- [ ] Both users at 3 messages each

---

### ✅ TEST 5: Switch to Bob & Continue

**Step 5.1:** Logout
- [ ] Go to Profile tab
- [ ] Click "Logout" button
- [ ] Confirm logout
- [ ] Return to login screen

**Step 5.2:** Login as Bob
- [ ] Email: `bob@test.com`
- [ ] Password: `Password123!`
- [ ] Click "Login"
- [ ] Successfully login

**Step 5.3:** Go to Messages
- [ ] Messages tab loads
- [ ] Alice's match visible
- [ ] **Should see Alice's 3 messages**

**Step 5.4:** Send 3 messages
- [ ] Send message 1
  - [ ] Counter shows "1"
  - [ ] Bounces (RED)
- [ ] Send message 2
  - [ ] Counter shows "2"
  - [ ] Bounces (RED)
- [ ] Send message 3
  - [ ] Counter shows "3"
  - [ ] Bounces (RED)
  - [ ] ✅ Should see toast: "⏳ Status Day 2 débloqué!"

**Step 5.5:** Check counter colors
- [ ] After each message, counter bounces
- [ ] Color progression:
  - [ ] 0-2: RED
  - [ ] 3: YELLOW (threshold reached!)
  - [ ] 4-6: GREEN

---

### ✅ TEST 6: Full Unlock (Day 2 → Day 3)

**Step 6.1:** Go to Swipe tab
- [ ] Profile card visible
- [ ] Photo still at 50% blur

**Step 6.2:** Watch for blur changes
- [ ] Wait for realtime update
- [ ] Photo blur should **smoothly animate** → 0%
- [ ] Transition should be **smooth**, not jerky
- [ ] Takes ~600ms

**Step 6.3:** Final blur state
- [ ] Photo is now **100% clear** ✅
- [ ] No blur effect
- [ ] Image fully visible

**Step 6.4:** Check status badge
- [ ] Badge emoji: ✅
- [ ] Badge text: "Day 3"
- [ ] Badge color: GREEN
- [ ] **Animation:** Spring/bounce on change

**Step 6.5:** Check toast notification
- [ ] Should see: "✅ Photo entièrement débloquée! 🎉"
- [ ] Green success toast
- [ ] Auto-dismisses

**Step 6.6:** Check progress bar
- [ ] Should be 100% filled
- [ ] Shows "100%" label
- [ ] Animated to full width

---

### ✅ TEST 7: Social Request

**Step 7.1:** Go to Messages tab
- [ ] Should see modal or notification

**Step 7.2:** Social request modal
- [ ] Modal appears asking about sharing
- [ ] Shows Instagram icon (or text)
- [ ] Shows Snapchat icon (or text)

**Step 7.3:** Accept sharing
- [ ] Click "Share Instagram"
- [ ] Text input appears
- [ ] Enter handle (e.g., `@yourhandle`)
- [ ] Click "Confirm" or "Accept"
- [ ] Modal closes smoothly
- [ ] Modal animation smooth

---

### ✅ TEST 8: Animation Quality Check

During all tests above, verify:

**Blur Animations (Critical)**
- [ ] Smooth transitions (no sudden jumps)
- [ ] Duration ~600ms (not instant)
- [ ] No jank or stuttering
- [ ] Opacity fades smoothly with blur

**Status Badge (Critical)**
- [ ] Spring animation on change
- [ ] Scale: 0.8 → 1.0 bounce
- [ ] Opacity fade-in smooth
- [ ] Color change visible

**Progress Bar (Important)**
- [ ] Width animates smoothly
- [ ] Not instant (interpolated)
- [ ] Linear progression

**Counter Bounce (Important)**
- [ ] Bounces on every increment
- [ ] Scale animation: 1.0 → 1.2 → 1.0
- [ ] Smooth easing

**Toast Notifications (Important)**
- [ ] Slide in from top (animation)
- [ ] Slide out when dismissing
- [ ] Text readable
- [ ] Color appropriate to type

**Overall Performance (Critical)**
- [ ] No app freezes
- [ ] No lag when sending messages
- [ ] Smooth 60fps (no dropped frames)
- [ ] No memory leaks (app shouldn't slow down)

---

## Performance Metrics

During testing, open React Native debugger (if available):

**Expected Performance:**
- Blur animation: 600ms ✅
- Status badge: <300ms ✅
- Progress bar: 600ms ✅
- Message send: <500ms ✅
- Realtime update: <100ms ✅

If any animation takes >1000ms, it's too slow.

---

## Error Scenarios

Test error handling:

**Test 9.1:** Network error
- [ ] Close WiFi/4G
- [ ] Try to send message
- [ ] Should show error toast
- [ ] Error toast is RED

**Test 9.2:** Login error
- [ ] Try login with wrong password
- [ ] Should show error message
- [ ] Stays on login screen

**Test 9.3:** Logout
- [ ] Logout should work smoothly
- [ ] Navigate back to login

---

## Final Verification

### Database Check
Run in Supabase SQL Editor:

```sql
-- Check message counts
SELECT messages_count_user_1, messages_count_user_2, status
FROM matches LIMIT 1;

-- Expected: 3, 3, 'day3' (or whatever you tested)
```

### Expected Results:
- [ ] `messages_count_user_1` = 3
- [ ] `messages_count_user_2` = 3
- [ ] `status` = 'day3'
- [ ] `day2_unlocked_at` has timestamp
- [ ] `day3_unlocked_at` has timestamp

---

## Checklist Summary

### Functionality
- [ ] Login works
- [ ] View profile
- [ ] Send messages
- [ ] See message counters
- [ ] Blur progresses day1→2→3
- [ ] Social requests appear
- [ ] Accept social request

### Animations
- [ ] Blur transitions smooth
- [ ] Status badge springs
- [ ] Progress bar animates
- [ ] Counters bounce
- [ ] Toasts slide in/out

### Performance
- [ ] 60fps smooth
- [ ] No jank or stuttering
- [ ] No memory leaks
- [ ] Fast message send (<500ms)
- [ ] Fast realtime update (<100ms)

### Error Handling
- [ ] Error toasts appear
- [ ] Network errors handled
- [ ] Invalid inputs handled

### Database
- [ ] Counters increment correctly
- [ ] Status auto-transitions
- [ ] Timestamps set correctly
- [ ] RLS policies working

---

## Issues Found?

If any test fails:

1. **Note the issue** (step number + what failed)
2. **Screenshot** the error (if visible)
3. **Check logs:**
   ```bash
   # Terminal where you ran npm start
   # Look for red error messages
   ```
4. **Open browser dev tools** (usually F12)
   - Check console for errors
   - Check network tab for failed requests

5. **Common issues:**
   - ❌ Photos not loading → Check internet
   - ❌ Messages not syncing → Check Realtime enabled
   - ❌ Blur not animating → Check GPU rendering
   - ❌ Counters not incrementing → Check triggers exist
   - ❌ Status not changing → Check trigger logic

---

## Ready for Production?

When ALL tests pass:

- [ ] Functionality: ✅ 100%
- [ ] Animations: ✅ Smooth
- [ ] Performance: ✅ 60fps
- [ ] Errors: ✅ Handled
- [ ] Database: ✅ Correct data

**Then proceed to:**

1. Deploy to Supabase (production)
2. Build iOS (TestFlight)
3. Build Android (Play Store)
4. Submit to app stores
5. **SHIP IT!** 🚀

---

**Good luck with testing!** Let me know if you find any issues! 💜
