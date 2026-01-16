# 🚀 Guide de Démarrage Rapide - Tests E2E

## Installation (Déjà fait ✅)

Les tests E2E sont déjà installés et configurés ! Playwright et tous les navigateurs sont prêts.

## Lancer les tests

### 1. Mode simple (tous les tests)

```bash
npm run test:e2e
```

Cette commande va :
- Démarrer automatiquement le serveur dev (`npm run dev`)
- Lancer tous les tests sur Chrome, Firefox, Safari et mobile
- Générer un rapport HTML avec les résultats

### 2. Mode UI interactif (recommandé pour débuter)

```bash
npm run test:e2e:ui
```

Cette commande ouvre une interface graphique où tu peux :
- ✅ Voir tous les tests en temps réel
- ✅ Lancer un test spécifique
- ✅ Voir les screenshots/vidéos
- ✅ Débugger facilement

### 3. Mode debug (step-by-step)

```bash
npm run test:e2e:debug
```

Ouvre Playwright Inspector pour débugger test par test.

## Tests disponibles

### 📍 Navigation (`e2e/navigation.spec.ts`)
Teste la navigation de base, les liens, la navbar.

### 🎮 Match Flow (`e2e/match-flow.spec.ts`)
Teste le formulaire Riot ID, la validation, la navigation vers overview.

### ♿ Accessibilité (`e2e/accessibility.spec.ts`)
Teste l'accessibilité : ARIA, navigation clavier, contraste, etc.

### 📱 Responsive (`e2e/responsive.spec.ts`)
Teste l'affichage sur mobile, tablette, desktop.

## Lancer un test spécifique

```bash
# Un seul fichier
npx playwright test e2e/navigation.spec.ts

# Un seul test
npx playwright test e2e/navigation.spec.ts -g "should load the home page"

# Un seul navigateur
npx playwright test --project=chromium
```

## Résultats

Après avoir lancé les tests, tu trouveras :

- **Rapport HTML** : `playwright-report/index.html`
  - Ouvre avec : `npx playwright show-report`

- **Screenshots** : `test-results/` (en cas d'échec)

- **Vidéos** : `test-results/` (en cas d'échec)

## Conseils

1. **Commence par le mode UI** : `npm run test:e2e:ui` pour voir visuellement ce qui se passe

2. **Si un test échoue** :
   - Regarde les screenshots/vidéos dans `test-results/`
   - Ouvre le rapport HTML pour voir les détails
   - Utilise le mode debug pour comprendre pourquoi

3. **Pour tester en local** :
   - Assure-toi que le serveur dev tourne (ou laisse Playwright le démarrer automatiquement)
   - Les tests utilisent `http://localhost:3000` par défaut

4. **Pour tester en CI/CD** :
   - Les tests sont configurés pour retry automatiquement
   - Les screenshots/vidéos sont générés automatiquement

## Problèmes courants

### "Port 3000 already in use"
Le serveur dev est déjà lancé. Soit :
- Ferme le serveur existant
- Ou laisse Playwright le gérer (il détecte automatiquement)

### "Tests timeout"
- Vérifie que le serveur dev répond bien
- Augmente le timeout dans `playwright.config.ts` si nécessaire

### "Element not found"
- Vérifie que la page se charge correctement
- Utilise le mode UI pour voir ce qui se passe en temps réel

## Prochaines étapes

Une fois que les tests fonctionnent, tu peux :
- Ajouter de nouveaux tests dans `e2e/`
- Améliorer les tests existants
- Intégrer dans CI/CD (GitHub Actions, etc.)

**Bon test ! 🎉**
