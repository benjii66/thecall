# Rate Limiting - Documentation

## Stratégie Multi-Utilisateurs

Le système de rate limiting est conçu pour supporter plusieurs utilisateurs simultanés, même sans authentification complète.

### Hiérarchie d'Identification

1. **`user:${userId}`** (Priorité maximale)
   - Utilisé quand un userId est disponible via session/cookie
   - Permet un rate limiting par utilisateur individuel
   - **Statut** : À implémenter quand l'authentification OAuth Riot sera disponible

2. **`session:${tokenHash}`** (Priorité moyenne)
   - Utilisé quand un token de session est disponible (cookie ou header)
   - Permet de distinguer les sessions même sans userId
   - Évite que plusieurs utilisateurs partageant la même IP se bloquent mutuellement
   - **Statut** : Prêt à utiliser (cherche `session-id`, `session-token`, `sid` dans cookies ou `x-session-id` dans headers)

3. **`ip:${clientIP}`** (Fallback)
   - Utilisé quand aucune session/userId n'est disponible
   - **Limitation** : Tous les utilisateurs partageant la même IP partagent le même quota
   - **Cas d'usage** : Réseaux d'entreprise, NAT, proxy partagés

### Exemples de Scénarios

#### Scénario 1 : Utilisateurs avec sessions distinctes
```
User A (IP: 192.168.1.10, session: abc123) → `session:abc123` → Quota indépendant
User B (IP: 192.168.1.10, session: def456) → `session:def456` → Quota indépendant
```
✅ Les deux utilisateurs ont des quotas séparés même s'ils partagent la même IP

#### Scénario 2 : Utilisateurs authentifiés
```
User A (userId: user-123) → `user:user-123` → Quota par utilisateur
User B (userId: user-456) → `user:user-456` → Quota par utilisateur
```
✅ Rate limiting optimal par utilisateur

#### Scénario 3 : Utilisateurs anonymes sans session
```
User A (IP: 192.168.1.10) → `ip:192.168.1.10` → Quota partagé
User B (IP: 192.168.1.10) → `ip:192.168.1.10` → Quota partagé
```
⚠️ Les deux utilisateurs partagent le même quota (limitation actuelle)

## Configuration

### Limites par Route

- **Routes générales** (match, matches, account) : 100 req/min
- **Route coaching** : 10 req/min (stricte, car coûteuse en ressources)

### Headers Retournés

Toutes les réponses API incluent :
- `X-RateLimit-Limit` : Limite maximale
- `X-RateLimit-Remaining` : Requêtes restantes
- `X-RateLimit-Reset` : Timestamp de réinitialisation
- `Retry-After` : Secondes avant de pouvoir réessayer (si limit atteint)

## Migration Production

### Actuel (Développement)
- Store en mémoire (`Map<string, ...>`)
- Non partagé entre instances
- Perdu au restart

### Recommandé (Production)
- **Redis** : Partage entre instances, persistance, scalabilité
- **Vercel Edge Config** : Solution serverless, intégration native
- **Upstash Redis** : Alternative serverless à Redis

### Exemple de Migration Redis

```typescript
// lib/rateLimitRedis.ts (futur)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const redisKey = `ratelimit:${key}`;
  
  // Utiliser Redis avec TTL
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, Math.ceil(config.windowMs / 1000));
  }
  
  // ... logique de vérification
}
```

## Recommandations

1. **Court terme** : Le système actuel fonctionne pour le développement et les premiers utilisateurs
2. **Moyen terme** : Ajouter des tokens de session pour distinguer les utilisateurs anonymes
3. **Long terme** : Migrer vers Redis + authentification OAuth pour un rate limiting optimal
