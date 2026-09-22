import { loadSpecies } from "./loader.js";

import { initMap, renderSites } from "./renderMap.js";
import { renderTexts } from "./renderText.js";
import { renderTitle } from "./renderTitle.js";
import { renderMeta } from "./renderMeta.js";
import { renderEcology } from "./renderEcology.js";
import { renderHeader } from "./renderHeader.js";
import { renderGallery } from "./renderGallery.js";

import { watchLanguageChange } from "../i18n/langWatcher.js";

console.log("[SPECIES] APP LOADED");


/* =========================
   RENDER PIPELINE
========================= */

function renderAll(source = "unknown") {

  const data = window.VECTOBOL?.data;

  if (!data || !data.ready) {
    console.warn("[SPECIES] Render skipped: data not ready");
    return;
  }

  renderHeader();
  renderTitle();
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
    return;
  }

  console.log("[SPECIES] DATA:", window.VECTOBOL?.data);

  initMap();

  scheduleRender("init");

  watchLanguageChange(() => {
    scheduleRender("lang-change");
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