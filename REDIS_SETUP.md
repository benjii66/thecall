# 🔴 Configuration Redis pour Rate Limiting

## Pourquoi Redis ?

Le rate limiting actuel utilise la mémoire, ce qui pose problème en production :
- ❌ Perdu au redémarrage
- ❌ Non partagé entre instances (si plusieurs serveurs)
- ❌ Contournable en changeant d'instance

Redis résout ces problèmes avec un store distribué et persistant.

## Setup avec Upstash (Recommandé pour Vercel)

### 1. Créer un compte Upstash

1. Aller sur [upstash.com](https://upstash.com)
2. Créer un compte (gratuit jusqu'à 10K requêtes/jour)
3. Créer une nouvelle base de données Redis

### 2. Récupérer les credentials

Une fois la base créée, tu auras :
- `UPSTASH_REDIS_REST_URL` : URL de l'API REST
- `UPSTASH_REDIS_REST_TOKEN` : Token d'authentification

### 3. Ajouter dans `.env.local`

```env
# Redis (Upstash) - Optionnel, fallback sur mémoire si non configuré
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### 4. Vérifier que ça fonctionne

Le système détecte automatiquement si Redis est disponible :
- ✅ Si configuré → Utilise Redis
- ✅ Si non configuré → Fallback sur mémoire (comportement actuel)

Tu peux vérifier dans les logs :
```
[RATE_LIMIT] Redis initialisé avec succès
```

## Alternative : Vercel KV

Si tu es sur Vercel, tu peux aussi utiliser Vercel KV (basé sur Upstash) :
1. Dans le dashboard Vercel → Storage → Create KV Database
2. Les variables sont automatiquement injectées

## Coût

**Upstash Free Tier :**
- 10 000 requêtes/jour gratuit
- Parfait pour démarrer

**Si tu dépasses :**
- Pay-as-you-go : ~0.20$ pour 100K requêtes
- Très économique

## Migration

Aucune migration nécessaire ! Le code détecte automatiquement Redis et utilise le fallback mémoire si non disponible.

## Test

Pour tester que Redis fonctionne :

```bash
# En dev, vérifie les logs
npm run dev

# Tu devrais voir :
# [RATE_LIMIT] Redis initialisé avec succès
```

Si tu ne vois pas ce message, Redis n'est pas configuré et le fallback mémoire est utilisé (comportement normal en dev).
