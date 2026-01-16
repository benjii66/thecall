# 🔒 Audit de Sécurité - TheCall

**Date** : 2025-01-XX  
**Version** : 2.0  
**Score** : 81/100 ✅

## ✅ Mesures de Sécurité Implémentées

### 1. Validation et Sanitisation ✅

**Statut** : ✅ **IMPLÉMENTÉ**

Tous les inputs utilisateur sont validés avant utilisation :

- ✅ **PUUID** : Validation format UUID v4 (32 hex avec tirets)
- ✅ **Match ID** : Validation format `REGION1_ID` (ex: `EUW1_1234567890`)
- ✅ **Game Name** : 3-16 caractères, alphanumériques + espaces/tirets/underscores
- ✅ **Tag Line** : 3-5 caractères alphanumériques
- ✅ **Game Type** : Validation stricte (`all`, `draft`, `ranked`)
- ✅ **Tab** : Validation stricte (`overview`, `coach`)

**Fichiers** :
- `lib/security.ts` - Fonctions de validation centralisées
- `app/api/account/route.ts` - Validation gameName/tagLine
- `app/api/match/[id]/route.ts` - Validation matchId/puuid
- `app/api/matches/route.ts` - Validation puuid/type
- `app/match/page.tsx` - Validation matchId côté serveur

### 2. Protection contre les Injections ✅

**Statut** : ✅ **IMPLÉMENTÉ**

- ✅ Sanitisation des endpoints Riot API (suppression de `..`, `//`, caractères dangereux)
- ✅ Encodage URL avec `encodeURIComponent` pour tous les paramètres
- ✅ Validation des endpoints avant construction des URLs
- ✅ Protection contre les injections dans les query params

**Fichiers** :
- `lib/riot.ts` - Sanitisation des endpoints
- `lib/security.ts` - Fonction `sanitizeForUrl` et `hasDangerousChars`

### 3. Headers de Sécurité HTTP ✅

**Statut** : ✅ **IMPLÉMENTÉ**

Headers configurés dans `next.config.ts` et sur les réponses API :

