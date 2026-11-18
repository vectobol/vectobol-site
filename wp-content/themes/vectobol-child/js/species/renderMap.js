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
      historical: "Carte historique de distribution",
      noData: "Aucune donnée géographique disponible.",
      unavailable: "La bibliothèque cartographique n'est pas disponible.",
      noSites: "Aucun site de collecte VECTOBOL.",
      noCoordinates: "Aucun site ne possède de coordonnées cartographiables.",
      siteCount: count => count + " sites de collecte VECTOBOL",
      historicalAlt: "Carte historique de distribution"
    },
    en: {
      historical: "Historical distribution map",
      noData: "No geographic data available.",
      unavailable: "The mapping library is unavailable.",
      noSites: "No VECTOBOL collection sites.",
      noCoordinates: "No site has mappable coordinates.",
      siteCount: count => count + " VECTOBOL collection sites",
      historicalAlt: "Historical distribution map"
    },
    es: {
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

function getData() {
  return window.VECTOBOL?.data || null;
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
    setStatus(getMapLabels().noData);
    return;
  }

  const sites = Array.isArray(data.collection_sites)
    ? data.collection_sites
    : [];

  if (sites.length === 0) {
    const historicalMap = (data.photos || []).find(
      (media) => media.media_type === "historical_map"
    );

    if (historicalMap) {
      renderHistoricalMap(element, historicalMap);
    } else {
      element.hidden = true;
      setStatus(getMapLabels().noData);
    }

    return;
  }

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
  if (!map || !layerGroup) {
    return;
  }

  const data = getData();
  const sites = Array.isArray(data?.collection_sites)
    ? data.collection_sites
    : [];

  layerGroup.clearLayers();

  if (!sites.length) {
    setStatus(getMapLabels().noSites);
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
