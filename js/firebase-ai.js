// Bonnetje - Online AI-transport via Firebase AI Logic (v14)
// Vervangt de oude "eigen Gemini-sleutel"-route (directe REST-call met een sleutel
// van de gebruiker). Deze module bevat GEEN sleutel van de maker en vraagt de
// gebruiker nooit om een sleutel. De Firebase-SDK wordt pas geladen als er echt
// een aanroep gedaan wordt (lazy), zodat de app offline en bij ontbrekende config
// gewoon blijft werken met de lokale backup.
//
// Elke fout uit callFirebaseAiModel krijgt een fallbackCode, zodat app.js altijd
// terugvalt op de lokale backup — precies de afspraak voor v14:
// "lokaal lezen als de aanroep mislukt of de spend cap bereikt is".

import {
  FIREBASE_SDK_VERSION,
  AI_MODEL,
  AI_LOCATION,
  FIREBASE_CONFIG,
  RECAPTCHA_ENTERPRISE_SITE_KEY,
  isFirebaseConfigured,
  isAppCheckConfigured,
  missingAiConfigParts
} from './firebase-config.js';

const SDK_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
const AI_TIMEOUT_MS = 60000; // v18: ruimer; een grote bonfoto duurde >30s en viel terug op lokaal

let modelPromise = null;

/** True als de online AI-route gebruikt kan worden (webconfig ingevuld). */
export function isAiConfigured() {
  return isFirebaseConfigured();
}

/**
 * v17: mag de app een online AI-aanroep doen? Alleen als de config klopt én de
 * gebruiker de schakelaar 'Online AI-scan (Google)' niet heeft uitgezet (standaard aan).
 * Bij false doet de app GEEN online aanroep: alleen lokaal lezen.
 */
export function isOnlineAiUsable(settings) {
  return isFirebaseConfigured() && settings?.onlineAiEnabled !== false;
}

/** Korte NL-statusregel over de online AI-route, voor status- en instellingenteksten. */
export function aiStatusText() {
  if (!isFirebaseConfigured()) {
    return `Online AI nog niet ingesteld (ontbreekt: ${missingAiConfigParts().join(', ')}). De lokale backup, het plakvak en handmatig invoeren werken wel.`;
  }
  const appCheck = isAppCheckConfigured()
    ? 'App Check (reCAPTCHA Enterprise) actief'
    : 'App Check-site key ontbreekt nog';
  return `Online AI via Firebase AI Logic (model: ${AI_MODEL}, regio: ${AI_LOCATION === 'eu' ? 'EU-multiregio' : AI_LOCATION}). ${appCheck}.`;
}

/**
 * Vertaalt een Firebase AI Logic / App Check / netwerk-fout naar een vriendelijke
 * Nederlandse melding met een fallbackCode voor de lokale backup.
 * Puur en zonder netwerk: direct te testen.
 */
export function mapFirebaseAiError(err) {
  const code = String(err?.code || '');
  const msg = String(err?.message || err || '');
  const hay = `${code} ${msg}`.toLowerCase();

  const wrap = (text, fallbackCode) => {
    const e = new Error(text);
    e.fallbackCode = fallbackCode;
    // v18: de echte code (bijv. 'app-check/fetch-stored-token', 'resource-exhausted') blijft
    // zichtbaar in de statusregel, zodat een mislukte online aanroep niet langer blind terugvalt.
    e.rawCode = code || fallbackCode;
    return e;
  };

  if (/resource.?exhausted|\b429\b|quota|spend cap|billing/.test(hay)) {
    return wrap(
      'De grens van de online AI-scan is bereikt (quotum of spend cap). De lokale backup, het plakvak en handmatig invoeren blijven beschikbaar.',
      'http_429'
    );
  }
  if (/app.?check|permission.?denied|unauthenticated|\b403\b|\b401\b/.test(hay)) {
    return wrap(
      'De beveiligingscheck (App Check) ontbreekt of is geweigerd, dus de online AI-scan kan nu niet worden aangeroepen. De lokale backup, het plakvak en handmatig invoeren blijven beschikbaar.',
      'config'
    );
  }
  if (/overloaded|unavailable|internal|deadline|\b5\d\d\b/.test(hay)) {
    return wrap(
      'De online AI-scan is tijdelijk niet beschikbaar (drukte of storing bij Google). De lokale backup start nu automatisch; je kunt ook het plakvak of handmatig invoeren gebruiken.',
      'http_5xx'
    );
  }
  if (/failed to fetch|network|fetch failed|load failed|time.?out|timed out|abort/.test(hay)) {
    return wrap(
      'Geen internetverbinding of de aanvraag duurde te lang. De lokale backup, het plakvak en handmatig invoeren blijven beschikbaar.',
      'network'
    );
  }
  return wrap(
    `De online AI-scan is mislukt${msg ? `: ${msg}` : ''}. De lokale backup, het plakvak en handmatig invoeren blijven beschikbaar.`,
    'unknown'
  );
}

