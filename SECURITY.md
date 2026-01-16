# 🔒 Guide de Sécurité - TheCall

Ce document décrit les mesures de sécurité implémentées dans l'application TheCall.

## ✅ Mesures de Sécurité Implémentées

### 1. Validation et Sanitisation des Inputs

Tous les inputs utilisateur sont validés et sanitisés avant utilisation :

- **PUUID** : Validation du format UUID v4 (32 hex avec tirets)
- **Match ID** : Validation du format `REGION1_ID` (ex: `EUW1_1234567890`)
- **Game Name** : 3-16 caractères alphanumériques, espaces, tirets, underscores uniquement
- **Tag Line** : 3-5 caractères alphanumériques uniquement
- **Game Type** : Validation stricte (`all`, `draft`, `ranked`)
- **Tab** : Validation stricte (`overview`, `coach`)

**Fichiers concernés** :
- `lib/security.ts` - Fonctions de validation
- `app/api/account/route.ts` - Validation gameName/tagLine
- `app/api/match/[id]/route.ts` - Validation matchId/puuid
- `app/api/matches/route.ts` - Validation puuid/type
- `app/match/page.tsx` - Validation matchId côté serveur

### 2. Protection contre les Injections

- **URLs Riot API** : Sanitisation des paths pour éviter les injections (`..`, `//`, caractères dangereux)
- **Encodage URL** : Utilisation de `encodeURIComponent` pour tous les paramètres d'URL
- **Validation des endpoints** : Vérification que les endpoints ne contiennent pas de caractères dangereux

**Fichiers concernés** :
- `lib/riot.ts` - Sanitisation des endpoints
- `lib/security.ts` - Fonction `sanitizeForUrl`

### 3. Headers de Sécurité HTTP

Headers de sécurité ajoutés via `next.config.ts` et dans les réponses API :

- **X-Frame-Options: DENY** - Protection contre clickjacking
- **X-Content-Type-Options: nosniff** - Empêche MIME sniffing
- **X-XSS-Protection: 1; mode=block** - Protection XSS (navigateurs anciens)
- **Referrer-Policy: strict-origin-when-cross-origin** - Contrôle des référents
- **Permissions-Policy** - Désactive les APIs sensibles (géolocalisation, caméra, etc.)
- **Strict-Transport-Security** - HSTS en production (HTTPS uniquement)

**Fichiers concernés** :
- `next.config.ts` - Headers globaux
- `app/api/coaching/route.ts` - Headers sur réponses API
- `lib/headers.ts` - Fonctions utilitaires (pour usage futur)

### 4. Limitation de Taille des Données

- **Body requests** : Limite de 5MB pour les requêtes POST
- **Validation JSON** : Vérification de la taille des objets JSON avant traitement

**Fichiers concernés** :
- `app/api/coaching/route.ts` - Validation de la taille du body
- `lib/security.ts` - Fonction `validateJsonSize`

### 5. Protection des Secrets

- **Variables d'environnement** : Secrets stockés dans `.env.local` (non commité)
- **API Keys** : Jamais exposées côté client (pas de `NEXT_PUBLIC_` pour les secrets)
- **Validation** : Vérification de la présence des clés API avant utilisation

**Variables sensibles** :
- `RIOT_API_KEY` - Clé API Riot (serveur uniquement)
- `OPENAI_API_KEY` - Clé API OpenAI (serveur uniquement)
- `STRIPE_PRICE_ID_*` - IDs Stripe (serveur uniquement)

**Variables publiques (non sensibles)** :
- `NEXT_PUBLIC_DEV_TIER` - Uniquement pour développement local
- `NEXT_PUBLIC_SITE_URL` - URL publique du site

### 6. Protection des Routes API

- **Middleware** : Vérification du tier utilisateur pour les routes protégées
- **Quotas** : Limitation du nombre de coachings par mois (free tier)
- **Validation tier** : Vérification avant chaque action premium

**Fichiers concernés** :
- `middleware.ts` - Protection des routes
- `app/api/coaching/route.ts` - Vérification quota/tier
- `lib/tier.ts` - Logique de gestion des tiers

### 7. Gestion des Erreurs

