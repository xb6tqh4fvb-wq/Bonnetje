// Bonnetje - Vriendelijke Nederlandse foutmeldingen (v9, punt 5)
// Kapotte, lege of onleesbare bestanden en misleidende OCR-fouten krijgen een duidelijke
// Nederlandse melding met een werkbare vervolgstap, nooit een kale Engelse decode-fout.

/**
 * Herkent decode-/leesfouten van afbeeldingen en PDF's (bijv. "The source image could not
 * be decoded", corrupte png, nep-bestand met foto-extensie).
 */
export function isImageDecodeError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return /(could not be decoded|cannot decode|decode|decoding|corrupt|invalid image|not a valid|unsupported image|unknown image|invalid pdf|invalid document|unexpected end of|malformed)/.test(msg);
}

/** Melding voor een kapot, nep of onleesbaar bestand (foto of pdf). */
export function unreadableFileMessage(isPdf = false) {
  return isPdf
    ? 'Deze pdf kunnen we niet openen; het bestand lijkt beschadigd of is geen echte pdf. Probeer een foto van de bon, het plakvak (iPhone Live Text) of handmatig invoeren.'
    : 'Dit bestand kunnen we niet als foto openen; het lijkt beschadigd of het is geen echte foto. Probeer een andere foto, het plakvak (iPhone Live Text) of handmatig invoeren.';
}

/** Melding voor een leeg bestand. */
export function emptyFileMessage() {
  return 'Dit bestand is leeg (0 bytes). Kies een echte foto of pdf van de bon, of gebruik het plakvak / handmatig invoeren.';
}

/** Melding voor een verkeerd bestandstype (bijv. een .txt of .docx). */
export function wrongFileTypeMessage() {
  return 'Dit is geen foto of pdf van een bon. Kies een foto (jpg/png/heic) of pdf, of gebruik het plakvak / handmatig invoeren.';
}

/** Melding voor een gescande pdf terwijl Gemini niet beschikbaar is (geen sleutel / geen toestemming). */
// Punt B6 (v10): jsDelivr geblokkeerd of offline -> PDF.js zelf laadt niet; dat is geen
// "scan zonder tekstlaag".
export function pdfReaderLoadFailedMessage() {
  return 'De pdf-lezer (PDF.js) kon niet geladen worden; meestal is de jsDelivr-CDN geblokkeerd of ben je offline. Daardoor kan de tekstlaag van deze pdf niet lokaal worden gelezen. Maak een foto van de bon, gebruik het plakvak / handmatig invoeren, of stel een gratis Gemini-sleutel in bij Instellingen & privacy om de pdf online te laten lezen.';
}

export function scannedPdfWithoutGeminiMessage() {
  return 'Deze pdf is een scan zonder leesbare tekstlaag. De lokale backup kan alleen foto\u2019s lezen, geen pdf\u2019s. Stel een gratis Gemini-sleutel in bij Instellingen & privacy, of maak een foto van de bon, of gebruik het plakvak / handmatig invoeren.';
}

/** Melding als de modellen van de lokale backup offline nog niet gecachet zijn. */
export function localModelsOfflineMessage() {
  return 'Je bent offline en de modelbestanden van de lokale backup staan nog niet in de cache van dit toestel. Maak eenmalig verbinding met internet om ze op te halen; daarna werkt de lokale backup volledig offline. Je kunt nu het plakvak of handmatig invoeren gebruiken.';
}

/**
 * Vertaalt een technische fout uit de scan-/OCR-route naar een vriendelijke Nederlandse
 * melding. Laat bekende, al vriendelijke meldingen (Gemini HTTP-statussen, offline,
 * modelproblemen) ongemoeid.
 */
export function friendlyScanError(err, { isPdf = false } = {}) {
  if (isImageDecodeError(err)) return unreadableFileMessage(isPdf);
  const msg = String(err?.message || '').trim();
  return msg || 'De bon kon niet worden gelezen. Gebruik het plakvak of voer de bon handmatig in.';
}
