import { state, CONFIG } from "./state.js";

export function normField(key) {
  if (!key) return key;
  return key.replace(/_taxo$/, "");
}

export function buildLabels(dictionary) {
  state.labels = {};
  state.valueLabels = {};

  (dictionary?.variables || []).forEach(variable => {
    const key = normField(variable.variable);

    state.labels[key] = {
      fr: variable.label_fr || variable.label_en || key,
      en: variable.label_en || key,
      es: variable.label_es || variable.label_en || key
    };
  });

  (dictionary?.values || []).forEach(value => {
    const key = normField(value.variable);

    if (!state.valueLabels[key]) {
      state.valueLabels[key] = {};
    }

    state.valueLabels[key][String(value.code)] = {
      fr: value.value_fr || value.value_en || String(value.code),
      en: value.value_en || String(value.code),
      es: value.value_es || value.value_en || String(value.code)
    };
  });
}

export function buildVariableCatalog(dictionary) {
  state.catalog = {};

  (dictionary?.variables || []).forEach(variable => {
    const key = variable.variable;

    state.catalog[key] = {
      label: state.labels?.[key] || key,
      exists: true
    };
  });
}

function detectType(values) {
  const clean = values
    .map(value => (
      value === null || value === undefined
        ? ""
        : String(value).trim()
    ))
    .filter(value => value !== "");

  const numeric = clean.filter(value => Number.isFinite(Number(value)));
  const numericRatio = clean.length ? numeric.length / clean.length : 0;

  if (numericRatio > 0.95) return "numeric";
  if (clean.length && clean.every(value => value === "true" || value === "false")) {
    return "boolean";
  }

  return "categorical";
}

export function buildIndex() {
  state.index = {};
  state.varType = {};

  state.data.forEach(record => {
    Object.entries(record).forEach(([key, value]) => {
      if (CONFIG.excludedFields.has(key)) return;
      if (value === null || value === undefined || String(value).trim() === "") return;

      const normalizedKey = normField(key);

      if (!state.index[normalizedKey]) {
        state.index[normalizedKey] = new Set();
      }

      state.index[normalizedKey].add(String(value));
    });
  });

  if (state.dictionary?.variables?.length) {
    state.dictionary.variables.forEach(variable => {
      const key = normField(variable.variable);

      if (!state.index[key]) {
        state.index[key] = new Set();
      }
    });
  }

  Object.keys(state.index).forEach(key => {
    const values = [...state.index[key]].sort();

    state.index[key] = values;
    state.varType[key] = state.valueLabels?.[key]
      ? "categorical"
      : detectType(values);
  });
}

export function getValueLabelSafe(fieldKey, value) {
  const raw = state.valueLabels?.[fieldKey]?.[String(value)];

  if (raw && typeof raw === "object") {
    return raw[state.lang] || raw.en || raw.fr || String(value);
  }

  return String(value ?? "");
}
