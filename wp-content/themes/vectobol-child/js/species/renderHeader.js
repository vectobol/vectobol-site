import { qs } from "../shared/utils.js";

export function renderHeader(state) {

  const h = qs("species_header");

  if (!h || !state.taxonomy) return;

  const genus = state.taxonomy?.taxonomy?.genus || "";
  const species = state.taxonomy?.taxonomy?.species || "";

  h.innerHTML = `<i>${genus} ${species}</i>`;
}