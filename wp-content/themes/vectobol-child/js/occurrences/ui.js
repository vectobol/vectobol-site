import { state, translate, ui } from "./state.js";
import { getGroupedVariables, getOperators, buildAST, capitalize } from "./filters.js";
import { getValueLabelSafe } from "./dictionary.js";
import { getClusterMode, toggleClusters, render, invalidateSize } from "./map.js";
import { updateCount, updateExpression, updateFilterError } from "./expression.js";

let rebuildingUI = false;
let suppressApply = false;

function createSearchableValue(values, fieldKey, apply) {
  const wrapper = document.createElement("div");
  wrapper.className = "searchable-select";

  const input = document.createElement("input");
  input.className = "val searchable-input";

  const list = document.createElement("div");
  list.className = "searchable-list";

  const unique = [...new Set(values)]
    .filter(value => value !== null && value !== undefined)
    .map(String)
    .sort();

  function getLabel(value) {
    const raw = state.valueLabels?.[fieldKey]?.[value];

    if (raw && typeof raw === "object") {
      return raw[state.lang] || raw.en || raw.fr || value;
    }

    return raw || value;
  }

  function refresh(filter = "") {
    list.innerHTML = "";

    const query = filter.toLowerCase();

    unique
      .filter(value => String(getLabel(value)).toLowerCase().includes(query))
      .forEach(value => {
        const label = capitalize(getLabel(value));
        const item = document.createElement("div");

        item.className = "searchable-item";
        item.textContent = label;

        item.onclick = () => {
          input.value = label;
          input.dataset.value = String(value);
          list.style.display = "none";
          apply();
        };

        list.appendChild(item);
      });

    list.style.display = list.children.length ? "block" : "none";
  }

  input.addEventListener("focus", () => refresh(""));

  input.addEventListener("input", () => {
    if (rebuildingUI || suppressApply) return;

    input.dataset.value = "";
    refresh(input.value);
    apply();
  });

  document.addEventListener("click", event => {
    if (!wrapper.contains(event.target)) {
      list.style.display = "none";
    }
  });

  wrapper.append(input, list);

  return {
    element: wrapper,
    getValue: () => input.dataset.value || ""
  };
}

function createRow(container, apply, hydrate = false) {
  const row = document.createElement("div");
  row.className = "filter-row";

  const field = document.createElement("select");
  field.className = "field";
  field.innerHTML = `<option value="">${ui("variable")}</option>`;

  Object.entries(getGroupedVariables()).forEach(([groupName, vars]) => {
    const group = document.createElement("optgroup");
    group.label = translate("group", groupName);

    vars.forEach(key => {
      if (!state.index[key]) return;

      const option = document.createElement("option");
      option.value = key;
      option.textContent = capitalize(translate("var", key));
      group.appendChild(option);
    });

    field.appendChild(group);
  });

  const operator = document.createElement("select");
  operator.className = "op";
  operator.innerHTML = `<option value="">${ui("operator")}</option>`;

  const valueBox = document.createElement("div");
  valueBox.className = "val-box";

  let valueElement = null;

  function setSelect(values, fieldKey) {
    const searchable = createSearchableValue(values, fieldKey, apply);
    valueBox.innerHTML = "";
    valueBox.appendChild(searchable.element);

    valueElement = {
      get value() {
        return searchable.getValue();
      }
    };
  }

  function setInput() {
    const input = document.createElement("input");
    input.className = "val";
    input.type = "text";
    input.placeholder = ui("type");
    input.oninput = apply;

    valueBox.innerHTML = "";
    valueBox.appendChild(input);
    valueElement = input;
  }

  field.onchange = () => {
    if (rebuildingUI) return;

    const key = field.value;

    if (!key) {
      valueBox.innerHTML = "";
      valueElement = null;
      operator.innerHTML = `<option value="">${ui("operator")}</option>`;
      operator.selectedIndex = 0;
      add.disabled = true;
      apply();
      return;
    }

    valueBox.innerHTML = "";
    valueElement = null;
    operator.innerHTML = `<option value="">${ui("operator")}</option>`;

    const type = state.varType?.[key] || "categorical";
    const values = state.index[key] || [];

    getOperators(type).forEach(optionData => {
      const option = document.createElement("option");
      option.value = optionData.v;
      option.textContent = optionData.l;
      operator.appendChild(option);
    });

    if (type === "numeric") {
      setInput();
    }
    else {
      setSelect(values, key);
    }

    operator.selectedIndex = 0;
    add.disabled = false;
    apply();
  };

  operator.onchange = () => {
    if (rebuildingUI) return;
    apply();
  };

  const logic = document.createElement("select");
  logic.className = "intra";
  logic.innerHTML = `
    <option value="AND">AND</option>
    <option value="OR">OR</option>
  `;
  logic.value = "AND";
  logic.onchange = () => {
    if (rebuildingUI) return;
    apply();
  };

  const add = document.createElement("button");
  add.className = "add-condition";
  add.textContent = ui("addCondition");
  add.disabled = true;
  add.onclick = () => {
    if (rebuildingUI) return;
    container.appendChild(createRow(container, apply));
  };

  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "X";
  del.onclick = () => {
    row.remove();
    apply();
  };

  row.append(field, operator, valueBox, logic, add, del);

  if (!hydrate && !rebuildingUI) {
    field.selectedIndex = 0;
    field.dispatchEvent(new Event("change"));
  }

  return row;
}

