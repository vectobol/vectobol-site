export function renderTexts() {
  const translate = window.VECTOBOL_I18N?.t;

  if (typeof translate !== "function") {
    return;
  }

  const nodes = document.querySelectorAll("[data-label]");

  nodes.forEach((element) => {
    const key = element.dataset.label;

    if (!key) {
      return;
    }

    const value = translate(key);

    if (value && value !== key) {
      element.textContent = value;
    }
  });
}
