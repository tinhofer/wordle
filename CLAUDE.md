# Wordle

A Wordle clone built as a Progressive Web App (PWA) with vanilla JavaScript. No frameworks, no build step, no dependencies.

## Project Structure

- `index.html` — Main HTML (game layout, stats modal)
- `app.js` — All game logic (state, input, evaluation, animations, stats)
- `style.css` — Styling and animations (CSS custom properties for theming)
- `words-en.js` — English word lists (`WORDS_EN.answers` / `WORDS_EN.valid`)
- `words-de.js` — German word lists (`WORDS_DE.answers` / `WORDS_DE.valid`)
- `sw.js` — Service Worker for offline caching
- `manifest.json` — PWA manifest

## Architecture

Single IIFE in `app.js`. All state is module-scoped variables. No modules, no imports.

### Key state variables
- `board` — array of submitted guesses
- `currentGuess` — string being typed
- `targetWord` — the word to guess
- `keyStates` — tracks keyboard color state per letter
- `revealedHints` — Set of positions already shown as hints

### Game flow
`startNewGame()` → user types → `handleKey()` → `submitGuess()` → `evaluate()` → `revealRow()` animation → win/loss check

### I18N
All user-facing strings are in the `I18N` object (keys: `en`, `de`). Add new strings to both languages.

## Features

- 6 guesses to find a 5-letter word
- Bilingual: English (EN) and German (DE) with umlaut support
- Dark navy blue theme (`--color-bg: #0f1b2d`)
- Flip/bounce/shake animations
- **Give up** button — ends game early, reveals word, counts as loss
- **Hint** button — reveals one unrevealed letter position per click
- Statistics with streak tracking (localStorage)
- Offline-capable PWA

## Conventions

- Pure vanilla JS — no frameworks, no build tools
- CSS custom properties for all colors (`:root` in `style.css`)
- DOM elements referenced once at top of `app.js`
- Commit messages: `Add:`, `Fix:`, `Update:`, `Remove:`, `Docs:` prefixes
