export function pretty(v, type = "") {
  v = String(v || "").trim();
  if (!v) return "";

  if (type === "species") {
    return `<i>${v.charAt(0).toLowerCase() + v.slice(1)}</i>`;
  }

  if (type === "genus" || type === "subgenus") {
    return `<i>${v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()}</i>`;
  }

  return v;
}