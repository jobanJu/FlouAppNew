# 🛒 FLOU - Système de Monétisation

## Vue d'ensemble

Le système de monétisation de Flou comprend:
- **3 formules d'abonnement** (Classique, Kama, Cupidon)
- **Monnaie virtuelle "Brumes"** (💎) pour achats in-app
- **Actions payables** avec les Brumes

---

## 📊 Formules d'abonnement

### ⚪ CLASSIQUE (Gratuit)
- 10 matches / jour
- Blur niveau standard
- 1 Live VS Love / jour
- 10 Brumes gratuites au démarrage

### 🔵 KAMA (4,99€/semaine)
- 20 matches / jour
- Blur -1 niveau (déblocage accéléré)
- Accès Vocaux inclus
- 2 Live VS Love / jour
- Déblocage réseaux: 50 Brumes (au lieu de 100)
- +50 Brumes / semaine
- Badge Kama sur profil

### 💜 CUPIDON (14,99€/semaine) - PREMIUM
- Matches **illimités**
- Blur -2 niveaux (déblocage rapide)
- Vocaux illimités
- Live VS Love illimités
- Déblocage réseaux **GRATUIT**
- +150 Brumes / semaine
- Badge Cupidon sur profil
- Bio vidéo incluse
- Assistance IA pour messages
- Priorité visibilité & boosts gratuits

---

## 💎 Système Brumes

### Packs d'achat
| Brumes | Prix | Bonus |
|--------|------|-------|
| 50 💎 | 5€ | - |
| 100 💎 | 10€ | - |
| 200 💎 | 20€ | +5% |
| 500 💎 | 45€ | +10% |

### Utilisation des Brumes

| Action | Coût | Description |
|--------|------|-------------|
| 🎤 Messages Vocaux | 100 💎 | Envoie des messages audio |
| 📱 Déblocage Réseaux | 100 💎 | Accès Instagram/Snapchat |
| ✨ Déflouttage Partiel | 100 💎 | Réduit le blur immédiatement |
| 🚀 Boost de Profil | 300 💎 | 20 min de visibilité max |
| 🎥 Bio Vidéo Premium | 300 💎 | Vidéo profil (non-Cupidon) |
| 🎁 Cadeaux Live | 5-100 💎 | Cadeaux virtuels en direct |

---

## 🗄️ Installation Base de Données

### Nouvelle installation (vide)
Exécuter dans Supabase SQL Editor:
```sql
-- Fichier: supabase_complete_setup.sql
-- Inclut déjà les colonnes de monétisation
```

### Migration (données existantes)
Exécuter dans Supabase SQL Editor:
```sql
-- Fichier: supabase_add_monetization.sql
-- Ajoute les colonnes sans détruire les données
```

Cette migration ajoute:
- ✅ `brumes_balance` (integer, default 10)
- ✅ `subscription_tier` (text, default 'classique')
- ✅ `subscription_start` (timestamptz)
- ✅ Table `transactions` pour l'historique
- ✅ Fonctions `record_transaction()` et `spend_brumes()`

---

## 💳 Intégration Paiement

### À faire en production

Le code actuel utilise des paiements **simulés** avec `confirm()`.

Pour la production, intégrer **Stripe**:

```javascript
// 1. Installer Stripe SDK
// <script src="https://js.stripe.com/v3/"></script>

// 2. Remplacer dans subscribeTo()
const stripe = Stripe('pk_live_VOTRE_CLE_PUBLIQUE');
const { error } = await stripe.redirectToCheckout({
  lineItems: [{ price: 'price_KAMA_ou_CUPIDON', quantity: 1 }],
  mode: 'subscription',
  successUrl: window.location.origin + '/success',
  cancelUrl: window.location.origin + '/shop'
});

// 3. Webhook Stripe pour confirmer paiement
// POST /api/stripe-webhook
// Mettre à jour subscription_tier dans Supabase
```

**Prix Stripe à créer**:
- `price_kama` → 4,99€ / semaine
- `price_cupidon` → 14,99€ / semaine
- `price_brumes_50` → 5€
- `price_brumes_100` → 10€
- `price_brumes_200` → 20€
- `price_brumes_500` → 45€

---

## 🔐 Sécurité

### Politiques RLS
Les policies Supabase garantissent:
- ✅ Les utilisateurs voient seulement leurs transactions
- ✅ Les utilisateurs ne peuvent modifier que leur propre solde
- ✅ Les fonctions SQL utilisent `security definer`

### Validation côté serveur
La fonction `spend_brumes()` vérifie:
- ✅ Solde suffisant avant débit
- ✅ Transaction atomique (rollback si erreur)
- ✅ Historique complet des dépenses

---

## 📱 Interface Utilisateur

### Accès boutique
1. Profil → Bouton **🛒 Boutique & Abonnements**
2. Affiche solde Brumes et abonnement actuel
3. Cartes interactives pour chaque formule
4. Grille de packs Brumes

### Affichage profil
- Badge abonnement (⚪/🔵/💜)
- Solde Brumes en temps réel
- Mise à jour automatique après achat

---

## 🎯 Prochaines étapes

### Implémentation Stripe
1. Créer compte Stripe
2. Configurer produits et prix
3. Implémenter webhook backend
4. Tester en mode test
5. Activer en production

### Fonctionnalités avancées
- [ ] Gestion auto-renouvellement abonnements
- [ ] Notifications avant expiration
- [ ] Historique détaillé transactions
- [ ] Offres promotionnelles
- [ ] Codes promo
- [ ] Programme de parrainage (bonus Brumes)

---

## 📞 Support

Pour questions sur la monétisation:
- **Code**: `public/index.html` (fonctions `subscribeTo`, `buyBrumes`, `loadShop`)
- **Base de données**: `supabase_add_monetization.sql`
- **Stripe docs**: https://stripe.com/docs/billing/subscriptions/overview

---

**Version**: 1.0  
**Date**: 2024  
**Status**: ✅ Interface complète, ⏳ Paiements à intégrer
