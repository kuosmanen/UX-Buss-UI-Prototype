declare const L: any;

type Stop = {
  name: string;
  lineHint: string;
  coords: [number, number];
};

const stops: Stop[] = [
  { name: "Keskusta", lineHint: "14, 23", coords: [61.0581, 28.1889] },
  { name: "Matkakeskus", lineHint: "5, 9", coords: [61.0604, 28.1929] },
  { name: "Satama", lineHint: "14, 23", coords: [61.0549, 28.2026] },
  { name: "LUT Yliopisto", lineHint: "5", coords: [61.0645, 28.0924] },
  { name: "Skinnarila", lineHint: "5", coords: [61.0616, 28.1039] },
  { name: "Sampsaankatu", lineHint: "9", coords: [61.0509, 28.1817] },
  { name: "Lauritsala", lineHint: "2", coords: [61.0432, 28.3072] },
];

const profileButton = document.querySelector<HTMLButtonElement>("#profileButton");
const menuPanel = document.querySelector<HTMLElement>("#menuPanel");

function attachMenuEvents(): void {
  profileButton?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    menuPanel?.classList.toggle("hidden");
  });

  menuPanel?.addEventListener("click", (ev) => {
    ev.stopPropagation();
  });

  document.addEventListener("click", () => {
    menuPanel?.classList.add("hidden");
  });
}

function initMap(): void {
  const mapEl = document.querySelector<HTMLElement>("#lappeenrantaMap");
  if (!mapEl || typeof L === "undefined") return;

  const map = L.map("lappeenrantaMap", {
    zoomControl: true,
  }).setView([61.0581, 28.1889], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const routeCoords: [number, number][] = [];

  stops.forEach((stop) => {
    routeCoords.push(stop.coords);

    const marker = L.circleMarker(stop.coords, {
      radius: 8,
      color: "#d4007a",
      fillColor: "#d4007a",
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(map);

    marker.bindPopup(
      `<strong>${stop.name}</strong><br/>Jouko lines: ${stop.lineHint}<br/>Concept stop for UX prototype`
    );
  });

  L.polyline(routeCoords, {
    color: "#d4007a",
    weight: 4,
    opacity: 0.7,
    dashArray: "10 8",
  }).addTo(map);
}

attachMenuEvents();
initMap();

export {};
