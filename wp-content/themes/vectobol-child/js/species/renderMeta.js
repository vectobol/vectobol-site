/* =========================
   META RENDERING (STABLE)
========================= */

const t = window.VECTOBOL_I18N?.t;

function formatUpdate(value) {

  if (!value) return "—";

  const str = String(value);

  // format YYMMDD ou YYYYMMDD simplifié
  if (str.length === 6) {
    return `20${str.slice(0,2)}-${str.slice(2,4)}-${str.slice(4,6)}`;
  }

  return str;
}

/* =========================
   MAIN RENDER
========================= */
export function renderMeta() {

    const el = document.getElementById("species_meta");
  if (!el) {
    
    return;
  }


  const eco = window.VECTOBOL?.data?.ecology || {};

  const author = eco.redaction || "—";
  const update = formatUpdate(eco.update);

    el.innerHTML = `
    <div class="vb-meta-line">
      ${t("sheet_author")} : <strong>${author}</strong>
      <span class="vb-meta-sep"> · </span>
      ${t("last_update")} : <strong>${update}</strong>
    </div>
  `;
}