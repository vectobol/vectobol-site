/* =========================
   TITLE RENDERING
========================= */

function formatName(tax) {

  const genus = tax?.genus
    ? tax.genus.charAt(0).toUpperCase() +
      tax.genus.slice(1).toLowerCase()
    : "";

  const species = tax?.species
    ? tax.species.toLowerCase()
    : "";

  return `<i>${genus} ${species}</i>`;
}


function formatAuthor(auth) {

  if (!auth?.author) return "";

  const year = auth?.year
    ? `, ${auth.year}`
    : "";

  const base = `${auth.author}${year}`;

  return auth?.parentheses
    ? `(${base})`
    : base;
}


function formatTaxonomy(tax) {

  if (!tax) return "";

  const parts = [];

  if (tax.order) {
    parts.push(tax.order);
  }

  if (tax.family) {
    parts.push(tax.family);
  }

  if (tax.subfamily) {
    parts.push(tax.subfamily);
  }

  return parts.join(" • ");
}


/* =========================
   MAIN RENDER
========================= */

export function renderTitle() {

  const container = document.getElementById("vb-header");

  if (!container) return;

  const data = window.VECTOBOL?.data;

  if (!data) return;

  /*
   * La taxonomie provient maintenant
   * directement de vb_taxa pour l'espèce demandée.
   */
  const tax = data.taxonomy || {};
  const auth = data.authority || {};

  if (!tax.genus || !tax.species) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="vb-name">
      ${formatName(tax)}
    </div>

    <div class="vb-author">
      ${formatAuthor(auth)}
    </div>

    <div class="vb-taxo">
      ${formatTaxonomy(tax)}
    </div>
  `;
}