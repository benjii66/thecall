# Architecture Base de Données - TheCall

## Recommandation : PostgreSQL + Prisma

**Pourquoi PostgreSQL ?**
- Relationnel adapté aux relations user → subscriptions → analyses
- ACID, transactions, contraintes d'intégrité
- Performance avec index et requêtes optimisées
- Support Next.js excellent avec Prisma
- Hosting facile (Neon, Vercel Postgres, Supabase, Railway)

**Pourquoi Prisma ?**
- Type-safe avec génération TypeScript automatique
- Migrations automatiques
- Excellente DX
- Support natif Next.js App Router

**Note** : Tu utilises déjà Neon, donc on reste sur Neon + Prisma.

---

## Schema de Base de Données

### 1. Table `users`

Stocke les utilisateurs et leurs infos de base.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puuid TEXT UNIQUE NOT NULL,
  riot_id TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_puuid ON users(puuid);
CREATE INDEX idx_users_email ON users(email);
```

**Données** :
- PUUID Riot (unique, identifiant principal)
- Riot ID (gameName#tagLine) pour affichage
- Email (pour Stripe/webhooks)
- Dates création/modification

---

### 2. Table `subscriptions`

Stocke les abonnements Stripe des utilisateurs.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**Workflow Stripe** :
1. User checkout → webhook `checkout.session.completed`
2. Créer/update subscription avec `stripe_subscription_id`
3. Webhook `customer.subscription.updated` → update status/dates
4. Webhook `customer.subscription.deleted` → set status = 'canceled'

---

### 3. Table `match_analyses`

Stocke les analyses de matchs effectuées par les utilisateurs.

```sql
CREATE TABLE match_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  
  match_data JSONB NOT NULL,
  coaching_report JSONB,
  
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_match_analyses_user_id ON match_analyses(user_id);
CREATE INDEX idx_match_analyses_match_id ON match_analyses(match_id);
CREATE INDEX idx_match_analyses_created_at ON match_analyses(created_at DESC);
CREATE INDEX idx_match_analyses_user_created ON match_analyses(user_id, created_at DESC);
```

**Données** :
- User ID + Match ID (unique ensemble)
- Match data (JSONB avec toutes les données)
- Coaching report (JSONB avec rapport)
- is_premium (coaching premium ou basique)
- created_at (pour limite mensuelle)

**Pourquoi JSONB ?**
- Historique complet des analyses
- Flexibilité structure (ajout champs sans migration)
- Requêtes rapides avec index
- Limite mensuelle : `COUNT(*)` avec filtre date

**Exemple requête limite mensuelle** :
```sql
SELECT COUNT(*) FROM match_analyses
WHERE user_id = $1
  AND created_at >= date_trunc('month', NOW());
```

---

### 4. Table `usage_limits` (OPTIONNEL)

Pour optimisation si beaucoup d'analyses. Sinon, utiliser `COUNT(*)` sur `match_analyses`.

```sql
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('monthly')),
  
  analyses_count INTEGER DEFAULT 0,
  analyses_limit INTEGER NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_type)
);

CREATE INDEX idx_usage_limits_user_period ON usage_limits(user_id, period_start DESC);
```

**Recommandation MVP** : Commencer par `COUNT(*)` sur `match_analyses`, optimiser après si besoin.

---

## Relations

```
users (1) ──→ (N) subscriptions
  │
  └──→ (N) match_analyses
  │
  └──→ (N) usage_limits
```

---

## Indexes Recommandés

**Performance critiques** :
- `users.puuid` : Lookup fréquent
- `users.email` : Pour Stripe lookup
- `subscriptions.user_id` : FK lookup
- `subscriptions.stripe_customer_id` : Webhook lookup
- `match_analyses.user_id` : FK lookup
- `match_analyses(user_id, created_at DESC)` : Historique user + limite mensuelle
- `match_analyses.match_id` : Recherche par match

---

## Migration Stratégie

### Phase 1 : Setup Prisma + Neon
1. Installer Prisma
2. Créer schema (users, subscriptions, match_analyses)
3. Migration initiale

### Phase 2 : Intégration progressive
1. Création user au premier login
2. Stocker analyses dans DB
3. Vérifier limites depuis DB (COUNT(*))
4. Intégrer Stripe (créer user au checkout)

### Phase 3 : Production
- Optimisations (indexes, requêtes)
- Monitoring (slow queries)
- Optionnel: `usage_limits` si besoin optimisation

---

## Volume Estimé

**1000 utilisateurs actifs** :
- `users` : ~1000 lignes
- `subscriptions` : ~100-200 lignes (10-20% conversion)
- `match_analyses` : ~10,000-50,000 lignes/mois
- Total après 1 an : ~6 GB (acceptable PostgreSQL)

---

## Schema Prisma (exemple)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  puuid     String   @unique
  riotId    String?
  email     String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  subscription Subscription?
  matchAnalyses MatchAnalysis[]
  usageLimits   UsageLimit[]
}

model Subscription {
  id                  String    @id @default(uuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tier                String
  status              String
  stripeCustomerId    String?   @unique
  stripeSubscriptionId String?  @unique
  stripePriceId       String?
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  canceledAt          DateTime?
  trialEndsAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model MatchAnalysis {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  matchId       String
  matchData     Json
  coachingReport Json?
  isPremium     Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@unique([userId, matchId])
  @@index([userId, createdAt(sort: Desc)])
}

model UsageLimit {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  periodStart    DateTime
  periodType     String   @default("monthly")
  analysesCount  Int      @default(0)
  analysesLimit  Int
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([userId, periodStart, periodType])
  @@index([userId, periodStart(sort: Desc)])
}
```

---

## Outils Recommandés

**ORM** : Prisma
```bash
npm install prisma @prisma/client
npx prisma init
```

**Base de données** : Neon (déjà utilisé)
- PostgreSQL serverless
- Branchings pour dev/test
- Free tier généreux

**Migration** :
```bash
npx prisma migrate dev --name init
npx prisma migrate deploy  # Production
```

---

## Recommandation Finale

**Tables essentielles MVP** :
1. `users` (identifiant)
2. `subscriptions` (gestion Stripe)
3. `match_analyses` (historique + limite mensuelle via COUNT)

**Tables à ajouter plus tard** :
- `usage_limits` (si besoin optimisation COUNT)

**Migration progressive** :
1. Setup Prisma + Neon (déjà fait partiellement)
2. Créer tables (users, subscriptions, match_analyses)
3. Intégrer Stripe (créer user au checkout)
4. Stocker analyses dans DB
5. Vérifier limites depuis DB (COUNT(*))
