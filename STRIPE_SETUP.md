# 💳 Configuration Stripe pour Flou App

## 1. Variables d'environnement requises

Ajoute ces variables dans Railway (Settings > Variables) :

```env
STRIPE_SECRET_KEY=sk_live_XXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX
```

⚠️ **La clé publique est déjà configurée dans le frontend** :
```
pk_live_51QicTOGL6nMNahkvpVtrDyCQgDlyL9i2lXt35FSnJLaesJn2zWsax7kmrwwoc1w9QmYsMRyb5UT0jAnYZDmouXBU00OexIGkdz
```

---

## 2. Créer les produits et prix dans Stripe Dashboard

### Abonnements

Va sur https://dashboard.stripe.com/products et crée :

#### 🔵 KAMA (4.99€/semaine)
- Nom: `Flou KAMA`
- Description: `Abonnement KAMA - Likes illimités, 3 Super Likes/jour`
- Prix: `4.99 EUR` - Récurrent (weekly)
- **Note le Price ID** (ex: `price_1Qic...`)

#### 💜 CUPIDON (14.99€/semaine)
- Nom: `Flou CUPIDON`
- Description: `Abonnement CUPIDON - Tout KAMA + visibilité prioritaire, filtres avancés`
- Prix: `14.99 EUR` - Récurrent (weekly)
- **Note le Price ID**

### Packs de Brumes

#### 💎 50 Brumes (1.99€)
- Nom: `50 Brumes`
- Prix: `1.99 EUR` - Paiement unique
- Metadata: `brumes_amount: 50`

#### 💎 100 Brumes (3.99€)
- Nom: `100 Brumes`  
- Prix: `3.99 EUR` - Paiement unique
- Metadata: `brumes_amount: 100`

#### 💎 200 Brumes (6.99€)
- Nom: `200 Brumes`
- Prix: `6.99 EUR` - Paiement unique
- Metadata: `brumes_amount: 200`

#### 💎 500 Brumes (14.99€)
- Nom: `500 Brumes`
- Prix: `14.99 EUR` - Paiement unique
- Metadata: `brumes_amount: 500`

---

## 3. Mettre à jour les Price IDs dans le code

Une fois les produits créés, mets à jour les IDs dans `public/index.html` :

```javascript
const STRIPE_PRICES = {
  // Abonnements
  'kama': 'price_XXXXXXXXXX', // Ton vrai price ID KAMA
  'cupidon': 'price_XXXXXXXXXX', // Ton vrai price ID CUPIDON
  // Packs de Brumes
  'brumes_50': 'price_XXXXXXXXXX',
  'brumes_100': 'price_XXXXXXXXXX',
  'brumes_200': 'price_XXXXXXXXXX',
  'brumes_500': 'price_XXXXXXXXXX'
};
```

---

## 4. Configurer le Webhook

1. Va sur https://dashboard.stripe.com/webhooks
2. Clique sur "Ajouter un endpoint"
3. URL : `https://ton-app.railway.app/api/stripe-webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.payment_failed`
5. Copie le **Webhook Signing Secret** (`whsec_...`)
6. Ajoute-le dans Railway : `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 5. Tester

### Mode Test
Pour tester sans vrais paiements :
1. Utilise les clés test (`sk_test_...` et `pk_test_...`)
2. Carte test : `4242 4242 4242 4242`
3. Date expiration : n'importe quelle date future
4. CVC : n'importe quel code à 3 chiffres

### Mode Live
Une fois en production :
1. Active le mode Live dans Stripe Dashboard
2. Utilise les clés live (`sk_live_...` et `pk_live_...`)

---

## 6. Architecture du flux de paiement

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUX DE PAIEMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Utilisateur clique "Acheter"                                │
│           │                                                      │
│           ▼                                                      │
│  2. Frontend appelle /api/create-checkout-session               │
│           │                                                      │
│           ▼                                                      │
│  3. Backend crée session Stripe Checkout                        │
│           │                                                      │
│           ▼                                                      │
│  4. Utilisateur redirigé vers Stripe Checkout                   │
│           │                                                      │
│           ▼                                                      │
│  5. Utilisateur entre ses infos de paiement                     │
│           │                                                      │
│           ▼                                                      │
│  6. Stripe traite le paiement                                   │
│           │                                                      │
│           ├──────────────────┐                                   │
│           │                  │                                   │
│           ▼                  ▼                                   │
│  7a. Success URL         7b. Webhook /api/stripe-webhook        │
│      (redirection)           (notification asynchrone)          │
│           │                  │                                   │
│           ▼                  ▼                                   │
│  8. Mise à jour Supabase (abonnement ou Brumes)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Sécurité

✅ **Clé secrète uniquement côté serveur** - Jamais exposée au frontend
✅ **Vérification signature webhook** - Protection contre les attaques
✅ **HTTPS obligatoire** - Railway fournit SSL automatique
✅ **Rate limiting** - Protection contre les abus

---

## Support

- Documentation Stripe : https://stripe.com/docs
- Dashboard Stripe : https://dashboard.stripe.com
- Support Stripe France : https://support.stripe.com
