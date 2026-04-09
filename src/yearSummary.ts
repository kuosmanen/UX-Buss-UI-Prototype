type YearSummaryData = {
  year: number;
  totalTrips: number;
  co2Kg: number;
  treesEquivalent: number;
  favoriteRoute: string;
  mostUsedStop: string;
  monthlyTrips: number[];
  longestTripKm: number;
  streakDays: number;
};

const summaryDataByYear: Record<number, YearSummaryData> = {
  2026: {
    year: 2026,
    totalTrips: 124,
    co2Kg: 78,
    treesEquivalent: 4,
    favoriteRoute: "Line 5",
    mostUsedStop: "Keskusta",
    monthlyTrips: [6, 8, 10, 12, 11, 14, 9, 13, 15, 12, 8, 6],
    longestTripKm: 12.4,
    streakDays: 12,
  },
  2025: {
    year: 2025,
    totalTrips: 102,
    co2Kg: 64,
    treesEquivalent: 3,
    favoriteRoute: "Line 2",
    mostUsedStop: "Matkakeskus",
    monthlyTrips: [4, 7, 8, 9, 10, 12, 8, 11, 13, 10, 6, 4],
    longestTripKm: 10.8,
    streakDays: 9,
  },
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const profileButton = document.querySelector<HTMLButtonElement>("#profileButton");
const menuPanel = document.querySelector<HTMLElement>("#menuPanel");
const contrastButton = document.querySelector<HTMLButtonElement>("#summaryContrastButton");
const soundButton = document.querySelector<HTMLButtonElement>("#summarySoundButton");
const yearSelect = document.querySelector<HTMLSelectElement>("#summaryYearSelect");
const totalTripsValue = document.querySelector<HTMLElement>("#totalTripsValue");
const co2Value = document.querySelector<HTMLElement>("#co2Value");
const treesValue = document.querySelector<HTMLElement>("#treesValue");
const favoriteRouteValue = document.querySelector<HTMLElement>("#favoriteRouteValue");
const usedStopValue = document.querySelector<HTMLElement>("#usedStopValue");
const monthlyChart = document.querySelector<HTMLElement>("#monthlyChart");
const peakMonthValue = document.querySelector<HTMLElement>("#peakMonthValue");
const longestTripValue = document.querySelector<HTMLElement>("#longestTripValue");
const streakValue = document.querySelector<HTMLElement>("#streakValue");
const co2BarFill = document.querySelector<HTMLElement>("#co2BarFill");
const co2Particles = document.querySelector<HTMLElement>("#co2Particles");
const shareSummaryButton = document.querySelector<HTMLButtonElement>("#shareSummaryButton");
const co2Card = document.querySelector<HTMLElement>(".summary-co2");
const activityCard = document.querySelector<HTMLElement>(".summary-activity");
const pinThwumpContainer = document.querySelector<HTMLElement>("#pinThwumpContainer");
const streakFireContainer = document.querySelector<HTMLElement>("#streakFireContainer");

let co2BarAnimation: Animation | null = null;
let soundEffectsEnabled = true;
let audioContext: AudioContext | null = null;

function isHighContrastMode(): boolean {
  return document.body.classList.contains("summary-high-contrast");
}

function getSelectedSummaryData(): YearSummaryData {
  const selectedYear = Number(yearSelect?.value ?? new Date().getFullYear());
  return summaryDataByYear[selectedYear] ?? Object.values(summaryDataByYear)[0];
}

function getAudioContext(): AudioContext | null {
  if (!soundEffectsEnabled || isHighContrastMode()) {
    return null;
  }

  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) {
    return null;
  }

  if (!audioContext) {
    audioContext = new Ctx();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startOffsetMs: number,
  durationMs: number,
  gainLevel: number,
  type: OscillatorType
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const startAt = ctx.currentTime + startOffsetMs / 1000;
  const endAt = startAt + durationMs / 1000;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainLevel, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(endAt + 0.02);
}

function playWrappedSound(kind: "card" | "co2" | "activity" | "year" | "share"): void {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (kind === "card") {
    playTone(ctx, 520, 0, 120, 0.018, "triangle");
    return;
  }

  if (kind === "co2") {
    playTone(ctx, 220, 0, 360, 0.02, "sine");
    playTone(ctx, 330, 120, 260, 0.016, "triangle");
    return;
  }

  if (kind === "activity") {
    playTone(ctx, 310, 0, 110, 0.014, "square");
    playTone(ctx, 370, 90, 110, 0.014, "square");
    playTone(ctx, 430, 180, 110, 0.014, "square");
    return;
  }

  if (kind === "year") {
    playTone(ctx, 420, 0, 120, 0.016, "triangle");
    playTone(ctx, 560, 100, 140, 0.016, "triangle");
    return;
  }

  playTone(ctx, 523, 0, 140, 0.018, "triangle");
  playTone(ctx, 659, 110, 160, 0.018, "triangle");
  playTone(ctx, 784, 220, 200, 0.018, "triangle");
}

function attachSoundToggle(): void {
  soundButton?.addEventListener("click", () => {
    soundEffectsEnabled = !soundEffectsEnabled;
    soundButton.setAttribute("aria-pressed", String(soundEffectsEnabled));

    const icon = soundButton.querySelector<HTMLElement>(".material-symbols-rounded");
    if (icon) {
      icon.textContent = soundEffectsEnabled ? "volume_up" : "volume_off";
    }

    if (soundEffectsEnabled) {
      playWrappedSound("card");
    }
  });
}

function animateMetric(
  element: HTMLElement | null,
  targetValue: number,
  formatter: (value: number) => string,
  durationMs: number
): void {
  if (!element) {
    return;
  }

  if (isHighContrastMode()) {
    element.textContent = formatter(targetValue);
    return;
  }

  const start = performance.now();

  const step = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = targetValue * eased;

    element.textContent = formatter(current);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function emitCo2Particles(): void {
  if (!co2Particles) {
    return;
  }

  if (isHighContrastMode()) {
    co2Particles.innerHTML = "";
    return;
  }

  co2Particles.innerHTML = "";

  for (let i = 0; i < 12; i += 1) {
    const particle = document.createElement("span");
    particle.className = "co2-particle";
    particle.style.left = `${6 + Math.random() * 88}%`;
    particle.style.animationDelay = `${Math.random() * 180}ms`;
    particle.style.animationDuration = `${560 + Math.random() * 320}ms`;
    co2Particles.appendChild(particle);
  }

  window.setTimeout(() => {
    if (co2Particles) {
      co2Particles.innerHTML = "";
    }
  }, 1100);
}

function animateCo2Bar(co2Kg: number): void {
  if (!co2BarFill) {
    return;
  }

  const co2Percent = Math.min((co2Kg / 100) * 100, 100);
  const targetWidth = Math.max(co2Percent, 10);

  if (isHighContrastMode()) {
    if (co2BarAnimation) {
      co2BarAnimation.cancel();
      co2BarAnimation = null;
    }
    co2BarFill.style.transform = "scaleX(1)";
    co2BarFill.style.width = `${targetWidth}%`;
    if (co2Particles) {
      co2Particles.innerHTML = "";
    }
    return;
  }

  if (co2BarAnimation) {
    co2BarAnimation.cancel();
    co2BarAnimation = null;
  }

  co2BarFill.style.width = `${targetWidth}%`;
  co2BarFill.style.transform = "scaleX(0)";

  co2BarAnimation = co2BarFill.animate(
    [
      { transform: "scaleX(0)", offset: 0 },
      { transform: "scaleX(1.06)", offset: 0.78 },
      { transform: "scaleX(0.97)", offset: 0.9 },
      { transform: "scaleX(1)", offset: 1 },
    ],
    {
      duration: 1900,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      fill: "forwards",
    }
  );

  co2BarAnimation.onfinish = () => {
    emitCo2Particles();
  };
}

function attachMenuEvents(): void {
  profileButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    menuPanel?.classList.toggle("hidden");
  });

  menuPanel?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    menuPanel?.classList.add("hidden");
  });
}

