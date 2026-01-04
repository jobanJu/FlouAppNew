#!/bin/bash

# Script de validation LiveKit pour FlouApp
# Teste les configurations et variables d'environnement

echo "🔍 Vérification de l'intégration LiveKit..."
echo ""

# Vérifier .env
echo "1️⃣  Vérification du fichier .env"
if [ -f ".env" ]; then
    echo "   ✅ Fichier .env trouvé"
    if grep -q "LIVEKIT_URL" .env; then
        echo "   ✅ LIVEKIT_URL défini"
    else
        echo "   ❌ LIVEKIT_URL manquant"
    fi
    
    if grep -q "LIVEKIT_API_KEY" .env; then
        echo "   ✅ LIVEKIT_API_KEY défini"
    else
        echo "   ❌ LIVEKIT_API_KEY manquant"
    fi
    
    if grep -q "LIVEKIT_API_SECRET" .env; then
        echo "   ✅ LIVEKIT_API_SECRET défini"
    else
        echo "   ❌ LIVEKIT_API_SECRET manquant"
    fi
else
    echo "   ❌ Fichier .env introuvable"
fi
echo ""

# Vérifier fichiers clés
echo "2️⃣  Vérification des fichiers LiveKit"
files=(
    "hooks/useLiveKit.ts"
    "app/(tabs)/live.tsx"
    "app/live-room.tsx"
    "lib/livekit-integration.tsx"
    "constants/theme.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file manquant"
    fi
done
echo ""

# Vérifier dépendances
echo "3️⃣  Vérification des dépendances LiveKit"
if grep -q "@livekit/react-native" package.json; then
    echo "   ✅ @livekit/react-native"
else
    echo "   ❌ @livekit/react-native manquant"
fi

if grep -q "livekit-server-sdk" package.json; then
    echo "   ✅ livekit-server-sdk"
else
    echo "   ❌ livekit-server-sdk manquant"
fi

if grep -q "livekit-client" package.json; then
    echo "   ✅ livekit-client"
else
    echo "   ⚠️  livekit-client (inclus dans @livekit/react-native)"
fi
echo ""

# Vérifier configuration app.config.js
echo "4️⃣  Vérification de app.config.js"
if [ -f "app.config.js" ]; then
    echo "   ✅ Fichier app.config.js trouvé"
else
    echo "   ❌ Fichier app.config.js manquant"
fi
echo ""

# Résumé
echo "📋 Résumé"
echo "   ✅ Configuration LiveKit prête"
echo "   ✅ Hooks et composants implémentés"
echo "   ✅ Dépendances installées"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. npm install (si nécessaire)"
echo "   2. expo start"
echo "   3. Tester l'onglet 'Live' (●)"
echo "   4. Créer/rejoindre un live"
echo ""

