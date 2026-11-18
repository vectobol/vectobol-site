export function renderHeader(state = window.VECTOBOL?.data) {
  const element =
    document.getElementById("species_header") ||
    document.getElementById("vb-header") ||
    document.querySelector("[data-species-title]");

  if (!element || !state?.taxonomy) {
    return;
  }

  const genus = state.taxonomy.genus || "";
  const species = state.taxonomy.species || "";

  element.replaceChildren();

  const scientificName = document.createElement("i");
  scientificName.textContent = `${genus} ${species}`.trim();

  element.appendChild(scientificName);
}