function addGroupConnector(container, isFirst, apply) {
  if (isFirst) return;

  const connector = document.createElement("div");
  connector.className = "group-connector";

  const select = document.createElement("select");
  select.className = "group-logic";
  select.innerHTML = `<option value="AND">AND</option><option value="OR">OR</option>`;
  select.onchange = () => apply();

  connector.appendChild(select);
  container.appendChild(connector);
}

function renumberGroups() {
  document.querySelectorAll(".filter-group").forEach((group, index) => {
    const title = group.querySelector("b");
    if (title) {
      title.textContent = `${ui("group")} ${index + 1}`;
    }
  });
}

function createGroup(container, apply) {
  const isFirst = document.querySelectorAll(".filter-group").length === 0;

  addGroupConnector(container, isFirst, apply);

  const group = document.createElement("div");
  group.className = "filter-group";

  const header = document.createElement("div");
  header.className = "group-header";

  const title = document.createElement("b");
  title.textContent = ui("group");

  const del = document.createElement("button");
  del.className = "del del-group";
  del.textContent = "X";
  del.title = ui("groupDelete");
  del.onclick = () => {
    group.remove();
    renumberGroups();
    apply();
  };

  header.append(title, del);

  const body = document.createElement("div");
  body.appendChild(createRow(body, apply));

  group.append(header, body);
  container.appendChild(group);
  renumberGroups();
}

function rebuildFiltersFromAST(ast, apply) {
  rebuildingUI = true;
  suppressApply = true;

  const panel = document.getElementById("filter-rows");
  if (!panel) return;

  panel.innerHTML = "";

  if (!ast || !ast.length) {
    createGroup(panel, apply);
    rebuildingUI = false;
    suppressApply = false;
    return;
  }

  ast.forEach((groupAst, groupIndex) => {
    const group = document.createElement("div");
    group.className = "filter-group";

    const header = document.createElement("div");
    header.className = "group-header";

    const title = document.createElement("b");
    title.textContent = `${ui("group")} ${groupIndex + 1}`;

    const del = document.createElement("button");
    del.className = "del del-group";
    del.textContent = "X";
    del.title = ui("groupDelete");
    del.onclick = () => {
      group.remove();
      renumberGroups();
      apply();
    };

    header.append(title, del);

    const body = document.createElement("div");

    groupAst.rows.forEach(rowAst => {
      const row = createRow(body, apply, true);
      const field = row.querySelector(".field");
      const operator = row.querySelector(".op");
      const logic = row.querySelector(".intra");
      const searchable = row.querySelector(".searchable-input");
      const input = row.querySelector(".val");
      const valueBox = row.querySelector(".val-box");

      field.value = rowAst.f || "";

      const type = state.varType?.[rowAst.f] || "categorical";
      operator.innerHTML = `<option value="">${ui("operator")}</option>`;

      getOperators(type).forEach(optionData => {
        const option = document.createElement("option");
        option.value = optionData.v;
        option.textContent = optionData.l;
        operator.appendChild(option);
      });

      operator.value = rowAst.o || "";
      if (logic) logic.value = rowAst.intra || "AND";

      const value = rowAst.v ?? "";

      if (searchable) {
        searchable.dataset.value = value;
        searchable.value = getValueLabelSafe(rowAst.f, value);
      }

      if (input && !searchable) {
        input.value = value;
        input.dataset.value = value;
      }

      if (!rowAst.f) {
        valueBox.innerHTML = "";
        operator.innerHTML = `<option value="">${ui("operator")}</option>`;
      }

      body.appendChild(row);
      row.dataset.hydrated = "1";
    });

    group.append(header, body);

    if (groupIndex > 0) {
      const connector = document.createElement("div");
      connector.className = "group-connector";

      const select = document.createElement("select");
      select.className = "group-logic";
      select.innerHTML = `<option value="AND">AND</option><option value="OR">OR</option>`;
      select.value = groupAst.logic || "AND";
      select.onchange = () => apply();

      connector.appendChild(select);
      panel.appendChild(connector);
    }

    panel.appendChild(group);
  });

  rebuildingUI = false;
  suppressApply = false;
  renumberGroups();
}

