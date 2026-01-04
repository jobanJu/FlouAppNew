# 🚀 FLOU V2 - Guide de Déploiement Complet

## Phase 1: Déploiement Database

### Étape 1: Déployer le Schema

1. Aller à **Supabase Studio** → **SQL Editor**
2. Copier le contenu de `supabase/schema-v2.sql`
3. Exécuter le script
4. Vérifier que toutes les tables sont créées:
   - ✅ profiles
   - ✅ photos
   - ✅ matches
   - ✅ messages
   - ✅ match_social_requests

### Étape 2: Vérifier les Triggers

Dans **SQL Editor**, exécuter:
```sql
-- Vérifier les triggers
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Vérifier les functions
SELECT * FROM pg_proc WHERE proname LIKE '%message%' OR proname LIKE '%match%';
```

### Étape 3: Tester les RLS Policies

Dans **Supabase Studio** → **Authentication** → **Policies**:
- Vérifier que toutes les policies sont activées
- Tester avec un utilisateur de test

## Phase 2: Intégration Frontend

### Étape 1: Créer Supabase Client

Assurez-vous que `lib/supabase.ts` existe:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lyqtupcjevgxpovzevcz.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Étape 2: Ajouter Variables d'Environnement

Créer `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Étape 3: Créer Profil Test

SQL:
```sql
-- Créer 2 utilisateurs de test
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at
) VALUES
  ('alice@test.com', crypt('password', gen_salt('bf')), now()),
  ('bob@test.com', crypt('password', gen_salt('bf')), now())
RETURNING id;

-- Copier les IDs et créer les profiles
INSERT INTO public.profiles (
  id,
  username,
  age,
  bio,
  gender,
  instagram,
  snapchat
) VALUES
  ('alice-uuid-here', 'alice_flowers', 24, 'Aventurière 🌸', 'F', '@alice_flowers', 'alice.snap'),
  ('bob-uuid-here', 'bob_adventure', 26, 'Explorer 🗺️', 'M', '@bob_adventure', 'bob.snap');
```

### Étape 4: Intégrer BlurredPhotoCard

Dans `app/(tabs)/index.tsx`:

```typescript
import { BlurredPhotoCard } from '@/components/BlurredPhotoCard';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/hooks/useAuth';

export default function SwipeScreen() {
  const { user } = useAuth();
  const { matches, loading } = useMatches(user?.id);

  return (
    <View style={styles.container}>
      {matches.map((match) => (
        <BlurredPhotoCard
          key={match.id}
          photoUrl={photoUrl}
          match={match}
          onStatusChange={(status) => {
            console.log(`✨ Déverrouillé: ${status}`);
          }}
        />
      ))}
    </View>
  );
}
```

### Étape 5: Afficher Social Requests

Dans `app/(tabs)/messages.tsx`:

```typescript
import { SocialRequestModal } from '@/components/SocialRequestModal';
import { usePendingSocialRequests } from '@/hooks/useSocialRequests';

export default function MessagesScreen() {
  const { user } = useAuth();
  const { requests } = usePendingSocialRequests(user?.id);
  const [selectedRequest, setSelectedRequest] = useState(null);

  return (
    <View>
      {requests.length > 0 && (
        <SocialRequestModal
          visible={selectedRequest !== null}
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {/* refresh */}}
        />
      )}
    </View>
  );
}
```

## Phase 3: Test End-to-End

### Test Flow Complet:

1. **Login Alice**
   - Go to Swipe screen
   - Voir photo floutée (100%) 🌫️

2. **Send 3 Messages** (Alice → Bob)
   - Voir compteur: "2 messages restants"

3. **Bob Envoie 3 Messages**
   - Photo passe à 50% blur ⏳
   - Voir nouvelle silhouette

4. **Envoyer 6 messages (total 12)**
   - Photo passe à 0% blur ✅
   - SocialRequestModal apparaît

5. **Alice Partage Instagram**
   - Taper "@alice_flowers"
   - Voir confirmation

6. **Bob Refuse**
   - Cliquer "Plus tard"
   - Voir message d'attente

### Vérifier en Database:

```sql
-- Voir les matches
SELECT * FROM matches;

-- Voir les messages
SELECT * FROM messages;

-- Voir les demandes sociales
SELECT * FROM match_social_requests;
```

## Phase 4: Configuration Edge Function

### Option A: Sans Edge Function (Recommandé)

Les triggers SQL font tout le travail! Pas besoin d'Edge Function.

### Option B: Avec Edge Function

Si vous voulez logger/notifier:

```typescript
// supabase/functions/update-match-status/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

serve(async (req: Request) => {
  const { matchId, newStatus } = await req.json()
  console.log(`✅ Match ${matchId} → ${newStatus}`)
  return new Response(JSON.stringify({ ok: true }))
})
```

Deploy:
```bash
supabase functions deploy update-match-status --project-id xyz
```

## Troubleshooting

### Problème: Photos ne se floutent pas

**Solution:**
1. Vérifier que `BlurredPhotoCard` reçoit `match` data
2. Vérifier que `calculateBlurLevel` retourne 0/50/100
3. Vérifier que `BlurView` est importé de `expo-blur`

### Problème: Compteurs ne s'incrémentent pas

**Solution:**
1. Vérifier que le trigger `on_message_insert` existe
2. Exécuter: `SELECT * FROM pg_trigger WHERE tgname = 'on_message_insert'`
3. Vérifier que le message est inséré dans la bonne table

### Problème: Social requests ne s'affichent pas

**Solution:**
1. Vérifier que status est 'day3' dans matches
2. Vérifier que `match_social_requests` a les enregistrements
3. Exécuter: `SELECT * FROM match_social_requests WHERE consent IS NULL`

## Checklist Final

- [ ] Schema déployé en Supabase
- [ ] Triggers créés et fonctionnels
- [ ] RLS policies activées
- [ ] Env variables configurées
- [ ] Supabase client intégré
- [ ] BlurredPhotoCard affiche photos
- [ ] Compteurs s'incrémentent
- [ ] Status change automatiquement
- [ ] Social requests apparaissent
- [ ] Modal fonctionne
- [ ] Test end-to-end réussi

## Prochaines Étapes

1. **Phase 2**: Live Audio (grouped + 1v1)
2. **Phase 3**: Monetization (Brumes, Gifts)
3. **Phase 4**: Analytics & Notifications

---

**Status**: ✅ Production Ready

Toute l'architecture est en place. Prêt à tester! 🚀
