export function renderEcology() {
  const ecology = window.VECTOBOL?.data?.ecology;

  if (!ecology) {
    return;
  }

  const sections = ecology.sections || {};

  const sectionKeys = [
    "systematics",
    "bioecology",
    "pathogens",
    "distribution",
    "bolivia"
  ];

  sectionKeys.forEach((key) => {
    const element = document.querySelector(`[data-i18n="${key}"]`);

    if (!element) {
      return;
    }

    /*
     * L'API ne transmet que la langue demandée et les sections
     * publiables. Aucun repli vers une autre langue n'est permis
     * pour les contenus scientifiques.
     */
    element.innerHTML = sections[key] || "";
  });

  const bibliography = document.querySelector(
    '[data-i18n="bibliography"]'
  );

  if (bibliography) {
    bibliography.innerHTML = ecology.bibliography || "";
  }
}
