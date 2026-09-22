import { pretty } from "/wp-content/themes/vectobol-child/js/list/format.js";

/* ==========================================================
   table.js
   Affichage de la table uniquement
========================================================== */

export function renderTable({
  rows = [],
  tbody,
  speciesLink
}) {

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!rows.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="taxo-empty">
          No results
        </td>
      </tr>
    `;

    return;
  }

  rows.forEach(row => {

    const tr = document.createElement("tr");

    /* ----------------------------------------------------
       Scientific name
    ---------------------------------------------------- */

    const scientificName = `
      ${pretty(row.genus, "genus")}
      ${pretty(row.species, "species")}
    `.replace(/\s+/g," ").trim();

    /* ----------------------------------------------------
       Species link
    ---------------------------------------------------- */

    const url = speciesLink(row);

    const speciesCell = url

      ? `<a class="species-link" href="${url}">
            ${scientificName}
         </a>`

      : `<span class="species-text">
            ${scientificName}
         </span>`;

    

    /* ----------------------------------------------------
      Species sheet status
    ---------------------------------------------------- */

    const lang =
      (document.documentElement.lang || "fr")
        .toLowerCase()
        .split("-")[0];

    const statusKey = `status_${lang}`;

    const status = row[statusKey] || "";

    let statusClass = "";

    if (status === "ready") {
      statusClass = "status-ready";
    }
    else if (status === "in_progress") {
      statusClass = "status-progress";
    }
    else if (status === "draft") {
      statusClass = "status-draft";
    }

    const statusIndicator =
      row.has_ecology && status
        ? `<span class="species-status ${statusClass}"
                title="${status}">
          </span>`
        : "";

    
    /* ----------------------------------------------------
       Row
    ---------------------------------------------------- */

    tr.innerHTML = `
      <td>${row.family}</td>
      <td>${row.subfamily}</td>
      <td>${row.tribe}</td>
      <td>${pretty(row.genus,"genus")}</td>
      <td>${pretty(row.subgenus,"subgenus")}</td>
      <td>
        ${speciesCell}
        ${statusIndicator}
      </td>
    `;

    tbody.appendChild(tr);

  });

}