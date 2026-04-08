export type UserProfile = {
  simpleLanguage: boolean;
  highContrast: boolean;
};

export type UserContext = {
  displayName: string;
  currentLocation: string;
  likelyDestination: string;
  frequentOrigin: string;
  needsWheelchairAccess: boolean;
};

export type HabitState = {
  messageCount: number;
  routeRequests: number;
  delayRequests: number;
  ticketRequests: number;
  favoriteLine: string;
};

export const habitStorageKey = "jouko-demo-habits";

export const profile: UserProfile = {
  simpleLanguage: false,
  highContrast: false,
};

export const userContext: UserContext = {
  displayName: "Demo rider",
  currentLocation: "LUT University",
  likelyDestination: "Lappeenranta city centre",
  frequentOrigin: "LUT University",
  needsWheelchairAccess: true,
};

export const habits: HabitState = {
  messageCount: 0,
  routeRequests: 0,
  delayRequests: 0,
  ticketRequests: 0,
  favoriteLine: "5",
};

export function loadHabits(storage: Storage): void {
  try {
    const raw = storage.getItem(habitStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<HabitState>;
    habits.messageCount = parsed.messageCount ?? habits.messageCount;
    habits.routeRequests = parsed.routeRequests ?? habits.routeRequests;
    habits.delayRequests = parsed.delayRequests ?? habits.delayRequests;
    habits.ticketRequests = parsed.ticketRequests ?? habits.ticketRequests;
    habits.favoriteLine = parsed.favoriteLine ?? habits.favoriteLine;
  } catch {
    // Ignore malformed demo state.
  }
}

export function saveHabits(storage: Storage): void {
  storage.setItem(habitStorageKey, JSON.stringify(habits));
}

export function trackHabits(prompt: string, storage: Storage): void {
  habits.messageCount += 1;

  const lineMatch = prompt.match(/(?:bus|line)\s*(1x|1|2|3|4|5)/i);
  if (lineMatch) {
    habits.favoriteLine = lineMatch[1].toLowerCase();
    habits.routeRequests += 1;
  }

  if (/delay|late|traffic/i.test(prompt)) {
    habits.delayRequests += 1;
  }

  if (/ticket|price|cost|pass/i.test(prompt)) {
    habits.ticketRequests += 1;
  }

  saveHabits(storage);
}

export function getAdaptivePrefix(): string {
  const parts: string[] = [];
  if (userContext.needsWheelchairAccess) {
    parts.push("Accessible options only.");
  }
  return parts.join(" ");
}

export function getAdaptiveHints(): string[] {
  const hints: string[] = [];

  if (userContext.needsWheelchairAccess) {
    hints.push("Accessibility filter active: routes with step-free boarding are prioritized.");
  }

  if (habits.routeRequests >= 2) {
    hints.push(`Habit learned: you often ask for line ${habits.favoriteLine}.`);
  }

  if (habits.delayRequests >= 2) {
    hints.push("Habit learned: show live delay checks first in responses.");
  }

  if (hints.length === 0) {
    hints.push("No habits learned yet. Ask a few route questions to see adaptation.");
  }

  return hints;
}

export function toSimpleLanguage(message: string): string {
  if (!profile.simpleLanguage) return message;
  return message
    .replace("prioritize", "show")
    .replace("currently", "now")
    .replace("prototype", "demo")
    .replace("approximately", "about");
}
