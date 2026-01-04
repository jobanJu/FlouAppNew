# TODO - Correction et Amélioration FlouAppNew

## ✅ Étapes Terminées

### Correction des Erreurs ESLint
- [ ] Corriger `eslint.config.js` - Supprimer la règle `@typescript-eslint/no-var-requires`
- [ ] Corriger `app/(tabs)/spots.tsx` - Supprimer le commentaire ESLint problématique (ligne 21)
- [ ] Corriger `app/session/create.tsx` - Supprimer les 2 commentaires ESLint problématiques (lignes 14, 24)

### Remplacement des console.log
- [ ] `app/(tabs)/matching.tsx` - Remplacer console.log (lignes 71, 75)
- [ ] `app/_layout.tsx` - Remplacer console.log (lignes 19, 22, 37, 40, 43)
- [ ] `app/live-room.tsx` - Remplacer console.log (ligne 144)
- [ ] `app/onboarding.tsx` - Remplacer console.log (lignes 272, 275, 278, 285)
- [ ] `app/settings/edit-profile.tsx` - Remplacer console.log (lignes 85, 105)
- [ ] `app/settings/index.tsx` - Remplacer console.log (lignes 44, 69)

### Vérifications Finales
- [ ] Lancer `npm run lint` pour vérifier qu'il n'y a plus d'erreurs
- [ ] Lancer `npx tsc --noEmit` pour vérifier TypeScript
- [ ] Lancer l'application avec `npm start`

## Notes
- Les erreurs ESLint viennent de l'utilisation de `require()` dans TypeScript avec des commentaires eslint-disable
- La règle `@typescript-eslint/no-var-requires` nécessite un plugin séparé qui n'est pas installé
- La solution est de supprimer ces commentaires et d'utiliser des imports statiques ou de supprimer les vérifications ESLint pour ces lignes

