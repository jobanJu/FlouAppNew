# FlouApp — Étapes rapides après mise à jour

1) Commit & push pour déclencher le rebuild Railway

```bash
git add Dockerfile backend/ecosystem.config.js backend/logs/.gitkeep
git commit -m "chore(deploy): use pm2-runtime, add PM2 ecosystem and logs for Railway"
git push
```

2) Vérifications sur Railway Dashboard
- S'assurer qu'il n'y a qu'un seul service public pour ce projet (supprimer les doublons le cas échéant)
- Vérifier que le service public utilise bien le port `8080`
- Vérifier que toutes les variables d'environnement nécessaires sont définies (Supabase, LiveKit, etc.)

3) Si l'URL publique retourne encore `502`
- Récupérer les logs runtime:

```bash
railway logs --service <service-name> --tail
```

- Copier/coller les 200 dernières lignes ici pour que j'analyse.

4) Options supplémentaires que je peux faire pour vous
- Ajouter une vérification de santé plus robuste (`/health` vérifie aussi la connexion à Supabase)
- Automatiser la rotation de clés sensibles si elles sont exposées

---

Donnez-moi le signal quand vous avez poussé — je vous aiderai à analyser les logs Railway si nécessaire.