- **Messages d'erreur génériques** : Pas d'exposition d'informations sensibles dans les erreurs
- **Logging sécurisé** : Les logs ne contiennent pas de données sensibles
- **Gestion des exceptions** : Try/catch sur toutes les opérations critiques

## ⚠️ Points d'Attention

### 1. Rate Limiting

**Statut** : ⚠️ Non implémenté

Les routes API ne sont pas protégées par un rate limiting. Il est recommandé d'ajouter :
- Rate limiting par IP
- Rate limiting par utilisateur (quand l'authentification sera implémentée)
- Protection contre les attaques DDoS

**Recommandation** : Utiliser un service comme Vercel Edge Config, Upstash Redis, ou un middleware Next.js.

### 2. Authentification

**Statut** : ⚠️ Non implémentée

L'authentification Riot OAuth n'est pas encore implémentée. Actuellement :
- Pas de session utilisateur
- Pas de tokens CSRF
- Pas de vérification d'identité

**Recommandation** : Implémenter l'OAuth Riot avec :
- Sessions sécurisées (httpOnly cookies)
- Tokens CSRF pour les routes POST
- Refresh tokens

### 3. Validation des Données Riot API

**Statut** : ✅ Partiellement implémenté

Les données reçues de l'API Riot sont partiellement validées. Il serait recommandé d'ajouter :
- Validation stricte des types de données
- Validation de la structure des objets
- Protection contre les données malformées

### 4. CORS

**Statut** : ⚠️ À configurer

Next.js gère CORS par défaut, mais il faudra configurer les origines autorisées en production.

**Recommandation** : Configurer CORS dans `next.config.ts` pour limiter les origines autorisées.

### 5. Content Security Policy (CSP)

**Statut** : ⚠️ Basique

Une CSP basique est définie dans `next.config.ts`, mais elle utilise `unsafe-inline` pour les scripts/styles (nécessaire pour Next.js/Tailwind).

**Recommandation** : En production, utiliser des nonces ou hashes pour les scripts/styles inline.

## 🔐 Bonnes Pratiques Appliquées

1. ✅ **Principe du moindre privilège** : Seules les données nécessaires sont exposées
2. ✅ **Validation côté serveur** : Toutes les validations sont faites côté serveur
3. ✅ **Sanitisation** : Tous les inputs sont sanitisés avant utilisation
4. ✅ **Headers de sécurité** : Headers HTTP de sécurité configurés
5. ✅ **Gestion d'erreurs** : Messages d'erreur génériques, pas d'exposition de secrets
6. ✅ **Variables d'environnement** : Secrets stockés de manière sécurisée

## 📋 Checklist de Déploiement

Avant de déployer en production :

- [ ] Vérifier que tous les secrets sont dans `.env.local` (non commité)
- [ ] Configurer CORS pour les origines autorisées
- [ ] Activer HTTPS (HSTS sera automatiquement activé)
- [ ] Implémenter le rate limiting
- [ ] Configurer un WAF (Web Application Firewall) si possible
- [ ] Activer les logs de sécurité
- [ ] Configurer des alertes pour les tentatives d'intrusion
- [ ] Tester les validations avec des inputs malveillants
- [ ] Vérifier que les headers de sécurité sont bien présents
- [ ] Auditer les dépendances npm pour les vulnérabilités (`npm audit`)

## 🛡️ Protection contre les Vulnérabilités Courantes

### OWASP Top 10

1. **Injection** ✅ - Tous les inputs sont validés et sanitisés
2. **Broken Authentication** ⚠️ - À implémenter avec OAuth
3. **Sensitive Data Exposure** ✅ - Secrets non exposés, HTTPS requis
4. **XML External Entities** ✅ - Pas d'utilisation de XML
5. **Broken Access Control** ⚠️ - Partiellement implémenté (tier-based)
6. **Security Misconfiguration** ✅ - Headers de sécurité configurés
7. **XSS** ✅ - Protection via headers, pas de `dangerouslySetInnerHTML`
8. **Insecure Deserialization** ✅ - Validation des données JSON
9. **Using Components with Known Vulnerabilities** ⚠️ - À vérifier régulièrement (`npm audit`)
10. **Insufficient Logging & Monitoring** ⚠️ - Logging basique, à améliorer

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Riot API Security](https://developer.riotgames.com/docs/security)
