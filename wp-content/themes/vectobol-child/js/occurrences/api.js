const COLLECTION_SITES_URL = "/wp-json/vectobol/v1/collection-sites";
const OCCURRENCES_URL = "/wp-json/vectobol/v1/occurrences";
const DICTIONARY_URL = "/wp-json/vectobol/v1/dictionary";

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${url}`);
  }

  return response.json();
}

async function fetchAllPages(baseUrl, label) {
  const perPage = 2000;
  const firstPage = await fetchJson(
    `${baseUrl}?page=1&per_page=${perPage}`
  );

  if (
    !firstPage ||
    !Array.isArray(firstPage.data) ||
    !firstPage.meta
  ) {
    throw new Error(`${label} API returned an invalid structure`);
  }

  const pages = Number(firstPage.meta.pages) || 1;

  if (pages === 1) {
    return firstPage.data;
  }

  const requests = [];

  for (let page = 2; page <= pages; page += 1) {
    requests.push(
      fetchJson(`${baseUrl}?page=${page}&per_page=${perPage}`)
    );
  }

  const remaining = await Promise.all(requests);

  return [
    ...firstPage.data,
    ...remaining.flatMap(page => {
      if (!page || !Array.isArray(page.data)) {
        throw new Error(`${label} API returned an invalid page`);
      }

      return page.data;
    })
  ];
}

export async function loadData() {
  const [sites, occurrences, dictionary] = await Promise.all([
    fetchAllPages(COLLECTION_SITES_URL, "collection-sites"),
    fetchAllPages(OCCURRENCES_URL, "occurrences"),
    fetchJson(DICTIONARY_URL)
  ]);

  if (!Array.isArray(sites)) {
    throw new Error("collection-sites API data must be an array");
  }

  if (!Array.isArray(occurrences)) {
    throw new Error("occurrences API data must be an array");
  }

  if (
    !dictionary ||
    !Array.isArray(dictionary.variables) ||
    !Array.isArray(dictionary.values)
  ) {
    throw new Error("dictionary API returned an invalid structure");
  }

  /*
   * The filter engine works at collection-point level.
   * For each record_id, it receives:
   *   1. the collection-site row;
   *   2. zero, one or several occurrence rows.
   *
   * This lets a geography/date/sampling filter match a site
   * even when it has no occurrence, while taxonomy/identification
   * filters match its occurrence rows.
   */
  const occurrencesByRecord = new Map();

  occurrences.forEach(record => {
    const key = String(record.record_id);

    if (!occurrencesByRecord.has(key)) {
      occurrencesByRecord.set(key, []);
    }

    occurrencesByRecord.get(key).push(record);
  });

  const filterData = [];

  sites.forEach(site => {
    const key = String(site.record_id);

    filterData.push(site);

    (occurrencesByRecord.get(key) || []).forEach(occurrence => {
      filterData.push(occurrence);
    });
  });

  /*
   * Keep orphan occurrences in the filter dataset as a safety net.
   * They should normally not exist because collection_sites is the
   * authoritative collection table, but they remain useful for
   * diagnostics and do not alter the site-based map.
   */
  const siteKeys = new Set(
    sites.map(site => String(site.record_id))
  );

  occurrences.forEach(occurrence => {
    const key = String(occurrence.record_id);

    if (!siteKeys.has(key)) {
      filterData.push(occurrence);
    }
  });

  return {
    sites,
    occurrences,
    data: filterData,
    dictionary
  };
}
