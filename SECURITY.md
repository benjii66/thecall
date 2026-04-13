# 🔒 Security Policy / Politique de Sécurité

## 🇬🇧 English

### Reporting a Vulnerability
We take the security of **TheCall** seriously. If you believe you have found a security vulnerability, please **do not open a public issue**. Instead, please report it through one of the following channels:

- **Private Disclosure**: Reach out to the repository owner via their GitHub profile contact information.

We will acknowledge your report within 48 hours and provide a timeline for a fix.

### Supported Versions
Currently, only the `master` branch is actively supported and receiving security updates.

| Version | Supported          |
| ------- | ------------------ |
| v0.1.x  | ✅ YES              |
| < v0.1  | ❌ NO               |

### Implemented Security Measures
TheCall is built with security-first principles:
- **Strict Validation**: All user inputs (Riot ID, Match ID, etc.) are validated using Zod and custom filters.
- **Sanitization**: All external data (including Riot API responses) is sanitized before being used in the UI or logic.
- **Security Headers**: High-level HTTP headers (HSTS, CSP, X-Frame-Options) are enforced via Next.js configuration.
- **Rate Limiting**: API routes are protected by a robust rate-limiting system to prevent abuse.
- **Secret Protection**: API Keys (Riot, OpenAI, Stripe) are strictly server-side and never exposed to the client.

---

## 🇫🇷 Français

### Signaler une Vulnérabilité
La sécurité de **TheCall** est une priorité. Si vous pensez avoir découvert une vulnérabilité, merci de **ne pas ouvrir d'issue publique**. Veuillez plutôt la signaler via les canaux suivants :

- **Divulgation Privée** : Contactez le propriétaire du dépôt via les informations de contact de son profil GitHub.

Nous accuserons réception de votre rapport sous 48 heures et vous fournirons un délai pour la résolution.

### Versions Supportées
Actuellement, seule la branche `master` est activement supportée pour les mises à jour de sécurité.

| Version | Supportée          |
| ------- | ------------------ |
| v0.1.x  | ✅ OUI              |
| < v0.1  | ❌ NON              |

### Mesures de Sécurité Implémentées
TheCall est construit sur des bases sécurisées :
- **Validation Stricte** : Tous les inputs (Riot ID, Match ID, etc.) sont validés par Zod.
- **Sanitisation** : Les données externes sont nettoyées avant tout traitement.
- **Headers de Sécurité** : Utilisation de headers HTTP protecteurs (HSTS, CSP, X-Frame-Options).
- **Rate Limiting** : Protection contre les abus via un système de limitation de requêtes.
- **Protection des Secrets** : Les clés API restent exclusivement côté serveur.

---

<p align="center">
  <em>For more technical details, see our internal <a href="SECURITY_AUDIT.md">Security Audit</a>.</em>
</p>
