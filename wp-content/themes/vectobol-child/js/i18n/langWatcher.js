const lang =
  document.documentElement.lang
    ? document.documentElement.lang.toLowerCase().split("-")[0]
    : "fr";

export function watchLanguageChange(callback) {

  let currentLang = getLang();

  const observer = new MutationObserver(() => {

    const newLang = getLang();

    if (newLang !== currentLang) {
      currentLang = newLang;
      callback(newLang);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  return observer;
}