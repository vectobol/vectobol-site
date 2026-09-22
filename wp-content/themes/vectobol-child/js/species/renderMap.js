let map = null;
let layerGroup = null;

/* =========================
   INIT MAP
========================= */
export function initMap() {

  const el = document.getElementById("vb-map");

  if (!el) return;

  if (el._leaflet_id) {
    map = el._leaflet_map || map;
    if (!layerGroup && map) {
      layerGroup = L.layerGroup().addTo(map);
    }
    return;
  }

  map = L.map(el).setView([-15, -65], 5);
  el._leaflet_map = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  layerGroup = L.layerGroup().addTo(map);

  console.log("Map initialized");
}

/* =========================
   STATUS
========================= */
function setStatus(text) {
  const el = document.getElementById("vb-status");
  if (el) el.textContent = text;
}

/* =========================
   RENDER SITES
========================= */
export function renderSites() {

  if (!map || !layerGroup) return;

  const data = window.VECTOBOL?.data;

  if (!data || !Array.isArray(data.occurrences)) {
    console.warn("Occurrences not ready yet");
    return;
  }

  const slugKey = data.key;

  const filtered = data.occurrences.filter(p => {

      if (!p) return false;

      return p.species_key === slugKey;
    });


    // Un point = un record_id
    const points = [
      ...new Map(
        filtered.map(p => [
          p.record_id,
          p
        ])
      ).values()
    ];


  layerGroup.clearLayers();

  if (!points.length) {
    setStatus("Aucune occurrence");

    layerGroup.clearLayers();

    map.setView([-16.29, -63.58], 7);

    return;
  }
    
  setStatus(`${points.length} points de collecte`);

  const bounds = [];

  for (const p of points) {

    const lat = Number(p.latitude);
    const lon = Number(p.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    bounds.push([lat, lon]);

    L.circleMarker([lat, lon], {
      radius: 5,
      color: "#1f78b4",
      fillColor: "#1f78b4",
      fillOpacity: 1,
      weight: 1
    })
    .bindPopup(`
      <b>${p.genus ?? ""} ${p.species ?? ""}</b><br>
      ${p.sample_admin1 ?? ""} ${p.sample_admin2 ?? ""}
    `)
    .addTo(layerGroup);
  }

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }
}