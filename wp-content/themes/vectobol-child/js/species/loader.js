/* =========================================================
   SPECIES DATA LOADER
   Source unique : API REST du plugin VECTOBOL.
   Aucune dépendance à Elementor ni aux anciens fichiers JSON.
========================================================= */

function getSpeciesFromURL() {
  const url = new URL(window.location.href);
  return url.searchParams.get("species");
}

function getCurrentLanguage() {
  const language = (
    document.documentElement.lang || "fr"
  ).toLowerCase().split("-")[0];

  return ["fr", "en", "es"].includes(language)
    ? language
    : "fr";
}

export async function loadSpecies() {
  const slug = getSpeciesFromURL();

  if (!slug) {
    throw new Error("[SPECIES] Paramètre species absent de l'URL.");
  }

  const lang = getCurrentLanguage();

  const apiUrl = new URL(
    `/wp-json/vectobol/v1/species/${encodeURIComponent(slug)}`,
    window.location.origin
  );

  apiUrl.searchParams.set("lang", lang);

  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json"
    },
    credentials: "same-origin"
  });

  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("[SPECIES] Réponse API non JSON.");
  }

  if (!response.ok) {
    const messages = {
      fr: {
        species_language_unavailable: "Cette fiche espèce n’est pas encore disponible en français.",
        species_not_found: "Cette espèce n’existe pas dans le référentiel VECTOBOL ou n’est pas publiée.",
        invalid: "Paramètres de fiche espèce invalides.",
        technical: "Une erreur technique empêche actuellement le chargement de cette fiche."
      },
      en: {
        species_language_unavailable: "This species sheet is not yet available in English.",
        species_not_found: "This species does not exist in the VECTOBOL reference or is not published.",
        invalid: "Invalid species sheet parameters.",
        technical: "A technical error currently prevents this species sheet from loading."
      },
      es: {
        species_language_unavailable: "Esta ficha de especie todavía no está disponible en español.",
        species_not_found: "Esta especie no existe en el catálogo de referencia VECTOBOL o no está publicada.",
        invalid: "Parámetros de ficha de especie no válidos.",
        technical: "Un error técnico impide actualmente cargar esta ficha."
      }
    };

    const code = payload?.code || "species_api_error";
    const languageMessages = messages[lang] || messages.fr;
    const message = code === "species_language_unavailable"
      ? languageMessages.species_language_unavailable
      : code === "species_not_found"
        ? languageMessages.species_not_found
        : response.status === 400
          ? languageMessages.invalid
          : languageMessages.technical;

    // L'API fournit les données taxonomiques même si la langue
    // demandée n'est pas publiée : le titre reste donc affichable.
    const unavailableSpecies = payload?.data?.species;
    if (unavailableSpecies?.taxonomy) {
      const taxonomy = unavailableSpecies.taxonomy;
      window.VECTOBOL = window.VECTOBOL || {};
      window.VECTOBOL.data = {
        slug: unavailableSpecies.slug || slug,
        key: unavailableSpecies.taxon_key || "",
        language: lang,
        taxonomy,
        authority: {
          author: taxonomy.author || "",
          year: taxonomy.year ?? null,
          parentheses: Boolean(taxonomy.author_parentheses)
        },
        photos: [],
        historical_map: null,
        collection_sites: [],
        ready: false,
        error: code
      };
    }

    const error = new Error(message);
    error.status = response.status;
    error.code = code;
    throw error;
  }

  if (
    !payload?.species ||
    !payload?.content ||
    !Array.isArray(payload?.photos) ||
    !Array.isArray(payload?.collection_sites)
  ) {
    throw new Error("[SPECIES] Structure JSON de l'API invalide.");
  }

  const taxonomy = payload.species.taxonomy || {};

  window.VECTOBOL = window.VECTOBOL || {};

  window.VECTOBOL.data = {
    slug: payload.species.slug || slug,
    key: payload.species.taxon_key || "",
    language: payload.content.language || lang,

    taxonomy,
    authority: {
      author: taxonomy.author || "",
      year: taxonomy.year || null,
      parentheses: Boolean(taxonomy.author_parentheses)
    },

    ecology: {
      key: payload.species.taxon_key || "",
      slug: payload.species.slug || slug,
      has_ecology: true,
      redaction: payload.content.sheet_author || "",
      last_updated: payload.content.last_updated || null,
      sections: payload.content.sections || {},
      bibliography: payload.content.bibliography || ""
    },

    photos: payload.photos.filter(
      media => media.media_type === "photo"
    ),
    historical_map: payload.historical_map || payload.photos.find(
      media => media.media_type === "historical_map"
    ) || null,
    collection_sites: payload.collection_sites,

    ready: true,
    error: null
  };

  console.info(
    "[SPECIES] Fiche chargée depuis l'API VECTOBOL",
    {
      slug: window.VECTOBOL.data.slug,
      language: window.VECTOBOL.data.language,
      media: payload.photos.length,
      collectionSites: payload.collection_sites.length
    }
  );

  return window.VECTOBOL.data;
}