function populateYearSelect(): void {
  if (!yearSelect) {
    return;
  }

  const years = Object.keys(summaryDataByYear)
    .map((value) => Number(value))
    .sort((a, b) => b - a);

  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  });

  const currentYear = new Date().getFullYear();
  yearSelect.value = String(summaryDataByYear[currentYear] ? currentYear : years[0]);
}

function renderMonthlyChart(values: number[]): void {
  if (!monthlyChart || !peakMonthValue) {
    return;
  }

  monthlyChart.innerHTML = "";

  const maxValue = Math.max(...values);
  const peakIndex = values.findIndex((value) => value === maxValue);

  const highContrast = isHighContrastMode();

  values.forEach((value, index) => {
    const barWrap = document.createElement("div");
    barWrap.className = "month-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "month-bar";
    if (index === peakIndex) {
      bar.classList.add("peak");
    }
    const targetHeight = Math.max((value / maxValue) * 100, 8);
    bar.style.height = "8%";
    bar.setAttribute("aria-label", `${monthNames[index]} ${value} trips`);

    const month = document.createElement("span");
    month.className = "month-label";
    month.textContent = monthNames[index];

    barWrap.appendChild(bar);
    barWrap.appendChild(month);
    monthlyChart.appendChild(barWrap);

    if (highContrast) {
      bar.style.height = `${targetHeight}%`;
      bar.style.transform = "none";
      bar.style.opacity = "1";
    } else {
      bar.style.height = `${targetHeight}%`;
      bar.style.transform = "translateX(-16px) scaleY(0.04)";
      bar.style.opacity = "0";

      const delay = 180 + index * 125;
      window.setTimeout(() => {
        bar.animate(
          [
            { transform: "translateX(-16px) scaleY(0.04)", opacity: 0, offset: 0 },
            { transform: "translateX(3px) scaleY(1.08)", opacity: 1, offset: 0.78 },
            { transform: "translateX(0) scaleY(0.95)", opacity: 1, offset: 0.9 },
            { transform: "translateX(0) scaleY(1)", opacity: 1, offset: 1 },
          ],
          {
            duration: 980,
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            fill: "forwards",
          }
        );
      }, delay);
    }
  });

  peakMonthValue.textContent = `Peak month: ${monthNames[peakIndex]}`;
}

