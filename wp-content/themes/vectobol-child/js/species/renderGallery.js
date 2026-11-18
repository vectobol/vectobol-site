function getLanguage() {
  return (document.documentElement.lang || "fr")
    .toLowerCase()
    .split("-")[0];
}

function getNoMediaLabel() {
  const labels = {
    fr: "Aucun média disponible",
    en: "No media available",
    es: "No hay medios disponibles"
  };

  return labels[getLanguage()] || labels.fr;
}

export function renderGallery() {
  const container =
    document.getElementById("photo_band") ||
    document.querySelector("[data-vb-gallery]");

  if (!container) {
    return;
  }

  const media = window.VECTOBOL?.data?.photos || [];

  container.replaceChildren();

  if (!media.length) {
    const empty = document.createElement("em");
    empty.textContent = getNoMediaLabel();
    container.appendChild(empty);
    return;
  }

  const gallery = document.createElement("div");
  gallery.className = "vb-species-gallery";

  media.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "vb-species-gallery-item";
    figure.dataset.mediaType = item.media_type || "photo";

    const image = document.createElement("img");
    image.src = item.image_url || item.full_url;
    image.alt = item.alt || item.caption || "";
    image.loading = "lazy";

    figure.appendChild(image);

    if (item.caption || item.author) {
      const caption = document.createElement("figcaption");

      if (item.caption) {
        const title = document.createElement("span");
        title.className = "vb-media-caption";
        title.textContent = item.caption;
        caption.appendChild(title);
      }

      if (item.author) {
        const credit = document.createElement("span");
        credit.className = "vb-media-author";
        credit.textContent = item.author;
        caption.appendChild(credit);
      }

      figure.appendChild(caption);
    }

    gallery.appendChild(figure);
  });

  container.appendChild(gallery);
}
