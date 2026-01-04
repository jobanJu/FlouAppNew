# 🎯 FlouApp - Getting Started

**Status**: ✅ Ready for Development

---

## 📋 What's Included

### ✅ Frontend (Expo/React Native)
- Expo Router file-based routing
- TypeScript with strict mode
- Glassmorphism UI components
- Supabase integration (auth, real-time)
- LiveKit video streaming client
- All compilation & linting checks pass

### ✅ Backend (Express)
- Supabase Edge Functions (Deno)
- LiveKit token generation endpoint (`/api/livekit/token`)
- Environment-based configuration
- CORS enabled

### ✅ CI/CD
- GitHub Actions workflow: `supabase-deploy.yml`
- Auto-deploys DB schema + Edge Functions on push
- Tested and verified ✓

---

## 🚀 Quick Start

### 1. **Environment Setup**

Create `.env` at project root:
```env
# Frontend
EXPO_PUBLIC_SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
EXPO_PUBLIC_LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud

# Backend (create .env.local in backend/)
SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud
LIVEKIT_API_KEY=<your_api_key>
LIVEKIT_API_SECRET=<your_api_secret>
```

### 2. **Start Frontend** (Terminal 1)
```bash
npm install
npm start
```
Then scan QR code with Expo Go (iOS/Android).

### 3. **Start Backend** (Terminal 2)
```bash
cd backend
npm install
npm start
```
Backend runs on `http://localhost:3001` (or PORT env var).

### 4. **Test Everything**
```bash
bash scripts/test-app.sh
```
All checks should pass ✅

---

## 🏗️ Architecture

### Routes (Frontend - Expo Router)
```
app/
├── _layout.tsx          # Auth/Onboarding gate
├── onboarding.tsx       # Onboarding flow
├── live-room.tsx        # LiveKit video room
├── (auth)/
│   ├── login.tsx
│   └── signup.tsx
├── (tabs)/
│   ├── index.tsx        # Discover/Swiping
│   ├── messages.tsx     # Chat list
│   ├── live.tsx         # Live rooms
│   └── profile.tsx      # User profile
├── chat/[id].tsx        # Chat detail
└── profile/[id].tsx     # Profile detail
```

### Backend Routes
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/livekit/token` | Generate LiveKit access token |
| POST | Supabase Edge Function | Match status updates (triggered on message) |

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root auth routing logic |
| `lib/supabase.ts` | Supabase client init |
| `hooks/useAuth.ts` | Authentication pattern |
| `constants/theme.ts` | Design system (colors, typography) |
| `components/GlassCard.tsx` | Glassmorphism card component |
| `.github/workflows/supabase-deploy.yml` | CI/CD automation |
| `backend/livekit-token.js` | LiveKit token endpoint |
| `supabase/functions/update-match-status/` | Edge function (Deno) |

---

## 🔐 Security Notes

- **Never commit** `.env`, `.env.local`, or keys
- **Service Role Key** is server-side only (in backend `.env.local`)
- **Anon Key** is client-side (in frontend `.env`)
- **LiveKit Secrets** must stay on backend
- Rotate keys if ever exposed

---

## 🧪 Testing

### TypeScript Check
```bash
npx tsc --noEmit
```

### ESLint
```bash
npm run lint
```

### Full App Test
```bash
bash scripts/test-app.sh
```

---

## 🛠️ Development Workflow

1. **Make code changes**
2. **Run tests**: `bash scripts/test-app.sh`
3. **Commit**: `git commit -m "feat: ..."`
4. **Push**: `git push origin main`
   - ✅ CI auto-deploys Supabase schema + functions

---

## 📱 Deployment

### Expo Production Build
```bash
eas build --platform all
eas submit --platform all
```

### Supabase Production
- DB schema auto-synced via CI/CD
- Edge functions auto-deployed on push
- Change secrets if needed (rotate keys)

---

## 🆘 Troubleshooting

### App won't start
```bash
npm install
npx expo prebuild --clean
npm start
```

### Backend won't connect
- Check `.env.local` has all keys
- Verify Supabase project is active
- Test endpoint: `curl http://localhost:3001/api/hello`

### Supabase login fails in CI
- Verify `SUPABASE_ACCESS_TOKEN` is a Personal Access Token (format: `sbp_...`)
- Not a JWT or service role key

### LiveKit token fails
- Ensure `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are correct
- Verify room name doesn't exceed 64 characters

---

## 📖 Documentation

- [Copilot Instructions](./.github/copilot-instructions.md) - AI agent guidance
- [Supabase Integration](./LIVEKIT_INTEGRATION.md) - LiveKit setup
- [Deployment Guide](./PRODUCTION_DEPLOYMENT.md) - Production steps

---

## 🎯 Next Steps

1. **Test Onboarding Flow** - Verify sign-up → match creation works
2. **Test Swiping** - UI responds to matches  
3. **Test Chat** - Real-time messages update
4. **Test LiveKit Video** - Token endpoint generates valid tokens
5. **Test Edge Functions** - Match status updates on 3+ messages

---

**Happy coding! 🚀**
