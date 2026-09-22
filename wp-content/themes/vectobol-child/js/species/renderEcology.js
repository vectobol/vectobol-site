export function renderEcology() {

  const eco = window.VECTOBOL?.data?.ecology;
  if (!eco) return;

  const lang = (document.documentElement.lang || "fr").slice(0, 2);

  const map = {
    systematics: "systematics",
    bioecology: "bioecology",
    pathogens: "pathogens",
    distribution: "distribution",
    bolivia: "bolivia"
  };

  Object.entries(map).forEach(([key, base]) => {

    const el = document.querySelector(`[data-i18n="${key}"]`);
    if (!el) return;

    const value =
      eco[`${base}_${lang}`] ||
      eco[`${base}_fr`] ||
      "";

    el.innerHTML = value;
  });

  // bibliographie (non multilingue)
  const biblio = document.querySelector(`[data-i18n="bibliography"]`);

  if (biblio) {
    biblio.innerHTML = eco.bibliography || "";
  }
}