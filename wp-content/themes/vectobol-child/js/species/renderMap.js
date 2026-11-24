let map = null;
let layerGroup = null;

function getLanguage() {
  return (document.documentElement.lang || "fr")
    .toLowerCase()
    .split("-")[0];
}

function getMapLabels() {
  const labels = {
    fr: {
      collectionTitle: "Points de collecte VECTOBOL",
      historicalTitle: "Carte historique",
      historical: "Carte historique de distribution",
      noData: "Aucune donnée géographique disponible.",
      unavailable: "La bibliothèque cartographique n'est pas disponible.",
      noSites: "Aucun site de collecte VECTOBOL.",
      noCoordinates: "Aucun site ne possède de coordonnées cartographiables.",
      siteCount: count => count + " sites de collecte VECTOBOL",
      historicalAlt: "Carte historique de distribution"
    },
    en: {
      collectionTitle: "VECTOBOL collection sites",
      historicalTitle: "Historical map",
      historical: "Historical distribution map",
      noData: "No geographic data available.",
      unavailable: "The mapping library is unavailable.",
      noSites: "No VECTOBOL collection sites.",
      noCoordinates: "No site has mappable coordinates.",
      siteCount: count => count + " VECTOBOL collection sites",
      historicalAlt: "Historical distribution map"
    },
    es: {
      collectionTitle: "Sitios de colecta VECTOBOL",
      historicalTitle: "Mapa histórico",
      historical: "Mapa histórico de distribución",
      noData: "No hay datos geográficos disponibles.",
      unavailable: "La biblioteca cartográfica no está disponible.",
      noSites: "No hay sitios de colecta VECTOBOL.",
      noCoordinates: "Ningún sitio tiene coordenadas cartografiables.",
      siteCount: count => count + " sitios de colecta VECTOBOL",
      historicalAlt: "Mapa histórico de distribución"
    }
  };

  return labels[getLanguage()] || labels.fr;
}

function setStatus(message) {
  const element = document.getElementById("vb-status");

  if (element) {
    element.textContent = message;
  }
}

function setMapTitle(title) {
  const element = document.getElementById("label_collectes");

  if (element) {
    element.textContent = title;
  }
}

function getData() {
  return window.VECTOBOL?.data || null;
}

function isMappableSite(site) {
  if (
    site?.latitude === null ||
    site?.latitude === "" ||
    site?.longitude === null ||
    site?.longitude === ""
  ) {
    return false;
  }

  const latitude = Number(site.latitude);
  const longitude = Number(site.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function showMapCard(element) {
  const card = element.closest(".vb-card");
  if (card) card.hidden = false;
}

function hideMapCard(element) {
  element.hidden = true;
  const card = element.closest(".vb-card");
  if (card) card.hidden = true;
}

function renderHistoricalMap(element, media) {
  const figure = document.createElement("figure");
  figure.className = "vb-historical-map";

  const image = document.createElement("img");
  image.src = media.full_url || media.image_url;
  image.alt = media.alt || media.caption || getMapLabels().historicalAlt;
  image.loading = "lazy";
  image.style.maxWidth = "100%";
  image.style.height = "auto";

  figure.appendChild(image);

  if (media.caption) {
    const caption = document.createElement("figcaption");
    caption.textContent = media.caption;
    figure.appendChild(caption);
  }

  element.replaceChildren(figure);
  element.hidden = false;
  element.style.height = "auto";
  element.style.minHeight = "0";

  setMapTitle(getMapLabels().historicalTitle);
  setStatus(getMapLabels().historical);
}

/* =========================
   INIT MAP
========================= */
export function initMap() {
  const element = document.getElementById("vb-map");

  if (!element) {
    return;
  }

  const data = getData();

  if (!data) {
    hideMapCard(element);
    return;
  }

  const sites = Array.isArray(data.collection_sites)
    ? data.collection_sites.filter(isMappableSite)
    : [];

  // Les points VECTOBOL ont priorité dès qu'au moins un point
  // possède des coordonnées réellement cartographiables.
  if (sites.length === 0) {
    const historicalMap = data.historical_map ||
      (data.photos || []).find(
        media => media.media_type === "historical_map"
      );

    if (historicalMap) {
      showMapCard(element);
      renderHistoricalMap(element, historicalMap);
    } else {
      hideMapCard(element);
    }

    return;
  }

  showMapCard(element);

  if (!window.L) {
    setStatus(getMapLabels().unavailable);
    return;
  }

  element.hidden = false;

  if (element._leaflet_id && map) {
    return;
  }

  map = window.L.map(element).setView([-15, -65], 5);

  window.L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "© OpenStreetMap"
    }
  ).addTo(map);

  layerGroup = window.L.layerGroup().addTo(map);
}

/* =========================
   RENDER COLLECTION SITES
========================= */
export function renderSites() {
  const data = getData();
  const sites = Array.isArray(data?.collection_sites)
    ? data.collection_sites.filter(isMappableSite)
    : [];

  if (sites.length > 0) {
    setMapTitle(getMapLabels().collectionTitle);
  } else {
    const historicalMap = data?.historical_map ||
      (data?.photos || []).find(
        media => media.media_type === "historical_map"
      );

    if (historicalMap) {
      setMapTitle(getMapLabels().historicalTitle);
    }
  }

  if (!map || !layerGroup) {
    return;
  }

  layerGroup.clearLayers();

  if (!sites.length) {
    setStatus(getMapLabels().noCoordinates);
    return;
  }

  const bounds = [];

  sites.forEach((site) => {
    const latitude = Number(site.latitude);
    const longitude = Number(site.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return;
    }

    const point = [latitude, longitude];
    bounds.push(point);

    const popup = document.createElement("div");
    const record = document.createElement("strong");
    record.textContent = site.record_id || "";
    popup.appendChild(record);

    const administrativeNames = [
      site.admin3_name,
      site.admin2_name,
      site.admin1_name
    ].filter(Boolean);

    if (administrativeNames.length) {
      const details = document.createElement("div");
      details.textContent = administrativeNames.join(", ");
      popup.appendChild(details);
    }

    window.L.circleMarker(point, {
      radius: 5,
      color: "#1f78b4",
      fillColor: "#1f78b4",
      fillOpacity: 1,
      weight: 1
    })
      .bindPopup(popup)
      .addTo(layerGroup);
  });

  if (!bounds.length) {
    setStatus(getMapLabels().noCoordinates);
    return;
  }

  setStatus(getMapLabels().siteCount(bounds.length));

  if (bounds.length === 1) {
    map.setView(bounds[0], 8);
  } else {
    map.fitBounds(bounds, { padding: [20, 20] });
  }
}
