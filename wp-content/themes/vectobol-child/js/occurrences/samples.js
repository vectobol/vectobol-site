import { state } from "./state.js";
import { normField } from "./dictionary.js";

export const getSampleKey = record => String(record.record_id);

export function buildSamples() {
  const sampleMap = new Map();

  state.data.forEach(record => {
    const key = getSampleKey(record);

    if (!sampleMap.has(key)) {
      sampleMap.set(key, {
        record_id: key,
        sample_id: key,
        latitude: record.latitude,
        longitude: record.longitude,
        species_set: new Set(),
        raw: []
      });
    }

    const sample = sampleMap.get(key);
    let speciesName = null;

    if (record.genus && record.species) {
      const genusRaw = record[normField("genus")] ?? record.genus;
      const speciesRaw = record[normField("species")] ?? record.species;

      const genus = genusRaw
        ? String(genusRaw).charAt(0).toUpperCase() + String(genusRaw).slice(1).toLowerCase()
        : null;

      const species = speciesRaw
        ? String(speciesRaw).toLowerCase()
        : null;

      if (genus && species) {
        speciesName = `${genus} ${species}`;
      }
    }
    else if (record.species_key) {
      const parts = record.species_key.replace(/_/g, " ").split(" ");

      speciesName = parts.map((part, index) => (
        index === 0
          ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          : part.toLowerCase()
      )).join(" ");
    }
    else if (record.species) {
      speciesName = record.species;
    }

    if (speciesName) {
      sample.species_set.add(speciesName);
    }

    sample.raw.push(record);
  });

  state.samples = [...sampleMap.values()].map(sample => ({
    ...sample,
    species: [...sample.species_set]
  }));
}
