const stops = [
    { name: "Keskusta", lineHint: "1, 2, 3, 4, 5", coords: [61.0581, 28.1889] },
    { name: "Matkakeskus", lineHint: "1x, 4, 5", coords: [61.0604, 28.1929] },
    { name: "Satama", lineHint: "3", coords: [61.0549, 28.2026] },
    { name: "LUT Yliopisto", lineHint: "5", coords: [61.0645, 28.0924] },
    { name: "Skinnarila", lineHint: "2, 5", coords: [61.0616, 28.1039] },
    { name: "Sampsaankatu", lineHint: "3, 4", coords: [61.0509, 28.1817] },
    { name: "Lauritsala", lineHint: "2", coords: [61.0432, 28.3072] },
];
const scheduleTemplates = [
    { line: "1", busNumber: "101", from: "Keskusta", to: "Lauritsala", departure: "08:10", arrival: "08:32", coords: [61.0488, 28.2452], passengers: 18, capacity: 56, accessible: true },
    { line: "1", busNumber: "114", from: "Keskusta", to: "Lauritsala", departure: "09:10", arrival: "09:31", coords: [61.0455, 28.2823], passengers: 31, capacity: 56, accessible: true },
    { line: "1x", busNumber: "1X-07", from: "Matkakeskus", to: "LUT Yliopisto", departure: "08:20", arrival: "08:40", coords: [61.0602, 28.1401], passengers: 45, capacity: 56, accessible: true },
    { line: "1x", busNumber: "1X-12", from: "Matkakeskus", to: "LUT Yliopisto", departure: "09:20", arrival: "09:39", coords: [61.0621, 28.1177], passengers: 52, capacity: 56, accessible: true },
    { line: "2", busNumber: "206", from: "Keskusta", to: "Skinnarila", departure: "08:05", arrival: "08:24", coords: [61.0597, 28.1614], passengers: 24, capacity: 56, accessible: false },
    { line: "2", busNumber: "223", from: "Keskusta", to: "Skinnarila", departure: "09:05", arrival: "09:25", coords: [61.0611, 28.1326], passengers: 39, capacity: 56, accessible: false },
    { line: "3", busNumber: "311", from: "Satama", to: "Sampsaankatu", departure: "08:15", arrival: "08:34", coords: [61.0533, 28.1924], passengers: 16, capacity: 48, accessible: true },
    { line: "3", busNumber: "329", from: "Satama", to: "Sampsaankatu", departure: "09:15", arrival: "09:33", coords: [61.0514, 28.1841], passengers: 29, capacity: 48, accessible: true },
    { line: "4", busNumber: "404", from: "Matkakeskus", to: "Keskusta", departure: "08:30", arrival: "08:41", coords: [61.0599, 28.1906], passengers: 12, capacity: 40, accessible: true },
    { line: "4", busNumber: "417", from: "Matkakeskus", to: "Keskusta", departure: "09:30", arrival: "09:42", coords: [61.0586, 28.1878], passengers: 21, capacity: 40, accessible: true },
    { line: "5", busNumber: "508", from: "Keskusta", to: "LUT Yliopisto", departure: "08:25", arrival: "08:47", coords: [61.0632, 28.1092], passengers: 41, capacity: 56, accessible: true },
    { line: "5", busNumber: "521", from: "Keskusta", to: "LUT Yliopisto", departure: "09:25", arrival: "09:46", coords: [61.0642, 28.0957], passengers: 47, capacity: 56, accessible: true },
];
function formatMinutesToClock(totalMinutes) {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
function buildFrequentSchedules(templates) {
    const beginHour = 6;
    const endHour = 23;
    const result = [];
    const uniqueByRoute = new Map();
    templates.forEach((template) => {
        const key = `${template.line}|${template.from}|${template.to}|${template.departure.slice(3, 5)}`;
        if (!uniqueByRoute.has(key)) {
            uniqueByRoute.set(key, template);
        }
    });
    uniqueByRoute.forEach((template) => {
        const depMins = parseTimeToMinutes(template.departure);
        const arrMins = parseTimeToMinutes(template.arrival);
        const tripMinutes = Math.max((arrMins - depMins + 1440) % 1440, 8);
        const minuteOfHour = depMins % 60;
        for (let hour = beginHour; hour <= endHour; hour += 1) {
            const departureMinutes = hour * 60 + minuteOfHour;
            const arrivalMinutes = departureMinutes + tripMinutes;
            const busCode = `${template.line}-${hour.toString().padStart(2, "0")}${minuteOfHour
                .toString()
                .padStart(2, "0")}`;
            result.push({
                ...template,
                busNumber: busCode,
                departure: formatMinutesToClock(departureMinutes),
                arrival: formatMinutesToClock(arrivalMinutes),
            });
        }
    });
    result.sort((a, b) => parseTimeToMinutes(a.departure) - parseTimeToMinutes(b.departure));
    return result;
}
const schedules = buildFrequentSchedules(scheduleTemplates);
const busAnimalFamilies = {
    "1": [
        { name: "Salmon", icon: "🐟" },
        { name: "Tropical Fish", icon: "🐠" },
        { name: "Blowfish", icon: "🐡" },
        { name: "Shark", icon: "🦈" },
    ],
    "2": [
        { name: "Cat", icon: "🐱" },
        { name: "Black Cat", icon: "🐈‍⬛" },
        { name: "Tiger", icon: "🐅" },
        { name: "Lion", icon: "🦁" },
    ],
    "3": [
        { name: "Bird", icon: "🐦" },
        { name: "Owl", icon: "🦉" },
        { name: "Duck", icon: "🦆" },
        { name: "Penguin", icon: "🐧" },
    ],
    "4": [
        { name: "Fox", icon: "🦊" },
        { name: "Bear", icon: "🐻" },
        { name: "Deer", icon: "🦌" },
        { name: "Hedgehog", icon: "🦔" },
    ],
    "5": [
        { name: "Seal", icon: "🦭" },
        { name: "Polar Bear", icon: "🐻‍❄️" },
        { name: "Wolf", icon: "🐺" },
        { name: "Rabbit", icon: "🐇" },
    ],
};
function getBusAnimal(line, busNumber) {
    const normalizedLine = line.startsWith("1") ? "1" : line;
    const family = busAnimalFamilies[normalizedLine] ?? busAnimalFamilies["1"];
    let hash = 0;
    for (let i = 0; i < busNumber.length; i += 1) {
        hash = (hash * 31 + busNumber.charCodeAt(i)) >>> 0;
    }
    return family[hash % family.length];
}
const profileButton = document.querySelector("#profileButton");
const menuPanel = document.querySelector("#menuPanel");
const busSearchInput = document.querySelector("#busSearchInput");
const busSearchButton = document.querySelector("#busSearchButton");
const busSearchResults = document.querySelector("#busSearchResults");
const busSearchPanel = document.querySelector("#busSearchPanel");
const busSearchToggle = document.querySelector("#busSearchToggle");
const mapContrastButton = document.querySelector("#mapContrastButton");
const mapDemoButton = document.querySelector("#mapDemoButton");
const myLocationButton = document.querySelector("#myLocationButton");
const mapDemoNotification = document.querySelector("#mapDemoNotification");
let mapInstance;
let liveBusMarker;
let liveBusRouteLine;
let liveBusAnimationFrameId;
let locateBusRequestId = 0;
let mapDemoNotificationTimeoutId;
let userLocationMarker;
let userLocationRing;
const fallbackUserCoords = [61.0581, 28.1889];
let currentUserCoords = fallbackUserCoords;
const stopMarkers = [];
function attachMenuEvents() {
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
function initMap() {
    const mapEl = document.querySelector("#lappeenrantaMap");
    if (!mapEl || typeof L === "undefined")
        return;
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
    const routeCoords = [];
    stops.forEach((stop) => {
        routeCoords.push(stop.coords);
        const marker = L.marker(stop.coords, {
            icon: pinkPinIcon,
        }).addTo(map);
        marker.bindPopup(getStopPopupHtml(stop, currentUserCoords), {
            className: "jouko-popup-wrap",
        });
        marker.on("click", () => {
            marker.setPopupContent(getStopPopupHtml(stop, currentUserCoords));
        });
        stopMarkers.push({ stop, marker });
    });
    drawRoadFollowingRoute(map, routeCoords);
    // Ensure map tiles render correctly after floating overlays and layout sizing settle.
    window.setTimeout(() => {
        map.invalidateSize();
    }, 100);
    requestUserLocation();
}
function requestUserLocation() {
    if (!navigator.geolocation) {
        return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
        currentUserCoords = [position.coords.latitude, position.coords.longitude];
        refreshStopPopups();
    }, () => {
        // Keep fallback location when geolocation is unavailable or denied.
    }, {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 60000,
    });
}
function renderUserLocation(coords, shouldCenter) {
    if (!mapInstance || typeof L === "undefined") {
        return;
    }
    if (userLocationMarker) {
        mapInstance.removeLayer(userLocationMarker);
    }
    if (userLocationRing) {
        mapInstance.removeLayer(userLocationRing);
    }
    userLocationRing = L.circle(coords, {
        radius: 70,
        color: "#d4007a",
        weight: 2,
        fillColor: "#d4007a",
        fillOpacity: 0.16,
    }).addTo(mapInstance);
    userLocationMarker = L.circleMarker(coords, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#d4007a",
        fillOpacity: 1,
    }).addTo(mapInstance);
    userLocationMarker.bindPopup("You are here");
    if (shouldCenter) {
        mapInstance.setView(coords, 14, {
            animate: true,
        });
        userLocationMarker.openPopup();
    }
}
function showMyLocation() {
    if (!mapInstance) {
        return;
    }
    if (!navigator.geolocation) {
        renderUserLocation(currentUserCoords, true);
        return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
        currentUserCoords = [position.coords.latitude, position.coords.longitude];
        refreshStopPopups();
        renderUserLocation(currentUserCoords, true);
    }, () => {
        renderUserLocation(currentUserCoords, true);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
    });
}
function triggerDemoNotification() {
    if (!mapDemoNotification) {
        return;
    }
    mapDemoNotification.classList.remove("hidden");
    if (typeof navigator.vibrate === "function") {
        navigator.vibrate([80, 50, 80]);
    }
    if (mapDemoNotificationTimeoutId !== undefined) {
        window.clearTimeout(mapDemoNotificationTimeoutId);
    }
    mapDemoNotificationTimeoutId = window.setTimeout(() => {
        mapDemoNotification.classList.add("hidden");
        mapDemoNotificationTimeoutId = undefined;
    }, 3600);
}
function refreshStopPopups() {
    stopMarkers.forEach(({ stop, marker }) => {
        marker.setPopupContent(getStopPopupHtml(stop, currentUserCoords));
    });
}
function formatMinutesLabel(totalMinutes) {
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
        return `${hours} h`;
    }
    return `${hours} h ${minutes} min`;
}
function getMinutesUntil(timeValue, fromDate) {
    const [hoursRaw, minutesRaw] = timeValue.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return 0;
    }
    const nowMinutes = fromDate.getHours() * 60 + fromDate.getMinutes();
    const targetMinutes = hours * 60 + minutes;
    const dayMinutes = 24 * 60;
    return (targetMinutes - nowMinutes + dayMinutes) % dayMinutes;
}
function getNextBusMinutes(stopName) {
    const now = new Date();
    const upcoming = schedules
        .flatMap((schedule) => {
        const events = [];
        if (schedule.from.toLowerCase() === stopName.toLowerCase()) {
            events.push(getMinutesUntil(schedule.departure, now));
        }
        if (schedule.to.toLowerCase() === stopName.toLowerCase()) {
            events.push(getMinutesUntil(schedule.arrival, now));
        }
        return events;
    })
        .sort((a, b) => a - b);
    if (upcoming.length === 0) {
        return null;
    }
    return upcoming[0];
}
function getDistanceKm(a, b) {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const haversine = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
function getWalkingMinutes(fromCoords, toCoords) {
    const distanceKm = getDistanceKm(fromCoords, toCoords);
    const walkingSpeedKmPerHour = 4.8;
    return Math.max(Math.round((distanceKm / walkingSpeedKmPerHour) * 60), 1);
}
function getStopPopupHtml(stop, userCoords) {
    const nextBusMinutes = getNextBusMinutes(stop.name);
    const walkingMinutes = getWalkingMinutes(userCoords, stop.coords);
    const nextBusText = nextBusMinutes === null ? "No departures listed" : `${nextBusMinutes} min`;
    return (`<div class="jouko-popup">` +
        `<h4 class="jouko-popup-title">${stop.name}</h4>` +
        `<div class="jouko-popup-route">Jouko lines: ${stop.lineHint}</div>` +
        `<div class="jouko-popup-route">Next bus: ${nextBusText}</div>` +
        `<div class="jouko-popup-route">Walk from you: ${formatMinutesLabel(walkingMinutes)}</div>` +
        `</div>`);
}
async function drawRoadFollowingRoute(map, stopCoords) {
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
    }
    catch {
        fallback();
    }
}
async function fetchRoadPath(points) {
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
        const data = (await response.json());
        const roadCoords = data.routes?.[0]?.geometry?.coordinates;
        if (!roadCoords || roadCoords.length === 0) {
            return null;
        }
        return roadCoords.map(([lon, lat]) => [lat, lon]);
    }
    catch {
        return null;
    }
}
function getStopCoords(stopName) {
    const stop = stops.find((item) => item.name.toLowerCase() === stopName.toLowerCase());
    return stop ? stop.coords : null;
}
function clearLiveBusAnimation() {
    if (liveBusAnimationFrameId !== undefined) {
        window.cancelAnimationFrame(liveBusAnimationFrameId);
        liveBusAnimationFrameId = undefined;
    }
}
function interpolate(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function parseTimeToMinutes(value) {
    const [hoursRaw, minutesRaw] = value.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return 0;
    }
    return hours * 60 + minutes;
}
function getAnimationDurationMs(schedule) {
    const dep = parseTimeToMinutes(schedule.departure);
    const arr = parseTimeToMinutes(schedule.arrival);
    const tripMinutes = Math.max(arr - dep, 1);
    // Slow simulation for demos: much longer run time than real-time ratio.
    const ms = tripMinutes * 12000;
    return Math.min(Math.max(ms, 90000), 240000);
}
function interpolateNumber(start, end, t) {
    return Math.round(start + (end - start) * t);
}
function getBusLoadRatio(schedule) {
    if (schedule.capacity <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(schedule.passengers / schedule.capacity, 1));
}
function getLoadColor(loadRatio) {
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
function getLoadLevel(schedule) {
    const ratio = getBusLoadRatio(schedule);
    if (ratio < 0.4)
        return "Low";
    if (ratio < 0.75)
        return "Medium";
    return "High";
}
function animateBusOnPath(path, schedule) {
    if (!mapInstance || !liveBusMarker || path.length < 2)
        return;
    const startTime = performance.now();
    const durationMs = getAnimationDurationMs(schedule);
    const step = (timestamp) => {
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
function filterSchedules(query) {
    const normalized = query.trim().toLowerCase();
    const now = new Date();
    const filtered = schedules.filter((schedule) => {
        const line = schedule.line.toLowerCase();
        if (!normalized) {
            return true;
        }
        return line === normalized || line.startsWith(normalized);
    });
    // Always prioritize upcoming departures from the current time.
    const ranked = filtered
        .map((schedule) => ({
        schedule,
        delta: getMinutesUntil(schedule.departure, now),
    }))
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 18)
        .map((entry) => entry.schedule);
    return ranked;
}
async function locateBus(schedule) {
    if (!mapInstance || typeof L === "undefined")
        return;
    const requestId = ++locateBusRequestId;
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
    if (requestId !== locateBusRequestId) {
        return;
    }
    const routePath = roadPath && roadPath.length > 1 ? roadPath : [start, schedule.coords, end];
    const loadRatio = getBusLoadRatio(schedule);
    const loadColor = getLoadColor(loadRatio);
    const loadHeight = Math.max(Math.round(loadRatio * 100), 10);
    const busIcon = L.divIcon({
        className: "bus-locator-icon",
        html: `<div class="bus-locator-shell">` +
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
    const loadLevel = getLoadLevel(schedule);
    liveBusMarker.bindPopup(`Bus ${schedule.busNumber}<br/>Fill rate: ${loadLevel}`);
    liveBusMarker.on("click", () => {
        liveBusMarker.openPopup();
    });
    mapInstance.fitBounds(liveBusRouteLine.getBounds(), {
        padding: [40, 40],
        maxZoom: 14,
    });
    mapInstance.setView(routePath[0], 13, {
        animate: true,
    });
    animateBusOnPath(routePath, schedule);
}
function renderSchedules(items) {
    if (!busSearchResults)
        return;
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
        const animal = getBusAnimal(schedule.line, schedule.busNumber);
        const titleRow = document.createElement("div");
        titleRow.className = "bus-result-head";
        const title = document.createElement("h3");
        title.className = "bus-result-title";
        title.textContent = `Line ${schedule.line}`;
        const animalIcon = document.createElement("button");
        animalIcon.type = "button";
        animalIcon.className = "bus-animal-icon";
        const animalGlyph = document.createElement("span");
        animalGlyph.className = "bus-animal-glyph";
        animalGlyph.textContent = animal.icon;
        animalIcon.appendChild(animalGlyph);
        animalIcon.title = `Bus name: ${animal.name}`;
        animalIcon.dataset.tooltip = animalIcon.title;
        animalIcon.setAttribute("aria-label", animalIcon.title);
        animalIcon.addEventListener("click", (event) => {
            event.stopPropagation();
            const allAnimalIcons = busSearchResults.querySelectorAll(".bus-animal-icon");
            allAnimalIcons.forEach((iconEl) => {
                if (iconEl !== animalIcon) {
                    delete iconEl.dataset.showTooltip;
                }
            });
            animalIcon.dataset.showTooltip = animalIcon.dataset.showTooltip === "true" ? "false" : "true";
            window.setTimeout(() => {
                delete animalIcon.dataset.showTooltip;
            }, 2200);
        });
        const route = document.createElement("p");
        route.className = "bus-result-route";
        route.textContent = `Line ${schedule.line}: ${schedule.from} -> ${schedule.to}`;
        const times = document.createElement("p");
        times.className = "bus-result-times bus-times-with-access";
        times.textContent = `Departure: ${schedule.departure} | Arrival: ${schedule.arrival}`;
        if (schedule.accessible) {
            const accessIcon = document.createElement("span");
            accessIcon.className = "bus-access-icon";
            const accessGlyph = document.createElement("span");
            accessGlyph.className = "material-symbols-rounded";
            accessGlyph.textContent = "accessible";
            accessIcon.appendChild(accessGlyph);
            accessIcon.title = "Wheel chair accessible";
            accessIcon.dataset.tooltip = accessIcon.title;
            accessIcon.setAttribute("aria-label", accessIcon.title);
            times.appendChild(accessIcon);
        }
        const locateButton = document.createElement("button");
        locateButton.className = "primary-btn";
        locateButton.textContent = "Locate bus";
        locateButton.addEventListener("click", () => {
            void locateBus(schedule);
        });
        titleRow.appendChild(title);
        titleRow.appendChild(animalIcon);
        card.appendChild(titleRow);
        card.appendChild(route);
        card.appendChild(times);
        card.appendChild(locateButton);
        busSearchResults.appendChild(card);
    });
}
function attachSearchEvents() {
    const syncPanelStateClass = () => {
        const isOpen = !(busSearchPanel?.classList.contains("collapsed") ?? true);
        document.body.classList.toggle("map-bus-panel-open", isOpen);
    };
    syncPanelStateClass();
    mapContrastButton?.addEventListener("click", () => {
        document.body.classList.toggle("map-high-contrast");
    });
    mapDemoButton?.addEventListener("click", () => {
        triggerDemoNotification();
    });
    myLocationButton?.addEventListener("click", () => {
        showMyLocation();
    });
    busSearchToggle?.addEventListener("click", () => {
        busSearchPanel?.classList.toggle("collapsed");
        const collapsed = busSearchPanel?.classList.contains("collapsed") ?? true;
        busSearchToggle.setAttribute("aria-label", collapsed ? "Open bus search" : "Close bus search");
        syncPanelStateClass();
    });
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
renderSchedules(filterSchedules(""));
export {};
