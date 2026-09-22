console.log("🔥 CORE TAXONOMY LOADED");

window.VECTOBOL = window.VECTOBOL || {};

const BASE = "/wp-content/data/vectobol/production/";

async function loadTaxonomy() {

  try {

    const res = await fetch(BASE + "taxo_structured.json");
    const data = await res.json();

    window.VECTOBOL.taxonomy = Array.isArray(data) ? data : [];

    console.log("[CORE] taxonomy loaded:", window.VECTOBOL.taxonomy.length);

  } catch (e) {

    console.error("[CORE] taxonomy load failed", e);
    window.VECTOBOL.taxonomy = [];

  }
}

// AUTO EXECUTION (CRITIQUE)
document.addEventListener("DOMContentLoaded", loadTaxonomy);