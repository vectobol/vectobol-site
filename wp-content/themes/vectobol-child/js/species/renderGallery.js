function getLanguage() {
  return (document.documentElement.lang || "fr")
    .toLowerCase()
    .split("-")[0];
}

function getGalleryLabels() {
  const labels = {
    fr: {
      empty: "Aucun média disponible",
      viewer: "Visionneuse de médias",
      close: "Fermer",
      previous: "Média précédent",
      next: "Média suivant",
      zoomIn: "Agrandir",
      zoomOut: "Réduire",
      reset: "Réinitialiser le zoom",
      fit: "Ajuster à la fenêtre",
      zoomLevel: "Niveau de zoom",
      open: "Ouvrir le média"
    },
    en: {
      empty: "No media available",
      viewer: "Media viewer",
      close: "Close",
      previous: "Previous media",
      next: "Next media",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      reset: "Reset zoom",
      fit: "Fit to window",
      zoomLevel: "Zoom level",
      open: "Open media"
    },
    es: {
      empty: "No hay medios disponibles",
      viewer: "Visor de medios",
      close: "Cerrar",
      previous: "Medio anterior",
      next: "Medio siguiente",
      zoomIn: "Ampliar",
      zoomOut: "Reducir",
      reset: "Restablecer zoom",
      fit: "Ajustar a la ventana",
      zoomLevel: "Nivel de zoom",
      open: "Abrir medio"
    }
  };

  return labels[getLanguage()] || labels.fr;
}

