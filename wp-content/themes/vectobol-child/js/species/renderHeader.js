export function renderHeader(state = window.VECTOBOL?.data) {
  const element = document.getElementById("species_header");

  if (!element) {
    console.error("[SPECIES] Élément obligatoire #species_header absent du modèle.");
    return false;
  }

  const taxonomy = state?.taxonomy || {};
  const genus = String(taxonomy.genus || "").trim();
  const species = String(taxonomy.species || "").trim();

  element.replaceChildren();

  if (!genus && !species) {
    const fallback = String(state?.slug || "").replace(/-/g, " ").trim();
    element.textContent = fallback || "Species";
    return false;
  }

  const scientificName = document.createElement("i");
  scientificName.textContent = [genus, species].filter(Boolean).join(" ");
  element.appendChild(scientificName);

  const authority = state?.authority || {};
  const author = String(authority.author || taxonomy.author || "").trim();
  const year = authority.year ?? taxonomy.year ?? null;

  if (author || year) {
    const authorityElement = document.createElement("span");
    authorityElement.className = "vb-taxonomic-authority";

    let authorityText = author;
    if (year !== null && year !== "") {
      authorityText += (authorityText ? ", " : "") + String(year);
    }

    if (authority.parentheses ?? Boolean(taxonomy.author_parentheses)) {
      authorityText = "(" + authorityText + ")";
    }

    authorityElement.textContent = " " + authorityText;
    element.appendChild(authorityElement);
  }

  return true;
}
