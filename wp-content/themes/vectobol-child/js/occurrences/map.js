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

function createPoint(latitude, longitude, sample) {
  const sampleCode = sample.sample_id ?? "";
  const speciesList = sample.species || [];

  const marker = L.circleMarker([latitude, longitude], {
    radius: 4,
    color: "#2c7be5",
    fillColor: "#2c7be5",
    fillOpacity: 0.9
  });

  const html = `
    <div style="font-size:12px; line-height:1.4">
      <b>Field code:</b> ${sampleCode}<br><br>
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

export function initMap() {
  if (!window.L) {
    throw new Error("Leaflet is not loaded");
  }

  const element = document.getElementById("map");
  if (!element) return;

  if (map) return;

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
