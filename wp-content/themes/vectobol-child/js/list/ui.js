/* =========================================================
   ui.js
   Gestion complète de l'interface Taxonomy
========================================================= */


/* =========================================================
 BLOC 1 de 4 : Imports + constantes + variables globales
========================================================= */

import { renderTable } from "./table.js";
import { paginate } from "./pager.js";
import {
  applyFilters,
  setGlobalQuery,
  setStatusFilter
} from "./filters.js";

import { speciesLink } from "./links.js";

const t = window.VECTOBOL_I18N?.t || (k => k);


/* =========================================================
   HIERARCHIE TAXONOMIQUE
========================================================= */

const TAXONOMIC_LEVELS = [

  "phylum",
  "class",
  "order",

  "family",
  "subfamily",
  "tribe",

  "genus",
  "subgenus",
  "species"

];


/* =========================================================
   ETAT DE L'INTERFACE
========================================================= */

let baseRows = [];

let filteredRows = [];

let page = 1;

let pageSize = 10;

let totalPages = 1;


/* =========================================================
   REFERENCES DOM
========================================================= */

let tbody;

let pageInfo;

let counter;

let pageSizeSelect;

let searchInput;

let statusFilter;

let resetButton;

let selects = [];

let topSelects = [];

let tableSelects = [];


/* =========================================================
 BLOC 2 de 4 : Normalisation + lecture des filtres + état propre
========================================================= */


/* =========================================================
   NORMALISATION
========================================================= */

