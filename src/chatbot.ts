import {
  getBriefAlignedResponse,
  getFallbackResponse,
  getLocationAwareResponse,
  quickReplies,
} from "./chatbotResponses.js";
import {
  getAdaptiveHints,
  habits,
  loadHabits,
  profile,
  toSimpleLanguage,
  trackHabits,
  userContext,
} from "./chatbotModel.js";

const profileButton = document.querySelector<HTMLButtonElement>("#profileButton");
const menuPanel = document.querySelector<HTMLElement>("#menuPanel");
const chatForm = document.querySelector<HTMLFormElement>("#chatForm");
const chatInput = document.querySelector<HTMLInputElement>("#chatInput");
const chatMessages = document.querySelector<HTMLElement>("#chatMessages");
const speakButton = document.querySelector<HTMLButtonElement>("#speakButton");
const speechStatus = document.querySelector<HTMLElement>("#speechStatus");
const botThought = document.querySelector<HTMLElement>("#botThought");
const botAvatar = document.querySelector<HTMLElement>("#botAvatar");
const botSparkles = document.querySelector<HTMLElement>("#botSparkles");
const toggleChips = document.querySelectorAll<HTMLButtonElement>(".toggle-chip[data-toggle]");
const adaptiveHints = document.querySelector<HTMLElement>("#adaptiveHints");
const toggleDemoButton = document.querySelector<HTMLButtonElement>("#toggleDemoButton");
const chatbotSettings = document.querySelector<HTMLElement>(".chatbot-settings");
let latestBotMessage = "Hi! I am Jouko assistant. Try asking: When is bus 5 leaving to city centre?";

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

function appendMessage(text: string, role: "user" | "bot"): void {
  if (!chatMessages) return;

  const bubble = document.createElement("article");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (role === "bot") {
    latestBotMessage = text;
  }
}

function setSpeechStatus(text: string): void {
  if (speechStatus) {
    speechStatus.textContent = text;
  }
}

function readLatestMessageAloud(): void {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    setSpeechStatus("Read aloud is not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(latestBotMessage);
  utterance.lang = "en-US";
  utterance.rate = profile.simpleLanguage ? 0.88 : 1;
  utterance.pitch = 1;
  utterance.onstart = () => setSpeechStatus("Reading latest response aloud...");
  utterance.onend = () => setSpeechStatus("Read aloud is ready.");
  utterance.onerror = () => setSpeechStatus("Could not read aloud this message.");

  window.speechSynthesis.speak(utterance);
}

function renderAdaptiveHints(): void {
  if (!adaptiveHints) return;

  const hints = getAdaptiveHints();

  adaptiveHints.innerHTML = "";
  hints.forEach((hint) => {
    const item = document.createElement("p");
    item.className = "adaptive-hint";
    item.textContent = hint;
    adaptiveHints.appendChild(item);
  });
}

function renderThoughtBubble(): void {
  if (!botThought) return;

  if (habits.messageCount < 2) {
    botThought.textContent = `Current location: ${userContext.currentLocation}.`;
    return;
  }

  const cues: string[] = [];
  cues.push(`Current location: ${userContext.currentLocation}.`);

  if (habits.routeRequests >= 2) {
    cues.push(`Frequent line pattern: ${habits.favoriteLine}.`);
  }

  if (userContext.needsWheelchairAccess) {
    cues.push("Wheelchair access required.");
  }

  botThought.textContent = cues.join(" ");
}

function setHighContrast(enabled: boolean): void {
  document.body.classList.toggle("chatbot-high-contrast", enabled);
}

function attachProfileEvents(): void {
  toggleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.toggle as keyof typeof profile | undefined;
      if (!key) return;

      profile[key] = !profile[key];
      chip.setAttribute("aria-pressed", String(profile[key]));
      chip.classList.toggle("active", profile[key]);

      if (key === "highContrast") {
        setHighContrast(profile.highContrast);
      }

      renderThoughtBubble();
      renderAdaptiveHints();
    });
  });
}

