# 🔴 Redis pour Rate Limiting & 🧪 Tests E2E - Explication

## 🔴 Redis pour Rate Limiting

### Pourquoi Redis ?

**Problème actuel :**
- Rate limiting en mémoire (`lib/rateLimit.ts`)
- ❌ Perdu au redémarrage du serveur
- ❌ Non partagé entre instances (si tu as 2+ serveurs, chaque serveur a son propre compteur)
- ❌ En production avec plusieurs instances Vercel, un utilisateur peut contourner la limite en changeant d'instance

**Solution : Redis**
- ✅ Store distribué partagé entre toutes les instances
- ✅ Persistant (survit aux redémarrages)
- ✅ Scalable (millions de requêtes/seconde)
- ✅ TTL natif (expiration automatique des clés)

### Comment ça marche ?

```typescript
// Avant (mémoire)
const store = new Map(); // ❌ Perdu au restart

// Après (Redis)
await redis.setex(`ratelimit:${key}`, ttl, count); // ✅ Persistant
```

### Options Redis

1. **Upstash Redis** (recommandé pour Vercel)
   - Serverless, pay-as-you-go
   - REST API (pas besoin de connexion persistante)
   - Gratuit jusqu'à 10K requêtes/jour
   - Parfait pour Vercel Edge Functions

2. **Vercel KV** (basé sur Upstash)
   - Intégration native Vercel
   - Même technologie qu'Upstash

3. **Redis Cloud / AWS ElastiCache**
   - Plus complexe à setup
   - Nécessite un serveur dédié

### Implémentation proposée

Je vais créer :
- `lib/rateLimitRedis.ts` : Version Redis du rate limiting
- Migration automatique : Détecte si Redis est disponible, sinon fallback sur mémoire
- Configuration via variables d'environnement

---

## 🧪 Tests E2E (End-to-End)

### Qu'est-ce que les tests E2E ?

**Tests unitaires actuels :**
- Testent des fonctions isolées (`lib/security.test.ts`)
- Rapides mais limités
- Ne testent pas l'intégration complète

**Tests E2E :**
- Testent l'application complète du point de vue utilisateur
- Simulent un vrai navigateur
- Vérifient que tout fonctionne ensemble

### Exemple de test E2E

```typescript
// Test unitaire (actuel)
test('validatePuuid returns true for valid PUUID', () => {
  expect(validatePuuid('abc-123')).toBe(true);
});

// Test E2E (nouveau)
test('user can search for a match', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="riotId"]', 'Summoner#EUW');
  await page.click('button[type="submit"]');
  await expect(page.locator('.match-list')).toBeVisible();
});
```

### Playwright vs autres outils

**Playwright** (recommandé) :
- ✅ Support multi-navigateurs (Chrome, Firefox, Safari)
- ✅ Rapide et fiable
- ✅ Intégration Next.js facile
- ✅ Screenshots/vidéos automatiques

**Cypress** :
- Plus populaire mais plus lent
- Un seul navigateur à la fois

**Puppeteer** :
- Plus bas niveau
- Moins de features

### Tests E2E à créer

1. **Navigation de base**
   - Accès à la page d'accueil
   - Recherche d'un Riot ID
   - Affichage des matchs

2. **Flux utilisateur complet**
   - Recherche → Sélection match → Affichage détails → Coaching

3. **Gestion d'erreurs**
   - PUUID invalide
   - API Riot down
   - Rate limit atteint

4. **Accessibilité**
   - Navigation au clavier
   - Lecteurs d'écran

### Structure proposée

```
e2e/
  ├── fixtures/
  │   └── test-data.ts
  ├── tests/
  │   ├── navigation.spec.ts
  │   ├── match-flow.spec.ts
  │   ├── errors.spec.ts
  │   └── accessibility.spec.ts
  └── playwright.config.ts
```

---

## 🚀 Implémentation

Je peux implémenter les deux maintenant :

1. **Redis Rate Limiting**
   - Créer `lib/rateLimitRedis.ts`
   - Modifier `lib/rateLimit.ts` pour utiliser Redis si disponible
   - Ajouter les variables d'environnement nécessaires
   - Documentation dans `.env.example`

2. **Tests E2E avec Playwright**
   - Installer Playwright
   - Créer `playwright.config.ts`
   - Créer les premiers tests E2E
   - Ajouter script `test:e2e` dans `package.json`

Souhaites-tu que je procède à l'implémentation des deux ?
