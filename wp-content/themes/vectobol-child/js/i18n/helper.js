export function getLang() {
  return (document.documentElement.lang || "fr")
    .toLowerCase()
    .split("-")[0];
}

export function pickLang(obj, baseKey) {
  if (!obj || typeof obj !== "object") return "";

  const lang = getLang();

  const key = `${baseKey}_${lang}`;

  return obj[key] ?? obj[`${baseKey}_fr`] ?? "";
}