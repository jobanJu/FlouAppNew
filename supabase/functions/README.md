# Fonctions Supabase

Ce dossier contient les fonctions Edge (Deno) fournies pour le projet FlouApp.

Objectifs du README:
- Expliquer comment tester localement avec la CLI Supabase
- Fournir des exemples `curl` pour valider le comportement
- Indiquer les variables d'environnement nécessaires

## Variables d'environnement
Créez un fichier `.env` dans ce dossier (ou utilisez le mécanisme de votre CI) avec au minimum:

```
SUPABASE_URL=https://<votre-supabase>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<votre-service-role-key>
```

Ne mettez jamais la `SERVICE_ROLE_KEY` dans le client (mobile/web) — gardez-la côté serveur.

## Tester localement

Installez la CLI Supabase (https://supabase.com/docs/guides/cli) puis depuis la racine du repo:

```bash
cd supabase/functions/update-match-status
# créer .env en copiant .env.example et en remplissant les valeurs
supabase functions serve update-match-status --env-file .env
```

La fonction sera servie sur le port local géré par la CLI (ex: `http://localhost:54321/functions/v1/update-match-status`).

Exemple de requête de test (webhook payload minimal utilisé par Supabase lorsqu'un message est inséré):

```bash
curl -X POST http://localhost:54321/functions/v1/update-match-status \
  -H "Content-Type: application/json" \
  -d '{"record":{"match_id":"<match-id>"}}'
```

## Notes techniques

- J'ai remplacé la requête de regroupement PostgREST (count by sender) par une récupération simple des `sender_id` puis un comptage en JS. Cela évite des problèmes de syntaxe et de compatibilité avec différentes versions du client Supabase/PostgREST.
- Si vous préférez une version SQL plus performante, envisagez d'ajouter une vue matérialisée côté Postgres ou d'utiliser une requête RPC (stored procedure) qui renvoie directement les comptes.

## Déploiement

Pour déployer la fonction vers Supabase (production):

```bash
# depuis la racine du repo
cd supabase/functions/update-match-status
supabase functions deploy update-match-status --env-file .env
```

Assurez-vous que les variables d'environnement sont définies dans le projet Supabase ou via vos secrets CI.

## Prochaine étape
- Je peux parcourir le dossier `supabase/functions/` pour détecter d'autres fonctions similaires et appliquer des correctifs automatiques si nécessaire.

## Déploiement CI (GitHub Actions) & secrets requis

Pour déployer automatiquement depuis GitHub, ajoutez ces secrets (Repository → Settings → Secrets and variables → Actions) :

- `SUPABASE_PROJECT_REF` : le *project ref* (slug) extrait de l'URL Supabase (ex: `lyqtupcjevgxpovzevcz`).
- `SUPABASE_ACCESS_TOKEN` : token d'accès CLI (optionnel selon méthode CLI utilisée).
- `SUPABASE_SERVICE_ROLE_KEY` : la clé service_role (NE JAMAIS exposer côté client). Utilisez-la uniquement en CI/serveur.

Exemple de workflow GitHub Actions : `.github/workflows/supabase-deploy.yml` (fourni dans le repo). Ce workflow installe le binaire Supabase CLI, exécute `supabase db push` et déploie chaque fonction sous `supabase/functions/`.

## Script local de déploiement
Un script utile est disponible à `scripts/supabase_deploy.sh` pour exécuter localement les mêmes étapes que le CI (attend les variables d'environnement suivantes) :

- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN` ou `SUPABASE_SERVICE_ROLE_KEY`

Utilisez le script ainsi (sans mot de passe en clair) :

```bash
# exporter vos secrets localement (ou les injecter depuis un gestionnaire de secrets)
export SUPABASE_PROJECT_REF=lyqtupcjevgxpovzevcz
export SUPABASE_ACCESS_TOKEN="<token>"
./scripts/supabase_deploy.sh
```

---

