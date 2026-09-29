const OCCURRENCES_URL = "/wp-json/vectobol/v1/occurrences";
const DICTIONARY_URL = "/wp-json/vectobol/v1/dictionary";

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${url}`);
  }

  return response.json();
}

async function fetchAllOccurrences() {
  const perPage = 2000;
  const firstPage = await fetchJson(`${OCCURRENCES_URL}?page=1&per_page=${perPage}`);

  if (!firstPage || !Array.isArray(firstPage.data) || !firstPage.meta) {
    throw new Error("occurrences API returned an invalid structure");
  }

  const pages = Number(firstPage.meta.pages) || 1;

  if (pages === 1) {
    return firstPage.data;
  }

  const requests = [];
  for (let page = 2; page <= pages; page += 1) {
    requests.push(
      fetchJson(`${OCCURRENCES_URL}?page=${page}&per_page=${perPage}`)
    );
  }

  const remaining = await Promise.all(requests);

  return [
    ...firstPage.data,
    ...remaining.flatMap(page => {
      if (!page || !Array.isArray(page.data)) {
        throw new Error("occurrences API returned an invalid page");
      }
      return page.data;
    })
  ];
}

export async function loadData() {
  const [data, dictionary] = await Promise.all([
    fetchAllOccurrences(),
    fetchJson(DICTIONARY_URL)
  ]);

  if (!Array.isArray(data)) {
    throw new Error("occurrences API data must be an array");
  }

  if (!dictionary || !Array.isArray(dictionary.variables) || !Array.isArray(dictionary.values)) {
    throw new Error("dictionary API returned an invalid structure");
  }

  return { data, dictionary };
}