- ✅ `X-Frame-Options: DENY` - Protection clickjacking
- ✅ `X-Content-Type-Options: nosniff` - Empêche MIME sniffing
- ✅ `X-XSS-Protection: 1; mode=block` - Protection XSS
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy` - Désactive APIs sensibles
- ✅ `Strict-Transport-Security` - HSTS en production

**Fichiers** :
- `next.config.ts` - Headers globaux
- `app/api/coaching/route.ts` - Headers sur réponses API
- `lib/headers.ts` - Fonctions utilitaires (pour usage futur)

### 4. Limitation de Taille ✅

**Statut** : ✅ **IMPLÉMENTÉ**

- ✅ Limite de 5MB pour les requêtes POST
- ✅ Validation de la taille des objets JSON

**Fichiers** :
- `app/api/coaching/route.ts` - Validation taille body
- `lib/security.ts` - Fonction `validateJsonSize`

### 5. Protection des Secrets ✅

**Statut** : ✅ **IMPLÉMENTÉ**

- ✅ Secrets dans `.env.local` (non commité)
- ✅ Pas de `NEXT_PUBLIC_` pour les secrets
- ✅ Validation de la présence des clés API

**Secrets protégés** :
- `RIOT_API_KEY` - Serveur uniquement
- `OPENAI_API_KEY` - Serveur uniquement
- `STRIPE_PRICE_ID_*` - Serveur uniquement

### 6. Protection des Routes ✅

**Statut** : ✅ **PARTIELLEMENT IMPLÉMENTÉ**

- ✅ Middleware pour vérification tier
- ✅ Quotas coaching (free tier)
- ⚠️ Pas d'authentification utilisateur (à venir avec OAuth)

**Fichiers** :
- `middleware.ts` - Protection routes
- `app/api/coaching/route.ts` - Vérification quota/tier

## ⚠️ Points à Améliorer

### 1. Rate Limiting ✅

**Statut** : ✅ **IMPLÉMENTÉ**

**Implémentation** :
- Rate limiting en mémoire pour le développement (via `lib/rateLimit.ts`)
- Configuration par route :
  - Routes générales : 100 requêtes/minute
  - Route coaching : 10 requêtes/minute (stricte)
- Headers `X-RateLimit-*` retournés dans toutes les réponses
- Support des headers proxy (`x-forwarded-for`, `x-real-ip`)

**Note** : En production, migrer vers Redis ou Vercel Edge Config pour un partage entre instances.

**Support Multi-Utilisateurs** :
- ✅ Identification par userId (quand auth disponible)
- ✅ Identification par session token (distinction par session)
- ✅ Fallback par IP (limitation : utilisateurs partageant IP = même quota)
- ✅ Documentation dans `lib/rateLimit.md`

**Conformité RGPD** :
- ✅ Bannière de consentement aux cookies
- ✅ Page de politique de confidentialité (`/privacy`)
- ✅ Gestion du consentement par catégorie (nécessaires, fonctionnels, analytiques)
- ✅ Cookies de session créés uniquement après consentement
- ✅ Traductions FR/EN complètes

**Fichiers** :
- `lib/rateLimit.ts` - Implémentation du rate limiting avec support multi-utilisateurs
- `lib/rateLimit.md` - Documentation détaillée
- `app/api/coaching/route.ts` - Rate limiting strict (10 req/min)
- `app/api/match/[id]/route.ts` - Rate limiting standard
- `app/api/matches/route.ts` - Rate limiting standard
- `app/api/account/route.ts` - Rate limiting standard

### 2. Authentification ⚠️

**Statut** : ⚠️ **NON IMPLÉMENTÉE**

**Risque** : Accès non autorisé, manipulation de données

**Recommandation** :
- Implémenter OAuth Riot
- Sessions sécurisées (httpOnly cookies)
- Tokens CSRF pour routes POST
- Refresh tokens

**Priorité** : 🔴 **HAUTE**

### 3. CSRF Protection ⚠️

**Statut** : ⚠️ **NON IMPLÉMENTÉE**

**Risque** : Cross-Site Request Forgery

**Recommandation** :
- Tokens CSRF pour toutes les routes POST
- Vérification de l'origine des requêtes

**Priorité** : 🟡 **MOYENNE** (à faire avec l'authentification)

### 4. CORS Configuration ✅

**Statut** : ✅ **CONFIGURÉ**

**Implémentation** :
- Configuration CORS dans `next.config.ts` pour toutes les routes `/api/*`
- Headers configurés :
  - `Access-Control-Allow-Origin` : Basé sur `NEXT_PUBLIC_SITE_URL` ou domaine de production
  - `Access-Control-Allow-Methods` : GET, POST, OPTIONS
  - `Access-Control-Allow-Headers` : Content-Type, Authorization, X-CSRF-Token
  - `Access-Control-Allow-Credentials` : true
  - `Access-Control-Max-Age` : 86400 (24h)

**Fichiers** :
- `next.config.ts` - Configuration CORS

### 5. Content Security Policy ⚠️

**Statut** : ⚠️ **BASIQUE**

**Risque** : XSS via scripts/styles malveillants

**Recommandation** :
- Utiliser des nonces ou hashes pour scripts/styles inline
- Restreindre davantage les sources autorisées

**Priorité** : 🟢 **FAIBLE** (déjà protégé par headers XSS)

### 6. Validation Données Riot API ✅

**Statut** : ✅ **VALIDATION STRICTE IMPLÉMENTÉE**

**Implémentation** :
- `lib/validateRiotData.ts` avec fonctions de validation :
  - `validateRiotMatch()` : Valide la structure complète d'un match (metadata, info, participants, etc.)
  - `validateRiotTimeline()` : Valide la structure d'une timeline (frames, events, etc.)
  - `validateRiotResponseSize()` : Limite la taille des réponses (max 10MB)
- Validation appliquée dans :
  - `app/api/match/[id]/route.ts` : Validation match + timeline
  - `app/api/matches/route.ts` : Validation de chaque match avant traitement
- Protection contre les données malformées et DoS par taille excessive

**Fichiers** :
- `lib/validateRiotData.ts` - Fonctions de validation
- `app/api/match/[id]/route.ts` - Validation match/timeline
- `app/api/matches/route.ts` - Validation matches

## 🔍 Vulnérabilités Détectées

### Dépendances npm

**Vulnérabilités détectées** : 3 high severity

- **hono** (via @prisma/dev) : Vulnérabilités JWT
  - **Impact** : Faible (Prisma utilisé uniquement en dev, pas en production)
  - **Action** : Mettre à jour Prisma quand une version corrigée sera disponible
  - **Priorité** : 🟢 **FAIBLE** (pas utilisé en production)

**Note** : Prisma n'est pas utilisé dans le code de production actuel. Les vulnérabilités sont dans les dépendances de développement uniquement.

## 📊 Score de Sécurité

| Catégorie | Statut | Score |
|-----------|--------|-------|
| Validation Inputs | ✅ | 10/10 |
| Protection Injections | ✅ | 10/10 |
| Headers Sécurité | ✅ | 9/10 |
| Limitation Taille | ✅ | 10/10 |
| Protection Secrets | ✅ | 10/10 |
| Rate Limiting | ✅ | 10/10 |
| Authentification | ⚠️ | 2/10 |
| CSRF Protection | ⚠️ | 0/10 |
| CORS | ✅ | 10/10 |
| Validation Données | ✅ | 10/10 |

**Score Global** : **81/100** ✅

## 🎯 Plan d'Action Prioritaire

### Priorité 🔴 HAUTE

1. **Implémenter Authentification OAuth Riot**
   - Sessions sécurisées (httpOnly cookies)
   - Tokens CSRF
   - Refresh tokens

### Priorité 🟡 MOYENNE

3. **Améliorer Rate Limiting en Production**
   - Migrer vers Redis ou Vercel Edge Config
   - Partage entre instances
   - Rate limiting par utilisateur (quand auth sera implémentée)

### Priorité 🟢 FAIBLE

5. **Améliorer CSP**
   - Utiliser nonces/hashes pour scripts/styles

6. **Mettre à jour Prisma**
   - Attendre version corrigée des vulnérabilités JWT

## ✅ Checklist Déploiement Production

Avant de déployer :

- [x] Validation et sanitisation des inputs
- [x] Headers de sécurité configurés
- [x] Secrets non exposés
- [x] Protection contre injections
- [x] Limitation taille données
- [x] **Rate limiting implémenté** ✅
- [ ] **Authentification implémentée** ⚠️
- [ ] **CSRF protection** ⚠️
- [x] CORS configuré ✅
- [ ] Tests de sécurité effectués
- [ ] Audit dépendances npm (`npm audit`)
- [ ] HTTPS activé
- [ ] Logs de sécurité configurés

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Riot API Security](https://developer.riotgames.com/docs/security)
