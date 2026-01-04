#!/bin/bash

# DÉPLOIEMENT EDGE FUNCTION SUPABASE
# 
# Cette fonction est appelée automatiquement quand on INSERT un message
# Elle détecte les seuils de déverrouillage et met à jour match.status

echo "🚀 Déploiement Edge Function: update-match-status"
echo ""

# Configuration
PROJECT_ID="<votre-project-id>"
FUNCTION_NAME="update-match-status"

echo "📝 Étapes de déploiement:"
echo ""

echo "1️⃣  Récupérer votre PROJECT_ID"
echo "   • Aller à: https://supabase.io/dashboard"
echo "   • Sélectionner votre projet"
echo "   • Settings → General → Project ID"
echo "   • Copier le PROJECT_ID"
echo ""

echo "2️⃣  Créer le trigger SQL dans Supabase"
echo "   • Aller à: SQL Editor"
echo "   • Coller le code ci-dessous:"
echo ""

cat << 'SQL'
-- TRIGGER: Appelé après INSERT sur messages
-- ACTION: Appelle la Edge Function pour vérifier seuils

CREATE OR REPLACE FUNCTION trigger_update_match_status()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
BEGIN
  -- URL de votre Edge Function
  function_url := 'https://<PROJECT_ID>.supabase.co/functions/v1/update-match-status';
  
  -- Appeler la fonction HTTP POST
  PERFORM
    net.http_post(
      function_url,
      jsonb_build_object('record', row_to_json(NEW)),
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.jwt_secret')
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS messages_update_match_status ON messages;

CREATE TRIGGER messages_update_match_status
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION trigger_update_match_status();
SQL

echo ""
echo "3️⃣  Remplacer <PROJECT_ID> par votre vrai ID"
echo ""

echo "4️⃣  Exécuter le SQL"
echo ""

echo "5️⃣  Déployer la fonction via CLI"
echo "   supabase functions deploy update-match-status --project-id <PROJECT_ID>"
echo ""

echo "6️⃣  Vérifier le déploiement"
echo "   supabase functions list --project-id <PROJECT_ID>"
echo ""

echo "7️⃣  Tester en envoyant un message"
echo "   • Envoyer 6 messages dans un match"
echo "   • Vérifier que match.status → 'day2'"
echo "   • Logs: Supabase Dashboard → Functions → Logs"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Une fois déployée, l'Edge Function:"
echo "   • Détecte 6 messages → déverrouille J2"
echo "   • Détecte 12 messages → déverrouille J3"
echo "   • Met à jour match.status automatiquement"
echo "   • Aucune action manuelle nécessaire"
echo ""
