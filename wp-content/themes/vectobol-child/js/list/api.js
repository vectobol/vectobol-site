/* ==========================================================
   api.js
   Source unique des données taxonomiques :
   SQL → REST API VectoBol
========================================================== */

export let allRows = [];


/* ==========================================================
   LOAD TAXONOMY
========================================================== */

export async function loadData(
  API = "/wp-json/vectobol/v1/taxa"
) {

  console.log("[API] loading SQL:", API);

  try {

    const response = await fetch(API);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.json();

    if (!Array.isArray(raw)) {
      throw new Error("REST API must return an array");
    }


    /* ======================================================
       NORMALISATION DES DONNÉES
    ====================================================== */

    allRows = raw.map(item => {

      return {

        /* ---------- identification ---------- */

        key: item.key ?? "",
        slug: item.slug ?? "",


        /* ---------- fiche espèce ---------- */

        has_ecology:
          item.has_ecology === true ||
          item.has_ecology === 1,


        /* ---------- taxonomy ---------- */

        phylum: item.phylum ?? "",
        class: item.class ?? "",
        order: item.order ?? "",

        family: item.family ?? "",
        subfamily: item.subfamily ?? "",
        tribe: item.tribe ?? "",

        genus: item.genus ?? "",
        subgenus: item.subgenus ?? "",
        species: item.species ?? "",


        /* ---------- authority ---------- */

        author: item.author ?? "",
        year: item.year ?? "",

        author_parentheses:
          item.author_parentheses === true ||
          item.author_parentheses === 1,


        /* ---------- fiche / statuts ---------- */

        status_fr:
          item.status_fr ?? "",

        status_en:
          item.status_en ?? "",

        status_es:
          item.status_es ?? ""

      };

    });


    console.log(
      `[API] ${allRows.length} taxa loaded from SQL`
    );

    console.log("[API] FIRST ROW", allRows[0]);

    return allRows;

  }


  catch (err) {

    console.error("[API] SQL load error:", err);

    allRows = [];

    return [];

  }

}


/* ==========================================================
   GETTERS
========================================================== */

export function getAllRows() {

  return allRows;

}