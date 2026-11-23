import { loadSpecies } from "./loader.js";

import { initMap, renderSites } from "./renderMap.js";
import { renderTexts } from "./renderText.js";
import { renderMeta } from "./renderMeta.js";
import { renderEcology } from "./renderEcology.js";
import { renderHeader } from "./renderHeader.js";
import { renderGallery } from "./renderGallery.js";

import { watchLanguageChange } from "../i18n/langWatcher.js";

console.log("[SPECIES] APP LOADED");


/* =========================
   RENDER PIPELINE
========================= */

function showLoadError(error) {
  const message = error?.message || "Erreur lors du chargement de la fiche espèce.";

  const data = window.VECTOBOL?.data;
  if (data) {
    data.ready = false;
    if (data.taxonomy) {
      renderHeader(data);
    }
  }

  const grid = document.querySelector(".vb-grid");
  if (grid) {
    grid.hidden = true;
  }

  const speciesMessage = document.getElementById("vb-species-message");
  if (speciesMessage) {
    speciesMessage.textContent = message;
    speciesMessage.hidden = false;
  }

  document.querySelectorAll(
    '[data-i18n="systematics"],' +
    '[data-i18n="bioecology"],' +
    '[data-i18n="pathogens"],' +
    '[data-i18n="distribution"],' +
    '[data-i18n="bolivia"],' +
    '[data-i18n="bibliography"]'
  ).forEach((element) => element.replaceChildren());

  const gallery =
    document.getElementById("photo_band") ||
    document.querySelector("[data-vb-gallery]");

  if (gallery) {
    gallery.replaceChildren();
  }

  const metadata = document.getElementById("species_meta");
  if (metadata) {
    metadata.replaceChildren();
  }

  const mapElement = document.getElementById("vb-map");
  if (mapElement) {
    mapElement.hidden = true;
  }
}

function renderAll(source = "unknown") {

  const data = window.VECTOBOL?.data;

  if (!data || !data.ready) {
    console.warn("[SPECIES] Render skipped: data not ready");
    return;
  }

  const grid = document.querySelector(".vb-grid");
  if (grid) {
    grid.hidden = false;
  }

  const speciesMessage = document.getElementById("vb-species-message");
  if (speciesMessage) {
    speciesMessage.hidden = true;
    speciesMessage.textContent = "";
  }

  renderHeader(data);
  renderTexts();
  renderEcology();
  renderSites();
  renderGallery();
  renderMeta();

  console.log("[SPECIES] rendered:", source);
}


/* =========================
   SCHEDULER
========================= */

let scheduled = false;
let rendering = false;

function scheduleRender(source = "unknown") {

  if (scheduled || rendering) return;

  scheduled = true;

  requestAnimationFrame(() => {

    rendering = true;

    try {
      renderAll(source);
    } catch (err) {
      console.error("[SPECIES] render error:", err);
    }

    rendering = false;
    scheduled = false;
  });
}


/* =========================
   INIT
========================= */

let initialized = false;

async function init() {

  if (initialized) return;
  initialized = true;

  console.log("[SPECIES] INIT START");

  try {
    await loadSpecies();
  } catch (e) {
    console.error("[SPECIES] loader failed", e);
    showLoadError(e);
    return;
  }

  console.log("[SPECIES] DATA:", window.VECTOBOL?.data);

  initMap();

  scheduleRender("init");

  watchLanguageChange(async () => {
    try {
      await loadSpecies();
      initMap();
      scheduleRender("lang-change");
    } catch (error) {
      console.error("[SPECIES] language reload failed", error);
      showLoadError(error);
    }
  });

  window.addEventListener("load", () => {
    scheduleRender("window-load");
  });
}


/* =========================
   BOOT SAFE
========================= */

document.addEventListener("DOMContentLoaded", () => {
  init();
});