function updateStaticTexts() {
  const addGroupButton = document.getElementById("add-group");
  const resetButton = document.getElementById("reset");
  const toggleButton = document.getElementById("toggle");

  if (addGroupButton) addGroupButton.textContent = ui("addGroup");
  if (resetButton) resetButton.textContent = ui("reset");
  if (toggleButton) {
    toggleButton.textContent = getClusterMode()
      ? ui("clustersOn")
      : ui("clustersOff");
  }

  const filterButton = document.querySelector("#filter-toggle-bar .toggle-left button");
  if (filterButton) {
    filterButton.textContent = state.filtersVisible
      ? `▼ ${ui("filters")}`
      : `▲ ${ui("filters")}`;
  }

  renumberGroups();
}

export function setLanguage(lang, apply) {
  const ast = buildAST();
  state.lang = lang;
  rebuildFiltersFromAST(ast, apply);
  updateStaticTexts();
  apply();
}

export function initUI(apply) {
  const bar = document.getElementById("filter-toggle-bar");
  const left = bar?.querySelector(".toggle-left");

  if (bar && left) {
    const filterButton = document.createElement("button");

    function renderFilterToggleText() {
      filterButton.textContent = state.filtersVisible
        ? `▼ ${ui("filters")}`
        : `▲ ${ui("filters")}`;
    }

    renderFilterToggleText();

    filterButton.onclick = () => {
      state.filtersVisible = !state.filtersVisible;

      const panel = document.getElementById("filter-panel");
      if (panel) {
        panel.style.display = state.filtersVisible ? "block" : "none";
      }

      renderFilterToggleText();
      render(false);
      invalidateSize(150);
    };

    left.innerHTML = "";
    left.appendChild(filterButton);
  }

  const panel = document.getElementById("filter-rows");
  if (!panel) return;

  panel.innerHTML = "";
  createGroup(panel, apply);

  const addGroupButton = document.getElementById("add-group");
  const resetButton = document.getElementById("reset");
  const toggleButton = document.getElementById("toggle");

  function updateClusterText() {
    if (!toggleButton) return;
    toggleButton.textContent = getClusterMode()
      ? ui("clustersOn")
      : ui("clustersOff");
  }

  if (addGroupButton) {
    addGroupButton.textContent = ui("addGroup");
    addGroupButton.onclick = () => createGroup(panel, apply);
  }

  if (resetButton) {
    resetButton.textContent = ui("reset");
    resetButton.onclick = () => {
      panel.innerHTML = "";
      createGroup(panel, apply);
      state.current = [...state.samples];
      render(false);
      updateCount();
      updateExpression([]);
      updateFilterError();
    };
  }

  if (toggleButton) {
    updateClusterText();

    toggleButton.onclick = () => {
      toggleClusters();
      updateClusterText();
    };
  }

  const panelElement = document.getElementById("filter-panel");
  if (panelElement) {
    panelElement.style.display = state.filtersVisible ? "block" : "none";
  }

  const fr = document.getElementById("lang-fr");
  const en = document.getElementById("lang-en");
  const es = document.getElementById("lang-es");

  if (fr) fr.onclick = () => setLanguage("fr", apply);
  if (en) en.onclick = () => setLanguage("en", apply);
  if (es) es.onclick = () => setLanguage("es", apply);
}
