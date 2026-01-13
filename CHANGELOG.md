# Changelog - TheCall

## [2025-01-XX] - Nettoyage, améliorations et coaching IA

### 🧹 Nettoyage
- ✅ Supprimé `components/TimelineVertical.tsx` (non utilisé)
- ✅ Supprimé `components/ObjectiveGrid.tsx` (non utilisé)
- ✅ Supprimé `lib/parseDrakes.ts` (non utilisé)
- ✅ Supprimé `lib/parseObjectives.ts` (non utilisé)
- ✅ Supprimé `lib/cache.ts` (remplacé par `matchCache.ts`)

### 🎨 Améliorations UI/UX
- ✅ Ajouté `components/Toast.tsx` - Système de notifications toast
- ✅ Ajouté `components/LoadingSpinner.tsx` - Spinners de chargement
- ✅ Ajouté `components/AnimatedSection.tsx` - Animations avec framer-motion
- ✅ Intégré ToastContainer dans le layout global
- ✅ Ajouté animations sur les sections de la page match

### 🤖 Coaching IA
- ✅ Créé `types/coaching.ts` - Types pour les insights de coaching
- ✅ Créé `app/api/coaching/route.ts` - Route API pour générer le rapport coaching
  - Support OpenAI API (GPT-4o-mini par défaut)
  - Fallback heuristique si pas d'API key
  - Prompt engineering optimisé pour LoL
- ✅ Intégré le coaching IA dans `app/match/page.tsx`
  - Remplace les données hardcodées
  - Affiche turning point, focus, action
  - Sections positives/négatives dynamiques

### 🧪 Tests
- ✅ Configuré Jest avec Next.js
- ✅ Ajouté `jest.config.js` et `jest.setup.js`
- ✅ Créé tests unitaires pour `lib/winProbability.ts`
- ✅ Créé tests unitaires pour `lib/parseTimelineEvents.ts`
- ✅ Créé tests pour `components/WinProbabilityChart.tsx`
- ✅ Ajouté scripts npm : `test`, `test:watch`, `test:coverage`

### 📦 Dépendances ajoutées
- `@testing-library/jest-dom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@types/jest`
- `jest`
- `jest-environment-jsdom`

### 🔧 Configuration
- ✅ Ajouté variables d'environnement pour OpenAI (`OPENAI_API_KEY`, `OPENAI_MODEL`)
- ✅ Documentation des tests dans `README_TESTS.md`

### 📝 Notes
- Le coaching IA fonctionne avec ou sans OpenAI API key (fallback heuristique)
- Les tests sont prêts à être étendus (API routes, composants complexes)
- Les animations sont discrètes et performantes
