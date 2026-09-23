import { state } from "./state.js";
import { loadData } from "./api.js";
import { buildLabels, buildVariableCatalog, buildIndex } from "./dictionary.js";
import { buildSamples, getSampleKey } from "./samples.js";
import { buildAST, evaluateAST, validateAST } from "./filters.js";
import { updateCount, updateExpression, updateFilterError } from "./expression.js";
import { initMap, render } from "./map.js";
import { initUI } from "./ui.js";

let booting = true;
let refreshLock = false;
let applyTimeout = null;

function apply() {
  if (booting || refreshLock) return;

  clearTimeout(applyTimeout);

  applyTimeout = setTimeout(() => {
    if (booting) return;

    refreshLock = true;

    try {
      const ast = buildAST();

      if (!ast || ast.length === 0) {
        state.filterError = null;
        state.current = [...state.samples];
        render(false);
        updateCount();
        updateExpression([]);
        updateFilterError();
        return;
      }

      validateAST(ast);

      if (state.filterError) {
        state.current = [...state.samples];
        render(false);
        updateCount();
        updateExpression(ast);
        updateFilterError();
        return;
      }

      const filteredOccurrences = evaluateAST(ast, state.data);
      const allowedSamples = new Set(filteredOccurrences.map(getSampleKey));

      state.current = state.samples.filter(sample =>
        allowedSamples.has(sample.sample_id)
      );

      render(false);
      updateCount();
      updateExpression(ast);
      updateFilterError();
    }
    finally {
      refreshLock = false;
    }
  }, 50);
}

function getLang() {
  const lang = (
    window.LANG ||
    document.documentElement?.lang ||
    navigator.language ||
    "en"
  ).toLowerCase().slice(0, 2);

  return ["fr", "en", "es"].includes(lang) ? lang : "en";
}

async function boot() {
  console.log("[OCCURRENCES] INIT START");

  try {
    const { data, dictionary } = await loadData();

    state.data = data;
    state.dictionary = dictionary;
    state.lang = getLang();

    buildLabels(dictionary);
    buildVariableCatalog(dictionary);
    buildIndex();
    buildSamples();

    state.current = [...state.samples];

    initMap();
    initUI(apply);

    requestAnimationFrame(() => {
      booting = false;

      state.current = [...state.samples];
      render(false);
      updateCount();
      updateExpression([]);
      updateFilterError();
    });
  }
  catch (error) {
    console.error("[OCCURRENCES] BOOT ERROR", error);

    const root = document.getElementById("vectobol-widget");
    if (root) {
      const message = document.createElement("div");
      message.className = "vb-occurrences-error";
      message.textContent = "Unable to load occurrence data.";
      root.prepend(message);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("vectobol-widget")) return;
  boot();
});
