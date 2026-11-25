import { state, CONFIG, translate, ui } from "./state.js";
import { normField } from "./dictionary.js";

export function getGroupedVariables() {
  const has = key => state.index[normField(key)] !== undefined;
  const G = key => normField(key);

  return {
    Taxonomy: (() => {
      const values = [];
      if (has("class")) values.push(G("class"));
      if (has("order")) values.push(G("order"));
      if (has("family")) values.push(G("family"));
      if (has("subfamily")) values.push(G("subfamily"));
      if (has("tribe")) values.push(G("tribe"));
      if (has("genus")) values.push(G("genus"));
      if (has("subgenus")) values.push(G("subgenus"));
      if (has("species")) values.push(G("species"));
      return values;
    })(),

    Geography: (() => {
      const values = [];
      if (has("sample_admin1")) values.push(G("sample_admin1"));
      if (has("sample_admin2")) values.push(G("sample_admin2"));
      if (has("sample_admin3")) values.push(G("sample_admin3"));
      if (has("altitude")) values.push(G("altitude"));
      return values;
    })(),

    Time: (() => {
      const values = [];
      if (has("year")) values.push(G("year"));
      if (has("month")) values.push(G("month"));
      if (has("day")) values.push(G("day"));
      return values;
    })(),

    Sampling: (() => {
      const values = [];
      if (has("sample_type")) values.push(G("sample_type"));
      if (has("sample_origen")) values.push(G("sample_origen"));
      if (has("sampling_method_ter")) values.push(G("sampling_method_ter"));
      if (has("acuatic_location")) values.push(G("acuatic_location"));
      if (has("artificial_container")) values.push(G("artificial_container"));
      return values;
    })(),

    Identification: (() => {
      const values = [];
      if (has("identifiedby")) values.push(G("identifiedby"));
      if (has("identificationverificationstatus")) values.push(G("identificationverificationstatus"));
      return values;
    })()
  };
}

export function getOperators(type) {
  switch (type) {
    case "numeric":
      return [
        { v: "eq", l: "=" },
        { v: "neq", l: "!=" },
        { v: "gt", l: ">" },
        { v: "lt", l: "<" },
        { v: "gte", l: "≥" },
        { v: "lte", l: "≤" }
      ];

    case "boolean":
    case "categorical":
    default:
      return [
        { v: "eq", l: "=" },
        { v: "neq", l: "!=" }
      ];
  }
}

export function buildAST() {
  const groups = document.querySelectorAll(".filter-group");
  const ast = [];

  groups.forEach(groupElement => {
    const rows = [];
    const rowElements = groupElement.querySelectorAll(".filter-row");

    rowElements.forEach((row, index) => {
      const field = row.querySelector(".field")?.value || "";
      const operator = row.querySelector(".op")?.value || "";
      const logicElement = row.querySelector(".intra");
      const intra = logicElement ? logicElement.value : "AND";

      let value = "";

      const searchable = row.querySelector(".searchable-input");
      const input = row.querySelector(".val");

      if (searchable && searchable.dataset?.value !== undefined) {
        value = searchable.dataset.value;
      }
      else if (input && input.dataset?.value !== undefined) {
        value = input.dataset.value;
      }
      else if (input) {
        value = input.value;
      }

      // A row with no variable is only the empty UI placeholder.
      // It must not become a real filter condition.
      if (!field) return;

      rows.push({
        f: field,
        o: operator,
        v: value,
        // The connector displayed on this row connects this condition
        // to the next condition. The first row therefore must preserve
        // its OR/AND selection: it is meaningful when a second row exists.
        intra
      });
    });

    // The group connector is intentionally placed just before the group in the DOM.
    // Read it from the previous sibling so the group-level AND/OR is preserved.
    const previousElement = groupElement.previousElementSibling;
    const groupLogic = previousElement?.classList.contains("group-connector")
      ? previousElement.querySelector(".group-logic")?.value || "AND"
      : "AND";

    // Empty groups are not filters.
    // This is essential for the initial/reset state, where the UI
    // contains one blank row.
    if (!rows.length) return;

    ast.push({
      logic: groupLogic,
      rows
    });
  });

  return ast;
}

export function isRealNumber(value) {
  return value !== null &&
    value !== undefined &&
    value !== "" &&
    !Number.isNaN(Number(value));
}

export function evalCondition(x, operator, value) {
  if (x === null || x === undefined) return false;

  const xNum = Number(x);
  const vNum = Number(value);
  const numeric = isRealNumber(x) && isRealNumber(value);

  switch (operator) {
    case "eq":
      return numeric ? xNum === vNum : String(x) === String(value);
    case "neq":
      return numeric ? xNum !== vNum : String(x) !== String(value);
    case "gt":
      return numeric ? xNum > vNum : false;
    case "lt":
      return numeric ? xNum < vNum : false;
    case "gte":
      return numeric ? xNum >= vNum : false;
    case "lte":
      return numeric ? xNum <= vNum : false;
    default:
      return false;
  }
}

export function evaluateGroup(group, records) {
  if (!group.rows.length) return false;

  const sampleRecords = Array.isArray(records) ? records : [records];

  const conditionMatches = row =>
    sampleRecords.some(record =>
      evalCondition(
        record[normField(row.f)],
        row.o,
        row.v
      )
    );

  // The connector displayed on a row connects that row to the
  // following row. This matches the visual order of the filter UI.
  let result = conditionMatches(group.rows[0]);

  for (let index = 1; index < group.rows.length; index++) {
    const previous = group.rows[index - 1];
    const operator = (previous.intra || "AND").toUpperCase();
    const currentResult = conditionMatches(group.rows[index]);

    if (operator === "AND") {
      result = result && currentResult;
    }
    else {
      result = result || currentResult;
    }
  }

  return result;
}

export function evaluateAST(ast, data) {
  if (!ast.length) return data;

  // Filters operate on collection points, not individual occurrence rows.
  // A point may contain several occurrence records (for example one Aedes
  // and one Culex). Each condition therefore matches a point when at least
  // one of its occurrence records satisfies that condition.
  const sampleMap = new Map();

  data.forEach(record => {
    const key = String(record.record_id);

    if (!sampleMap.has(key)) {
      sampleMap.set(key, []);
    }

    sampleMap.get(key).push(record);
  });

  const matchingKeys = new Set();

  sampleMap.forEach((records, key) => {
    let finalResult = null;

    for (let index = 0; index < ast.length; index++) {
      const groupResult = evaluateGroup(ast[index], records);

      if (index === 0) {
        finalResult = groupResult;
        continue;
      }

      const logic = (ast[index].logic || "AND").toUpperCase();

      if (logic === "AND") {
        finalResult = finalResult && groupResult;
      }
      else if (logic === "OR") {
        finalResult = finalResult || groupResult;
      }
    }

    if (finalResult) {
      matchingKeys.add(key);
    }
  });

  // Return occurrence records belonging to matching collection points.
  // apply() converts these records back to unique sample IDs.
  return data.filter(record =>
    matchingKeys.has(String(record.record_id))
  );
}

export function validateAST(ast) {
  state.filterError = null;

  for (const group of ast || []) {
    for (const row of group.rows || []) {
      if (!row.f) continue;

      if (!row.o) {
        state.filterError = "missing_operator";
        return false;
      }

      const emptyValue = row.v == null ||
        (typeof row.v === "string" && row.v.trim() === "");

      if (emptyValue) {
        state.filterError = "missing_value";
        return false;
      }
    }
  }

  return true;
}

export function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