function renderSummary(data: YearSummaryData): void {
  if (totalTripsValue) {
    totalTripsValue.textContent = `${data.totalTrips} trips`;
  }
  if (co2Value) {
    co2Value.textContent = `You saved ${data.co2Kg} kg of CO2`;
  }
  treesValue!.textContent = `That is like planting ${data.treesEquivalent} trees`;
  favoriteRouteValue!.textContent = data.favoriteRoute;
  usedStopValue!.textContent = data.mostUsedStop;
  if (longestTripValue) {
    longestTripValue.textContent = `${data.longestTripKm.toFixed(1)} km`;
  }
  if (streakValue) {
    streakValue.textContent = `${data.streakDays} days`;
  }

  const visibleCards = document.querySelectorAll<HTMLElement>(".summary-card.in-view");
  visibleCards.forEach((card) => {
    triggerCardSpecificAnimations(card, false);
  });

  if (isHighContrastMode()) {
    renderMonthlyChart(data.monthlyTrips);
    animateCo2Bar(data.co2Kg);
  }
}

function restartCardEffect(card: HTMLElement, className: string): void {
  card.classList.remove(className);
  void card.offsetWidth;
  card.classList.add(className);
}

function renderStreakFire(days: number): void {
  if (!streakFireContainer) {
    return;
  }

  streakFireContainer.innerHTML = "";
  const fireCount = Math.min(Math.max(days, 1), 24);

  for (let i = 0; i < fireCount; i += 1) {
    const fire = document.createElement("span");
    fire.className = "fire-emoji";
    fire.textContent = "🔥";
    fire.style.animationDelay = `${60 + i * 35}ms, ${480 + i * 40}ms`;
    streakFireContainer.appendChild(fire);
  }
}

