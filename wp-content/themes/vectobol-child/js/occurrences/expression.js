import { state, translate, ui } from "./state.js";

export function updateCount() {
  const element = document.getElementById("count");
  if (!element) return;

  const label = {
    fr: "Nombre de points filtrés",
    en: "Filtered points",
    es: "Puntos filtrados"
  }[state.lang] || "Filtered points";

  const count = Array.isArray(state.current) ? state.current.length : 0;
  element.textContent = `${label} : ${count}`;
}

export function updateExpression(ast) {
  const element = document.getElementById("expression");
  if (!element) return;

  const emptyMessage =
    state.lang === "fr" ? "Aucun filtre actif" :
    state.lang === "es" ? "Sin filtro activo" :
    "No active filter";

  if (!ast || !ast.length) {
    element.textContent = emptyMessage;
    return;
  }

  const operatorLabels = {
    eq: "=",
    neq: "≠",
    gt: ">",
    lt: "<",
    gte: "≥",
    lte: "≤"
  };

  const groupsText = ast.map((group, groupIndex) => {
    const rowsText = group.rows.map((row, rowIndex) => {
      const label = translate("var", row.f);
      const operator = operatorLabels[row.o] || row.o;
      const value = translate("value", row.f, row.v);

      if (rowIndex === 0) {
        return `${label} ${operator} ${value}`;
      }

      const link = group.rows[rowIndex - 1].intra || "AND";
      return `${link} ${label} ${operator} ${value}`;
    }).join(" ");

    if (groupIndex === 0) {
      return `( ${rowsText} )`;
    }

    const link = ast[groupIndex - 1]?.logic || "AND";
    return `${link} ( ${rowsText} )`;
  }).join(" ");

  element.textContent = groupsText;
}

export function updateFilterError() {
  const element = document.getElementById("expression");
  if (!element) return;

  element.classList.remove("expression-error");

  if (!state.filterError) return;

  element.classList.add("expression-error");

  switch (state.filterError) {
    case "missing_operator":
      element.textContent = ui("missingOperator");
      break;
    case "missing_value":
      element.textContent = ui("missingValue");
      break;
    default:
      element.textContent = ui("error");
  }
}