function playCuteBotSound(): void {
  const audioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!audioContextConstructor) return;

  const context = new audioContextConstructor();
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  master.connect(context.destination);

  const patterns: Array<[number, number, OscillatorType, number, number, OscillatorType]> = [
    [730, 950, "sine", 620, 780, "triangle"],
    [680, 900, "triangle", 540, 700, "sine"],
    [760, 1020, "sine", 640, 820, "square"],
    [620, 860, "triangle", 700, 880, "sine"],
    [800, 1080, "square", 560, 740, "triangle"],
  ];
  const [aStart, aEnd, aType, bStart, bEnd, bType] =
    patterns[Math.floor(Math.random() * patterns.length)];

  const oscA = context.createOscillator();
  oscA.type = aType;
  oscA.frequency.setValueAtTime(aStart, now);
  oscA.frequency.exponentialRampToValueAtTime(aEnd, now + 0.1);
  oscA.connect(master);
  oscA.start(now);
  oscA.stop(now + 0.12);

  const oscB = context.createOscillator();
  oscB.type = bType;
  oscB.frequency.setValueAtTime(bStart, now + 0.1);
  oscB.frequency.exponentialRampToValueAtTime(bEnd, now + 0.24);
  oscB.connect(master);
  oscB.start(now + 0.1);
  oscB.stop(now + 0.26);
}

function triggerBotVisualEffects(): void {
  if (!botAvatar) return;

  botAvatar.classList.remove("bot-pressed");
  void botAvatar.offsetWidth;
  botAvatar.classList.add("bot-pressed");

  if (!botSparkles) return;
  botSparkles.innerHTML = "";

  const emitSparkles = (originX: number, originY: number, direction: -1 | 1): void => {
    for (let i = 0; i < 6; i += 1) {
      const sparkle = document.createElement("span");
      sparkle.className = "bot-sparkle";
      const angle = (Math.PI * i) / 6 - Math.PI / 2;
      sparkle.style.left = `${originX}px`;
      sparkle.style.top = `${originY}px`;
      sparkle.style.setProperty("--dx", `${Math.cos(angle) * 14 * direction}px`);
      sparkle.style.setProperty("--dy", `${Math.sin(angle) * 12}px`);
      sparkle.style.animationDelay = `${i * 18}ms`;
      botSparkles.appendChild(sparkle);
    }
  };

  emitSparkles(28, 40, -1);
  emitSparkles(62, 40, 1);
}

function attachBotInteraction(): void {
  const trigger = () => {
    playCuteBotSound();
    triggerBotVisualEffects();
  };

  botAvatar?.addEventListener("click", trigger);
  botAvatar?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      trigger();
    }
  });
}

function attachDemoVisibilityToggle(): void {
  toggleDemoButton?.addEventListener("click", () => {
    if (!chatbotSettings) return;
    chatbotSettings.classList.toggle("hidden");
    const hidden = chatbotSettings.classList.contains("hidden");
    toggleDemoButton.setAttribute("aria-label", hidden ? "Show AI demo profile" : "Hide AI demo profile");
  });
}

function getBotReply(prompt: string): string {
  trackHabits(prompt, window.localStorage);

  const locationResponse = getLocationAwareResponse(prompt, {
    favoriteLine: habits.favoriteLine,
    currentLocation: userContext.currentLocation,
    likelyDestination: userContext.likelyDestination,
  });
  if (locationResponse) {
    return toSimpleLanguage(locationResponse);
  }

  const briefResponse = getBriefAlignedResponse(prompt, {
    favoriteLine: habits.favoriteLine,
    currentLocation: userContext.currentLocation,
    likelyDestination: userContext.likelyDestination,
  });
  if (briefResponse) {
    return toSimpleLanguage(briefResponse);
  }

  const hit = quickReplies.find((entry) => entry.match.test(prompt));

  if (hit) {
    return toSimpleLanguage(hit.response);
  }

  const personalized = getFallbackResponse({
    favoriteLine: habits.favoriteLine,
    currentLocation: userContext.currentLocation,
    likelyDestination: userContext.likelyDestination,
  });

  return toSimpleLanguage(personalized);
}

function attachChatEvents(): void {
  speakButton?.addEventListener("click", () => {
    readLatestMessageAloud();
  });

  chatForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const text = chatInput?.value.trim() ?? "";
    if (!text) return;

    appendMessage(text, "user");
    if (chatInput) {
      chatInput.value = "";
    }

    window.setTimeout(() => {
      appendMessage(getBotReply(text), "bot");
      renderThoughtBubble();
      renderAdaptiveHints();
    }, 220);
  });
}

loadHabits(window.localStorage);
renderThoughtBubble();
attachMenuEvents();
attachProfileEvents();
attachBotInteraction();
attachDemoVisibilityToggle();
attachChatEvents();
renderAdaptiveHints();

export {};