function buildLightbox(media, labels) {
  const previous = document.querySelector(".vb-media-lightbox");

  if (previous) {
    previous.remove();
  }

  let currentIndex = 0;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let returnFocus = null;
  let dragPointer = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  const pointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 1.25;

  const dialog = document.createElement("div");
  dialog.className = "vb-media-lightbox";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", labels.viewer);
  dialog.tabIndex = -1;
  dialog.hidden = true;

  const panel = document.createElement("div");
  panel.className = "vb-media-lightbox-panel";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "vb-media-lightbox-close";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", labels.close);

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "vb-media-lightbox-previous";
  previousButton.textContent = "‹";
  previousButton.setAttribute("aria-label", labels.previous);

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "vb-media-lightbox-next";
  nextButton.textContent = "›";
  nextButton.setAttribute("aria-label", labels.next);

  const viewport = document.createElement("div");
  viewport.className = "vb-media-lightbox-viewport";

  const image = document.createElement("img");
  image.className = "vb-media-lightbox-image";
  image.draggable = false;

  const toolbar = document.createElement("div");
  toolbar.className = "vb-media-lightbox-toolbar";

  function makeToolButton(className, text, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.title = label;
    return button;
  }

  const zoomOutButton = makeToolButton(
    "vb-media-lightbox-zoom-out", "−", labels.zoomOut
  );
  const zoomInButton = makeToolButton(
    "vb-media-lightbox-zoom-in", "+", labels.zoomIn
  );
  const zoomLevel = document.createElement("output");
  zoomLevel.className = "vb-media-lightbox-zoom-level";
  zoomLevel.setAttribute("aria-label", labels.zoomLevel);
  zoomLevel.textContent = "100%";

  const resetButton = makeToolButton(
    "vb-media-lightbox-reset", "↺", labels.reset
  );
  const fitButton = makeToolButton(
    "vb-media-lightbox-fit", "□", labels.fit
  );

  toolbar.append(
    zoomOutButton,
    zoomLevel,
    zoomInButton,
    resetButton,
    fitButton
  );

  const caption = document.createElement("div");
  caption.className = "vb-media-lightbox-caption";

  const title = document.createElement("strong");
  title.className = "vb-media-lightbox-title";

  const author = document.createElement("div");
  author.className = "vb-media-lightbox-author";

  const comments = document.createElement("div");
  comments.className = "vb-media-lightbox-comments";

  caption.append(title, author, comments);
  viewport.appendChild(image);
  panel.append(
    closeButton,
    previousButton,
    nextButton,
    viewport,
    toolbar,
    caption
  );
  dialog.appendChild(panel);
  document.body.appendChild(dialog);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function constrainTranslation() {
    const viewportRect = viewport.getBoundingClientRect();
    const imageWidth = image.clientWidth * scale;
    const imageHeight = image.clientHeight * scale;
    const maxX = Math.max(0, (imageWidth - viewportRect.width) / 2);
    const maxY = Math.max(0, (imageHeight - viewportRect.height) / 2);

    translateX = clamp(translateX, -maxX, maxX);
    translateY = clamp(translateY, -maxY, maxY);
  }

  function applyTransform() {
    constrainTranslation();
    image.style.transform =
      `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    image.classList.toggle("is-zoomed", scale > 1);
    viewport.classList.toggle("is-zoomed", scale > 1);
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    zoomOutButton.disabled = scale <= MIN_ZOOM;
    zoomInButton.disabled = scale >= MAX_ZOOM;
  }

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }

  function zoomAt(nextScale, clientX, clientY) {
    const newScale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
    if (newScale === scale) return;

    const rect = viewport.getBoundingClientRect();
    const pointX = clientX - (rect.left + rect.width / 2);
    const pointY = clientY - (rect.top + rect.height / 2);
    const ratio = newScale / scale;

    translateX = pointX - (pointX - translateX) * ratio;
    translateY = pointY - (pointY - translateY) * ratio;
    scale = newScale;
    applyTransform();
  }

  function zoomFromCenter(nextScale) {
    const rect = viewport.getBoundingClientRect();
    zoomAt(
      nextScale,
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  }

  function renderCurrent() {
    const item = media[currentIndex];

    resetZoom();
    image.onload = resetZoom;
    image.src = item.full_url || item.image_url;
    image.alt = item.alt || item.caption || "";

    title.textContent = item.caption || "";
    author.textContent = item.author ? `© ${item.author}` : "";
    comments.textContent = item.comments || "";

    previousButton.disabled = media.length < 2;
    nextButton.disabled = media.length < 2;
  }

  function open(index, trigger) {
    currentIndex = index;
    returnFocus = trigger || document.activeElement;
    renderCurrent();
    dialog.hidden = false;
    document.body.classList.add("vb-lightbox-open");
    closeButton.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.classList.remove("vb-lightbox-open");
    resetZoom();
    pointers.clear();

    if (returnFocus && typeof returnFocus.focus === "function") {
      returnFocus.focus();
    }
  }

  function move(step) {
    currentIndex = (currentIndex + step + media.length) % media.length;
    renderCurrent();
  }

  function pointerDistance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function pointerMidpoint(a, b) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    };
  }

  closeButton.addEventListener("click", close);
  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));

  zoomInButton.addEventListener("click", () => {
    zoomFromCenter(scale * ZOOM_STEP);
  });

  zoomOutButton.addEventListener("click", () => {
    zoomFromCenter(scale / ZOOM_STEP);
  });

  resetButton.addEventListener("click", resetZoom);
  fitButton.addEventListener("click", resetZoom);

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    zoomAt(scale * factor, event.clientX, event.clientY);
  }, { passive: false });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      dragPointer = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragOriginX = translateX;
      dragOriginY = translateY;
    } else if (pointers.size === 2) {
      const points = [...pointers.values()];
      pinchStartDistance = pointerDistance(points[0], points[1]);
      pinchStartScale = scale;
      dragPointer = null;
    }
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const points = [...pointers.values()];
      const distance = pointerDistance(points[0], points[1]);
      const midpoint = pointerMidpoint(points[0], points[1]);

      if (pinchStartDistance > 0) {
        zoomAt(
          pinchStartScale * (distance / pinchStartDistance),
          midpoint.x,
          midpoint.y
        );
      }
      return;
    }

    if (dragPointer === event.pointerId && scale > 1) {
      translateX = dragOriginX + event.clientX - dragStartX;
      translateY = dragOriginY + event.clientY - dragStartY;
      applyTransform();
    }
  });

  function finishPointer(event) {
    pointers.delete(event.pointerId);
    if (dragPointer === event.pointerId) dragPointer = null;

    if (pointers.size < 2) {
      pinchStartDistance = 0;
      if (pointers.size === 1) {
        const [id, point] = [...pointers.entries()][0];
        dragPointer = id;
        dragStartX = point.x;
        dragStartY = point.y;
        dragOriginX = translateX;
        dragOriginY = translateY;
      }
    }
  }

  viewport.addEventListener("pointerup", finishPointer);
  viewport.addEventListener("pointercancel", finishPointer);
  viewport.addEventListener("lostpointercapture", finishPointer);

  image.addEventListener("dblclick", (event) => {
    event.preventDefault();
    if (scale > 1) {
      resetZoom();
    } else {
      zoomAt(2, event.clientX, event.clientY);
    }
  });

  image.addEventListener("dragstart", (event) => event.preventDefault());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
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
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomFromCenter(scale * ZOOM_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomFromCenter(scale / ZOOM_STEP);
    } else if (event.key === "0") {
      event.preventDefault();
      resetZoom();
    }
  });

  return open;
}

export function renderGallery() {
  const container =
    document.getElementById("photo_band") ||
    document.querySelector("[data-vb-gallery]");

  if (!container) return;

  // La galerie présente tous les médias associés à l'espèce,
  // quel que soit leur type (photo, carte historique, illustration, etc.).
  const media = Array.isArray(window.VECTOBOL?.data?.photos)
    ? window.VECTOBOL.data.photos
    : [];
  const labels = getGalleryLabels();

  container.replaceChildren();

  if (!media.length) {
    const empty = document.createElement("em");
    empty.textContent = labels.empty;
    container.appendChild(empty);
    return;
  }

  const gallery = document.createElement("div");
  gallery.className = "vb-species-gallery";

  const openLightbox = buildLightbox(media, labels);

  media.forEach((item, index) => {
    const figure = document.createElement("figure");
    figure.className = "vb-species-gallery-item";
    figure.dataset.mediaType = item.media_type || "photo";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "vb-species-gallery-trigger";
    button.setAttribute(
      "aria-label",
      item.caption || item.alt || `${labels.open} ${index + 1}`
    );

    const image = document.createElement("img");
    image.src = item.image_url || item.full_url;
    image.alt = item.alt || item.caption || "";
    image.loading = "lazy";

    button.appendChild(image);
    button.addEventListener("click", () => openLightbox(index, button));

    figure.appendChild(button);

    if (item.caption || item.author) {
      const figcaption = document.createElement("figcaption");

      if (item.caption) {
        const mediaTitle = document.createElement("span");
        mediaTitle.className = "vb-media-caption";
        mediaTitle.textContent = item.caption;
        figcaption.appendChild(mediaTitle);
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
