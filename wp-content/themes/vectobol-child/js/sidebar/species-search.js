
document.addEventListener("DOMContentLoaded", async () => {

  const t = window.VECTOBOL_I18N?.t || (k => k);

  const input =
    document.getElementById("speciesSearch");

  const box =
    document.getElementById("speciesSuggestions");

  if (!input || !box) {
    return;
  }


  /* =========================================================
     LABEL + PLACEHOLDER
  ========================================================= */

  input.placeholder =
    t("search_species") || "Search...";


  /* =========================================================
     LANGUE COURANTE
  ========================================================= */

  const lang =
    document.documentElement.lang
      ?.split("-")[0]
      || "fr";


  /* =========================================================
     CHAMP DE STATUT SELON LA LANGUE
  ========================================================= */

  const statusField =
    `status_${lang}`;


  /* =========================================================
     FETCH TAXONOMIE DEPUIS L'API SQL
  ========================================================= */

  let taxonomy = [];

  try {

    const res =
      await fetch(
        "/wp-json/vectobol/v1/taxa"
      );

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status}`
      );
    }

    taxonomy =
      await res.json();

    if (!Array.isArray(taxonomy)) {
      taxonomy = [];
    }

  } catch (e) {

    console.error(
      "[SIDEBAR] taxonomy API error",
      e
    );

    return;
  }


  /* =========================================================
     FILTRE : FICHES PUBLIQUES PRÊTES
  ========================================================= */

  taxonomy =
    taxonomy.filter(sp => {

      return sp[statusField] === "ready";

    });


  console.log(
    "[SIDEBAR] ready count:",
    taxonomy.length,
    "| langue:",
    lang
  );


  /* =========================================================
     INPUT EVENT
  ========================================================= */

  input.addEventListener(
    "input",
    () => {

      const val =
        input.value
          .trim()
          .toLowerCase();


      if (val.length < 2) {

        box.innerHTML = "";

        return;

      }


      /* =====================================================
         RECHERCHE GENRE + ESPÈCE
      ===================================================== */

      const matches =
        taxonomy
          .filter(sp => {

            const g =
              (
                sp.genus || ""
              ).toLowerCase();

            const s =
              (
                sp.species || ""
              ).toLowerCase();


            return (
              g.includes(val) ||
              s.includes(val)
            );

          })
          .slice(0, 10);


      /* =====================================================
         AUCUN RÉSULTAT
      ===================================================== */

      if (!matches.length) {

        box.innerHTML =
          `<div class="vb-no-result">${
            t("no_match") || "No match"
          }</div>`;

        return;

      }


      /* =====================================================
         AFFICHAGE DES RÉSULTATS
      ===================================================== */

      box.innerHTML =
        matches
          .map(sp => {

            const g =
              sp.genus || "";

            const s =
              sp.species || "";


            return `
              <div
                class="vb-suggestion"
                data-slug="${sp.slug}"
              >
                <strong>${g} ${s}</strong>
              </div>
            `;

          })
          .join("");

    }
  );


  /* =========================================================
     CLICK NAVIGATION
  ========================================================= */

  box.addEventListener(
    "click",
    (e) => {

      const item =
        e.target.closest(
          ".vb-suggestion"
        );

      if (!item) return;


      const slug =
        item.dataset.slug;


      const routes = {

        fr: "espece",

        es: "especie",

        en: "species"

      };


      const route =
        routes[lang]
        || routes.fr;


      window.location.href =
        `/${lang}/${route}/?species=${slug}`;

    }
  );

});

