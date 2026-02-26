# Wordle

A Wordle clone as a Progressive Web App — playable in English and German, with full umlaut support.

**Play it:** [tinhofer.github.io/wordle](https://tinhofer.github.io/wordle/)

## Features

- Classic Wordle gameplay — guess the 5-letter word in 6 tries
- Color-coded feedback: green (correct), yellow (wrong position), gray (not in word)
- English and German word lists with language toggle
- German keyboard with ä, ö, ü keys
- Statistics with win/loss tracking and streak counter
- Offline-capable via Service Worker
- Installable on your phone's homescreen (PWA)
- Mobile-first dark theme with flip and bounce animations

## Install on your phone

1. Open [tinhofer.github.io/wordle](https://tinhofer.github.io/wordle/) in Chrome
2. Tap the menu (⋮) → **"Add to Home screen"**
3. Play offline, anytime

## Run locally

```bash
cd src/wordle
python3 -m http.server 8080
```

Then open [localhost:8080](http://localhost:8080).

## Tech stack

Pure vanilla JS — no frameworks, no build step, no dependencies. Just static HTML, CSS, and JavaScript.

## Files

| File | Description |
|------|-------------|
| `index.html` | Main HTML with board, keyboard, and stats modal |
| `style.css` | Mobile-first dark theme |
| `app.js` | Game logic, statistics, i18n (EN/DE) |
| `words-en.js` | English 5-letter word list |
| `words-de.js` | German 5-letter word list (with umlauts) |
| `sw.js` | Service Worker for offline caching |
| `manifest.json` | PWA manifest |
