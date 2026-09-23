const OCCURRENCES_URL = "/wp-content/data/vectobol/production/occurrences.json";
const DICTIONARY_URL = "/wp-content/data/vectobol/production/dictionary.json";

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${url}`);
  }

  return response.json();
}

export async function loadData() {
  const [data, dictionary] = await Promise.all([
    fetchJson(OCCURRENCES_URL),
    fetchJson(DICTIONARY_URL)
  ]);

  if (!Array.isArray(data)) {
    throw new Error("occurrences.json must contain an array");
  }

  if (!dictionary || !Array.isArray(dictionary.variables) || !Array.isArray(dictionary.values)) {
    throw new Error("dictionary.json has an invalid structure");
  }

  return { data, dictionary };
}
