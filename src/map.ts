declare const L: any;

type Stop = {
  name: string;
  lineHint: string;
  coords: [number, number];
};

type BusSchedule = {
  line: "1" | "1x" | "2" | "3" | "4" | "5";
  from: string;
  to: string;
  departure: string;
  arrival: string;
  coords: [number, number];
  passengers: number;
  capacity: number;
  accessible: boolean;
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

const schedules: BusSchedule[] = [
  { line: "1", from: "Keskusta", to: "Lauritsala", departure: "08:10", arrival: "08:32", coords: [61.0488, 28.2452], passengers: 18, capacity: 56, accessible: true },
  { line: "1", from: "Keskusta", to: "Lauritsala", departure: "09:10", arrival: "09:31", coords: [61.0455, 28.2823], passengers: 31, capacity: 56, accessible: true },
  { line: "1x", from: "Matkakeskus", to: "LUT Yliopisto", departure: "08:20", arrival: "08:40", coords: [61.0602, 28.1401], passengers: 45, capacity: 56, accessible: true },
  { line: "1x", from: "Matkakeskus", to: "LUT Yliopisto", departure: "09:20", arrival: "09:39", coords: [61.0621, 28.1177], passengers: 52, capacity: 56, accessible: true },
  { line: "2", from: "Keskusta", to: "Skinnarila", departure: "08:05", arrival: "08:24", coords: [61.0597, 28.1614], passengers: 24, capacity: 56, accessible: false },
  { line: "2", from: "Keskusta", to: "Skinnarila", departure: "09:05", arrival: "09:25", coords: [61.0611, 28.1326], passengers: 39, capacity: 56, accessible: false },
  { line: "3", from: "Satama", to: "Sampsaankatu", departure: "08:15", arrival: "08:34", coords: [61.0533, 28.1924], passengers: 16, capacity: 48, accessible: true },
  { line: "3", from: "Satama", to: "Sampsaankatu", departure: "09:15", arrival: "09:33", coords: [61.0514, 28.1841], passengers: 29, capacity: 48, accessible: true },
  { line: "4", from: "Matkakeskus", to: "Keskusta", departure: "08:30", arrival: "08:41", coords: [61.0599, 28.1906], passengers: 12, capacity: 40, accessible: true },
  { line: "4", from: "Matkakeskus", to: "Keskusta", departure: "09:30", arrival: "09:42", coords: [61.0586, 28.1878], passengers: 21, capacity: 40, accessible: true },
  { line: "5", from: "Keskusta", to: "LUT Yliopisto", departure: "08:25", arrival: "08:47", coords: [61.0632, 28.1092], passengers: 41, capacity: 56, accessible: true },
  { line: "5", from: "Keskusta", to: "LUT Yliopisto", departure: "09:25", arrival: "09:46", coords: [61.0642, 28.0957], passengers: 47, capacity: 56, accessible: true },
];

const profileButton = document.querySelector<HTMLButtonElement>("#profileButton");
const menuPanel = document.querySelector<HTMLElement>("#menuPanel");
const busSearchInput = document.querySelector<HTMLInputElement>("#busSearchInput");
const busSearchButton = document.querySelector<HTMLButtonElement>("#busSearchButton");
const busSearchResults = document.querySelector<HTMLDivElement>("#busSearchResults");

let mapInstance: any;
let liveBusMarker: any;
let liveBusRouteLine: any;
let liveBusAnimationFrameId: number | undefined;

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
    zoomControl: false,
  }).setView([61.0581, 28.1889], 12);

  mapInstance = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const pinkPinIcon = L.divIcon({
    className: "custom-pin-icon",
    html: "<div class=\"map-pin\"></div>",
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });

  const routeCoords: [number, number][] = [];

  stops.forEach((stop) => {
    routeCoords.push(stop.coords);

    const marker = L.marker(stop.coords, {
      icon: pinkPinIcon,
    }).addTo(map);

    marker.bindPopup(
      `<strong>${stop.name}</strong><br/>Jouko lines: ${stop.lineHint}<br/>Concept stop for UX prototype`
    );
  });

  drawRoadFollowingRoute(map, routeCoords);

  // Ensure map tiles render correctly after floating overlays and layout sizing settle.
  window.setTimeout(() => {
    map.invalidateSize();
  }, 100);
}

