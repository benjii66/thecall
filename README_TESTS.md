# Tests - TheCall

## Installation

Les dépendances de test sont déjà ajoutées dans `package.json`. Installe-les avec :

```bash
npm install
```

## Lancer les tests

```bash
# Tous les tests
npm test

# Mode watch (re-lance les tests à chaque changement)
npm run test:watch

# Avec coverage
npm run test:coverage
```

## Structure des tests

- `__tests__/lib/` - Tests unitaires pour les fonctions de logique métier
  - `winProbability.test.ts` - Tests du calcul de probabilité de victoire
  - `parseTimelineEvents.test.ts` - Tests du parsing d'événements

- `__tests__/components/` - Tests des composants React
  - `WinProbabilityChart.test.tsx` - Tests du composant graphique

## Configuration

- `jest.config.js` - Configuration Jest avec Next.js
- `jest.setup.js` - Setup global (jest-dom matchers)

## Coverage

Les tests couvrent actuellement :
- ✅ Calcul de win probability
- ✅ Parsing d'événements timeline
- ✅ Composants graphiques de base

À ajouter :
- Tests API routes
- Tests de composants plus complexes (HorizontalTimeline, etc.)
- Tests d'intégration
