# Checklist de déploiement - FlouApp

Avant de déployer sur Supabase / production :

1. Vérifications locales
   - [ ] Exécuter les tests unitaires et lint
   - [ ] Builder l'app et vérifier qu'il n'y a pas d'erreurs TypeScript
   - [ ] Vérifier les migrations localement : `supabase db push --project-ref <PROJECT_REF>`
   - [ ] Servir et tester les functions localement si nécessaire

2. Secrets & configuration
   - [ ] Ajouter/mettre à jour les secrets GitHub Actions :
     - `SUPABASE_PROJECT_REF`
     - `SUPABASE_ACCESS_TOKEN` (ou `SUPABASE_SERVICE_ROLE_KEY` pour opérations DB sensibles)
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
     - `BACKEND_URL` (si besoin)

3. Déploiement CI
   - [ ] Pousser la branche vers `main` (ou ouvrir PR vers `main`) pour déclencher `.github/workflows/supabase-deploy.yml`
   - [ ] Vérifier les logs GitHub Actions pour erreurs

4. Vérifications post-déploiement
   - [ ] Appeler rapidement les endpoints critiques (smoke tests)
   - [ ] Vérifier les logs Supabase / function logs
   - [ ] Vérifier que les nouvelles migrations ont bien été appliquées

5. Rollback
   - [ ] Avoir une sauvegarde avant changements destructifs (dump `.dump` recommandé)
   - [ ] Plan de rollback documenté dans le ticket PR

6. Communication
   - [ ] Notifier l'équipe/Slack avec le lien de PR et l'heure de déploiement

---

Conserver cette checklist à jour et l'utiliser pour tout déploiement en production.
