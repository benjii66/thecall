# Stratégie Pricing - TheCall

## Prix
- **Gratuit** : Tier Free (limité mais généreux)
- **Payant** : 5.99€/mois (ou 49.99€/an = -2 mois)
- **Lancement** : 3.99€/mois (promo early adopters via coupon Stripe)

---

## Philosophie : "Wow + Preuve, sans tout donner"

**Principe** : Donner accès complet aux matchs (notre différenciant) mais limiter l'action coaching et verrouiller les insights profonds.

---

## Différenciation Free vs Pro

### 🆓 TIER GRATUIT (Free)

**Objectif** : Montrer la valeur du produit, créer une frustration douce avec paywall propre (pas de mur noir).

#### ✅ Accessible gratuitement (accès complet) :

1. **Match Analysis** : Accès complet (notre aimant différenciant)
   - ✅ Timeline complète + Win Probability + Events (tout visible)
   - ✅ Stats match + Duel + Builds (visibles)
   - ✅ Consultation illimitée des matchs (pas de limite de visualisation)

2. **Historique** : 5 derniers matchs seulement
   - Consultation des 5 derniers matchs analysés

3. **Profil global** : Mini-version (basé sur 5-10 matchs)
   - ✅ 2-3 traits de style de jeu (agression / focus objectifs / teamfights)
   - ✅ 1 insight "headline" (une phrase)
   - ✅ 1 axe prioritaire (titre seulement)
   - ❌ Insights détaillés verrouillés
   - ❌ Patterns récurrents verrouillés
   - ❌ Rapport mensuel verrouillé

4. **Coaching** : 5 coachings/mois (limite l'action "Coach", pas la consultation)
   - ✅ Coaching basique (heuristique courte et smart) :
     - Moment clé (fenêtre + impact)
     - Focus prioritaire (1 phrase)
     - Action next game (1 instruction)
   - 🔒 Sections premium visibles mais verrouillées (avec aperçu flou) :
     - Causes racines (preuves + détails) 🔒
     - Plan d'action (3 règles + anti-erreurs) 🔒
     - Drills / exercices sur 5 games 🔒

5. **Partage** : Possible mais avec watermark "Free" (viral marketing)

#### 🔒 Verrouillé gratuitement :
- ❌ Profil global complet (patterns + rapport mensuel)
- ❌ Coaching IA premium (LLM avec causes racines + plan + drills)
- ❌ Export PDF (ou avec watermark)
- ❌ Historique étendu (50+ matchs)
- ❌ Analyse build vs meta approfondie

---

### 💎 TIER PRO (5.99€/mois, 3.99€ lancement)

**Objectif** : Tout débloqué + insights premium + progression mesurée.

#### ✅ Tout du gratuit + :

1. **Coaching illimité** : Pas de limite mensuelle
   - Option "safety" : limite fair-use silencieuse très haute (50-100 coachings/mois) pour éviter abus

2. **Coaching IA Premium** (LLM GPT-4o-mini) :
   - ✅ Causes racines + preuves (events, timings détaillés)
   - ✅ Plan d'action (priorités early/mid/late)
   - ✅ Drills (exercices sur 3-5 games)
   - ✅ Analyse build vs meta / cohérence
   - ✅ Détection patterns d'erreurs récurrents

3. **Profil global complet** :
   - ✅ Analyse de 50+ matchs (ou illimité)
   - ✅ Style de jeu + patterns récurrents
   - ✅ Axes d'amélioration personnalisés
   - ✅ Rapport mensuel de progression :
     - 3 sous-scores (tempo/objectifs, économie, sécurité/impact)
     - Évolution 30 jours + 3 priorités du mois

4. **Historique étendu** : 50+ matchs (ou illimité)

5. **Export PDF** : Rapports coaching exportables en PDF (sans watermark)

6. **Partage** : Partager matchs/insights avec liens (sans watermark)

7. **Support prioritaire** : Réponses rapides aux questions

---

## Stratégie UX (Paywall Propre + Triggers de Conversion)

### 1. Paywall Propre (pas de mur noir)

**Quand l'utilisateur clique "Coach" en Free** :
- ✅ Affiche les cartes gratuites (Moment clé / Focus / Action next game)
- 🔒 Juste en dessous : 3 blocs premium verrouillés avec aperçu :
  - "Causes racines" (titre + flou + icône 🔒)
  - "Plan d'action" (titre + flou + icône 🔒)
  - "Drills / exercices" (titre + flou + icône 🔒)
- CTA unique : "Débloquer mon coaching Pro" (+ prix 3.99€/mois)

### 2. Quota Lisible

**En haut du tab Coach** :
- Free : "Coaching Free : 2/5 restants ce mois-ci" (badge visible)
- Quand quota = 0 : Match + graph toujours visibles, mais bouton "Coach" devient "Upgrade Pro pour coaching illimité"

### 3. Profil Global : Mini-Version en Free

**Ne pas bloquer totalement** :
- ✅ Affiche mini-profil (barres + 1 insight headline)
- 🔒 Sections verrouillées avec CTA :
  - "Insights détaillés" 🔒
  - "Patterns récurrents" 🔒
  - "Plan d'amélioration" 🔒
  - "Rapport mensuel" 🔒

### 4. Triggers de Conversion (au bon moment)

**Banner contextuel après le 1er coaching** :
- "Tu veux les causes + le plan + les drills ? Upgrade Pro."

**Banner après 5/5 coachings** :
- "Upgrade Pro pour coaching illimité + profil complet."

**Banner dans profil mini** :
- "Débloquer profil complet avec 50+ matchs + rapport mensuel"

### 5. Copy Courte (promesse claire)

**Landing / CTA** :
- "Comprends où ça s'est joué. Sais quoi changer."

**Sur paywall** :
- "Causes → Plan → Drills → Progression mesurée."

**Dans coaching basique** :
- "Coaching basique" (badge)
- "Upgrade pour causes racines + plan d'action + drills"

---

## Recommandations d'implémentation

### Priorité 1 : Core différenciation
1. ✅ Limiter analyses (5/mois pour free)
2. ✅ Bloquer profil global (free)
3. ✅ Coaching basique vs premium (déjà fait, juste vérifier tier)
4. ✅ Historique limité (10 matchs free)

### Priorité 2 : Features premium
5. Export PDF
6. Partage de matchs
7. Analyse build vs meta (dans coaching premium)

### Priorité 3 : Nice to have
8. Comparaison avec joueurs similaires
9. Heatmaps
10. Notifications

---

## Messages marketing

### Gratuit → Pro :
- "Passe de 5 à analyses illimitées"
- "Coaching IA premium avec analyse approfondie"
- "Profil global : découvre ton style de jeu sur 50+ matchs"
- "Exporte tes rapports en PDF"
- "Historique illimité de tes performances"

### Pricing page :
- **Gratuit** : "Parfait pour tester"
- **Pro** : "Pour progresser sérieusement" (5.99€/mois ou 49.99€/an)

---

## Notes techniques

- Vérifier tier utilisateur dans middleware/helper
- Compteur d'analyses par mois (reset le 1er du mois)
- Cache des matchs : free = 10 max, pro = illimité
- Coaching : `isPremium` déjà implémenté, juste vérifier tier
- Profil : bloquer route `/profile` si free tier
