function getLanguage() {
  return (document.documentElement.lang || "fr")
    .toLowerCase()
    .split("-")[0];
}

function translate(key, fallback) {
  return window.VECTOBOL_I18N?.t?.(key) || fallback;
}

function formatUpdate(value) {
  if (!value) {
    return "—";
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return String(value);
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  return new Intl.DateTimeFormat(getLanguage(), {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

export function renderMeta() {
  const element = document.getElementById("species_meta");

  if (!element) {
    return;
  }

  const ecology = window.VECTOBOL?.data?.ecology || {};
  const author = ecology.redaction || "—";
  const update = formatUpdate(ecology.last_updated);

  element.replaceChildren();

  const line = document.createElement("div");
  line.className = "vb-meta-line";

  const authorLabel = document.createTextNode(
    `${translate("sheet_author", "Fiche rédigée par")} : `
  );

  const authorValue = document.createElement("strong");
  authorValue.textContent = author;

  const separator = document.createTextNode(" · ");

  const updateLabel = document.createTextNode(
    `${translate("last_update", "Mise à jour")} : `
  );

  const updateValue = document.createElement("strong");
  updateValue.textContent = update;

  line.append(
    authorLabel,
    authorValue,
    separator,
    updateLabel,
    updateValue
  );

  element.appendChild(line);
}
