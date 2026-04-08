const departuresSeed = [
    {
        id: "14-keskusta",
        line: "14",
        destination: "Keskusta",
        stop: "Torin pysakki",
        departsAt: "12:08",
        minutes: 4,
        routeStops: ["Satamakatu", "Kauppatori", "Puijonkatu", "Keskusta"],
    },
    {
        id: "5-kys",
        line: "5",
        destination: "KYS",
        stop: "Matkakeskus",
        departsAt: "12:12",
        minutes: 8,
        routeStops: ["Matkakeskus", "Haapaniemi", "Puijonlaakso", "KYS"],
    },
    {
        id: "23-satama",
        line: "23",
        destination: "Satama",
        stop: "Keskusta",
        departsAt: "12:19",
        minutes: 15,
        routeStops: ["Keskusta", "Asema", "Ranta", "Satama"],
    },
    {
        id: "9-neulamaki",
        line: "9",
        destination: "Neulamaki",
        stop: "Torin pysakki",
        departsAt: "12:24",
        minutes: 20,
        routeStops: ["Torin pysakki", "Savilahdentie", "Neulaniemi", "Neulamaki"],
    },
];
const state = {
    selectedStop: "Torin pysakki",
    favorites: new Set(),
    activeTab: "home",
    selectedDepartureId: "",
};
const departureList = document.querySelector("#departureList");
const departureTemplate = document.querySelector("#departureTemplate");
const routePanel = document.querySelector("#routePanel");
const routeTitle = document.querySelector("#routeTitle");
const routeStops = document.querySelector("#routeStops");
const ticketSheet = document.querySelector("#ticketSheet");
const ticketLineText = document.querySelector("#ticketLineText");
const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const refreshButton = document.querySelector("#refreshButton");
const closeRouteButton = document.querySelector("#closeRouteButton");
const closeTicketButton = document.querySelector("#closeTicketButton");
const quickActionButtons = document.querySelectorAll(".chip[data-stop]");
const navButtons = document.querySelectorAll(".nav-item");
const ticketOptions = document.querySelectorAll(".ticket-option");
const profileButton = document.querySelector("#profileButton");
const menuPanel = document.querySelector("#menuPanel");
function clampMinutes(minutes) {
    return Math.max(minutes, 1);
}
function getVisibleDepartures() {
    let items = departuresSeed.filter((dep) => dep.stop === state.selectedStop);
    if (state.activeTab === "favorites") {
        items = items.filter((dep) => state.favorites.has(dep.id));
    }
    return items;
}
function renderEmpty(message) {
    if (!departureList)
        return;
    departureList.innerHTML = "";
    const el = document.createElement("div");
    el.className = "notice";
    el.textContent = message;
    departureList.appendChild(el);
}
function renderDepartures() {
    if (!departureList || !departureTemplate)
        return;
    const items = getVisibleDepartures();
    departureList.innerHTML = "";
    if (state.activeTab === "tickets") {
        renderEmpty("Your mobile tickets will appear here. Tap 'Ticket' on a route to simulate purchase.");
        return;
    }
    if (items.length === 0) {
        const msg = state.activeTab === "favorites"
            ? "No favorite routes from this stop yet. Tap the star on a route first."
            : "No departures for this stop right now.";
        renderEmpty(msg);
        return;
    }
    items.forEach((dep) => {
        const node = departureTemplate.content.cloneNode(true);
        const lineBadge = node.querySelector(".line-badge");
        const lineTitle = node.querySelector(".line-title");
        const lineSubtitle = node.querySelector(".line-subtitle");
        const nextTime = node.querySelector(".next-time");
        const nextMinutes = node.querySelector(".next-minutes");
        const routeButton = node.querySelector(".view-route");
        const ticketButton = node.querySelector(".buy-ticket");
        const favoriteButton = node.querySelector(".favorite");
        if (!lineBadge || !lineTitle || !lineSubtitle || !nextTime || !nextMinutes)
            return;
        lineBadge.textContent = dep.line;
        lineTitle.textContent = `${dep.line} to ${dep.destination}`;
        lineSubtitle.textContent = `${dep.stop} stop`;
        nextTime.textContent = dep.departsAt;
        nextMinutes.textContent = `in ${dep.minutes} min`;
        if (routeButton) {
            routeButton.addEventListener("click", () => openRoutePanel(dep.id));
        }
        if (ticketButton) {
            ticketButton.addEventListener("click", () => openTicketSheet(dep.id));
        }
        if (favoriteButton) {
            favoriteButton.textContent = state.favorites.has(dep.id) ? "★" : "☆";
            favoriteButton.addEventListener("click", () => {
                toggleFavorite(dep.id);
            });
        }
        departureList.appendChild(node);
    });
}
function openRoutePanel(departureId) {
    const dep = departuresSeed.find((item) => item.id === departureId);
    if (!dep || !routePanel || !routeTitle || !routeStops)
        return;
    routeTitle.textContent = `Line ${dep.line} route`;
    routeStops.innerHTML = "";
    dep.routeStops.forEach((stop) => {
        const li = document.createElement("li");
        li.textContent = stop;
        routeStops.appendChild(li);
    });
    routePanel.classList.remove("hidden");
}
function openTicketSheet(departureId) {
    const dep = departuresSeed.find((item) => item.id === departureId);
    if (!dep || !ticketSheet || !ticketLineText)
        return;
    state.selectedDepartureId = dep.id;
    ticketLineText.textContent = `Line ${dep.line} to ${dep.destination} from ${dep.stop}`;
    ticketSheet.classList.remove("hidden");
}
function closePanels() {
    routePanel?.classList.add("hidden");
    ticketSheet?.classList.add("hidden");
}
function toggleMenu() {
    menuPanel?.classList.toggle("hidden");
}
function toggleFavorite(departureId) {
    if (state.favorites.has(departureId)) {
        state.favorites.delete(departureId);
    }
    else {
        state.favorites.add(departureId);
    }
    renderDepartures();
}
function applyStopFilter(stopText) {
    const normalized = stopText.trim().toLowerCase();
    if (!normalized)
        return;
    const bestMatch = departuresSeed.find((dep) => {
        return (dep.stop.toLowerCase().includes(normalized) ||
            dep.destination.toLowerCase().includes(normalized));
    });
    if (bestMatch) {
        state.selectedStop = bestMatch.stop;
        state.activeTab = "home";
        setActiveNav("home");
        closePanels();
        renderDepartures();
        return;
    }
    renderEmpty(`No matches for "${stopText}". Try another stop or destination.`);
}
function setActiveNav(tab) {
    state.activeTab = tab;
    navButtons.forEach((btn) => {
        const target = btn.dataset.nav;
        btn.classList.toggle("active", target === tab);
    });
}
function simulateRefresh() {
    departuresSeed.forEach((dep) => {
        const next = dep.minutes + Math.floor(Math.random() * 5) - 2;
        dep.minutes = clampMinutes(next);
    });
    renderDepartures();
}
function attachEvents() {
    profileButton?.addEventListener("click", (ev) => {
        ev.stopPropagation();
        toggleMenu();
    });
    menuPanel?.addEventListener("click", (ev) => {
        ev.stopPropagation();
    });
    document.addEventListener("click", () => {
        menuPanel?.classList.add("hidden");
    });
    searchButton?.addEventListener("click", () => {
        applyStopFilter(searchInput?.value ?? "");
    });
    searchInput?.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
            applyStopFilter(searchInput.value);
        }
    });
    refreshButton?.addEventListener("click", simulateRefresh);
    quickActionButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const stop = btn.dataset.stop;
            if (!stop)
                return;
            state.selectedStop = stop;
            setActiveNav("home");
            renderDepartures();
        });
    });
    navButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.nav;
            if (!target)
                return;
            setActiveNav(target);
            closePanels();
            renderDepartures();
        });
    });
    closeRouteButton?.addEventListener("click", () => routePanel?.classList.add("hidden"));
    closeTicketButton?.addEventListener("click", () => ticketSheet?.classList.add("hidden"));
    ticketOptions.forEach((btn) => {
        btn.addEventListener("click", () => {
            const dep = departuresSeed.find((item) => item.id === state.selectedDepartureId);
            const ticketType = btn.dataset.ticket ?? "ticket";
            if (!dep)
                return;
            ticketSheet?.classList.add("hidden");
            setActiveNav("tickets");
            renderEmpty(`Purchased ${ticketType} for line ${dep.line}. This is a concept interaction only.`);
        });
    });
}
attachEvents();
renderDepartures();
export {};
