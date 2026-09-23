export const state = {
  data: [],
  current: [],
  samples: [],
  index: {},
  varType: {},
  catalog: {},
  labels: {},
  valueLabels: {},
  dictionary: null,
  lang: "en",
  filtersVisible: true,
  filterError: null
};

export const CONFIG = {
  excludedFields: new Set([
    "record_id",
    "latitude",
    "longitude",
    "species_key"
  ]),

  groups: {
    Taxonomy: [
      "phylum",
      "class",
      "order",
      "family",
      "subfamily",
      "tribe",
      "genus",
      "subgenus",
      "species"
    ],

    Geography: [
      "sample_admin1",
      "sample_admin2",
      "sample_admin3",
      "altitude"
    ],

    Time: [
      "year",
      "month",
      "day"
    ],

    Sampling: [
      "sample_type",
      "sample_origen",
      "sampling_method_ter",
      "acuatic_location",
      "artificial_container"
    ],

    Identification: [
      "identifiedby",
      "identificationverificationstatus"
    ]
  }
};

export const GROUP_LABELS = {
  fr: {
    Taxonomy: "Taxonomie",
    Geography: "Géographie",
    Time: "Date",
    Sampling: "Capture",
    Identification: "Identification"
  },

  en: {
    Taxonomy: "Taxonomy",
    Geography: "Geography",
    Time: "Date",
    Sampling: "Sampling",
    Identification: "Identification"
  },

  es: {
    Taxonomy: "Taxonomía",
    Geography: "Geografía",
    Time: "Fecha",
    Sampling: "Captura",
    Identification: "Identificación"
  }
};

export const UI_LABELS = {
  fr: {
    filters: "Filtres",
    group: "Groupe",
    reset: "Réinitialiser",
    variable: "Variable",
    operator: "Opérateur",
    condition: "Condition",
    addGroup: "+ groupe",
    addCondition: "+ condition",
    clustersOn: "Clusters: ON",
    clustersOff: "Points: ON",
    groupDelete: "Supprimer groupe",
    missingOperator: "Opérateur manquant",
    type: "Saisir une valeur",
    missingValue: "Valeur manquante"
  },

  en: {
    filters: "Filters",
    group: "Group",
    reset: "Reset",
    variable: "Variable",
    operator: "Operator",
    condition: "Condition",
    addGroup: "+ group",
    addCondition: "+ condition",
    clustersOn: "Clusters: ON",
    clustersOff: "Points: ON",
    groupDelete: "Delete group",
    missingOperator: "Missing operator",
    type: "Enter a value",
    missingValue: "Missing value"
  },

  es: {
    filters: "Filtros",
    group: "Grupo",
    reset: "Reiniciar",
    variable: "Variable",
    operator: "Operador",
    condition: "Condición",
    addGroup: "+ grupo",
    addCondition: "+ condición",
    clustersOn: "Clusters: ON",
    clustersOff: "Puntos: ON",
    groupDelete: "Eliminar grupo",
    missingOperator: "Falta operador",
    type: "Introducir un valor",
    missingValue: "Falta valor"
  }
};

state.ui = UI_LABELS;

export function ui(key) {
  const lang = state.lang || "en";

  return (
    state.ui?.[lang]?.[key] ??
    state.ui?.en?.[key] ??
    key
  );
}

export function translate(type, key, subKey = null) {
  const lang = state.lang || "en";

  if (type === "group") {
    return GROUP_LABELS?.[lang]?.[key] ?? key;
  }

  if (type === "var") {
    return state.labels?.[key]?.[lang] ?? key;
  }

  if (type === "value") {
    return state.valueLabels?.[key]?.[subKey]?.[lang]
      ?? subKey
      ?? "";
  }

  if (type === "ui") {
    return ui(key);
  }

  return key;
}
