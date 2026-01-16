# 🔍 Diagnostic API Riot

## Problème
L'API `/api/matches` retourne une erreur `Response not OK`.

## Vérifications à faire

### 1. Vérifier que la clé API est bien chargée

Ouvre la console du serveur (terminal où tourne `npm run dev`) et cherche :
- `[MATCHES API] RIOT_API_KEY manquante` → La clé n'est pas chargée
- `Riot API key invalide ou expirée` → La clé est invalide (401)
- `Riot API key sans permissions` → La clé n'a pas les bonnes permissions (403)

### 2. Vérifier le format de la clé dans `.env.local`

Assure-toi que ton fichier `.env.local` contient :
```env
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Important :**
- Pas d'espaces autour du `=`
- Pas de guillemets autour de la valeur
- Pas de ligne vide avant/après

### 3. Redémarrer le serveur

Après avoir modifié `.env.local`, **tu dois redémarrer le serveur** :
1. Arrête le serveur (Ctrl+C)
2. Relance `npm run dev`

### 4. Vérifier que la clé fonctionne

Teste ta clé directement avec curl :
```bash
curl "https://europe.api.riotgames.com/lol/summoner/v4/summoners/by-name/Test?api_key=TA_CLE_API"
```

Si ça retourne 401 ou 403, ta clé est invalide ou expirée.

### 5. Vérifier les logs serveur

Dans la console du serveur, tu devrais voir :
```
[MATCHES API] Début fetch matches
[MATCHES API] Fetch IDs batch 1
```

Si tu vois une erreur, note le message exact.

## Solutions possibles

### Si la clé n'est pas chargée
1. Vérifie que `.env.local` existe à la racine du projet
2. Vérifie le format (pas d'espaces, pas de guillemets)
3. Redémarre le serveur

### Si la clé est invalide (401)
1. Va sur https://developer.riotgames.com/
2. Génère une nouvelle clé API
3. Remplace la clé dans `.env.local`
4. Redémarre le serveur

### Si la clé n'a pas les permissions (403)
1. Va sur https://developer.riotgames.com/
2. Vérifie que ta clé a les permissions pour "Match Data"
3. Si besoin, génère une nouvelle clé

### Si rate limit (429)
1. Attends quelques secondes
2. Réessaye

## Test rapide

Ouvre la console du navigateur (F12) et regarde l'onglet Network :
1. Va sur la page `/match`
2. Cherche la requête vers `/api/matches`
3. Regarde le status code et la réponse

Si le status est 500, regarde les logs serveur pour voir l'erreur exacte.
