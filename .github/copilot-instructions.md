# FlouApp - AI Copilot Instructions

## 🎯 Project Overview

FlouApp is a React Native dating/social discovery app built with **Expo 54** + **TypeScript**, connecting users through swiping, live video, real-time chat, and group sessions. The app uses a **three-day matching system** where users progressively unlock features (Day 1: match, Day 2-3: more features).

**Key Constraint**: This is a single-codebase Expo/React Native project (no separate backend repo). All backend services (Supabase, LiveKit, Stripe) are configured via environment variables.

---

## 🏗️ Architecture Essentials

### File-Based Routing (Expo Router)
```
app/
  _layout.tsx              # Root layout (auth/onboarding gate)
  onboarding.tsx           # Initial onboarding
  live-room.tsx            # LiveKit video room
  (auth)/                  # Auth screens (login, signup)
  (tabs)/
    _layout.tsx            # Tab navigation (4 main tabs)
    index.tsx              # Home/Discover (main swiping)
    messages.tsx           # Message list
    live.tsx               # Live streaming rooms
    profile.tsx            # User profile
  chat/[id].tsx            # Detailed chat by match ID
  profile/[id].tsx         # User profile by ID
```

**Navigation Flow**: User is routed based on:
1. Auth status (checked in `_layout.tsx` via `useAuth()`)
2. Onboarding completion (stored in AsyncStorage key `flou_onboarding_complete`)
3. Active tab/screen (Expo Router handles file → route mapping)

### Three-Day Match System
- **Day 1**: Initial match (just after swipe)
- **Day 2**: Unlocked after messages sent or time elapsed (`day2_unlocked_at` in DB)
- **Day 3**: Further unlocked features
- **Status field**: `'day1' | 'day2' | 'day3' | 'unmatched' | 'blocked'` in `matches` table

### Data Flow
```
Supabase (DB) ← → useAuth() → Root Layout → Tab Navigation
     ↓
  Hooks (useMatches, useMessages, useLiveKit)
     ↓
  Components (GlassCard, etc.) + Supabase Realtime subscriptions
```

---

## 🔑 Core Hooks (Data Management)

All hooks are in `hooks/` and follow a pattern: **load data + subscribe to Realtime changes**.

| Hook | Purpose | Key Returns |
|------|---------|-------------|
| `useAuth()` | Auth state & sign-out | `{ user, loading, signOut }` |
| `useMatches(userId)` | Fetch matches with subscriptions | `{ matches, loading, error }` |
| `useMessages(matchId)` | Fetch & stream messages | `{ messages, loading, sendMessage }` |
| `useLiveKit()` | Generate LiveKit tokens via backend API | `{ generateToken, loading }` |
| `useNotifications(userId)` | Subscribe to push notifications | `{ notifications, markRead }` |
| `useSocialRequests(userId)` | Social requests (follows, etc.) | `{ requests, accept, reject }` |
| `useOnboarding()` | Onboarding form state | `{ form, setForm, submit }` |

**Pattern**: Each hook manages its own Supabase subscription cleanup in `useEffect` return.

---

## 🎨 Design System & Components

### Glassmorphism / Flou Design
- **Core Component**: [GlassCard.tsx](../../components/GlassCard.tsx) - wraps content in BlurView + semi-transparent overlay
- **Theme**: [constants/theme.ts](../../constants/theme.ts) defines colors, shadows, borders
- **Blur Intensity**: Default 40 (adjustable per component)
- **Use GlassCard** for: cards, modals, tab bar background (see [Tabs layout](../../app/(tabs)/_layout.tsx#L18))

### Layout Conventions
- `BlurView` from `expo-blur` for frosted-glass effect
- `GestureHandlerRootView` from `react-native-gesture-handler` wraps swipeable screens
- Tabs use bottom-absolute positioning (20px from bottom, 16px margins)

---

## 🚀 Development Workflow

### Local Setup
```bash
npm install
npm start                 # Starts Expo development server
# Scan QR with Expo Go (iOS/Android) or use: npm run ios / npm run android
```

### Environment Variables (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud
LIVEKIT_API_KEY=APIJZ8kdXvHxS4j
LIVEKIT_API_SECRET=KyLjPsROTeXbd294yoLNhI2dXCUwOZTLcGLg73RiqCd
BACKEND_URL=http://localhost:3000  # For token generation
```

### Testing & Debugging
- **Lint**: `npm run lint` (ESLint via Expo)
- **TypeScript**: `npx tsc --noEmit` (strict mode enabled in tsconfig.json)
- **Console**: Use `console.log()` for debugging (visible in Expo dev server logs)

---

## 🔗 Key Integration Points

### Supabase Realtime Subscriptions
```typescript
// Pattern from useMatches.ts
const { data: subscription } = supabase
  .channel('matches_channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'matches',
    filter: `user_1=eq.${userId}`
  }, (payload) => {
    // Handle updates
  })
  .subscribe();

// Always cleanup in useEffect return:
return () => subscription?.unsubscribe();
```

### LiveKit Token Generation
- Tokens must be generated from **backend** (never client-side)
- Endpoint: `{BACKEND_URL}/api/livekit/token`
- Hook [useLiveKit.ts](hooks/useLiveKit.ts) handles this
- Response: `{ token: string, url: string }`

### Stripe Payments
- Component: [components/stripe-button.tsx](components/stripe-button.tsx)
- Uses `@stripe/stripe-react-native` v0.50.3
- Integration via checkout sessions (created server-side)

---

## ⚠️ Project-Specific Patterns

### Onboarding State Management
- Completion stored in **AsyncStorage** (not Supabase profile yet)
- Key: `flou_onboarding_complete` → value: `'true'` | `'false'`
- This gates access to main app (checked in root `_layout.tsx`)

### Error Handling
- Network errors: Show toast notifications (use [ToastManager.tsx](components/ToastManager.tsx))
- Auth errors: Redirect to login via router
- Data not found: Graceful fallbacks (show empty states, not crashes)

### Import Path Aliases
```typescript
// Use @ for absolute imports (configured in tsconfig.json)
import { useAuth } from '@/hooks/useAuth';
import theme from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
```

---

## 📊 Database Schema Highlights

Critical tables:
- **profiles**: User data (photos, bio, interests)
- **matches**: Match relationships (with day1/day2/day3 status)
- **messages**: Chat messages with Realtime subscriptions
- **photos**: Blur images (progressive reveal by day)

RLS Policies: All tables enforce row-level security (users see only their data)

---

## 🛑 Common Pitfalls

1. **Forgetting Realtime cleanup**: Always unsubscribe in useEffect return
2. **Missing Auth checks**: Wrap Supabase queries with `if (!user) return`
3. **Environment variables**: Use `EXPO_PUBLIC_*` prefix for client-side access
4. **Navigation before state ready**: Wait for `navigationState?.key` before routing
5. **TypeScript strict mode**: All types must be explicit (no `any` unless justified)

---

## 📚 Key Files to Understand First

1. [app/_layout.tsx](app/_layout.tsx) - Auth & onboarding routing logic
2. [lib/supabase.ts](lib/supabase.ts) - Supabase client initialization
3. [hooks/useAuth.ts](hooks/useAuth.ts) - Authentication pattern
4. [hooks/useMatches.ts](hooks/useMatches.ts) - Realtime subscription pattern
5. [components/GlassCard.tsx](components/GlassCard.tsx) - Design system example
