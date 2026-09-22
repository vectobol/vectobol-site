document.addEventListener("DOMContentLoaded", () => {

  const t = window.VECTOBOL_I18N?.t || (k => k);

  // =========================
  // HELPERS
  // =========================

  const set = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  const setLinkText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  const setLinkHref = (id, url) => {
    const el = document.getElementById(id);
    if (el) el.href = url;
  };

  // =========================
  // TITRES + TEXTES
  // =========================

  set("vb-project-title", "sidebar_project");
  set("vb-project-text", "sidebar_project_text");

  set("vb-news-title", "sidebar_news");
  set("vb-quick-title", "sidebar_quick");
  set("vb-species-title", "sidebar_species");

  set("vb-rss-title", "sidebar_rss");

  // =========================
  // LIENS (TEXTES)
  // =========================

  setLinkText("vb-link-maps", "sidebar_maps");
  setLinkText("vb-link-anopheles", "sidebar_anopheles");
  setLinkText("vb-link-triatomes", "sidebar_triatomes");
  setLinkText("vb-rss-link", "sidebar_feed");


  // =========================
  // LIENS (HREF)
  // =========================

  setLinkHref("vb-link-maps", VECTOBOL_LINKS.maps);
  setLinkHref("vb-link-anopheles", VECTOBOL_LINKS.anopheles);
  setLinkHref("vb-link-triatomes", VECTOBOL_LINKS.triatomes);
  setLinkHref("vb-rss-link", VECTOBOL_LINKS.rss);

});