function norm(v) {

  if (v === null || v === undefined) return "";

  return String(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}


/* =========================================================
   LECTURE DES FILTRES UI
========================================================= */

function getUIFilters() {

  const f = {};

  [...topSelects, ...tableSelects].forEach(sel => {

    const k = sel.dataset.k;
    if (!k) return;

    f[k] = sel.value || "";

  });

  return f;
}


function getEffectiveFilters() {

  return {
    ...(window.TAXO_INITIAL_FILTER || {}),
    ...getUIFilters()
  };

}


/* =========================================================
   RESET LOGIQUE (INTERNE)
========================================================= */

function resetState() {

  topSelects.forEach(sel => sel.value = "");

  tableSelects.forEach(sel => sel.value = "");

  updateClearStates();

  if (searchInput) {
    searchInput.value = "";
  }

  setGlobalQuery("");

  if (statusFilter) {

    statusFilter.value = "";
    setStatusFilter("");

    updateStatusFilterDot();

  }

  page = 1;

}


/* =========================================================
 BLOC 3 de 4 : Cascade des listes déroulantes + reconstruction dynamique
========================================================= */


/* =========================================================
   CASCADE DES FILTRES TAXONOMIQUES
========================================================= */

function updateCascadeOptions(lockedFilters = null) {

  const allSelects = [...topSelects, ...tableSelects];

  if (!allSelects.length) return;

  // filtres actuels (UI ou forcés)
  const currentFilters =
    lockedFilters || getEffectiveFilters();


  TAXONOMIC_LEVELS.forEach(level => {

    const selects =
      allSelects.filter(s => s.dataset.k === level);

    if (!selects.length) return;


    // base de travail
    let base = baseRows.filter(r => {

      return Object.entries(currentFilters).every(([k, v]) => {

        if (!v) return true;

        return norm(r?.[k]) === norm(v);

      });

    });


    const levelIndex =
      TAXONOMIC_LEVELS.indexOf(level);


    // filtrage hiérarchique (cascade)
    for (let i = 0; i < levelIndex; i++) {

      const upperKey =
        TAXONOMIC_LEVELS[i];

      const upperVal =
        currentFilters[upperKey];

      if (upperVal) {

        base = base.filter(r =>
          norm(r?.[upperKey]) === norm(upperVal)
        );

      }

    }


    // valeurs uniques du niveau
    const values = [...new Set(

      base
        .map(r => r?.[level])
        .filter(
          v =>
            v !== null &&
            v !== undefined &&
            v !== ""
        )

    )].sort((a, b) =>
      a.localeCompare(b)
    );


    selects.forEach(select => {

      const previousValue =
        select.value;


      // reset
      select.innerHTML = "";


      // placeholder
      const placeholder =
        document.createElement("option");

      placeholder.value = "";


      const label =
        window.VECTOBOL_I18N?.t?.(level);


      placeholder.textContent =
        label ?? level;


      select.appendChild(
        placeholder
      );


      // options
      values.forEach(v => {

        const opt =
          document.createElement("option");

        opt.value = v;

        opt.textContent = v;

        select.appendChild(opt);

      });


      // restauration éventuelle
      if (values.includes(previousValue)) {

        select.value =
          previousValue;

      } else {

        select.value = "";

      }

    });

  });


  updateClearStates();

}


/* =========================================================
 BLOC 4 de 4 : Events + orchestration + synchronisation
 UI ↔ filtres ↔ table
========================================================= */


/* =========================================================
   APPLICATION DES FILTRES + RENDER GLOBAL
========================================================= */
function applyAndRender() {

  setGlobalQuery(
    searchInput?.value || ""
  );

  setStatusFilter(
    statusFilter?.value || ""
  );

  updateStatusFilterDot();

  updateCascadeOptions(
    getEffectiveFilters()
  );

  filteredRows =
    applyFilters(baseRows);

  page = 1;

  updateClearStates();

  render();

}

/* =========================================================
   FILTRES TAXONOMIQUES
========================================================= */

function bindSelectEvents() {

  selects.forEach(sel => {

    sel.addEventListener(
      "change",
      () => {

        page = 1;

        updateClearStates();

        applyAndRender();

      }
    );

  });

}


/* =========================================================
   RECHERCHE GLOBALE
========================================================= */

function bindSearch() {

  if (!searchInput) return;

  searchInput.addEventListener(
    "input",
    (e) => {

      setGlobalQuery(
        e.target.value
      );

      applyAndRender();

    }
  );

}


/* =========================================================
   FILTRE STATUT
========================================================= */

function bindStatusFilter() {

  if (!statusFilter) return;

  statusFilter.addEventListener("change", () => {

    page = 1;

    applyAndRender();

  });

}

/* =========================================================
   RESET
========================================================= */

function bindReset() {

  if (!resetButton) return;

  resetButton.addEventListener(
    "click",
    () => {

      resetState();

      filteredRows =
        [...baseRows];

      updateCascadeOptions();

      render();

    }
  );

}


/* =========================================================
   PAGINATION
========================================================= */

function bindPager() {

  const prev =
    document.querySelector("#prev");

  const next =
    document.querySelector("#next");

  pageSizeSelect =
    document.querySelector("#pageSize");


  if (prev) {

    prev.addEventListener(
      "click",
      () => {

        page =
          Math.max(
            1,
            page - 1
          );

        render();

      }
    );

  }


  if (next) {

    next.addEventListener(
      "click",
      () => {

        page =
          page + 1;

        render();

      }
    );

  }


  if (pageSizeSelect) {

    pageSizeSelect.addEventListener(
      "change",
      (e) => {

        pageSize =
          e.target.value === "all"
            ? "all"
            : Number(
                e.target.value
              );

        page = 1;

        render();

      }
    );

  }

}


/* =========================================================
   BOUTONS CLEAR
========================================================= */

function bindClearButtons() {

  const app =
    document.querySelector("#taxo-app");

  if (!app) return;

  app.addEventListener(
    "click",
    (e) => {

      const btn =
        e.target.closest(".clear");

      if (!btn) return;

      e.preventDefault();

      e.stopPropagation();


      const box =
        btn.closest(
          ".filter-box, .filter-box-small"
        );

      if (!box) return;


      const select =
        box.querySelector("select.f");

      if (!select) return;


      // reset valeur
      select.value = "";


      // déclenche pipeline normal
      select.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );


      // UI
      page = 1;

      updateClearStates();

    }
  );

}


/* =========================================================
   ETAT DES BOUTONS CLEAR
========================================================= */

function updateClearStates() {

  const boxes =
    document.querySelectorAll(
      ".filter-box, .filter-box-small"
    );


  boxes.forEach(box => {

    const select =
      box.querySelector("select.f");

    const clear =
      box.querySelector(".clear");

    if (!select) return;


    const hasValue =
      select.value &&
      select.value !== "";


    box.classList.toggle(
      "has-value",
      hasValue
    );


    if (clear) {

      clear.style.display =
        hasValue
          ? "flex"
          : "none";

    }

  });

}

function updateStatusFilterDot() {

  const filter = document.querySelector("#statusFilter");
  const dot = document.querySelector("#statusFilterDot");

  if (!filter || !dot) return;

  // supprimer les anciens états
  dot.classList.remove(
    "status-ready",
    "status-progress",
    "status-draft",
    "status-none"
  );

  switch (filter.value) {

    case "ready":
      dot.classList.add("status-ready");
      break;

    case "in_progress":
      dot.classList.add("status-progress");
      break;

    case "draft":
      dot.classList.add("status-draft");
      break;

    case "none":
      dot.classList.add("status-none");
      break;

    default:
      // Tous les statuts → pas de pastille
      break;
  }

}



