type Departure = {
  id: string;
  line: string;
  destination: string;
  stop: string;
  departsAt: string;
  minutes: number;
  routeStops: string[];
};

const departuresSeed: Departure[] = [
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
  favorites: new Set<string>(),
  activeTab: "home" as "home" | "favorites" | "tickets",
  selectedDepartureId: "",
};

const departureList = document.querySelector<HTMLDivElement>("#departureList");
const departureTemplate = document.querySelector<HTMLTemplateElement>("#departureTemplate");
const routePanel = document.querySelector<HTMLElement>("#routePanel");
const routeTitle = document.querySelector<HTMLElement>("#routeTitle");
const routeStops = document.querySelector<HTMLOListElement>("#routeStops");
const ticketSheet = document.querySelector<HTMLElement>("#ticketSheet");
const ticketLineText = document.querySelector<HTMLElement>("#ticketLineText");
const searchInput = document.querySelector<HTMLInputElement>("#searchInput");
const searchButton = document.querySelector<HTMLButtonElement>("#searchButton");
const refreshButton = document.querySelector<HTMLButtonElement>("#refreshButton");
const closeRouteButton = document.querySelector<HTMLButtonElement>("#closeRouteButton");
const closeTicketButton = document.querySelector<HTMLButtonElement>("#closeTicketButton");
const quickActionButtons = document.querySelectorAll<HTMLButtonElement>(".chip[data-stop]");
const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav-item");
const ticketOptions = document.querySelectorAll<HTMLButtonElement>(".ticket-option");
const profileButton = document.querySelector<HTMLButtonElement>("#profileButton");
const menuPanel = document.querySelector<HTMLElement>("#menuPanel");

function clampMinutes(minutes: number): number {
  return Math.max(minutes, 1);
}

function getVisibleDepartures(): Departure[] {
  let items = departuresSeed.filter((dep) => dep.stop === state.selectedStop);

  if (state.activeTab === "favorites") {
    items = items.filter((dep) => state.favorites.has(dep.id));
  }

  return items;
}

function renderEmpty(message: string): void {
  if (!departureList) return;
  departureList.innerHTML = "";
  const el = document.createElement("div");
  el.className = "notice";
  el.textContent = message;
  departureList.appendChild(el);
}

function renderDepartures(): void {
  if (!departureList || !departureTemplate) return;

  const items = getVisibleDepartures();
  departureList.innerHTML = "";

  if (state.activeTab === "tickets") {
    renderEmpty("Your mobile tickets will appear here. Tap 'Ticket' on a route to simulate purchase.");
    return;
  }

  if (items.length === 0) {
    const msg =
      state.activeTab === "favorites"
        ? "No favorite routes from this stop yet. Tap the star on a route first."
        : "No departures for this stop right now.";
    renderEmpty(msg);
    return;
  }

  items.forEach((dep) => {
    const node = departureTemplate.content.cloneNode(true) as DocumentFragment;

    const lineBadge = node.querySelector<HTMLElement>(".line-badge");
    const lineTitle = node.querySelector<HTMLElement>(".line-title");
    const lineSubtitle = node.querySelector<HTMLElement>(".line-subtitle");
    const nextTime = node.querySelector<HTMLElement>(".next-time");
    const nextMinutes = node.querySelector<HTMLElement>(".next-minutes");
    const routeButton = node.querySelector<HTMLButtonElement>(".view-route");
    const ticketButton = node.querySelector<HTMLButtonElement>(".buy-ticket");
    const favoriteButton = node.querySelector<HTMLButtonElement>(".favorite");

    if (!lineBadge || !lineTitle || !lineSubtitle || !nextTime || !nextMinutes) return;

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

function openRoutePanel(departureId: string): void {
  const dep = departuresSeed.find((item) => item.id === departureId);
  if (!dep || !routePanel || !routeTitle || !routeStops) return;

  routeTitle.textContent = `Line ${dep.line} route`;
  routeStops.innerHTML = "";

  dep.routeStops.forEach((stop) => {
    const li = document.createElement("li");
    li.textContent = stop;
    routeStops.appendChild(li);
  });

  routePanel.classList.remove("hidden");
}

function openTicketSheet(departureId: string): void {
  const dep = departuresSeed.find((item) => item.id === departureId);
  if (!dep || !ticketSheet || !ticketLineText) return;

  state.selectedDepartureId = dep.id;
  ticketLineText.textContent = `Line ${dep.line} to ${dep.destination} from ${dep.stop}`;
  ticketSheet.classList.remove("hidden");
}

function closePanels(): void {
  routePanel?.classList.add("hidden");
  ticketSheet?.classList.add("hidden");
}

function toggleMenu(): void {
  menuPanel?.classList.toggle("hidden");
}

function toggleFavorite(departureId: string): void {
  if (state.favorites.has(departureId)) {
    state.favorites.delete(departureId);
  } else {
    state.favorites.add(departureId);
  }

  renderDepartures();
}

function applyStopFilter(stopText: string): void {
  const normalized = stopText.trim().toLowerCase();
  if (!normalized) return;

  const bestMatch = departuresSeed.find((dep) => {
    return (
      dep.stop.toLowerCase().includes(normalized) ||
      dep.destination.toLowerCase().includes(normalized)
    );
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

function setActiveNav(tab: "home" | "favorites" | "tickets"): void {
  state.activeTab = tab;

  navButtons.forEach((btn) => {
    const target = btn.dataset.nav;
    btn.classList.toggle("active", target === tab);
  });
}

function simulateRefresh(): void {
  departuresSeed.forEach((dep) => {
    const next = dep.minutes + Math.floor(Math.random() * 5) - 2;
    dep.minutes = clampMinutes(next);
  });
  renderDepartures();
}

function attachEvents(): void {
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
      if (!stop) return;
      state.selectedStop = stop;
      setActiveNav("home");
      renderDepartures();
    });
  });

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.nav as "home" | "favorites" | "tickets" | undefined;
      if (!target) return;
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

      if (!dep) return;

      ticketSheet?.classList.add("hidden");
      setActiveNav("tickets");
      renderEmpty(`Purchased ${ticketType} for line ${dep.line}. This is a concept interaction only.`);
    });
  });
}

attachEvents();
renderDepartures();

export {};
