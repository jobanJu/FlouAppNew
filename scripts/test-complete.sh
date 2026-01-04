#!/bin/bash

# 🧪 FLOU V2 - COMPLETE TESTING SCRIPT
# Tests everything before production deployment

set -e

echo "
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║              🧪 FLOU V2 - COMPLETE TESTING SUITE 🧪                      ║
║                                                                           ║
║                    Testing all features before production                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"

sleep 2

# ============================================================================
# PHASE 1: PRE-TEST CHECKS
# ============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 1: PRE-TEST VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Check all required files exist
echo "Checking required files..."

FILES=(
  "supabase/schema-v2.sql"
  "supabase/test-data.sql"
  "components/BlurredPhotoCard.tsx"
  "components/ToastManager.tsx"
  "components/AnimatedStatus.tsx"
  "hooks/useMatches.ts"
  "hooks/useNotifications.ts"
  "app/(tabs)/index.tsx"
  "app/(tabs)/messages.tsx"
  ".env.local"
)

MISSING=0
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "  ✅ $FILE"
  else
    echo "  ❌ $FILE (MISSING!)"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo "❌ Missing $MISSING file(s). Please create them first."
  exit 1
fi

echo ""
echo "✅ All required files found!"

# Check .env.local has credentials
echo ""
echo "Checking .env.local..."
if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env.local && grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
  echo "✅ .env.local configured"
else
  echo "❌ .env.local missing Supabase credentials!"
  echo "Please add:"
  echo "  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
  echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
  exit 1
fi

# ============================================================================
# PHASE 2: BUILD VERIFICATION
# ============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 2: BUILD VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Compiling TypeScript..."
if npm run build > /tmp/build.log 2>&1; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  tail -20 /tmp/build.log
  exit 1
fi

# Check for TypeScript errors
if grep -q "error TS" /tmp/build.log; then
  echo "❌ TypeScript errors found!"
  grep "error TS" /tmp/build.log
  exit 1
fi

echo "✅ No TypeScript errors!"

# ============================================================================
# PHASE 3: DATABASE VERIFICATION
# ============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 3: DATABASE VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "Please verify your database schema in Supabase:"
echo "  1. Go to: https://app.supabase.com"
echo "  2. Select your FLOU project"
echo "  3. Go to SQL Editor"
echo "  4. Run this query:"
echo ""
echo "     SELECT table_name FROM information_schema.tables"
echo "     WHERE table_schema = 'public' ORDER BY table_name;"
echo ""
echo "  You should see: matches, messages, match_social_requests, photos, profiles"
echo ""
echo "  5. Then run:"
echo ""
echo "     SELECT trigger_name FROM information_schema.triggers"
echo "     WHERE trigger_schema = 'public';"
echo ""
echo "  You should see: on_message_insert, update_match_status_trigger, update_updated_at_column"
echo ""

read -p "Press Enter when schema verification is complete..."

# ============================================================================
# PHASE 4: START APPLICATION
# ============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 4: STARTING APPLICATION"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Starting npm development server..."
echo ""
echo "⚠️  MANUAL TESTING:"
echo ""
echo "When the app loads in simulator:"
echo ""
echo "TEST 1: Login"
echo "  ├─ Email: alice@test.com"
echo "  ├─ Password: Password123!"
echo "  └─ ✅ Should login successfully"
echo ""
echo "TEST 2: Swipe Tab"
echo "  ├─ Go to Swipe/Home tab"
echo "  ├─ Should see Bob's profile"
echo "  ├─ Photo should be 🌫️ (100% blurred)"
echo "  └─ Status badge should show 'Day 1'"
echo ""
echo "TEST 3: Message Animations"
echo "  ├─ Go to Messages tab"
echo "  ├─ Send 3 messages to Bob"
echo "  ├─ Each message should:"
echo "  │  ├─ Increment counter (with bounce animation)"
echo "  │  └─ Appear in real-time"
echo "  └─ ✅ Progress bar should fill to 50%"
echo ""
echo "TEST 4: Blur Transition"
echo "  ├─ Go back to Swipe tab"
echo "  ├─ Photo blur should smoothly animate to 50%"
echo "  ├─ Status badge should become ⏳"
echo "  ├─ Progress bar should show in bottom area"
echo "  └─ ✅ Watch the animation - should be smooth!"
echo ""
echo "TEST 5: Switch Users"
echo "  ├─ Logout (Profile > Logout)"
echo "  ├─ Login as bob@test.com / Password123!"
echo "  ├─ Go to Messages"
echo "  ├─ Send 3 messages to Alice"
echo "  └─ ✅ Counters should animate (bounce)"
echo ""
echo "TEST 6: Final Unlock"
echo "  ├─ Go to Swipe tab"
echo "  ├─ Photo should fully clear (0% blur) ✅"
echo "  ├─ Status badge should show 'Day 3'"
echo "  ├─ Should see success toast: '✅ Photo entièrement débloquée! 🎉'"
echo "  └─ ✅ All animations smooth!"
echo ""
echo "TEST 7: Social Request"
echo "  ├─ Messages tab should show social request modal"
echo "  ├─ Click 'Share Instagram'"
echo "  ├─ Enter handle (e.g., @yourhandle)"
echo "  ├─ Click 'Accept'"
echo "  └─ ✅ Modal should close smoothly"
echo ""
echo "TEST 8: Check Animations"
echo "  ├─ Blur transition: Should be smooth (600ms)"
echo "  ├─ Status badge: Should spring/bounce"
echo "  ├─ Progress bar: Should animate width"
echo "  ├─ Counters: Should bounce on change"
echo "  ├─ Toasts: Should slide in from top"
echo "  └─ ✅ No jank, 60fps smooth!"
echo ""

echo "Starting app... (Press Ctrl+C when done testing)"
echo ""

npm start