/* =========================================================
   HEADERS DU TABLEAU
========================================================= */

function renderHeaders() {

  const tr =
    document.querySelector(
      "#taxo-headers"
    );


  if (!tr) {

    console.warn(
      "[TAXO] header row not found"
    );

    return;

  }


  const levels = [

    "family",
    "subfamily",
    "tribe",
    "genus",
    "subgenus",
    "species"

  ];


  tr.innerHTML = "";


  levels.forEach(level => {

    const th =
      document.createElement("th");


    th.textContent =
      window.VECTOBOL_I18N?.t?.(level)
      ?? level;


    tr.appendChild(th);

  });

}


/* =========================================================
   LABELS
========================================================= */

function renderLabels() {

  const pagerLabel =
    document.querySelector(
      ".pager-label"
    );


  if (pagerLabel) {

    pagerLabel.textContent =
      t("pager_label");

  }


  const optAll =
    document.querySelector(
      '#pageSize option[value="all"]'
    );


  if (optAll) {

    optAll.textContent =
      t("all");

  }

}


/* =========================================================
   RENDER
========================================================= */

function render() {

  if (!filteredRows) {

    console.warn(
      "[UI] filteredRows missing"
    );

    return;

  }


  if (!tbody) {

    tbody =
      document.querySelector(
        "#taxoTable tbody"
      );

  }


  if (!tbody) {

    console.error(
      "[UI] tbody missing"
    );

    return;

  }


  const result =
    paginate(
      filteredRows,
      page,
      pageSize
    );


  page =
    result.page;

  totalPages =
    result.totalPages;


  renderTable({

    rows: result.slice,

    tbody,

    speciesLink

  });


  // Pagination
  if (pageInfo) {

    pageInfo.textContent =
      `Page ${page} / ${totalPages}`;

  }


  // Compteur
  if (counter) {

    counter.textContent =
      `${t("filtered_count")} : ${filteredRows.length} / ${baseRows.length}`;

  }


  // Mise à jour des libellés traduisibles
  renderLabels();

}


/* =========================================================
   INIT PUBLIC
========================================================= */

export function initUI(rows) {

  const container =
    document.querySelector(
      "#taxo-app"
    );


  let initialFilters = {};


  try {

    initialFilters =
      JSON.parse(
        container?.dataset.initialFilter
        || "{}"
      );

  } catch (e) {

    console.warn(
      "[TAXO] invalid initial filter JSON"
    );

    initialFilters = {};

  }


  baseRows =
    rows.filter(r =>

      Object.entries(
        initialFilters
      ).every(([k, v]) =>

        !v ||
        norm(r?.[k]) === norm(v)

      )

    );


  filteredRows =
    [...baseRows];


  tbody =
    document.querySelector(
      "#taxoTable tbody"
    );

  pageInfo =
    document.querySelector(
      "#pageInfo"
    );

  counter =
    document.querySelector(
      ".taxo-count"
    );

  pageSizeSelect =
    document.querySelector(
      "#pageSize"
    );

  searchInput =
    document.querySelector(
      "#globalSearch"
    );

  statusFilter =
    document.querySelector(
      "#statusFilter"
    );

  /*
   * Initialisation du filtre de statut
   */
  setStatusFilter(
    statusFilter?.value || ""
  );

  resetButton =
    document.querySelector(
      "#resetAll"
    );


  topSelects =
    [
      ...document.querySelectorAll(
        ".top-row-2 .f"
      )
    ];

  tableSelects =
    [
      ...document.querySelectorAll(
        ".filter-row .f"
      )
    ];

  selects =
    [
      ...topSelects,
      ...tableSelects
    ];


  // 1. events d'abord

  bindSelectEvents();

  bindClearButtons();

  bindSearch();

  bindStatusFilter();

  updateStatusFilterDot();

  bindReset();

  bindPager();


  // 2. cascade initial

  updateCascadeOptions(
    getEffectiveFilters()
  );


  // 3. premier render
  requestAnimationFrame(
    () => {

      applyAndRender();


      // headers après render
      renderHeaders();


      // labels statiques
      const pagerLabel =
        document.querySelector(
          ".pager-label"
        );


      if (pagerLabel) {

        pagerLabel.textContent =
          t("pager_label");

      }


      const optAll =
        document.querySelector(
          '#pageSize option[value="all"]'
        );


      if (optAll) {

        optAll.textContent =
          t("all");

      }

    }
  );

}