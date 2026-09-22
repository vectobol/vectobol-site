/* =========================================================
   SPECIES DATA LOADER
   Source :
   - taxonomy + species content → SQL via REST API
   - occurrences → JSON REDCap, inchangé
========================================================= */


function safeFetch(url) {

  return fetch(url)
    .then(res => {

      if (!res.ok) {

        console.warn("[FETCH FAIL]", url);

        return null;
      }

      return res.json();

    })
    .catch(err => {

      console.error("[FETCH ERROR]", url, err);

      return null;
    });
}


/* =========================================================
   GET SPECIES FROM URL
========================================================= */

function getSpeciesFromURL() {

  const url = new URL(window.location.href);

  return url.searchParams.get("species");
}


/* =========================================================
   LOAD SPECIES
========================================================= */

export async function loadSpecies() {

  const slug = getSpeciesFromURL();


  if (!slug) {

    console.error("[SPECIES] Missing species in URL");

    return;
  }


  /*
   * Normalisation :
   *
   * panstrongylus-noireaui
   *        ↓
   * panstrongylus_noireaui
   */

  const key = slug.replaceAll("-", "_");


  /* =======================================================
     URLS
  ======================================================= */

  const apiUrl =
    `${window.location.origin}/wp-json/vectobol/v1/species/${encodeURIComponent(key)}`;


  const occurrencesUrl =
    `${window.location.origin}/wp-content/data/vectobol/production/occurrences.json`;


  /* =======================================================
     LOAD DATA
  ======================================================= */

  const [species, occurrences] = await Promise.all([

    safeFetch(apiUrl),

    safeFetch(occurrencesUrl)

  ]);


  /* =======================================================
     CHECK SPECIES DATA
  ======================================================= */

  if (!species) {

    console.error(
      "[SPECIES] SQL species data could not be loaded"
    );

    return;
  }


  /* =======================================================
     GLOBAL STATE
  ======================================================= */

  window.VECTOBOL = window.VECTOBOL || {};


  window.VECTOBOL.data = {

    /*
     * Basic identifiers
     */

    slug: species.slug || slug,

    key: species.key || key,


    /*
     * Taxonomy
     *
     * Compatible with renderTitle.js
     */

    taxonomy: species.taxonomy || {},

    authority: species.authority || {},


    /*
     * Species content
     *
     * Compatible with renderEcology.js
     */

    ecology: {

      key: species.key || key,

      slug: species.slug || slug,

      has_ecology: true,


      /* Meta */

      redaction:
        species.sheet_author || "",


      /*
       * Current SQL content
       */

      systematics_fr:
        species.systematics_fr || "",

      systematics_en:
        species.systematics_en || "",

      systematics_es:
        species.systematics_es || "",


      bioecology_fr:
        species.bioecology_fr || "",

      bioecology_en:
        species.bioecology_en || "",

      bioecology_es:
        species.bioecology_es || "",


      pathogens_fr:
        species.pathogens_fr || "",

      pathogens_en:
        species.pathogens_en || "",

      pathogens_es:
        species.pathogens_es || "",


      distribution_fr:
        species.distribution_fr || "",

      distribution_en:
        species.distribution_en || "",

      distribution_es:
        species.distribution_es || "",


      bolivia_fr:
        species.bolivia_fr || "",

      bolivia_en:
        species.bolivia_en || "",

      bolivia_es:
        species.bolivia_es || "",


      bibliography:
        species.bibliography || "",


      /*
       * Status
       */

      status_fr:
        species.status_fr || "draft",

      status_en:
        species.status_en || "draft",

      status_es:
        species.status_es || "draft",


      /*
       * Dates
       */

      updated_at:
        species.updated_at || {}

    },


    /*
     * Occurrences
     *
     * Still loaded from the existing JSON.
     */

    occurrences:
      Array.isArray(occurrences)
        ? occurrences
        : [],


    /*
     * Loader state
     */

    ready: true

  };


  /* =======================================================
     DEBUG
  ======================================================= */

  console.log(
    "[SPECIES] SQL DATA LOADED",
    window.VECTOBOL.data
  );

}