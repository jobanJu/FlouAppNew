# 🚀 Configuration Appwrite pour Flou App

## 1️⃣ Créer un projet Appwrite

1. Va sur **https://cloud.appwrite.io/**
2. Crée un compte (gratuit)
3. Crée un nouveau projet (ex: "Flou App")
4. Note le **Project ID** (tu le trouveras dans Settings)

## 2️⃣ Créer la Database + Collection

### Dans le dashboard Appwrite :

1. **Databases** → Create Database
   - Name: `flou-database`
   - Database ID: `flou-database` (ou copie l'ID généré)

2. **Create Collection** dans cette database
   - Name: `users`
   - Collection ID: `users` (ou copie l'ID généré)

3. **Attributes** (colonnes) à créer dans la collection `users` :

   | Attribute Key | Type    | Size | Required | Default |
   |---------------|---------|------|----------|---------|
   | firstname     | String  | 100  | ✅       | -       |
   | age           | Integer | -    | ✅       | -       |
   | city          | String  | 200  | ❌       | -       |
   | latitude      | Float   | -    | ❌       | -       |
   | longitude     | Float   | -    | ❌       | -       |
   | gender        | String  | 50   | ✅       | -       |
   | sexuality     | String  | 50   | ✅       | -       |
   | interests     | String[]| -    | ✅       | -       |
   | email         | Email   | -    | ✅       | -       |
   | photoFileId   | String  | 100  | ❌       | -       |

4. **Permissions** de la collection :
   - Clique sur **Settings** de la collection
   - **Permissions** → Add Role :
     - `Any` → Read (pour que les users voient les profils)
     - `Users` → Create, Update (pour créer/modifier leur profil)

## 3️⃣ Créer le Storage Bucket

1. **Storage** → Create Bucket
   - Name: `user-photos`
   - Bucket ID: `user-photos` (ou copie l'ID généré)
   - Max file size: `5 MB`
   - Allowed file extensions: `jpg, jpeg, png, webp`

2. **Permissions** du bucket :
   - `Any` → Read (pour voir les photos)
   - `Users` → Create, Update (pour uploader photos)

## 4️⃣ Configuration Auth

1. **Auth** → Settings
2. Active **Email/Password** (si pas déjà fait)
3. (Optionnel) Configure les emails de vérification/reset password

## 5️⃣ Mettre à jour index.html

Dans `/home/jj755403/FlouAppNew/public/index.html`, remplace :

```javascript
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = 'TON_PROJECT_ID_ICI'; // ← Copie ton Project ID
const DATABASE_ID = 'flou-database';
const USERS_COLLECTION_ID = 'users';
const BUCKET_ID = 'user-photos';
```

## 6️⃣ Déployer

```bash
cd /home/jj755403/FlouAppNew
git add .
git commit -m "Migrate to Appwrite"
git push origin main
```

---

## 🔗 Liens utiles

- Dashboard Appwrite: https://cloud.appwrite.io/
- Documentation: https://appwrite.io/docs
- Support: https://appwrite.io/discord

## ✅ Checklist

- [ ] Projet créé sur Appwrite Cloud
- [ ] Database `flou-database` créée
- [ ] Collection `users` créée avec tous les attributs
- [ ] Bucket `user-photos` créé
- [ ] Permissions configurées (Any → Read, Users → Create/Update)
- [ ] Project ID copié dans index.html
- [ ] Déployé sur Railway
