import { getBriefAlignedResponse, getFallbackResponse, getLocationAwareResponse, quickReplies, } from "./chatbotResponses.js";
import { getAdaptiveHints, habits, loadHabits, profile, toSimpleLanguage, trackHabits, userContext, } from "./chatbotModel.js";
const profileButton = document.querySelector("#profileButton");
const menuPanel = document.querySelector("#menuPanel");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector("#chatMessages");
const chatVoiceButton = document.querySelector("#chatVoiceButton");
const speakButton = document.querySelector("#speakButton");
const speechStatus = document.querySelector("#speechStatus");
const botThought = document.querySelector("#botThought");
const botAvatar = document.querySelector("#botAvatar");
const botSparkles = document.querySelector("#botSparkles");
const toggleChips = document.querySelectorAll(".toggle-chip[data-toggle]");
const adaptiveHints = document.querySelector("#adaptiveHints");
const toggleDemoButton = document.querySelector("#toggleDemoButton");
const chatbotSettings = document.querySelector(".chatbot-settings");
const chatbotContrastButton = document.querySelector("#chatbotContrastButton");
let latestBotMessage = "Hi! I am Jouko assistant. Try asking: When is bus 5 leaving to city centre?";
let activeChatRecognition;
function getSpeechRecognitionConstructor() {
    const speechWindow = window;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}
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
function appendMessage(text, role) {
    if (!chatMessages)
        return;
    const bubble = document.createElement("article");
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (role === "bot") {
        latestBotMessage = text;
    }
}
function setSpeechStatus(text) {
    if (speechStatus) {
        speechStatus.textContent = text;
    }
}
function readLatestMessageAloud() {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
        setSpeechStatus("Read aloud is not supported in this browser.");
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestBotMessage);
    utterance.lang = "en-US";
    utterance.rate = profile.simpleLanguage ? 0.72 : 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeechStatus("Reading latest response aloud...");
    utterance.onend = () => setSpeechStatus("Read aloud is ready.");
    utterance.onerror = () => setSpeechStatus("Could not read aloud this message.");
    window.speechSynthesis.speak(utterance);
}
function renderAdaptiveHints() {
    if (!adaptiveHints)
        return;
    const hints = getAdaptiveHints();
    adaptiveHints.innerHTML = "";
    hints.forEach((hint) => {
        const item = document.createElement("p");
        item.className = "adaptive-hint";
        item.textContent = hint;
        adaptiveHints.appendChild(item);
    });
}
function renderThoughtBubble() {
    if (!botThought)
        return;
    if (habits.messageCount < 2) {
        botThought.textContent = `Current location: ${userContext.currentLocation}.`;
        return;
    }
    const cues = [];
    cues.push(`Current location: ${userContext.currentLocation}.`);
    if (habits.routeRequests >= 2) {
        cues.push(`Frequent line pattern: ${habits.favoriteLine}.`);
    }
    if (userContext.needsWheelchairAccess) {
        cues.push("Wheelchair access required.");
    }
    botThought.textContent = cues.join(" ");
}
function setHighContrast(enabled) {
    document.body.classList.toggle("chatbot-high-contrast", enabled);
}
function attachProfileEvents() {
    toggleChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            const key = chip.dataset.toggle;
            if (!key)
                return;
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
function playCuteBotSound() {
    const audioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!audioContextConstructor)
        return;
    const context = new audioContextConstructor();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    master.connect(context.destination);
    const patterns = [
        [730, 950, "sine", 620, 780, "triangle"],
        [680, 900, "triangle", 540, 700, "sine"],
        [760, 1020, "sine", 640, 820, "square"],
        [620, 860, "triangle", 700, 880, "sine"],
        [800, 1080, "square", 560, 740, "triangle"],
    ];
    const [aStart, aEnd, aType, bStart, bEnd, bType] = patterns[Math.floor(Math.random() * patterns.length)];
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
function triggerBotVisualEffects() {
    if (!botAvatar)
        return;
    botAvatar.classList.remove("bot-pressed");
    void botAvatar.offsetWidth;
    botAvatar.classList.add("bot-pressed");
    if (!botSparkles)
        return;
    botSparkles.innerHTML = "";
    const emitSparkles = (originX, originY, direction) => {
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
function attachBotInteraction() {
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
function attachDemoVisibilityToggle() {
    toggleDemoButton?.addEventListener("click", () => {
        if (!chatbotSettings)
            return;
        chatbotSettings.classList.toggle("hidden");
        const hidden = chatbotSettings.classList.contains("hidden");
        toggleDemoButton.setAttribute("aria-label", hidden ? "Show prototype chatbot options and insights" : "Hide prototype chatbot options and insights");
    });
}
function attachTopbarContrastToggle() {
    chatbotContrastButton?.addEventListener("click", () => {
        const next = !document.body.classList.contains("chatbot-high-contrast");
        profile.highContrast = next;
        setHighContrast(next);
        const chip = document.querySelector('.toggle-chip[data-toggle="highContrast"]');
        chip?.setAttribute("aria-pressed", String(next));
        chip?.classList.toggle("active", next);
    });
}
function attachChatVoiceInput() {
    chatVoiceButton?.addEventListener("click", () => {
        if (activeChatRecognition) {
            activeChatRecognition.stop();
            return;
        }
        const SpeechRecognition = getSpeechRecognitionConstructor();
        if (!SpeechRecognition) {
            setSpeechStatus("Voice input is not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognition();
        activeChatRecognition = recognition;
        let finalTranscript = chatInput?.value.trim() ?? "";
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        chatVoiceButton.classList.add("is-listening");
        chatVoiceButton.setAttribute("aria-pressed", "true");
        chatVoiceButton.setAttribute("aria-label", "Stop voice input for chat");
        setSpeechStatus("Listening for your message...");
        recognition.onresult = (event) => {
            if (!chatInput)
                return;
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const segment = String(event.results[i]?.[0]?.transcript ?? "");
                if (!segment)
                    continue;
                if (event.results[i].isFinal) {
                    finalTranscript = `${finalTranscript} ${segment}`.trim();
                }
                else {
                    interimTranscript += segment;
                }
            }
            chatInput.value = `${finalTranscript} ${interimTranscript}`.trim();
            chatInput.focus();
            setSpeechStatus("Listening... your words are being added to the input.");
        };
        recognition.onerror = () => {
            setSpeechStatus("Could not capture voice input.");
        };
        recognition.onend = () => {
            activeChatRecognition = undefined;
            chatVoiceButton.classList.remove("is-listening");
            chatVoiceButton.setAttribute("aria-pressed", "false");
            chatVoiceButton.setAttribute("aria-label", "Start voice input for chat");
            if (chatInput?.value.trim()) {
                setSpeechStatus("Voice input ready. Press Send.");
            }
        };
        try {
            recognition.start();
        }
        catch {
            activeChatRecognition = undefined;
            chatVoiceButton.classList.remove("is-listening");
            chatVoiceButton.setAttribute("aria-pressed", "false");
            chatVoiceButton.setAttribute("aria-label", "Start voice input for chat");
            setSpeechStatus("Could not start voice input.");
        }
    });
}
function getBotReply(prompt) {
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
function attachChatEvents() {
    speakButton?.addEventListener("click", () => {
        readLatestMessageAloud();
    });
    chatForm?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const text = chatInput?.value.trim() ?? "";
        if (!text)
            return;
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
attachTopbarContrastToggle();
attachChatVoiceInput();
attachChatEvents();
renderAdaptiveHints();