function aiError(text, fallbackCode, rawCode) {
  const e = new Error(text);
  e.fallbackCode = fallbackCode;
  e.rawCode = rawCode || fallbackCode;
  return e;
}

/**
 * Laadt de Firebase-SDK (eenmalig) en maakt het GenerativeModel aan:
 * Agent Platform Gemini API (voorheen Vertex AI) op de ingestelde locatie,
 * met App Check (reCAPTCHA Enterprise) als de site key ingevuld is.
 */
async function loadFirebaseModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [appMod, aiMod, appCheckMod] = await Promise.all([
        import(`${SDK_BASE}/firebase-app.js`),
        import(`${SDK_BASE}/firebase-ai.js`),
        isAppCheckConfigured() ? import(`${SDK_BASE}/firebase-app-check.js`) : Promise.resolve(null)
      ]);
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      if (appCheckMod) {
        // Zelfde sleutel als bij de App Check-registratie in de Firebase-console.
        appCheckMod.initializeAppCheck(app, {
          provider: new appCheckMod.ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
      }
      const ai = aiMod.getAI(app, { backend: new aiMod.AgentPlatformBackend(AI_LOCATION) });
      return aiMod.getGenerativeModel(ai, {
        model: AI_MODEL,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });
    })();
    // Bij een laadfout (bijv. CDN geblokkeerd) niet eeuwenig een kapotte promise vasthouden.
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

/**
 * Roept het Gemini-model aan via Firebase AI Logic.
 * parts: array van { text } en/of { inlineData: { mimeType, data } } (zelfde vorm
 * als de oude route). Geeft { rawText, model, usageMetadata } terug.
 * Gooit ALTIJD een Error met fallbackCode bij mislukking, zodat de app terugvalt
 * op de lokale backup.
 */
export async function callFirebaseAiModel(parts, { timeoutMs = AI_TIMEOUT_MS } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw aiError(
      'Geen internetverbinding: de online AI-scan werkt alleen met internet. De lokale backup, het plakvak en handmatig invoeren werken wel gewoon.',
      'offline'
    );
  }
  if (!isFirebaseConfigured()) {
    throw aiError(
      `De online AI-scan is nog niet ingesteld (ontbreekt: ${missingAiConfigParts().join(', ')}). De lokale backup, het plakvak en handmatig invoeren werken wel.`,
      'not_configured'
    );
  }

  let model;
  try {
    model = await loadFirebaseModel();
  } catch (err) {
    throw mapFirebaseAiError(err);
  }

  let timer;
  try {
    const result = await Promise.race([
      model.generateContent(parts),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(aiError('De aanvraag naar de online AI-scan duurde te lang (time-out).', 'network', 'time-out')),
          timeoutMs
        );
      })
    ]);
    const response = result?.response;
    const rawText = typeof response?.text === 'function' ? response.text() : '';
    if (!rawText) {
      throw new Error('De online AI-scan gaf een leeg of onleesbaar antwoord terug.');
    }
    return { rawText, model: AI_MODEL, usageMetadata: response?.usageMetadata || null };
  } catch (err) {
    if (err && err.fallbackCode) throw err;
    throw mapFirebaseAiError(err);
  } finally {
    clearTimeout(timer);
  }
}
