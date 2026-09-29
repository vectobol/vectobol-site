import { state } from "./state.js";

export const getSampleKey = record => String(record.record_id);

function formatSpeciesName(record) {
  const genus = record?.genus
    ? String(record.genus).trim()
    : "";

  const species = record?.species
    ? String(record.species).trim()
    : "";

  if (!genus || !species) {
    if (record?.species_key) {
      const parts = String(record.species_key)
        .replace(/_/g, " ")
        .split(" ")
        .filter(Boolean);

      if (!parts.length) return null;

      return parts
        .map((part, index) => (
          index === 0
            ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            : part.toLowerCase()
        ))
        .join(" ");
    }

    return null;
  }

  return (
    genus.charAt(0).toUpperCase() +
    genus.slice(1).toLowerCase() +
    " " +
    species.toLowerCase()
  );
}

export function buildSamples() {
  const sampleMap = new Map();
  const occurrencesByRecord = new Map();

  state.occurrences.forEach(record => {
    const key = getSampleKey(record);

    if (!occurrencesByRecord.has(key)) {
      occurrencesByRecord.set(key, []);
    }

    occurrencesByRecord.get(key).push(record);
  });

  state.sites.forEach(site => {
    const key = getSampleKey(site);

    const sample = {
      record_id: key,
      sample_id: site.sample_id ?? "",
      latitude: site.latitude,
      longitude: site.longitude,
      altitude: site.altitude,
      species_set: new Set(),
      has_occurrences: false,
      has_identified_species: false,
      occurrence_count: occurrences.length,
      raw: [site]
    };

    const occurrences =
      occurrencesByRecord.get(key) || [];

    if (occurrences.length) {
      sample.has_occurrences = true;
    }

    occurrences.forEach(record => {
      const speciesName = formatSpeciesName(record);

      const speciesKey = record?.species_key
        ? String(record.species_key).trim().toLowerCase()
        : "";

      const identifiedSpecies =
        Boolean(speciesKey) &&
        !speciesKey.endsWith("_sp");

      if (identifiedSpecies) {
        sample.has_identified_species = true;
      }

      if (speciesName) {
        sample.species_set.add(speciesName);
      }

      sample.raw.push(record);
    });

    sampleMap.set(key, sample);
  });

  state.samples = [...sampleMap.values()].map(sample => ({
    ...sample,
    species: [...sample.species_set]
  }));

  console.log("[OCCURRENCES] SITE STATUS", {
    total: state.samples.length,
    noOccurrence: state.samples.filter(sample =>
      sample.occurrence_count === 0
    ).length,
    occurrenceNoSpecies: state.samples.filter(sample =>
      sample.occurrence_count > 0 &&
      !sample.has_identified_species
    ).length,
    identifiedSpecies: state.samples.filter(sample =>
      sample.has_identified_species
    ).length
  });
}
