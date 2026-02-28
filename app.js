(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────
  const MAX_GUESSES = 6;
  const WORD_LENGTH = 5;

  const KEYBOARDS = {
    en: [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['Enter','z','x','c','v','b','n','m','⌫']
    ],
    de: [
      ['q','w','e','r','t','z','u','i','o','p','ü'],
      ['a','s','d','f','g','h','j','k','l','ö','ä'],
      ['Enter','y','x','c','v','b','n','m','⌫']
    ]
  };

  const I18N = {
    en: {
      title: 'Wordle',
      notEnough: 'Not enough letters',
      notInList: 'Not in word list',
      win: ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'],
      lose: 'The word was',
      stats: 'Statistics',
      played: 'Played',
      winPct: 'Win %',
      streak: 'Streak',
      maxStreak: 'Max',
      guessDist: 'Guess Distribution',
      newGame: 'New Game',
      langBtn: 'EN',
      giveUp: 'Give up',
      hint: 'Hint',
      hintMsg: 'Position {pos}: {letter}',
      noHints: 'No more hints'
    },
    de: {
      title: 'Wordle',
      notEnough: 'Zu wenig Buchstaben',
      notInList: 'Wort nicht in der Liste',
      win: ['Genial!', 'Großartig!', 'Beeindruckend!', 'Klasse!', 'Gut!', 'Puh!'],
      lose: 'Das Wort war',
      stats: 'Statistik',
      played: 'Gespielt',
      winPct: 'Gewinn %',
      streak: 'Serie',
      maxStreak: 'Max',
      guessDist: 'Verteilung',
      newGame: 'Neues Spiel',
      langBtn: 'DE',
      giveUp: 'Aufgeben',
      hint: 'Hinweis',
      hintMsg: 'Position {pos}: {letter}',
      noHints: 'Keine weiteren Hinweise'
    }
  };

  // ── State ──────────────────────────────────────────────────────
  let lang = localStorage.getItem('wordle-lang') || 'en';
  let board = [];        // array of guessed words
  let currentGuess = ''; // letters typed so far
  let targetWord = '';
  let gameOver = false;
  let keyStates = {};    // letter -> 'correct' | 'present' | 'absent'
  let revealInProgress = false;
  let revealedHints = new Set(); // positions already revealed as hints

  // ── DOM refs ───────────────────────────────────────────────────
  const boardEl = document.getElementById('board');
  const kbEl = document.getElementById('keyboard');
  const msgBar = document.getElementById('message-bar');
  const statsModal = document.getElementById('stats-modal');
  const btnStats = document.getElementById('btn-stats');
  const btnLang = document.getElementById('btn-lang');
  const langLabel = document.getElementById('lang-label');
  const btnNewGame = document.getElementById('btn-new-game');
  const btnGiveUp = document.getElementById('btn-give-up');
  const btnHint = document.getElementById('btn-hint');

  // ── Word helpers ───────────────────────────────────────────────
  function getWordList() {
    return lang === 'de' ? WORDS_DE : WORDS_EN;
  }

  function getAllWords() {
    const wl = getWordList();
    return new Set([...wl.answers, ...wl.valid].map(w => w.trim().toLowerCase()));
  }

  function pickWord() {
    const answers = getWordList().answers.map(w => w.trim().toLowerCase()).filter(w => w.length === WORD_LENGTH);
    return answers[Math.floor(Math.random() * answers.length)];
  }

  function isValidWord(word) {
    return getAllWords().has(word.toLowerCase());
  }

  // ── Stats ──────────────────────────────────────────────────────
  function getStats() {
    const key = `wordle-stats-${lang}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return { played: 0, won: 0, streak: 0, maxStreak: 0, dist: {1:0,2:0,3:0,4:0,5:0,6:0} };
  }

  function saveStats(stats) {
    localStorage.setItem(`wordle-stats-${lang}`, JSON.stringify(stats));
  }

  function recordWin(guessCount) {
    const stats = getStats();
    stats.played++;
    stats.won++;
    stats.streak++;
    if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
    stats.dist[guessCount]++;
    saveStats(stats);
  }

  function recordLoss() {
    const stats = getStats();
    stats.played++;
    stats.streak = 0;
    saveStats(stats);
  }

  function renderStats(highlightRow) {
    const stats = getStats();
    const t = I18N[lang];

    document.getElementById('stats-title').textContent = t.stats;
    document.getElementById('stat-played').textContent = stats.played;
    document.getElementById('stat-win-pct').textContent = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
    document.getElementById('stat-streak').textContent = stats.streak;
    document.getElementById('stat-max-streak').textContent = stats.maxStreak;
    document.getElementById('guess-dist-title').textContent = t.guessDist;

    // Labels
    document.querySelector('#stats-summary .stat-box:nth-child(1) label').textContent = t.played;
    document.querySelector('#stats-summary .stat-box:nth-child(2) label').textContent = t.winPct;
    document.querySelector('#stats-summary .stat-box:nth-child(3) label').textContent = t.streak;
    document.querySelector('#stats-summary .stat-box:nth-child(4) label').textContent = t.maxStreak;

    const distEl = document.getElementById('guess-distribution');
    distEl.innerHTML = '';
    const maxVal = Math.max(1, ...Object.values(stats.dist));

    for (let i = 1; i <= MAX_GUESSES; i++) {
      const count = stats.dist[i] || 0;
      const pct = Math.max(8, (count / maxVal) * 100);
      const row = document.createElement('div');
      row.className = 'dist-row';
      row.innerHTML = `<span class="num">${i}</span><div class="bar${highlightRow === i ? ' highlight' : ''}" style="width:${pct}%">${count}</div>`;
      distEl.appendChild(row);
    }

    btnNewGame.textContent = t.newGame;
  }

  // ── Board rendering ────────────────────────────────────────────
  function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.row = r;
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.col = c;
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function updateTiles() {
    // Render committed rows
    for (let r = 0; r < board.length; r++) {
      const row = boardEl.children[r];
      const word = board[r];
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = row.children[c];
        tile.textContent = word[c];
      }
    }
    // Render current guess
    const currentRow = board.length;
    if (currentRow < MAX_GUESSES) {
      const row = boardEl.children[currentRow];
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = row.children[c];
        tile.textContent = currentGuess[c] || '';
        if (currentGuess[c]) {
          tile.classList.add('filled');
        } else {
          tile.classList.remove('filled');
        }
      }
    }
  }

  // ── Evaluate guess ─────────────────────────────────────────────
  function evaluate(guess, target) {
    const result = Array(WORD_LENGTH).fill('absent');
    const targetArr = target.split('');
    const guessArr = guess.split('');

    // First pass: correct positions
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        targetArr[i] = null;
        guessArr[i] = null;
      }
    }
    // Second pass: present but wrong position
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] === null) continue;
      const idx = targetArr.indexOf(guessArr[i]);
      if (idx !== -1) {
        result[i] = 'present';
        targetArr[idx] = null;
      }
    }
    return result;
  }

  // ── Reveal animation ──────────────────────────────────────────
  function revealRow(rowIdx, result, callback) {
    revealInProgress = true;
    const row = boardEl.children[rowIdx];
    const word = board[rowIdx];

    result.forEach((state, i) => {
      const tile = row.children[i];
      setTimeout(() => {
        tile.classList.add('reveal');
        // Apply color at midpoint of flip
        setTimeout(() => {
          tile.classList.add(state);
          tile.textContent = word[i];
        }, 250);

        if (i === WORD_LENGTH - 1) {
          setTimeout(() => {
            revealInProgress = false;
            updateKeyboard(word, result);
            if (callback) callback();
          }, 300);
        }
      }, i * 300);
    });
  }

  function bounceRow(rowIdx) {
    const row = boardEl.children[rowIdx];
    for (let i = 0; i < WORD_LENGTH; i++) {
      const tile = row.children[i];
      setTimeout(() => tile.classList.add('bounce'), i * 80);
      setTimeout(() => tile.classList.remove('bounce'), i * 80 + 600);
    }
  }

  // ── Keyboard ───────────────────────────────────────────────────
  function createKeyboard() {
    kbEl.innerHTML = '';
    const layout = KEYBOARDS[lang];
    layout.forEach(rowKeys => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      rowKeys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.dataset.key = key;
        btn.textContent = key;
        if (key === 'Enter' || key === '⌫') btn.classList.add('wide');
        btn.addEventListener('click', () => handleKey(key));
        rowEl.appendChild(btn);
      });
      kbEl.appendChild(rowEl);
    });
    // Re-apply key states
    Object.entries(keyStates).forEach(([letter, state]) => {
      const btn = kbEl.querySelector(`[data-key="${letter}"]`);
      if (btn) btn.classList.add(state);
    });
  }

  function updateKeyboard(word, result) {
    const priority = { correct: 3, present: 2, absent: 1 };
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = word[i];
      const state = result[i];
      const current = keyStates[letter];
      if (!current || priority[state] > priority[current]) {
        keyStates[letter] = state;
        const btn = kbEl.querySelector(`[data-key="${letter}"]`);
        if (btn) {
          btn.classList.remove('correct', 'present', 'absent');
          btn.classList.add(state);
        }
      }
    }
  }

  // ── Messages ───────────────────────────────────────────────────
  let msgTimeout;
  function showMessage(text, duration) {
    clearTimeout(msgTimeout);
    msgBar.innerHTML = `<span class="msg">${text}</span>`;
    msgBar.classList.add('show');
    if (duration) {
      msgTimeout = setTimeout(() => {
        msgBar.innerHTML = '';
        msgBar.classList.remove('show');
      }, duration);
    }
  }

  // ── Input handling ─────────────────────────────────────────────
  function handleKey(key) {
    if (gameOver || revealInProgress) return;

    if (key === '⌫' || key === 'Backspace') {
      currentGuess = currentGuess.slice(0, -1);
      updateTiles();
      return;
    }

    if (key === 'Enter') {
      submitGuess();
      return;
    }

    if (/^[a-zA-ZäöüÄÖÜß]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      currentGuess += key.toLowerCase();
      updateTiles();
    }
  }

  function submitGuess() {
    const t = I18N[lang];

    if (currentGuess.length < WORD_LENGTH) {
      shakeCurrentRow();
      showMessage(t.notEnough, 1500);
      return;
    }

    if (!isValidWord(currentGuess)) {
      shakeCurrentRow();
      showMessage(t.notInList, 1500);
      return;
    }

    const guess = currentGuess;
    board.push(guess);
    currentGuess = '';

    const result = evaluate(guess, targetWord);
    const rowIdx = board.length - 1;

    revealRow(rowIdx, result, () => {
      if (guess === targetWord) {
        gameOver = true;
        btnGiveUp.classList.add('disabled');
        btnHint.classList.add('disabled');
        bounceRow(rowIdx);
        showMessage(t.win[rowIdx], 2000);
        recordWin(rowIdx + 1);
        setTimeout(() => {
          renderStats(rowIdx + 1);
          statsModal.classList.remove('hidden');
        }, 2500);
      } else if (board.length >= MAX_GUESSES) {
        gameOver = true;
        btnGiveUp.classList.add('disabled');
        btnHint.classList.add('disabled');
        showMessage(`${t.lose}: ${targetWord.toUpperCase()}`, 4000);
        recordLoss();
        setTimeout(() => {
          renderStats(null);
          statsModal.classList.remove('hidden');
        }, 4500);
      }
    });
  }

  function shakeCurrentRow() {
    const row = boardEl.children[board.length];
    if (!row) return;
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 400);
  }

  // ── Give up ──────────────────────────────────────────────────
  function giveUp() {
    if (gameOver || revealInProgress) return;
    const t = I18N[lang];
    gameOver = true;
    showMessage(`${t.lose}: ${targetWord.toUpperCase()}`, 4000);
    recordLoss();
    btnGiveUp.classList.add('disabled');
    btnHint.classList.add('disabled');
    setTimeout(() => {
      renderStats(null);
      statsModal.classList.remove('hidden');
    }, 4500);
  }

  // ── Hint ────────────────────────────────────────────────────
  function revealHint() {
    if (gameOver || revealInProgress) return;
    const t = I18N[lang];

    // Collect positions already guessed correctly
    const correctPositions = new Set();
    for (const guess of board) {
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === targetWord[i]) correctPositions.add(i);
      }
    }

    // Find unrevealed positions
    const available = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (!correctPositions.has(i) && !revealedHints.has(i)) {
        available.push(i);
      }
    }

    if (available.length === 0) {
      showMessage(t.noHints, 1500);
      return;
    }

    const pos = available[Math.floor(Math.random() * available.length)];
    revealedHints.add(pos);
    showMessage(t.hintMsg.replace('{pos}', pos + 1).replace('{letter}', targetWord[pos].toUpperCase()), 3000);
  }

  // ── Physical keyboard ─────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (statsModal.classList.contains('hidden') === false) {
      if (e.key === 'Escape') statsModal.classList.add('hidden');
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    handleKey(e.key);
  });

  // ── UI events ──────────────────────────────────────────────────
  btnStats.addEventListener('click', () => {
    renderStats(null);
    statsModal.classList.remove('hidden');
  });

  statsModal.querySelector('.modal-close').addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) statsModal.classList.add('hidden');
  });

  btnNewGame.addEventListener('click', () => {
    statsModal.classList.add('hidden');
    startNewGame();
  });

  btnGiveUp.addEventListener('click', giveUp);
  btnHint.addEventListener('click', revealHint);

  btnLang.addEventListener('click', () => {
    lang = lang === 'en' ? 'de' : 'en';
    localStorage.setItem('wordle-lang', lang);
    startNewGame();
  });

  // ── Game lifecycle ─────────────────────────────────────────────
  function startNewGame() {
    board = [];
    currentGuess = '';
    gameOver = false;
    keyStates = {};
    revealInProgress = false;
    revealedHints = new Set();
    msgBar.innerHTML = '';
    msgBar.classList.remove('show');
    targetWord = pickWord();
    const t = I18N[lang];
    langLabel.textContent = t.langBtn;
    btnGiveUp.textContent = t.giveUp;
    btnGiveUp.classList.remove('disabled');
    btnHint.textContent = t.hint;
    btnHint.classList.remove('disabled');
    createBoard();
    createKeyboard();
  }

  // ── Service Worker registration ────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ── Init ───────────────────────────────────────────────────────
  startNewGame();
})();
