/* ==========================================================
   links.js
   Construction des liens vers les fiches espèces
========================================================== */
import { getSpeciesSlug } from "../shared/taxonomy.js";

export function speciesLink(row) {

  if (!row) return null;
  if (row.has_ecology !== true) return null;

  const slug = getSpeciesSlug(row);
  if (!slug) return null;

  const lang =
    (document.documentElement.lang || "fr")
      .toLowerCase()
      .split("-")[0];

  const prefixes = {
    fr: "espece",
    en: "species",
    es: "especie"
  };

  const prefix = prefixes[lang] || prefixes.fr;

  const url = new URL(`/${lang}/${prefix}/`, window.location.origin);
  url.searchParams.set("species", slug);

  return url.toString();
}
