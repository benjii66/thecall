# 🧪 Tests E2E avec Playwright

## Installation

Les tests E2E sont déjà configurés ! Playwright a été installé avec tous les navigateurs.

## Structure

```
e2e/
  ├── navigation.spec.ts      # Tests de navigation de base
  ├── match-flow.spec.ts      # Tests du flux de recherche de matchs
  └── accessibility.spec.ts   # Tests d'accessibilité
```

## Commandes

```bash
# Lancer tous les tests E2E
npm run test:e2e

# Lancer avec l'UI interactive
npm run test:e2e:ui

# Lancer en mode debug
npm run test:e2e:debug

# Lancer un test spécifique
npx playwright test e2e/navigation.spec.ts

# Lancer sur un navigateur spécifique
npx playwright test --project=chromium
```

## Configuration

La configuration est dans `playwright.config.ts` :
- ✅ Démarre automatiquement le serveur dev avant les tests
- ✅ Tests sur Chrome, Firefox, Safari, et mobile
- ✅ Screenshots/vidéos sur échec
- ✅ Retry automatique sur CI

## Tests disponibles

### Navigation (`navigation.spec.ts`)
- ✅ Chargement de la page d'accueil avec tous les éléments clés
- ✅ Navigation accessible (skip links)
- ✅ Navigation vers pricing/privacy
- ✅ Navbar visible sur toutes les pages

### Match Flow (`match-flow.spec.ts`)
- ✅ Affichage du formulaire de recherche Riot ID
- ✅ Validation du format Riot ID
- ✅ Navigation vers overview avec Riot ID valide
- ✅ Skeleton loaders pendant le chargement
- ✅ Gestion d'erreurs API
- ✅ Support de la touche Enter pour soumettre

### Accessibilité (`accessibility.spec.ts`)
- ✅ Structure de headings (h1 avec contenu)
- ✅ Navigation au clavier (Tab navigation)
- ✅ Skip links fonctionnels
- ✅ ARIA labels sur les formulaires
- ✅ ARIA labels sur les boutons interactifs
- ✅ Contraste des couleurs (basique)
- ✅ Indicateurs de focus visibles
- ✅ Gestion accessible des erreurs de validation

### Responsive Design (`responsive.spec.ts`) - **NOUVEAU**
- ✅ Affichage correct sur mobile (375x667)
- ✅ Affichage correct sur tablette (768x1024)
- ✅ Affichage correct sur desktop (1920x1080)
- ✅ Gestion du redimensionnement de viewport

## Ajouter de nouveaux tests

Créer un nouveau fichier dans `e2e/` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ma nouvelle feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // ... ton test
  });
});
```

## CI/CD

Pour intégrer dans CI/CD (GitHub Actions, etc.) :

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```

## Debugging

1. **Mode UI** : `npm run test:e2e:ui` - Interface graphique pour voir les tests
2. **Mode Debug** : `npm run test:e2e:debug` - Step-by-step debugging
3. **Screenshots** : Automatiquement sauvegardés dans `test-results/` en cas d'échec
4. **Vidéos** : Automatiquement sauvegardés en cas d'échec

## Bonnes pratiques

1. **Tests indépendants** : Chaque test doit pouvoir tourner seul
2. **Données de test** : Utiliser des fixtures pour les données
3. **Sélecteurs robustes** : Préférer `data-testid` aux sélecteurs CSS fragiles
4. **Attentes explicites** : Toujours utiliser `await expect()` au lieu de `waitForTimeout()`

## Prochaines étapes

- [ ] Ajouter des tests pour le flux coaching complet
- [ ] Tests de performance (Lighthouse)
- [ ] Tests de responsive design
- [ ] Tests de dark mode (si applicable)
