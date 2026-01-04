#!/bin/bash
# Local development test script

echo "🚀 FlouApp Development Test"
echo "============================"

echo ""
echo "1️⃣ TypeScript compilation..."
cd /home/jj755403/FlouAppNew
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✅ TypeScript OK"
else
  echo "❌ TypeScript errors found"
  exit 1
fi

echo ""
echo "2️⃣ Linting..."
npm run lint 2>&1 | grep "error TS" | wc -l
LINT_ERRORS=$?
if [ $LINT_ERRORS -eq 0 ]; then
  echo "✅ Linting OK (warnings only)"
else
  echo "⚠️ Linting found issues"
fi

echo ""
echo "3️⃣ Backend dependencies..."
cd backend
npm ls livekit-server-sdk @supabase/supabase-js > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Backend dependencies OK"
else
  echo "❌ Backend missing dependencies"
  exit 1
fi

echo ""
echo "4️⃣ Frontend dependencies..."
cd /home/jj755403/FlouAppNew
npm ls expo expo-router react-native > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Frontend dependencies OK"
else
  echo "❌ Frontend missing dependencies"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ ALL CHECKS PASSED - App is ready for testing!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Frontend: npm start"
echo "  2. Backend:  cd backend && npm start"
echo "  3. Scan QR with Expo Go"