async function drawRoadFollowingRoute(map: any, stopCoords: [number, number][]): Promise<void> {
  const fallback = () => {
    L.polyline(stopCoords, {
      color: "#d4007a",
      weight: 4,
      opacity: 0.7,
      dashArray: "10 8",
    }).addTo(map);
  };

  try {
    const roadPath = await fetchRoadPath(stopCoords);
    if (!roadPath) {
      fallback();
      return;
    }

    L.polyline(roadPath, {
      color: "#d4007a",
      weight: 4,
      opacity: 0.78,
    }).addTo(map);
  } catch {
    fallback();
  }
}

async function fetchRoadPath(points: [number, number][]): Promise<[number, number][] | null> {
  if (points.length < 2) {
    return null;
  }

  try {
    const coordinates = points.map(([lat, lon]) => `${lon},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };

    const roadCoords = data.routes?.[0]?.geometry?.coordinates;
    if (!roadCoords || roadCoords.length === 0) {
      return null;
    }

    return roadCoords.map(([lon, lat]) => [lat, lon]);
  } catch {
    return null;
  }
}

function getStopCoords(stopName: string): [number, number] | null {
  const stop = stops.find((item) => item.name.toLowerCase() === stopName.toLowerCase());
  return stop ? stop.coords : null;
}

function clearLiveBusAnimation(): void {
  if (liveBusAnimationFrameId !== undefined) {
    window.cancelAnimationFrame(liveBusAnimationFrameId);
    liveBusAnimationFrameId = undefined;
  }
}

function interpolate(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function parseTimeToMinutes(value: string): number {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

function getAnimationDurationMs(schedule: BusSchedule): number {
  const dep = parseTimeToMinutes(schedule.departure);
  const arr = parseTimeToMinutes(schedule.arrival);
  const tripMinutes = Math.max(arr - dep, 1);

  // Slow simulation for demos: much longer run time than real-time ratio.
  const ms = tripMinutes * 12000;
  return Math.min(Math.max(ms, 90000), 240000);
}

function interpolateNumber(start: number, end: number, t: number): number {
  return Math.round(start + (end - start) * t);
}

function getBusLoadRatio(schedule: BusSchedule): number {
  if (schedule.capacity <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(schedule.passengers / schedule.capacity, 1));
}

function getLoadColor(loadRatio: number): string {
  if (loadRatio <= 0.5) {
    const t = loadRatio / 0.5;
    const r = 255;
    const g = interpolateNumber(255, 214, t);
    const b = interpolateNumber(255, 10, t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const t = (loadRatio - 0.5) / 0.5;
  const r = 255;
  const g = interpolateNumber(214, 59, t);
  const b = interpolateNumber(10, 48, t);
  return `rgb(${r}, ${g}, ${b})`;
}

function animateBusOnPath(path: [number, number][], schedule: BusSchedule): void {
  if (!mapInstance || !liveBusMarker || path.length < 2) return;

  const startTime = performance.now();
  const durationMs = getAnimationDurationMs(schedule);

  const step = (timestamp: number) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / durationMs, 1);

    const scaled = progress * (path.length - 1);
    const fromIndex = Math.floor(scaled);
    const toIndex = Math.min(fromIndex + 1, path.length - 1);
    const localT = scaled - fromIndex;

    const position = interpolate(path[fromIndex], path[toIndex], localT);
    liveBusMarker.setLatLng(position);

    if (progress >= 1) {
      liveBusAnimationFrameId = undefined;
      return;
    }

    liveBusAnimationFrameId = window.requestAnimationFrame(step);
  };

  clearLiveBusAnimation();
  liveBusAnimationFrameId = window.requestAnimationFrame(step);
}

function filterSchedules(query: string): BusSchedule[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return schedules;
  }

  return schedules.filter((schedule) => {
    const line = schedule.line.toLowerCase();
    return line === normalized || line.startsWith(normalized);
  });
}

async function locateBus(schedule: BusSchedule): Promise<void> {
  if (!mapInstance || typeof L === "undefined") return;

  clearLiveBusAnimation();

  if (liveBusMarker) {
    mapInstance.removeLayer(liveBusMarker);
  }

  if (liveBusRouteLine) {
    mapInstance.removeLayer(liveBusRouteLine);
  }

  const start = getStopCoords(schedule.from) ?? schedule.coords;
  const end = getStopCoords(schedule.to) ?? schedule.coords;
  const roadPath = await fetchRoadPath([start, end]);
  const routePath = roadPath && roadPath.length > 1 ? roadPath : [start, schedule.coords, end];
  const loadRatio = getBusLoadRatio(schedule);
  const loadColor = getLoadColor(loadRatio);
  const loadHeight = Math.max(Math.round(loadRatio * 100), 10);

  const busIcon = L.divIcon({
    className: "bus-locator-icon",
    html:
      `<div class="bus-locator-shell">` +
      `<div class="bus-locator-fill" style="height:${loadHeight}%;background:${loadColor};"></div>` +
      `<span class="material-symbols-rounded bus-locator-glyph">directions_bus</span>` +
      `</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });

  liveBusRouteLine = L.polyline(routePath, {
    color: "#d4007a",
    weight: 5,
    opacity: 0.45,
  }).addTo(mapInstance);

  liveBusMarker = L.marker(routePath[0], {
    icon: busIcon,
  }).addTo(mapInstance);

  mapInstance.fitBounds(liveBusRouteLine.getBounds(), {
    padding: [40, 40],
    maxZoom: 14,
  });

  mapInstance.setView(routePath[0], 13, {
    animate: true,
  });

  animateBusOnPath(routePath, schedule);
}

