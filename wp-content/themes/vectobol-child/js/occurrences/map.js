import { state } from "./state.js";

let map = null;
let clusterLayer = null;
let simpleLayer = null;
let clusterMode = true;
let autoFit = false;

function safeCoord(value) {
  if (value === null || value === undefined) return NaN;

  const number = parseFloat(String(value).trim());
  return Number.isFinite(number) ? number : NaN;
}

function setStatus(text) {
  const element = document.getElementById("vb-status");
  if (element) element.textContent = text;
}

function getSiteStatus(sample) {
  if (!sample || sample.occurrence_count === 0) {
    return "no-occurrence";
  }

  if (sample.has_identified_species) {
    return "identified-species";
  }

  return "occurrence-no-species";
}

function getSiteStatusLabel(status) {
  const labels = {
    fr: {
      "no-occurrence": "Site de collecte sans occurrence",
      "occurrence-no-species": "Site avec occurrence(s), sans espèce identifiée",
      "identified-species": "Site avec au moins une espèce identifiée"
    },
    en: {
      "no-occurrence": "Collection site without occurrence",
      "occurrence-no-species": "Site with occurrence(s), no identified species",
      "identified-species": "Site with at least one identified species"
    },
    es: {
      "no-occurrence": "Sitio de colecta sin ocurrencia",
      "occurrence-no-species": "Sitio con ocurrencia(s), sin especie identificada",
      "identified-species": "Sitio con al menos una especie identificada"
    }
  };

  return labels[state.lang]?.[status] ||
    labels.en[status] ||
    status;
}

function createPoint(latitude, longitude, sample) {
  const sampleCode = sample.sample_id ?? "";
  const speciesList = sample.species || [];
  const status = getSiteStatus(sample);
  const statusLabel = getSiteStatusLabel(status);

  const markerOptions = {
    radius:
      status === "identified-species" ? 5 :
      status === "occurrence-no-species" ? 4.5 :
      4,
    color:
      status === "identified-species" ? "#2c7be5" :
      status === "occurrence-no-species" ? "#f39c12" :
      "#777",
    fillColor:
      status === "identified-species" ? "#2c7be5" :
      status === "occurrence-no-species" ? "#f39c12" :
      "#aaa",
    fillOpacity:
      status === "no-occurrence" ? 0.45 : 0.9
  };

  const marker = L.circleMarker(
    [latitude, longitude],
    markerOptions
  );

  const html = `
    <div style="font-size:12px; line-height:1.4">
      <b>Field code:</b> ${sampleCode}<br>
      <b>Status:</b> ${statusLabel}<br><br>
      <b>Species (${speciesList.length}):</b><br>
      ${speciesList.length
        ? speciesList.map(species => `<i>${species}</i>`).join("<br>")
        : "No species"
      }
    </div>
  `;

  marker.bindPopup(html, {
    maxWidth: 320,
    closeButton: true,
    autoPan: true
  });

  return marker;
}

function createLegend() {
  const existing = document.querySelector(".vb-map-legend");
  if (existing) existing.remove();

  const legend = L.control({ position: "bottomright" });

  legend.onAdd = () => {
    const container = L.DomUtil.create("div", "vb-map-legend");

    const title =
      state.lang === "fr" ? "État des sites" :
      state.lang === "es" ? "Estado de los sitios" :
      "Site status";

    container.innerHTML =
      '<div class="vb-map-legend-title">' + title + '</div>' +
      '<div class="vb-map-legend-row">' +
        '<span class="vb-map-legend-dot vb-site-no-occurrence"></span>' +
        '<span>' + getSiteStatusLabel("no-occurrence") + '</span>' +
      '</div>' +
      '<div class="vb-map-legend-row">' +
        '<span class="vb-map-legend-dot vb-site-occurrence-no-species"></span>' +
        '<span>' + getSiteStatusLabel("occurrence-no-species") + '</span>' +
      '</div>' +
      '<div class="vb-map-legend-row">' +
        '<span class="vb-map-legend-dot vb-site-identified-species"></span>' +
        '<span>' + getSiteStatusLabel("identified-species") + '</span>' +
      '</div>';

    L.DomEvent.disableClickPropagation(container);

    return container;
  };

  legend.addTo(map);
}

export function initMap() {
  if (!window.L) {
    throw new Error("Leaflet is not loaded");
  }

  let element = document.getElementById("map");
  if (!element) return;

  if (map) return;

  /*
   * Compatibility during the migration:
   * an older inline map script may already have initialized #map
   * before this module starts. Leaflet stores an internal marker
   * on the container (_leaflet_id), but the existing Map instance
   * is owned by the old script and is not safely recoverable here.
   *
   * Replace the already-initialized container with a clean clone,
   * preserving its HTML attributes but removing the old Leaflet DOM
   * and listeners. The new module then becomes the sole map owner.
   */
  if (element._leaflet_id) {
    const replacement = element.cloneNode(false);

    element.parentNode.replaceChild(replacement, element);
    element = replacement;
  }

  map = L.map(element);

  const boliviaBounds = [
    [-22.9, -69.7],
    [-9.7, -57.5]
  ];

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap contributors" }
  ).addTo(map);

  clusterLayer = L.markerClusterGroup();
  simpleLayer = L.layerGroup();
  clusterMode = true;

  map.addLayer(clusterLayer);

  map.fitBounds(boliviaBounds, { padding: [20, 20] });

  createLegend();

  /*
   * Move the existing cluster/point toggle into the Leaflet map
   * controls, at the top right of the map. The same #toggle button
   * is reused so its language handling and click behavior remain
   * unchanged.
   */
  const toggleButton = document.getElementById("toggle");
  if (toggleButton) {
    const toggleControl = L.control({ position: "topright" });

    toggleControl.onAdd = () => {
      const container = L.DomUtil.create("div", "leaflet-control vb-map-toggle-control");
      container.appendChild(toggleButton);
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      return container;
    };

    toggleControl.addTo(map);
  }

  setTimeout(() => map?.invalidateSize(), 200);
}

export function render(zoom = true) {
  if (!map || !clusterLayer || !simpleLayer) return;

  clusterLayer.clearLayers();
  simpleLayer.clearLayers();

  const bounds = [];

  state.current.forEach(sample => {
    const latitude = safeCoord(sample.latitude);
    const longitude = safeCoord(sample.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const marker = createPoint(latitude, longitude, sample);
    bounds.push([latitude, longitude]);

    if (clusterMode) {
      clusterLayer.addLayer(marker);
    }
    else {
      simpleLayer.addLayer(marker);
    }
  });

  if (clusterMode) {
    if (map.hasLayer(simpleLayer)) map.removeLayer(simpleLayer);
    if (!map.hasLayer(clusterLayer)) map.addLayer(clusterLayer);
  }
  else {
    if (map.hasLayer(clusterLayer)) map.removeLayer(clusterLayer);
    if (!map.hasLayer(simpleLayer)) map.addLayer(simpleLayer);
  }

  if (bounds.length && zoom && autoFit) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }

  console.log({
    mode: clusterMode ? "cluster" : "points",
    markers: bounds.length
  });
}

export function toggleClusters() {
  clusterMode = !clusterMode;
  render(false);
  invalidateSize(100);
  return clusterMode;
}

export function invalidateSize(delay = 150) {
  if (!map) return;
  setTimeout(() => map.invalidateSize(), delay);
}

export function getClusterMode() {
  return clusterMode;
}
