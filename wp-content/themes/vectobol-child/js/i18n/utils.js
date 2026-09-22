export function pickText(obj, baseKey) {

  if (!obj || typeof obj !== "object") return "";

  const lang =
    (document.documentElement.lang || "fr")
      .toLowerCase()
      .split("-")[0];

  // -----------------------------------
  // 1. CAS MULTILINGUE (champ suffixé)
  // ex: systematics_fr / systematics_en
  // -----------------------------------
  const multi = obj[`${baseKey}_${lang}`];

  if (multi !== undefined && multi !== null && multi !== "") {
    return multi;
  }

  // fallback français multilingue
  const fallbackFr = obj[`${baseKey}_fr`];
  if (fallbackFr !== undefined && fallbackFr !== null && fallbackFr !== "") {
    return fallbackFr;
  }

  // -----------------------------------
  // 2. CAS CHAMP UNIQUE
  // ex: bibliography, update, redaction
  // -----------------------------------
  if (obj[baseKey] !== undefined && obj[baseKey] !== null) {
    return obj[baseKey];
  }

  // -----------------------------------
  // 3. RIEN TROUVÉ
  // -----------------------------------
  return "";
}