function renderSchedules(items: BusSchedule[]): void {
  if (!busSearchResults) return;

  busSearchResults.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "bus-search-empty";
    empty.textContent = "No schedules found. Try one of: 1, 1x, 2, 3, 4, 5.";
    busSearchResults.appendChild(empty);
    return;
  }

  items.forEach((schedule) => {
    const card = document.createElement("article");
    card.className = "bus-result-card";

    const title = document.createElement("h3");
    title.className = "bus-result-title";
    title.textContent = `Bus ${schedule.line}`;

    const route = document.createElement("p");
    route.className = "bus-result-route";
    route.textContent = `${schedule.from} -> ${schedule.to}`;

    const times = document.createElement("p");
    times.className = "bus-result-times bus-times-with-access";
    times.textContent = `Departure: ${schedule.departure} | Arrival: ${schedule.arrival}`;

    const accessIcon = document.createElement("span");
    accessIcon.className = "material-symbols-rounded bus-access-icon";
    accessIcon.textContent = schedule.accessible ? "accessible" : "accessible_forward";
    accessIcon.title = schedule.accessible
      ? "Handicapped seating available"
      : "Limited handicapped seating";
    accessIcon.setAttribute("aria-label", accessIcon.title);
    times.appendChild(accessIcon);

    const load = document.createElement("p");
    load.className = "bus-result-times";
    load.textContent = `Load: ${schedule.passengers}/${schedule.capacity}`;

    const locateButton = document.createElement("button");
    locateButton.className = "primary-btn";
    locateButton.textContent = "Locate bus";
    locateButton.addEventListener("click", () => {
      void locateBus(schedule);
    });

    card.appendChild(title);
    card.appendChild(route);
    card.appendChild(times);
    card.appendChild(load);
    card.appendChild(locateButton);
    busSearchResults.appendChild(card);
  });
}

function attachSearchEvents(): void {
  busSearchButton?.addEventListener("click", () => {
    renderSchedules(filterSchedules(busSearchInput?.value ?? ""));
  });

  busSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      renderSchedules(filterSchedules(busSearchInput.value));
    }
  });
}

attachMenuEvents();
initMap();
attachSearchEvents();
renderSchedules(schedules);

export {};
