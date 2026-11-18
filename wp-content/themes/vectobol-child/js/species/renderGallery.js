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

function buildLightbox(media, initialIndex) {
  const previous = document.querySelector(".vb-media-lightbox");

  if (previous) {
    previous.remove();
  }

  let currentIndex = initialIndex;
  let zoomed = false;
  let returnFocus = null;

  const dialog = document.createElement("div");
  dialog.className = "vb-media-lightbox";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Media viewer");
  dialog.tabIndex = -1;
  dialog.hidden = true;

  const panel = document.createElement("div");
  panel.className = "vb-media-lightbox-panel";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "vb-media-lightbox-close";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Close");

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "vb-media-lightbox-previous";
  previousButton.textContent = "‹";
  previousButton.setAttribute("aria-label", "Previous media");

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "vb-media-lightbox-next";
  nextButton.textContent = "›";
  nextButton.setAttribute("aria-label", "Next media");

  const zoomButton = document.createElement("button");
  zoomButton.type = "button";
  zoomButton.className = "vb-media-lightbox-zoom";
  zoomButton.textContent = "+";
  zoomButton.setAttribute("aria-label", "Zoom");

  const image = document.createElement("img");
  image.className = "vb-media-lightbox-image";

  const caption = document.createElement("div");
  caption.className = "vb-media-lightbox-caption";

  const title = document.createElement("strong");
  title.className = "vb-media-lightbox-title";

  const author = document.createElement("div");
  author.className = "vb-media-lightbox-author";

  const comments = document.createElement("div");
  comments.className = "vb-media-lightbox-comments";

  caption.append(title, author, comments);
  panel.append(
    closeButton,
    previousButton,
    nextButton,
    zoomButton,
    image,
    caption
  );
  dialog.appendChild(panel);
  document.body.appendChild(dialog);

  function renderCurrent() {
    const item = media[currentIndex];

    image.src = item.full_url || item.image_url;
    image.alt = item.alt || item.caption || "";
    image.classList.toggle("is-zoomed", zoomed);

    title.textContent = item.caption || "";
    author.textContent = item.author
      ? `© ${item.author}`
      : "";
    comments.textContent = item.comments || "";

    previousButton.disabled = media.length < 2;
    nextButton.disabled = media.length < 2;
    zoomButton.textContent = zoomed ? "−" : "+";
  }

  function open(index, trigger) {
    currentIndex = index;
    returnFocus = trigger || document.activeElement;
    zoomed = false;
    renderCurrent();
    dialog.hidden = false;
    document.body.classList.add("vb-lightbox-open");
    closeButton.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.classList.remove("vb-lightbox-open");
    image.classList.remove("is-zoomed");

    if (returnFocus && typeof returnFocus.focus === "function") {
      returnFocus.focus();
    }
  }

  function move(step) {
    currentIndex = (
      currentIndex + step + media.length
    ) % media.length;

    zoomed = false;
    renderCurrent();
  }

  closeButton.addEventListener("click", close);
  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));

  zoomButton.addEventListener("click", () => {
    zoomed = !zoomed;
    renderCurrent();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close();
    }
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  });

  return open;
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

  const openLightbox = buildLightbox(media, 0);

  media.forEach((item, index) => {
    const figure = document.createElement("figure");
    figure.className = "vb-species-gallery-item";
    figure.dataset.mediaType = item.media_type || "photo";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "vb-species-gallery-trigger";
    button.setAttribute(
      "aria-label",
      item.caption || item.alt || `Open media ${index + 1}`
    );

    const image = document.createElement("img");
    image.src = item.image_url || item.full_url;
    image.alt = item.alt || item.caption || "";
    image.loading = "lazy";

    button.appendChild(image);
    button.addEventListener("click", () => {
      openLightbox(index, button);
    });

    figure.appendChild(button);

    if (item.caption || item.author) {
      const figcaption = document.createElement("figcaption");

      if (item.caption) {
        const title = document.createElement("span");
        title.className = "vb-media-caption";
        title.textContent = item.caption;
        figcaption.appendChild(title);
      }

      if (item.author) {
        const credit = document.createElement("span");
        credit.className = "vb-media-author";
        credit.textContent = item.author;
        figcaption.appendChild(credit);
      }

      figure.appendChild(figcaption);
    }

    gallery.appendChild(figure);
  });

  container.appendChild(gallery);
}
