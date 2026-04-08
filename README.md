# Jouko Transit Concept Prototype (TypeScript)

A mobile-first, interactive UI concept for a transit app inspired by Jouko.

## Features

- Interactive Lappeenranta bus map with stop details
- Real-time-like bus search list with upcoming departures
- Bus locator simulation and route display
- Accessibility indicators and high-contrast mode
- Map demo notification interaction
- Jouko chatbot page
- Hamburger menu navigation
- Jouko pink visual theme (`#d4007a`)

## Run with Live Server

1. Install dependencies:

```bash
npm install
```

2. Build TypeScript:

```bash
npm run build
```

3. Start automatic compile while editing (optional but recommended):

```bash
npm run watch
```

4. Open `map.html` with VS Code Live Server.

## App pages

- `index.html` redirects directly to `map.html`.
- Open the chatbot from the map hamburger menu, or open `chatbot.html` directly.

Live Server serves static files, so the browser uses compiled files from `dist/` (notably `dist/map.js` and `dist/chatbot.js`).