function emitPinThwumpParticles(): void {
  if (!pinThwumpContainer) {
    return;
  }

  pinThwumpContainer.innerHTML = "";

  const particleCount = 10;
  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement("span");
    particle.className = "pin-thwump-particle";

    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 40 + Math.random() * 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty("--tx", `${tx}px`);
    particle.style.setProperty("--ty", `${ty}px`);
    particle.style.left = "50%";
    particle.style.top = "50%";
    particle.style.width = "8px";
    particle.style.height = "8px";
    particle.style.background = `hsl(${320 + Math.random() * 30}, 85%, 60%)`;
    particle.style.animation = "thwumpParticleBurst 520ms ease-out both";
    particle.style.animationDelay = `${Math.random() * 40}ms`;

    pinThwumpContainer.appendChild(particle);
  }

  window.setTimeout(() => {
    if (pinThwumpContainer) {
      pinThwumpContainer.innerHTML = "";
    }
  }, 600);
}

function triggerCardSpecificAnimations(card: HTMLElement, playSound = true): void {
  const data = getSelectedSummaryData();

  if (card.classList.contains("summary-total-trips")) {
    animateMetric(totalTripsValue, data.totalTrips, (value) => `${Math.round(value)} trips`, 1250);
  }

  if (card.classList.contains("summary-co2")) {
    animateMetric(co2Value, data.co2Kg, (value) => `You saved ${Math.round(value)} kg of CO2`, 1200);
    animateCo2Bar(data.co2Kg);
    if (playSound) {
      playWrappedSound("co2");
    }
    return;
  }

  if (card.classList.contains("summary-favorite-route")) {
    restartCardEffect(card, "animate-routes");
  }

  if (card.classList.contains("summary-used-stop")) {
    restartCardEffect(card, "animate-pin");
    window.setTimeout(() => {
      emitPinThwumpParticles();
    }, 820);
  }

  if (card.classList.contains("summary-activity")) {
    renderMonthlyChart(data.monthlyTrips);
    if (playSound) {
      playWrappedSound("activity");
    }
    return;
  }

  if (card.classList.contains("summary-longest")) {
    const data = getSelectedSummaryData();
    animateMetric(longestTripValue, data.longestTripKm, (value) => `${value.toFixed(1)} km`, 1300);
    
    const busIcon = card.querySelector<HTMLElement>("#tripBusIcon");
    if (busIcon && !isHighContrastMode()) {
      const progress = Math.min(Math.max(data.longestTripKm / 20, 0), 1);
      const startLeft = -8;
      const endLeft = 72;
      const busLeft = startLeft + (endLeft - startLeft) * progress;

      busIcon.style.setProperty("--bus-start-left", `${startLeft}%`);
      busIcon.style.setProperty("--bus-end-left", `${busLeft}%`);
      busIcon.style.left = `${startLeft}%`;
      restartCardEffect(card, "animate-bus");
    } else if (busIcon) {
      const progress = Math.min(Math.max(data.longestTripKm / 20, 0), 1);
      const startLeft = -8;
      const endLeft = 72;
      const busLeft = startLeft + (endLeft - startLeft) * progress;
      busIcon.style.setProperty("--bus-start-left", `${startLeft}%`);
      busIcon.style.setProperty("--bus-end-left", `${busLeft}%`);
      busIcon.style.left = `${busLeft}%`;
    }
  }

  if (card.classList.contains("summary-streak")) {
    animateMetric(streakValue, data.streakDays, (value) => `${Math.round(value)} days`, 1250);
    renderStreakFire(data.streakDays);
    restartCardEffect(card, "animate-fire");
  }

  if (playSound) {
    playWrappedSound("card");
  }
}

