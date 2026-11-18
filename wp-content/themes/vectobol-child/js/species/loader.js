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
    const unavailableMessages = {
      fr: "Fiche espèce indisponible dans cette langue.",
      en: "Species sheet unavailable in this language.",
      es: "Ficha de especie no disponible en este idioma."
    };

    const invalidMessages = {
      fr: "Paramètres de fiche espèce invalides.",
      en: "Invalid species sheet parameters.",
      es: "Parámetros de ficha de especie no válidos."
    };

    const message = response.status === 404
      ? unavailableMessages[lang]
      : response.status === 400
        ? invalidMessages[lang]
        : (payload?.message || unavailableMessages[lang]);

    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.code || "species_api_error";
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

    photos: payload.photos,
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
