

export const labels = {
  fr: {
    systematique: "Systématique",
    bioecologie: "Bioécologie",
    pathogenes: "Pathogènes",
    distribution: "Distribution",
    bolivie: "En Bolivie...",
    bibliographie: "Bibliographie",
    collectes: "Points de collecte VectoBol",
    photos: "Photos",

    sheet_author: "Fiche rédigée par",
    last_update: "Mise à jour"


  },

  en: {
    systematique: "Systematics",
    bioecologie: "Bioecology",
    pathogenes: "Pathogens",
    distribution: "Distribution",
    bolivie: "In Bolivia...",
    bibliographie: "Bibliography",
    collectes: "VectoBol records",
    photos: "Photos",

    sheet_author: "Fact sheet written by",
    last_update: "Last updated"
  },

  es: {
    systematique: "Sistemática",
    bioecologie: "Bioecología",
    pathogenes: "Patógenos",
    distribution: "Distribución",
    bolivie: "En Bolivia...",
    bibliographie: "Bibliografía",
    collectes: "Puntos de colecta VectoBol",
    photos: "Fotos",

    sheet_author: "Ficha redactada por",
    last_update: "Última actualización"
  }
};

export function getLang() {
  const lang = document.documentElement.lang;
  return lang ? lang.toLowerCase().split("-")[0] : "fr";
}

export function t(key) {
  const lang = getLang();
  return labels?.[lang]?.[key]
    ?? labels?.fr?.[key]
    ?? key;
}

/* global safe exposure */
window.VECTOBOL_I18N = window.VECTOBOL_I18N || {
  labels,
  t
};