const t = window.VECTOBOL_I18N?.t;

export function renderTexts() {

  const nodes = document.querySelectorAll("[data-label]");

  nodes.forEach(el => {

    const key = el.dataset.label;
    if (!key) return;

    const value = t(key);
    if (!value) return;

    el.textContent = value;
  });
}