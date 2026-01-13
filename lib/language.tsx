"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traductions
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navbar
    "navbar.overview": "Overview",
    "navbar.coach": "Coach",
    "navbar.backToMatches": "Retour aux matchs",
    "navbar.profile": "Profil",
    "navbar.pro": "Pro",
    "navbar.settings": "Paramètres",
    "navbar.manageSubscription": "Gérer mon abonnement",
    "navbar.upgradeToPro": "Passer à Pro",
    "navbar.logout": "Se déconnecter",
    "navbar.userTierFree": "Tier Gratuit",
    "navbar.userTierPro": "Tier Pro",
    
    // Settings
    "settings.title": "Paramètres",
    "settings.subtitle": "Gère tes préférences et tes options",
    "settings.language": "Langue",
    "settings.languageDesc": "Choisis la langue de l'interface",
    "settings.saving": "Sauvegarde...",
    "settings.futureSettings": "D'autres paramètres seront disponibles prochainement",
    
    // Subscription
    "subscription.title": "Gestion de l'abonnement",
    "subscription.subtitle": "Gère ton abonnement Pro",
    "subscription.planPro": "Plan Pro",
    "subscription.planFree": "Plan Gratuit",
    "subscription.proDesc": "Accès complet à toutes les fonctionnalités",
    "subscription.freeDesc": "Accès limité aux fonctionnalités de base",
    "subscription.active": "ACTIF",
    "subscription.renewalDate": "Renouvellement automatique le",
    "subscription.cancelling": "Ton abonnement sera annulé à la fin de la période de facturation",
    "subscription.actions": "Actions",
    "subscription.cancel": "Annuler l'abonnement",
    "subscription.reactivate": "Réactiver l'abonnement",
    "subscription.downgrade": "Passer en gratuit immédiatement",
    "subscription.upgradeTitle": "Passe à Pro",
    "subscription.upgradeDesc": "Débloque toutes les fonctionnalités premium",
    "subscription.viewOffers": "Voir les offres",
    "subscription.paymentInfo": "Informations de paiement",
    "subscription.paymentInfoDesc": "La gestion des méthodes de paiement sera disponible prochainement",
    "subscription.cancelConfirmTitle": "Annuler l'abonnement ?",
    "subscription.cancelConfirmDesc": "Ton abonnement restera actif jusqu'à la fin de la période de facturation ({date}). Tu pourras toujours réactiver avant cette date.",
    "subscription.downgradeConfirmTitle": "Passer en gratuit ?",
    "subscription.downgradeConfirmDesc": "Tu perdras immédiatement l'accès aux fonctionnalités Pro. Cette action est irréversible jusqu'à ce que tu repasses à Pro.",
    "subscription.processing": "Traitement...",
    "subscription.confirm": "Confirmer",
    "subscription.cancelAction": "Annuler",
    "subscription.loading": "Chargement...",
    
    // Landing Page
    "landing.beta": "Beta privée",
    "landing.focus": "Focus macro",
    "landing.postGame": "Post-game coaching",
    "landing.tagline": "The Call • Coaching League of Legends",
    "landing.title": "Tu es stuck et tu comprends pas pourquoi ?",
    "landing.titleHighlight": "TheCall",
    "landing.titleEnd": "te montre où la game bascule.",
    "landing.subtitle": "TheCall — ton coach macro post-game.",
    "landing.description": "Plus de stats sans explication. Tu comprends le moment clé où ça bascule, la cause racine (macro, tempo, objectifs), et un plan concret pour ta prochaine game.",
    "landing.analyzeButton": "Analyser ma dernière game",
    "landing.riotConnect": "Connexion Riot (bientôt)",
    "landing.riotConnectTitle": "Connexion Riot via RSO — en cours de validation",
    "landing.fastReport": "Rapport en moins de 5s",
    "landing.roleAdapted": "Adapté à ton rôle (Top, Jungle, Mid, Bot, Support)",
    "landing.taglineShort": "Comprends la bascule • Corrige la cause • Progresse.",
    "landing.targetAudience": "Pour les joueurs Bronze → Gold qui veulent monter d'un palier. Pas de conseils génériques : des insights exploitables.",
    "landing.riotIdLabel": "Entrer mon Riot ID",
    "landing.riotIdPlaceholder": "BNJ#EUW",
    "landing.riotIdFormat": "Format : gameName#tag (ex : BNJ#EUW)",
    "landing.analyzeButtonForm": "Analyser",
    "landing.feature1Title": "Le moment clé",
    "landing.feature1Desc": "Tu vois le moment précis où la game bascule — et la cause (prio, vision, reset, fight forcé). Plus de \"j'ai mal joué\" vague : tu sais exactement quoi corriger.",
    "landing.feature1Proof": "Moment clé : 15:23",
    "landing.feature2Title": "La cause racine",
    "landing.feature2Desc": "On te dit pourquoi ça a basculé (macro, tempo, objectifs). Si tu gagnes ta lane mais que tu perds la game, tu comprends le pattern — et comment le corriger.",
    "landing.feature2Proof": "Cause : tempo lâché à 12 min",
    "landing.feature3Title": "Ton plan next game",
    "landing.feature3Desc": "Une consigne simple et actionnable pour ta prochaine partie. Pas une analyse de plus : une instruction à appliquer immédiatement.",
    "landing.feature3Proof": "Plan : reset + vision 40s avant",
    "landing.exampleTitle": "Exemple de rapport",
    "landing.exampleKeyMoment": "Moment clé",
    "landing.exampleKeyMomentText": "15:23 — Fight Herald perdu par manque de vision river.",
    "landing.exampleKeyMomentConsequence": "Conséquence : tempo lâché, prio mid inversée. Focus vision + reset avant objectifs.",
    "landing.exampleRootCause": "Cause racine",
    "landing.exampleRootCauseText": "Gold ahead +1,240 à 20 min, mais impact global tardif.",
    "landing.exampleRootCauseDetail": "Tu gagnes ta lane, mais tes moves arrivent trop tard. On te dit pourquoi et comment corriger (roams dès 12 min).",
    "landing.exampleAction": "Action suivante",
    "landing.exampleActionText": "14:40 — Reset + vision river bot.",
    "landing.exampleActionDetail": "Arrive 10s en avance pour setup avant Drake spawn. Tu reprends le tempo.",
    "landing.howItWorks1": "On récupère ta dernière partie (via Riot API).",
    "landing.howItWorks2": "On isole le moment clé + ton focus prioritaire.",
    "landing.howItWorks3": "Tu repars avec une action simple à appliquer next game.",
    "landing.coachingTitle": "À quoi ressemble le coaching",
    "landing.coachingSubtitle": "En 60 secondes : 1 moment clé, 1 focus, 1 action next game.",
    "landing.coachingExample": "Exemple de retours que tu peux recevoir",
    "landing.coachingExample1": "Gold ahead mais tempo lâché : on pointe le moment où tu perds la main et pourquoi.",
    "landing.coachingExample2": "Lead lane mais impact global faible : on te dit comment corriger (rotations + objectifs dès 12 min).",
    "landing.previewWinProb": "Probabilité de victoire • Exemple",
    "landing.previewWinProbValue": "72% victoire • Mid game",
    "landing.previewKeyMoment": "Moment clé :",
    "landing.previewHerald": "fight Herald perdu",
    "landing.previewMacro": "Macro",
    "landing.previewMacroScore": "Bon tempo",
    "landing.previewMacroValue": "Score : 78/100",
    "landing.previewLaning": "Laning",
    "landing.previewLaningScore": "Avantage",
    "landing.previewLaningValue": "Score : 84/100",
    "landing.previewDecisions": "Décisions",
    "landing.previewDecisionsScore": "À corriger",
    "landing.previewDecisionsValue": "Score : 62/100",
    
    // Matches
    "matches.title": "Mes matchs",
    "matches.subtitle": "Sélectionne un match pour voir les détails",
    "matches.noMatches": "Aucun match disponible",
    "matches.error": "Erreur API Riot",
    "matches.errorDesc": "Impossible de récupérer la liste des matchs.",
    "matches.errorSolution": "Solution :",
    "matches.errorStep1": "Vérifie que RIOT_API_KEY est défini dans .env.local",
    "matches.errorStep2": "Récupère une nouvelle clé sur developer.riotgames.com",
    "matches.errorStep3": "Redémarre le serveur après modification",
    "matches.loading": "Chargement des matchs...",
    "matches.selectMatch": "Sélectionne un match",
    
    // Common
    "common.back": "Retour",
    "common.loading": "Chargement...",
    "settings.french": "Français",
    "settings.english": "Anglais",
    "subscription.upgradeConfirmTitle": "Passer à Pro ? (Mode Dev)",
    "subscription.upgradeConfirmDesc": "En mode développement, tu peux tester le passage en Pro. La page sera rechargée pour appliquer les changements.",
    
    // Match
    "match.notFound": "Match introuvable",
    "match.notFoundDesc": "Ce match n'existe pas dans ta liste.",
    "match.unavailable": "Match indisponible",
    "match.unavailableDesc": "Impossible de charger les détails de ce match.",
    "match.noOpponent": "Impossible d'identifier un vis-à-vis (role match).",
    
    // Builds
    "build.yourBuild": "Ton build",
    "build.opponentBuild": "Build de l'adversaire",
    "build.title": "Build dans la partie",
    "build.items": "Items",
    "build.runes": "Runes",
    
    // Auth
    "auth.title": "Connexion via Riot",
    "auth.subtitle": "Auth Riot (placeholder)",
    "auth.description": "Cette page est prête pour brancher l'OAuth Riot (client_id, redirect_uri, scopes). On redirigera l'utilisateur vers l'URL d'autorisation, puis on traitera le code de retour pour échanger un token et récupérer le PUUID.",
    "auth.vars": "Prévois les vars: RIOT_CLIENT_ID, RIOT_CLIENT_SECRET, RIOT_REDIRECT_URI.",
    "auth.waiting": "En attendant l'OAuth, tu peux passer en mode \"déjà connecté\" via le lien ci-dessous.",
    "auth.continue": "Continuer (mock connecté)",
    "auth.back": "Retour à l'accueil",
    
    // Match List
    "matchList.loading": "Chargement...",
    "matchList.vs": "VS",
    "matchList.vsShort": "vs",
    "matchList.victory": "VICTOIRE",
    "matchList.defeat": "DÉFAITE",
    "matchList.victoryShort": "V",
    "matchList.defeatShort": "D",
    "matchList.queueRankedSolo": "Ranked Solo",
    "matchList.queueRankedFlex": "Ranked Flex",
    "matchList.queueAram": "ARAM",
    "matchList.queueNormalDraft": "Normal Draft",
    "matchList.queueClash": "Clash",
    "matchList.queueNormal": "Normal",
    
    // Match Type Filter
    "matchType.all": "Toutes les parties",
    "matchType.draft": "Draft",
    "matchType.ranked": "Classées",
  },
  en: {
    // Navbar
    "navbar.overview": "Overview",
    "navbar.coach": "Coach",
    "navbar.backToMatches": "Back to matches",
    "navbar.profile": "Profile",
    "navbar.pro": "Pro",
    "navbar.settings": "Settings",
    "navbar.manageSubscription": "Manage subscription",
    "navbar.upgradeToPro": "Upgrade to Pro",
    "navbar.logout": "Log out",
    "navbar.userTierFree": "Free Tier",
    "navbar.userTierPro": "Pro Tier",
    
    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your preferences and options",
    "settings.language": "Language",
    "settings.languageDesc": "Choose the interface language",
    "settings.saving": "Saving...",
    "settings.futureSettings": "More settings will be available soon",
    
    // Subscription
    "subscription.title": "Subscription management",
    "subscription.subtitle": "Manage your Pro subscription",
    "subscription.planPro": "Pro Plan",
    "subscription.planFree": "Free Plan",
    "subscription.proDesc": "Full access to all features",
    "subscription.freeDesc": "Limited access to basic features",
    "subscription.active": "ACTIVE",
    "subscription.renewalDate": "Auto-renewal on",
    "subscription.cancelling": "Your subscription will be cancelled at the end of the billing period",
    "subscription.actions": "Actions",
    "subscription.cancel": "Cancel subscription",
    "subscription.reactivate": "Reactivate subscription",
    "subscription.downgrade": "Downgrade to free immediately",
    "subscription.upgradeTitle": "Upgrade to Pro",
    "subscription.upgradeDesc": "Unlock all premium features",
    "subscription.viewOffers": "View offers",
    "subscription.paymentInfo": "Payment information",
    "subscription.paymentInfoDesc": "Payment method management will be available soon",
    "subscription.cancelConfirmTitle": "Cancel subscription?",
    "subscription.cancelConfirmDesc": "Your subscription will remain active until the end of the billing period ({date}). You can always reactivate before this date.",
    "subscription.downgradeConfirmTitle": "Downgrade to free?",
    "subscription.downgradeConfirmDesc": "You will immediately lose access to Pro features. This action is irreversible until you upgrade to Pro again.",
    "subscription.processing": "Processing...",
    "subscription.confirm": "Confirm",
    "subscription.cancelAction": "Cancel",
    "subscription.loading": "Loading...",
    
    // Landing Page
    "landing.beta": "Private Beta",
    "landing.focus": "Macro focus",
    "landing.postGame": "Post-game coaching",
    "landing.tagline": "The Call • League of Legends Coaching",
    "landing.title": "You're stuck and don't understand why?",
    "landing.titleHighlight": "TheCall",
    "landing.titleEnd": "shows you where the game turns.",
    "landing.subtitle": "TheCall — your post-game macro coach.",
    "landing.description": "No more stats without explanation. You understand the key moment when it turns, the root cause (macro, tempo, objectives), and a concrete plan for your next game.",
    "landing.analyzeButton": "Analyze my last game",
    "landing.riotConnect": "Riot Connection (coming soon)",
    "landing.riotConnectTitle": "Riot connection via RSO — pending validation",
    "landing.fastReport": "Report in less than 5s",
    "landing.roleAdapted": "Adapted to your role (Top, Jungle, Mid, Bot, Support)",
    "landing.taglineShort": "Understand the turn • Fix the cause • Progress.",
    "landing.targetAudience": "For Bronze → Gold players who want to climb a tier. No generic advice: actionable insights.",
    "landing.riotIdLabel": "Enter my Riot ID",
    "landing.riotIdPlaceholder": "BNJ#EUW",
    "landing.riotIdFormat": "Format: gameName#tag (ex: BNJ#EUW)",
    "landing.analyzeButtonForm": "Analyze",
    "landing.feature1Title": "The key moment",
    "landing.feature1Desc": "You see the exact moment when the game turns — and the cause (priority, vision, reset, forced fight). No more vague \"I played badly\": you know exactly what to fix.",
    "landing.feature1Proof": "Key moment: 15:23",
    "landing.feature2Title": "The root cause",
    "landing.feature2Desc": "We tell you why it turned (macro, tempo, objectives). If you win your lane but lose the game, you understand the pattern — and how to fix it.",
    "landing.feature2Proof": "Cause: tempo lost at 12 min",
    "landing.feature3Title": "Your next game plan",
    "landing.feature3Desc": "A simple, actionable instruction for your next game. Not another analysis: an instruction to apply immediately.",
    "landing.feature3Proof": "Plan: reset + vision 40s before",
    "landing.exampleTitle": "Example report",
    "landing.exampleKeyMoment": "Key moment",
    "landing.exampleKeyMomentText": "15:23 — Herald fight lost due to lack of river vision.",
    "landing.exampleKeyMomentConsequence": "Consequence: tempo lost, mid priority reversed. Focus vision + reset before objectives.",
    "landing.exampleRootCause": "Root cause",
    "landing.exampleRootCauseText": "Gold ahead +1,240 at 20 min, but late global impact.",
    "landing.exampleRootCauseDetail": "You win your lane, but your moves come too late. We tell you why and how to fix it (roams from 12 min).",
    "landing.exampleAction": "Next action",
    "landing.exampleActionText": "14:40 — Reset + bot river vision.",
    "landing.exampleActionDetail": "Arrive 10s early to setup before Drake spawn. You regain tempo.",
    "landing.howItWorks1": "We retrieve your last game (via Riot API).",
    "landing.howItWorks2": "We isolate the key moment + your priority focus.",
    "landing.howItWorks3": "You leave with a simple action to apply next game.",
    "landing.coachingTitle": "What coaching looks like",
    "landing.coachingSubtitle": "In 60 seconds: 1 key moment, 1 focus, 1 next game action.",
    "landing.coachingExample": "Example feedback you can receive",
    "landing.coachingExample1": "Gold ahead but tempo lost: we point out when you lose control and why.",
    "landing.coachingExample2": "Lane lead but weak global impact: we tell you how to fix it (rotations + objectives from 12 min).",
    "landing.previewWinProb": "Win probability • Example",
    "landing.previewWinProbValue": "72% win • Mid game",
    "landing.previewKeyMoment": "Key moment:",
    "landing.previewHerald": "Herald fight lost",
    "landing.previewMacro": "Macro",
    "landing.previewMacroScore": "Good tempo",
    "landing.previewMacroValue": "Score: 78/100",
    "landing.previewLaning": "Laning",
    "landing.previewLaningScore": "Advantage",
    "landing.previewLaningValue": "Score: 84/100",
    "landing.previewDecisions": "Decisions",
    "landing.previewDecisionsScore": "To fix",
    "landing.previewDecisionsValue": "Score: 62/100",
    
    // Matches
    "matches.title": "My matches",
    "matches.subtitle": "Select a match to see details",
    "matches.noMatches": "No matches available",
    "matches.error": "Riot API Error",
    "matches.errorDesc": "Unable to retrieve match list.",
    "matches.errorSolution": "Solution:",
    "matches.errorStep1": "Check that RIOT_API_KEY is defined in .env.local",
    "matches.errorStep2": "Get a new key from developer.riotgames.com",
    "matches.errorStep3": "Restart the server after modification",
    "matches.loading": "Loading matches...",
    "matches.selectMatch": "Select a match",
    
    // Common
    "common.back": "Back",
    "common.loading": "Loading...",
    "settings.french": "French",
    "settings.english": "English",
    "subscription.upgradeConfirmTitle": "Upgrade to Pro? (Dev Mode)",
    "subscription.upgradeConfirmDesc": "In development mode, you can test upgrading to Pro. The page will reload to apply changes.",
    
    // Match
    "match.notFound": "Match not found",
    "match.notFoundDesc": "This match does not exist in your list.",
    "match.unavailable": "Match unavailable",
    "match.unavailableDesc": "Unable to load match details.",
    "match.noOpponent": "Unable to identify opponent (role match).",
    
    // Builds
    "build.yourBuild": "Your build",
    "build.opponentBuild": "Opponent's build",
    "build.title": "Build in the game",
    "build.items": "Items",
    "build.runes": "Runes",
    
    // Auth
    "auth.title": "Connect via Riot",
    "auth.subtitle": "Riot Auth (placeholder)",
    "auth.description": "This page is ready to connect Riot OAuth (client_id, redirect_uri, scopes). We will redirect the user to the authorization URL, then process the return code to exchange a token and retrieve the PUUID.",
    "auth.vars": "Prepare vars: RIOT_CLIENT_ID, RIOT_CLIENT_SECRET, RIOT_REDIRECT_URI.",
    "auth.waiting": "While waiting for OAuth, you can switch to \"already connected\" mode via the link below.",
    "auth.continue": "Continue (mock connected)",
    "auth.back": "Back to home",
    
    // Match List
    "matchList.loading": "Loading...",
    "matchList.vs": "VS",
    "matchList.vsShort": "vs",
    "matchList.victory": "VICTORY",
    "matchList.defeat": "DEFEAT",
    "matchList.victoryShort": "W",
    "matchList.defeatShort": "L",
    "matchList.queueRankedSolo": "Ranked Solo",
    "matchList.queueRankedFlex": "Ranked Flex",
    "matchList.queueAram": "ARAM",
    "matchList.queueNormalDraft": "Normal Draft",
    "matchList.queueClash": "Clash",
    "matchList.queueNormal": "Normal",
    
    // Match Type Filter
    "matchType.all": "All matches",
    "matchType.draft": "Draft",
    "matchType.ranked": "Ranked",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const translation = translations[language]?.[key] || translations["fr"]?.[key] || key;
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, value]) => str.replace(new RegExp(`\\{${param}\\}`, "g"), value),
        translation
      );
    }
    return translation;
  };

  // Toujours fournir le contexte, même si pas encore monté
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
