// Bonnetje - Firebase-configuratie voor de online AI-scan (v14)
// Sinds v14 loopt de AI-scan via Firebase AI Logic met de Agent Platform Gemini API
// (voorheen "Vertex AI Gemini API") als backend, beveiligd met Firebase App Check
// (reCAPTCHA Enterprise). Er is GEEN persoonlijke API-sleutel meer in de app:
// geen sleutel van de gebruiker en geen sleutel van de maker.
//
// Deze webconfig is publiek-by-design (hij wordt immers met de client meegestuurd)
// en is op zichzelf geen geheim; misbruik wordt geblokkeerd door App Check en door
// de spend cap op het Google Cloud-project (Bonnetje, bonnetje-78c25).
// Bronnen (19-11-2026):
// - https://firebase.google.com/docs/ai-logic/get-started
// - https://firebase.google.com/docs/ai-logic/locations?api=vertex
// - https://firebase.google.com/docs/reference/js/ai.agentplatformbackend
// - https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider

// Vastgepinte versie van de Firebase JS SDK (AgentPlatformBackend bestaat vanaf 12.17.0).
export const FIREBASE_SDK_VERSION = '12.17.0';

// Vast model voor de scan en vertaling. gemini-2.5-flash is op de Agent Platform-route
// buiten gebruik gesteld; gemini-3.8-flash is de opvolger voor dit soort taken.
// Beschikbaarheid per regio: https://cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-8-flash
export const AI_MODEL = 'gemini-3.8-flash';

// Verwerkingslocatie. 'eu' = EU-multiregio (dataresidentie binnen de EU).
// Losse EU-regio's zoals europe-west4 bestaan voor dit model NIET (alleen global,
// us/eu-multiregio en enkele niet-EU-regio's); zie de modelpagina hierboven.
export const AI_LOCATION = 'eu';

// Documentatie/voorwaarden die in de app getoond worden.
export const AI_TERMS_URL = 'https://firebase.google.com/docs/ai-logic';

const PLACEHOLDER_PREFIX = 'VUL_IN';

// TODO(henk): plak hier de webconfig uit de Firebase-console
// (Project settings > Your apps > Bonnetje web > SDK setup and configuration > Config).
export const FIREBASE_CONFIG = {
  apiKey: 'VUL_IN_API_KEY',
  authDomain: 'bonnetje-78c25.firebaseapp.com',
  projectId: 'bonnetje-78c25',
  storageBucket: 'VUL_IN_STORAGE_BUCKET',
  messagingSenderId: 'VUL_IN_MESSAGING_SENDER_ID',
  appId: 'VUL_IN_APP_ID'
};

// TODO(henk): plak hier de reCAPTCHA Enterprise site key uit de App Check-registratie
// (Firebase console > Security > App Check > Apps > Bonnetje web).
// De site key is publiek-by-design en mag in de clientcode staan; de SECRET key
// hoort hier NOOIT te staan.
export const RECAPTCHA_ENTERPRISE_SITE_KEY = 'VUL_IN_RECAPTCHA_SITE_KEY';

function isPlaceholder(value) {
  return !value || String(value).startsWith(PLACEHOLDER_PREFIX);
}

/** True als alle velden van de webconfig echte waarden bevatten. */
export function isFirebaseConfigured() {
  return Object.values(FIREBASE_CONFIG).every((v) => !isPlaceholder(v));
}

/** True als de reCAPTCHA Enterprise site key een echte waarde bevat. */
export function isAppCheckConfigured() {
  return !isPlaceholder(RECAPTCHA_ENTERPRISE_SITE_KEY);
}

/** Lijst van ontbrekende configuratieonderdelen, voor eerlijke statusmeldingen. */
export function missingAiConfigParts() {
  const missing = [];
  if (!isFirebaseConfigured()) {
    for (const [key, value] of Object.entries(FIREBASE_CONFIG)) {
      if (isPlaceholder(value)) missing.push(`firebase-config ${key}`);
    }
  }
  if (!isAppCheckConfigured()) missing.push('reCAPTCHA Enterprise site key (App Check)');
  return missing;
}