function attachYearFilterEvents(): void {
  yearSelect?.addEventListener("change", () => {
    const year = Number(yearSelect.value);
    const data = summaryDataByYear[year];
    if (!data) {
      return;
    }
    renderSummary(data);
    playWrappedSound("year");
  });
}

function attachMotionObservers(): void {
  const cards = document.querySelectorAll<HTMLElement>(".summary-card");

  cards.forEach((card, index) => {
    card.classList.remove("in-view");
    card.style.setProperty("--summary-delay", `${index * 90}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          if (target.classList.contains("in-view")) {
            return;
          }

          window.requestAnimationFrame(() => {
            target.classList.add("in-view");
            triggerCardSpecificAnimations(target);
          });
        }
      });
    },
    {
      root: null,
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  cards.forEach((card) => {
    observer.observe(card);
  });
}

function attachContrastToggle(): void {
  contrastButton?.addEventListener("click", () => {
    document.body.classList.toggle("summary-high-contrast");

    const year = Number(yearSelect?.value ?? new Date().getFullYear());
    const data = summaryDataByYear[year] ?? Object.values(summaryDataByYear)[0];
    renderSummary(data);
  });
}

function attachSocialShareEvents(): void {
  const socialButtons = document.querySelectorAll<HTMLAnchorElement>(".social-btn");
  
  socialButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      
      const selectedYear = Number(yearSelect?.value ?? new Date().getFullYear());
      const data = summaryDataByYear[selectedYear];
      if (!data) {
        return;
      }

      const shareText = `My Jouko Wrapped ${selectedYear}: ${data.totalTrips} trips, ${data.co2Kg} kg CO2 saved, favorite route ${data.favoriteRoute}.`;
      const encodedText = encodeURIComponent(shareText);
      const baseUrl = window.location.origin + window.location.pathname;

      let url = "";
      if (btn.classList.contains("social-whatsapp")) {
        url = `https://wa.me/?text=${encodedText}`;
      } else if (btn.classList.contains("social-messenger")) {
        url = `https://m.me/?link=${encodeURIComponent(baseUrl)}`;
      } else if (btn.classList.contains("social-facebook")) {
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`;
      } else if (btn.classList.contains("social-instagram")) {
        url = `https://www.instagram.com/`;
      }

      if (url) {
        window.open(url, "_blank", "width=600,height=400");
        playWrappedSound("share");
      }
    });
  });
}

function attachShareEvent(): void {
  shareSummaryButton?.addEventListener("click", async () => {
    const selectedYear = Number(yearSelect?.value ?? new Date().getFullYear());
    const data = summaryDataByYear[selectedYear];
    if (!data) {
      return;
    }

    const shareText = `My Jouko Wrapped ${selectedYear}: ${data.totalTrips} trips, ${data.co2Kg} kg CO2 saved, favorite route ${data.favoriteRoute}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Jouko Wrapped ${selectedYear}`,
          text: shareText,
        });
        playWrappedSound("share");
        return;
      } catch {
        // User may cancel share sheet.
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText);
      shareSummaryButton.textContent = "Copied!";
      playWrappedSound("share");
      window.setTimeout(() => {
        shareSummaryButton.textContent = "Share summary";
      }, 1500);
    }
  });
}

function init(): void {
  document.body.classList.add("summary-animations-ready");
  attachMenuEvents();
  populateYearSelect();
  attachYearFilterEvents();
  attachMotionObservers();
  attachContrastToggle();
  attachSoundToggle();
  attachShareEvent();
  attachSocialShareEvents();

  const initialYear = Number(yearSelect?.value ?? new Date().getFullYear());
  const initialData = summaryDataByYear[initialYear] ?? Object.values(summaryDataByYear)[0];
  renderSummary(initialData);
}

init();

export {};
