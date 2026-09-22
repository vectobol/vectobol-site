import { qs } from "../shared/utils.js";

export function renderGallery() {

  const container = qs("photo_band");
  if (!container) return;

  const state = window.VECTOBOL?.data;
  const photos = state?.ecology?.photos || [];

  if (!photos.length) {
    container.innerHTML = "<em>No images</em>";
    return;
  }

  container.innerHTML = photos.map(p => `
    <figure class="vb-photo">
      <img src="${p.url}" alt="">
      <figcaption>${p.label || ""}</figcaption>
    </figure>
  `).join("");
}