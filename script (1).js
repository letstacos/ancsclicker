const iframe = document.getElementById('streetview');
const reloadBtn = document.getElementById('reload');

/* --- Simple password gate: blocks the game until correct password entered (TEACHERPROOF) --- */
const AUTH_KEY = 'TEACHERPROOF';
const COMBO = [1, 7, 2];
const authOverlay = document.getElementById('auth-overlay');
const authInput = document.getElementById('auth-input');
const authSubmit = document.getElementById('auth-submit');
const authHint = document.getElementById('auth-hint');
const authPasswordStep = document.getElementById('auth-password-step');
const authKeypadStep = document.getElementById('auth-keypad-step');
const keypadGrid = document.getElementById('keypad-grid');
const keypadHint = document.getElementById('keypad-hint');

let comboIdx = 0;

function unlockIfPassword(value) {
  if (String(value) === AUTH_KEY) {
    // password accepted -> animate the text box out, then reveal the touchpad
    if (authPasswordStep) authPasswordStep.classList.add('auth-leave');
    setTimeout(() => {
      if (authPasswordStep) authPasswordStep.style.display = 'none';
      if (authKeypadStep) { authKeypadStep.style.display = 'block'; void authKeypadStep.offsetWidth; authKeypadStep.classList.add('auth-visible'); }
      comboIdx = 0;
      buildKeypad();
    }, 320);
    return true;
  } else {
    if (authHint) {
      authHint.style.display = 'block';
      setTimeout(()=>{ if (authHint) authHint.style.display = 'none'; }, 2200);
    }
    return false;
  }
}

function buildKeypad() {
  if (!keypadGrid) return;
  keypadGrid.innerHTML = '';
  for (let i = 1; i <= 9; i++) {
    const cell = document.createElement('div');
    cell.textContent = i;
    cell.className = 'key-cell glitch-txt';
    cell.style.cssText = "display:flex;align-items:center;justify-content:center;font-family:'Times New Roman',Times,serif;font-size:min(12vw,72px);color:#fff;border:1px solid #333;cursor:pointer;user-select:none;background:#000;";
    cell.style.animationDelay = (i * 45) + 'ms';
    cell.addEventListener('mouseenter', () => { cell.style.background = '#222'; });
    cell.addEventListener('mouseleave', () => { cell.style.background = '#000'; });
    cell.addEventListener('click', () => pressKey(i));
    keypadGrid.appendChild(cell);
  }
}

function pressKey(n) {
  if (n === COMBO[comboIdx]) {
    comboIdx++;
    if (comboIdx === COMBO.length) {
      // correct full combo -> animate the keypad out, then unlock
      const cells = keypadGrid ? keypadGrid.querySelectorAll('.key-cell') : [];
      cells.forEach((c, idx) => {
        c.classList.add('game-out');
        c.style.animationDelay = (idx * 40) + 'ms';
      });
      setTimeout(() => {
        try {
          if (authOverlay) { authOverlay.classList.add('auth-fade-out'); }
        } catch (e) {}
        setTimeout(() => {
          try {
            if (authOverlay) { authOverlay.style.display = 'none'; authOverlay.setAttribute('aria-hidden','true'); }
          } catch (e) {}
          ensureBackgroundStarted();
        }, 600);
      }, 520);
      return;
    }
  } else {
    // wrong key -> reset and show a brief hint
    comboIdx = 0;
    if (keypadHint) {
      keypadHint.style.display = 'block';
      setTimeout(()=>{ if (keypadHint) keypadHint.style.display = 'none'; }, 900);
    }
  }
}

if (authSubmit) {
  authSubmit.addEventListener('click', () => {
    const val = authInput ? authInput.value : '';
    unlockIfPassword(val);
  });
}
if (authInput) {
  authInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = authInput.value;
      unlockIfPassword(val);
    }
    // prevent other keyboard shortcuts leaking while locked
    if (authOverlay && authOverlay.getAttribute('aria-hidden') !== 'true') {
      e.stopPropagation && e.stopPropagation();
    }
  });
}

// prevent interactions before unlocking by focusing the input on load
window.addEventListener('load', () => {
  try {
    if (authOverlay && authOverlay.getAttribute('aria-hidden') !== 'true' && authInput) {
      setTimeout(()=> authInput.focus && authInput.focus(), 60);
    }
  } catch(e){}
});

// hacker decode: scramble the heading when the page loads
const authTitleEl = document.getElementById('auth-title');
(function decodeTitle(){
  const target = 'say what?';
  const glyphs = '!<>-_\\/[]{}—=+*^?#01';
  if (!authTitleEl) return;
  let frame = 0;
  const loop = setInterval(() => {
    frame++;
    // each tick partly reveals the target from left to right
    let out = target.slice(0, Math.floor((frame/14)*target.length));
    // pad the rest with random glyphs
    while (out.length < target.length) {
      out += glyphs[Math.floor(Math.random()*glyphs.length)];
    }
    authTitleEl.textContent = out;
    if (frame >= 14) {
      authTitleEl.textContent = target;
      clearInterval(loop);
    }
  }, 50);
})();

/* --- Audio: click sfx for UI interactions + quiet background music playlist --- */
// click sound effect (short pop)
const CLICK_SFX_SRC = '/pop.wav';
const clickSfx = new Audio(CLICK_SFX_SRC);
clickSfx.preload = 'auto';
clickSfx.volume = 1.0;

// background playlist: include all .mp3 assets except the Minecraft click file
const BACKGROUND_TRACKS = [
  '/billy woods & Kenny Segal - Facetime (Instrumental Loop).mp3',
  '/Doomsday (Instrumental) 4.mp3',
  '/Nikes on my feet -  Mac Miller (Original Instrumental) 4.mp3',
  '/RickCaldwell.jpg' // placeholder left intentionally if non-audio; will be filtered out below
].filter(src => typeof src === 'string' && src.toLowerCase().endsWith('.mp3'));

// create background audio element
let bgAudio = null;
let bgIndex = 0;
function createBackgroundAudio() {
  if (!BACKGROUND_TRACKS || BACKGROUND_TRACKS.length === 0) return null;
  bgAudio = new Audio();
  bgAudio.preload = 'auto';
  // slightly louder background music
  bgAudio.volume = 0.18; // quiet but a bit louder
  bgAudio.loop = false;
  bgAudio.src = BACKGROUND_TRACKS[bgIndex];
  bgAudio.addEventListener('ended', () => {
    // advance to next track (wrap)
    bgIndex = (bgIndex + 1) % BACKGROUND_TRACKS.length;
    bgAudio.src = BACKGROUND_TRACKS[bgIndex];
    // slight delay between tracks
    setTimeout(() => { try { bgAudio.play().catch(()=>{}); } catch(e){} }, 120);
  });
  // attempt autoplay once loaded (browsers may block until user gesture)
  bgAudio.addEventListener('canplay', () => {
    try { bgAudio.play().catch(()=>{}); } catch(e){}
  });
  // start it
  try { bgAudio.load(); bgAudio.play().catch(()=>{}); } catch(e){}
  return bgAudio;
}
// initialize background audio on first user gesture to comply with autoplay policies
let bgInitialized = false;
function ensureBackgroundStarted() {
  if (bgInitialized) return;
  bgInitialized = true;
  createBackgroundAudio();
}

// global helper to play click sfx quickly without interrupting other audio
function playClickSfx() {
  try {
    // clone to allow rapid overlapping clicks
    const sfx = clickSfx.cloneNode();
    // slightly louder click sfx for UI
    sfx.volume = 1.0;
    sfx.play().catch(()=>{});
  } catch (e) {}
}

// delegate: play pop on pointerdown for any interactive button-like elements and handle keyboard activations
document.addEventListener('pointerdown', (ev) => {
  try {
    const btn = ev.target.closest && ev.target.closest('button, .buy-btn, .info-btn, .notif, [role="button"], [role="menuitem"]');
    if (btn) {
      playClickSfx();
      // also ensure background music starts after first user gesture
      ensureBackgroundStarted();
    }
  } catch (e) {}
}, { passive: true });

document.addEventListener('keydown', (ev) => {
  try {
    if ((ev.key === 'Enter' || ev.key === ' ') && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
      const focused = document.activeElement;
      if (focused && (focused.tagName === 'BUTTON' || focused.classList.contains('buy-btn') || focused.classList.contains('info-btn') || focused.getAttribute && focused.getAttribute('role') === 'button')) {
        playClickSfx();
        ensureBackgroundStarted();
      }
    }
  } catch(e) {}
});

reloadBtn.addEventListener('click', () => {
  const src = iframe.src;
  iframe.src = '';
  setTimeout(() => iframe.src = src, 50);
});

iframe.setAttribute('tabindex', '-1');

/* --- Settings modal: save/load player name + teachers (persist to localStorage) --- */
const SETTINGS_KEY = 'an_s_settings_v1';
const settingsBtn = document.getElementById('settings-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsSave = document.getElementById('settings-save');
const settingsCancel = document.getElementById('settings-cancel');
const settingsReset = document.getElementById('settings-reset');
const playerNameInput = document.getElementById('player-name');
const teacherInputs = Array.from(document.querySelectorAll('.teacher-input'));

/* load settings from localStorage and populate fields, including radio choices */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (data.playerName) playerNameInput.value = data.playerName;

    const teachers = data.teachers || {};

    // Provide requested default teacher names if nothing saved
    const DEFAULT_TEACHERS = {
      "Math": ["Mr. Heacock","Ms. Clemmons"],
      "Language and Literature": ["Ms. Sims","Ms. Goodwin"],
      "Design": ["Ms. Holstein","Ms. Carter"],
      "Health": ["Coach D","Ms. Hinton"],
      "I&S": ["Mr. Caldwell","Mr. Rios","Ms. Santina"],
      "Spanish": ["Senora T","Dr. Noble"],
      "Science": ["Ms. Jones","Ms. Nelson"],
      "Visual Arts": ["Mr. Bubes"],
      "Performing Arts": ["Mr. Dewey"]
    };

    // populate inputs (use saved value or default)
    teacherInputs.forEach(input => {
      const subject = input.getAttribute('data-subject');
      const idx = parseInt(input.getAttribute('data-index') || '0', 10);
      let val = '';
      if (teachers[subject] && typeof teachers[subject][idx] !== 'undefined') {
        val = teachers[subject][idx];
      } else if (DEFAULT_TEACHERS[subject] && typeof DEFAULT_TEACHERS[subject][idx] !== 'undefined') {
        val = DEFAULT_TEACHERS[subject][idx];
      }
      input.value = val || '';
    });

    // restore radio selections (for two-option subjects using .teacher-radio)
    const radios = Array.from(document.querySelectorAll('.teacher-radio'));
    radios.forEach(r => {
      const subject = r.getAttribute('data-subject');
      const idx = r.getAttribute('data-index');
      if (teachers[subject] && teachers[subject][idx]) {
        r.checked = true;
      }
    });

    // restore arts choice radio (visual vs performing)
    const savedArts = data.chosenArts || 'visual';
    const artsRadios = Array.from(document.querySelectorAll('.arts-radio'));
    artsRadios.forEach(ar => {
      ar.checked = (ar.value === savedArts);
    });
  } catch (err) {
    console.warn('Failed to load settings', err);
  }
}

/* persist settings with validation: require exactly one radio chosen for two-option subjects */
function saveSettings() {
  const out = { playerName: playerNameInput.value || '', teachers: {} };

  // gather all teacher inputs into map first
  teacherInputs.forEach(input => {
    const subject = input.getAttribute('data-subject');
    const idx = parseInt(input.getAttribute('data-index') || '0', 10);
    out.teachers[subject] = out.teachers[subject] || [];
    out.teachers[subject][idx] = input.value || '';
  });

  // Validate: for each subject that has two radio choices, ensure one radio selected and its corresponding input non-empty
  const subjectsWithChoices = Array.from(new Set(Array.from(document.querySelectorAll('.teacher-radio')).map(r => r.getAttribute('data-subject'))));
  for (const subject of subjectsWithChoices) {
    const radios = Array.from(document.querySelectorAll(`.teacher-radio[data-subject="${subject}"]`));
    const chosen = radios.find(r => r.checked);
    if (!chosen) {
      createNotification(`Please choose one teacher for ${subject} before saving.`, 4500);
      return;
    }
    const chosenIdx = parseInt(chosen.value, 10);
    const val = out.teachers[subject] && out.teachers[subject][chosenIdx] ? out.teachers[subject][chosenIdx] : '';
    if (!val || String(val).trim() === '') {
      createNotification(`Please enter the name for the selected ${subject} teacher before saving.`, 4500);
      return;
    }
    // reduce stored subject entry to only the chosen teacher in position 0 for clarity
    out.teachers[subject] = [out.teachers[subject][chosenIdx]];
  }

  // Ensure one of Visual or Performing Arts is selected
  const artsChoiceEl = document.querySelector('input[name="arts-choice"]:checked');
  if (!artsChoiceEl) {
    createNotification('Please choose either Visual Arts or Performing Arts (you cannot be in both).', 4500);
    return;
  }
  out.chosenArts = artsChoiceEl.value; // 'visual' or 'performing'

  // For single-input subjects (Visual/Performing Arts), ensure they have some value (optional)
  const singles = ['Visual Arts','Performing Arts'];
  for (const s of singles) {
    const v = out.teachers[s] && out.teachers[s][0] ? out.teachers[s][0] : '';
    // allow empty but trim whitespace
    out.teachers[s] = [String(v || '').trim()];
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(out));
  createNotification('Settings saved.', 3000);
}

// open/close helpers
function openSettings() {
  if (!settingsOverlay) return;
  settingsOverlay.style.display = 'flex';
  settingsOverlay.setAttribute('aria-hidden', 'false');
  loadSettings();
  // focus first input
  setTimeout(() => playerNameInput && playerNameInput.focus && playerNameInput.focus(), 80);
}
function closeSettings() {
  if (!settingsOverlay) return;
  settingsOverlay.style.display = 'none';
  settingsOverlay.setAttribute('aria-hidden', 'true');
}

// reset to empty defaults
function resetSettings() {
  playerNameInput.value = '';
  teacherInputs.forEach(i => i.value = '');
  saveSettings();
  createNotification('Settings reset.', 3000);
}

// wire up buttons
settingsBtn && settingsBtn.addEventListener('click', openSettings);

/* --- Hidden promo codes & shop credits --- */
const SHOP_CREDITS_KEY = 'an_s_shop_credits_v1';
const USED_CODES_KEY = 'an_s_used_codes_v1';
const LAST_CREDIT_GRANT_KEY = 'an_s_last_credit_grant_v1';
let shopCredits = (function(){ const v = localStorage.getItem(SHOP_CREDITS_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
let usedCodes = (function(){ try { const raw = localStorage.getItem(USED_CODES_KEY); return raw ? JSON.parse(raw) : {}; } catch(e){ return {}; } })();

function persistShopCredits(){ try { localStorage.setItem(SHOP_CREDITS_KEY, String(shopCredits)); } catch(e){} updateShopCreditsDisplay(); }
function persistUsedCodes(){ try { localStorage.setItem(USED_CODES_KEY, JSON.stringify(usedCodes)); } catch(e){} }
function updateShopCreditsDisplay(){
  const el = document.getElementById('shop-credits-count');
  if (el) el.textContent = String(shopCredits || 0);
}
updateShopCreditsDisplay();

// --- Hall Pass shop tab + Hall Pass balance (new) ---
const HALLPASS_KEY = 'an_s_hallpasses_v1';
// hall passes are a separate currency used in the Hall Pass Shop
let hallPasses = (function(){ const v = localStorage.getItem(HALLPASS_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
function persistHallPasses(){ try { localStorage.setItem(HALLPASS_KEY, String(hallPasses)); } catch(e){} updateHallPassDisplay(); }
function updateHallPassDisplay(){
  const el = document.getElementById('hallpass-count');
  if (el) el.textContent = String(hallPasses || 0);
}
updateHallPassDisplay();

// expose a simple grant function (can be called later)
function grantHallPass(amount = 1){
  hallPasses = Math.max(0, hallPasses) + Math.max(0, Math.floor(amount));
  persistHallPasses();
  createNotification(`You received ${amount} hall pass${amount>1?'es':''}!`, 3000);
}

// Tab-switching logic for the shop
const tabMainBtn = document.getElementById('tab-main');
const tabHallBtn = document.getElementById('tab-hallpass');
const panelMain = document.getElementById('shop-panel-main');
const panelHall = document.getElementById('shop-panel-hallpass');

function setActiveShopTab(tab) {
  if (!panelMain || !panelHall || !tabMainBtn || !tabHallBtn) return;
  if (tab === 'hallpass') {
    panelMain.style.display = 'none';
    panelHall.style.display = 'block';
    tabMainBtn.classList.remove('active');
    tabHallBtn.classList.add('active');
  } else {
    panelMain.style.display = 'block';
    panelHall.style.display = 'none';
    tabHallBtn.classList.remove('active');
    tabMainBtn.classList.add('active');
  }
}

// initialize tab state
setActiveShopTab('main');

if (tabMainBtn) tabMainBtn.addEventListener('click', () => setActiveShopTab('main'));
if (tabHallBtn) tabHallBtn.addEventListener('click', () => setActiveShopTab('hallpass'));

// helper to attempt spending hall passes (returns true if successful)
function spendHallPasses(amount){
  // ensure numeric amount
  amount = Math.max(0, Number(Math.floor(amount) || 0));
  // re-read latest value from storage in case another tab/flow updated it
  try {
    const raw = localStorage.getItem(HALLPASS_KEY);
    const parsed = parseInt(raw, 10);
    hallPasses = Number.isFinite(parsed) ? parsed : Number(hallPasses || 0);
  } catch (e) {
    hallPasses = Number(hallPasses || 0);
  }

  if (hallPasses >= amount) {
    hallPasses -= amount;
    persistHallPasses();
    return true;
  }
  createNotification('Not enough Hall Passes.', 2400);
  return false;
}

// grant a shop credit (can be called by code or timer); persists timestamp of grant unless forced
function grantShopCredit({ignoreCooldown=false} = {}){
  // Enforce 45 minutes cooldown for automated grants only (2700000 ms)
  try {
    const last = parseInt(localStorage.getItem(LAST_CREDIT_GRANT_KEY) || '0',10) || 0;
    const now = Date.now();
    if (!ignoreCooldown && (now - last) < 2700000) {
      return false;
    }
    shopCredits = Math.max(0, shopCredits) + 1;
    persistShopCredits();
    if (!ignoreCooldown) localStorage.setItem(LAST_CREDIT_GRANT_KEY, String(now));
    createNotification('You received 1 shop credit!', 3000);
    return true;
  } catch (e) { return false; }
}

// auto-grant a credit every 45 minutes of active time if not recently granted
try {
  // only start the interval if not already awarded very recently
  setInterval(() => { grantShopCredit(); }, 2700000);
} catch (e){}

// helper to check and spend either points or a shop credit depending on toggle
function spendForPurchase(price){
  // if the "use credit" toggle is enabled and we have at least one credit, consume it and succeed
  const toggle = document.getElementById('use-credit-toggle');
  const useCredit = toggle && toggle.checked;
  if (useCredit && shopCredits > 0) {
    shopCredits -= 1;
    persistShopCredits();
    return true;
  }
  // otherwise require points
  const pts = readPoints();
  if (pts < price) return false;
  writePoints(pts - price);
  return true;
}

// wire up secret code entry (hidden/undocumented)
const secretInput = document.getElementById('secret-code-input');
const secretEnter = document.getElementById('secret-code-enter');
if (secretEnter && secretInput) {
  secretEnter.addEventListener('click', () => {
    const code = String(secretInput.value || '').trim();
    if (!code) return;
    const codeLower = code.toLowerCase();

    // ANCSWOLVES26 (case-insensitive match) => multiply current score by 1000, infinite uses
    if (codeLower === 'ancswolves26'.toLowerCase()) {
      const pts = readPoints();
      const next = Math.round(pts * 1000);
      writePoints(next);
      createNotification('Promo applied.', 3000);
      secretInput.value = '';
      return;
    }

    // IMINMAINE (grant 1 shop credit) - one-time code unless user clears storage
    if (codeLower === 'iminmaine'.toLowerCase()) {
      if (usedCodes['iminmaine']) {
        createNotification('Code already used.', 2600);
        secretInput.value = '';
        return;
      }
      usedCodes['iminmaine'] = true;
      persistUsedCodes();
      grantShopCredit({ignoreCooldown:true});
      secretInput.value = '';
      return;
    }

    // ADOPTMYGRADES - one-time code: grants +200 CGP
    if (codeLower === 'adoptmygrades'.toLowerCase()) {
      if (usedCodes['adoptmygrades']) {
        createNotification('Code already used.', 2600);
        secretInput.value = '';
        return;
      }
      usedCodes['adoptmygrades'] = true;
      persistUsedCodes();
      try {
        writeCGP(cgp + 200);
        createNotification('Code applied: +200 CGP', 3000);
      } catch (e) {
        createNotification('Code applied.', 3000);
      }
      secretInput.value = '';
      return;
    }

    // ADOPTMYGRADESHACK - infinite use: grants +500 CGP each use
    if (codeLower === 'adoptmygradeshack'.toLowerCase()) {
      try {
        writeCGP(cgp + 500);
        createNotification('Code applied: +500 CGP', 3000);
      } catch (e) {
        createNotification('Code applied.', 3000);
      }
      secretInput.value = '';
      return;
    }

    // SACKRACE26 - one-time code: grants 2 hall passes
    if (codeLower === 'sackrace26'.toLowerCase()) {
      if (usedCodes['sackrace26']) {
        createNotification('Code already used.', 2600);
        secretInput.value = '';
        return;
      }
      usedCodes['sackrace26'] = true;
      persistUsedCodes();
      grantHallPass(2);
      createNotification('Code applied: +2 Hall Passes', 3000);
      secretInput.value = '';
      return;
    }

    // SACKYHACKY - infinite use: grants 20 hall passes per use
    if (codeLower === 'sackyhacky'.toLowerCase()) {
      try {
        grantHallPass(20);
        createNotification('Code applied: +20 Hall Passes', 3000);
      } catch (e) {
        createNotification('Code applied.', 3000);
      }
      secretInput.value = '';
      return;
    }

    // GIMME GREEN - grants 8 wheel spins (persistent)
    if (codeLower === 'gimme green'.toLowerCase() || codeLower === 'gimmegreen') {
      try {
        const WHEEL_KEY = 'an_s_wheel_spins_v1';
        const raw = localStorage.getItem(WHEEL_KEY);
        const cur = raw ? parseInt(raw, 10) : NaN;
        const current = Number.isFinite(cur) ? cur : 3; // default if not present
        const next = Math.max(0, current) + 8;
        localStorage.setItem(WHEEL_KEY, String(next));
        // update any visible wheel UI immediately if present
        const el = document.getElementById('wheel-spin-count');
        if (el) el.textContent = String(next);
        createNotification('Code applied: +8 Wheel Spins', 3600);
      } catch (e) {
        createNotification('Code applied.', 2600);
      }
      secretInput.value = '';
      return;
    }

    // 5SECONDS - spawn a Golden Hall Pass in 5 seconds
    if (codeLower === '5seconds') {
      try {
        createNotification('Golden Hall Pass incoming in 5 seconds...', 3200);
        // if the golden spawn helper is exposed, use it; otherwise schedule a fallback to attempt to call the internal function later
        setTimeout(() => {
          try {
            if (typeof window.spawnGoldenHallPass === 'function') {
              window.spawnGoldenHallPass();
            } else {
              // best-effort fallback: dispatch a custom event the golden wheel module listens for
              document.dispatchEvent(new CustomEvent('spawnGoldenHallPassNow'));
            }
          } catch (e) { console.warn('spawn golden fallback failed', e); }
        }, 5000);
      } catch (e) {
        createNotification('Code applied.', 2600);
      }
      secretInput.value = '';
      return;
    }

    // for any other code: if not used before, mark used and (optionally) provide effects in future;
    if (usedCodes[codeLower]) {
      createNotification('Code already used or invalid.', 2600);
      secretInput.value = '';
      return;
    }
    // mark unknown code as used to avoid re-entry (hidden codes can be added by dev later)
    usedCodes[codeLower] = true;
    persistUsedCodes();
    createNotification('Code accepted (no visible effect).', 2600);
    secretInput.value = '';
  });
}
settingsCancel && settingsCancel.addEventListener('click', closeSettings);
settingsSave && settingsSave.addEventListener('click', () => { saveSettings(); closeSettings(); });
settingsReset && settingsReset.addEventListener('click', () => { if (confirm('Reset saved name and teachers?')) resetSettings(); });

// close settings with Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsOverlay && settingsOverlay.getAttribute('aria-hidden') === 'false') {
    closeSettings();
  }
});

// expose helper to read settings programmatically later
function getSavedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { playerName: '', teachers: {} };
  } catch (err) { return { playerName: '', teachers: {} }; }
}

const CLICKER_KEY = 'an_s_points_v1';
const clickerBtn = document.getElementById('clicker');
const clickerCountEl = document.getElementById('clicker-count');
const bigScoreEl = document.getElementById('big-score');

const buyClickerBtn = document.getElementById('buy-clicker');
const clickerPriceEl = document.getElementById('clicker-price');
const ownedListEl = document.getElementById('owned-list');
const upgradeContainer = document.getElementById('upgrade-clicker');

const deleteClickersBtn = document.getElementById('delete-clickers');
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmAccept = document.getElementById('confirm-accept');
const confirmCancel = document.getElementById('confirm-cancel');

const PENCIL_SRC = '/yellow-pencil-isolated-sharpened-tip-writing-tool-school-supplies-educational-object-office-stationery-classic-design-creative-simple-transparent-background-png.webp';
const UPGRADE_KEY = 'an_s_auto_clickers_v1';
// compute price deterministically from how many auto-clickers are owned:
// base 50, each owned autoclicker scales price by 1.25x (price = ceil(50 * 1.25^owned))
function computeAutoClickerPrice(){
  const base = 50;
  const owned = Math.max(0, readOwned());
  return Math.max(base, Math.ceil(base * Math.pow(1.25, owned)));
}
// keep a local cached value for display convenience (will be recomputed when needed)
let autoClickerPrice = computeAutoClickerPrice();

// Conveyor speed multiplier: starts at 1 and increases by 1.25x per purchase
let conveyorSpeedMultiplier = 1;

function readPoints(){
  const v = localStorage.getItem(CLICKER_KEY);
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}
function writePoints(n){
  localStorage.setItem(CLICKER_KEY, String(n));
  clickerCountEl.textContent = n;
  if (bigScoreEl) bigScoreEl.textContent = n;
}
function bump(delta = 1){
  const current = readPoints();
  const next = current + delta;
  writePoints(next);

  if (clickerBtn.animate) {
    // preserve the horizontal centering (translateX(-50%)) so the button doesn't shift when animating
    clickerBtn.animate([
      { transform: 'translate(-50%,-50%) scale(1)' },
      { transform: 'translate(-50%,-50%) scale(1.08)' },
      { transform: 'translate(-50%,-50%) scale(1)' }
    ], { duration: 140, easing: 'ease-out' });
  }

  if (bigScoreEl && bigScoreEl.animate) {
    bigScoreEl.animate([
      { transform: 'translateX(-50%) translateY(0) scale(1)' },
      { transform: 'translateX(-50%) translateY(-6px) scale(1.06,1.02)' },
      { transform: 'translateX(-50%) translateY(0) scale(1)' }
    ], { duration: 220, easing: 'cubic-bezier(.2,.9,.3,1)' });
  }

  if (clickerCountEl && clickerCountEl.animate) {
    clickerCountEl.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: 'translate(0,0) scale(1.12)' },
      { transform: 'translate(0,0) scale(1)' }
    ], { duration: 160, easing: 'cubic-bezier(.2,.9,.3,1)' });
  }
}

function readOwned() {
  const v = localStorage.getItem(UPGRADE_KEY);
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}
function writeOwned(n) {
  localStorage.setItem(UPGRADE_KEY, String(n));
  // only update the owned-list display if the element exists to avoid runtime errors
  if (ownedListEl) ownedListEl.textContent = `Owned: ${n}`;
  const ownedClickerEl = document.getElementById('owned-clicker');
  if (ownedClickerEl) ownedClickerEl.textContent = `Owned: ${n}`;
}

function updatePriceDisplay() {
  // always compute from owned count so price remains consistent across reloads
  autoClickerPrice = computeAutoClickerPrice();
  if (clickerPriceEl) clickerPriceEl.textContent = `Cost: ${autoClickerPrice}`;
}

const conveyor = document.getElementById('conveyor');

// Central timer awards points each second equal to number of owned auto-clickers.
let gainIntervalId = null;

function startGainTimer() {
  if (gainIntervalId) return;
  gainIntervalId = setInterval(() => {
    const owned = readOwned();
    if (owned > 0) {
      // apply autoclicker-specific multiplier then pass to bump (bump already applies activeMultiplier)
      const effectiveCount = Math.round(owned * (typeof autoClickerMultiplier !== 'undefined' ? autoClickerMultiplier : 1));
      bump(effectiveCount);
    }
  }, 1000);
}

function stopGainTimer() {
  if (gainIntervalId) {
    clearInterval(gainIntervalId);
    gainIntervalId = null;
  }
}

function spawnPencil(index, total, duration, delay) {
  const item = document.createElement('div');
  item.className = 'conveyor-item';
  const img = document.createElement('img');
  img.src = PENCIL_SRC;
  img.alt = 'Auto clicker pencil';
  item.appendChild(img);

  item.style.animationDuration = (duration / 1000) + 's';
  item.style.animationDelay = (delay / 1000) + 's';

  conveyor.appendChild(item);
  return item;
}

function clearPencilIntervals() {
  if (!conveyor) return;
  const items = [...conveyor.querySelectorAll('.conveyor-item')];
  items.forEach(it => it.remove());
}

// buy logic
if (buyClickerBtn) {
  // compute price from owned count so it's consistent across reloads
  updatePriceDisplay();
  writeOwned(readOwned());
  writePoints(readPoints());
  startGainTimer();

  buyClickerBtn.addEventListener('click', () => {
    // recompute price at moment of purchase
    const price = computeAutoClickerPrice();
    if (!spendForPurchase(price)) return;

    const owned = readOwned() + 1;
    writeOwned(owned);

    // CGP: ChatGPT purchase does NOT lower CGP (explicitly skip)
    adjustCGPOnPurchase(true);

    // Increase conveyor speed multiplier by 1.25x per purchase
    conveyorSpeedMultiplier *= 1.25;

    // recompute/display new price after purchase
    updatePriceDisplay();

    // relayout pencils with new speed
    clearPencilIntervals();
    layoutPencils(owned);
  });

  upgradeContainer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buyClickerBtn.click();
    }
  });

  const ownedNow = readOwned();
  if (ownedNow > 0) {
    // compute multiplier from stored owned count (re-create multiplier deterministically)
    // If page reloads we don't persist multiplier; derive it from owned count: 1.25^(owned-1) if >0
    conveyorSpeedMultiplier = Math.pow(1.25, Math.max(0, ownedNow - 1));
    layoutPencils(ownedNow);
  }

  window.addEventListener('resize', () => {
    const owned = readOwned();
    clearPencilIntervals();
    if (owned > 0) layoutPencils(owned);
  });

  function layoutPencils(total) {
    clearPencilIntervals();
    if (total <= 0) return;

    const conveyorWidth = Math.max(160, conveyor.clientWidth || 600);
    const itemVisualWidth = 64;
    const itemMargin = 18;
    const slotSize = itemVisualWidth + itemMargin;

    const slots = Math.max(1, Math.floor((conveyorWidth + itemMargin) / slotSize));

    // baseDuration (ms) for one full loop at multiplier=1
    const baseDuration = 1000;
    // faster when multiplier >1: effectiveDuration = base / multiplier
    const effectiveDuration = Math.max(80, baseDuration / conveyorSpeedMultiplier);

    const spacingCount = (total <= slots) ? slots : total;

    for (let i = 0; i < total; i++) {
      const delay = -Math.floor(i * (effectiveDuration / spacingCount));
      spawnPencil(i, total, effectiveDuration, delay);
    }
  }
}

// --- Multiplier upgrade: doubles all points earned for 2 minutes per purchase --- //
const MULT_KEY = 'an_s_multiplier_v1';
const buyMultiplierBtn = document.getElementById('buy-multiplier');
const multiplierPriceEl = document.getElementById('multiplier-price');
const ownedMultiplierEl = document.getElementById('owned-multiplier');

let MULTIPLIER_PRICE_KEY = 'an_s_multiplier_price_v1';
let multiplierPrice = (function(){
  const v = localStorage.getItem(MULTIPLIER_PRICE_KEY);
  const n = parseInt(v,10);
  return Number.isFinite(n) && n > 0 ? n : 1000;
})();
let multiplierOwned = (function(){ const v = localStorage.getItem(MULT_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
let activeMultiplier = 1; // current active multiplier factor
const MULT_EFFECT = 1.1; // each purchase multiplies points by 1.1
const MULT_DURATION_MS = 120000; // 2 minutes in ms

// runtime state for visual timer
let multTimerInterval = null;
let multEndTime = 0;

const multBanner = document.getElementById('multiplier-banner');
const multBar = document.getElementById('multiplier-bar');

function writeMultiplierOwned(n){
  multiplierOwned = n;
  localStorage.setItem(MULT_KEY, String(n));
  if (ownedMultiplierEl) ownedMultiplierEl.textContent = `Owned: ${n}`;
}
function updateMultiplierPriceDisplay(){
  if (multiplierPriceEl) multiplierPriceEl.textContent = `Cost: ${multiplierPrice}`;
}

/* Persistent/permanent multiplier and manual click-power upgrades:
   - Research Grant: persistent multiplier stored in localStorage affects all gains.
   - Study Group: increases manual click power (clickPower). */
const PERM_KEY = 'an_s_perm_mult_v1';
const STUDY_KEY = 'an_s_study_v1';

// load persistent multiplier
let permanentMultiplier = (function(){ const v = localStorage.getItem(PERM_KEY); const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 1; })();

// load study group ownership (affects clickPower)
let studyOwned = (function(){ const v = localStorage.getItem(STUDY_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();

// compute total owned across shop items by reading known owned indicators (fall back to localStorage keys)
function computeTotalShopOwned(){
  const ids = [
    'owned-clicker','owned-multiplier','owned-auto-boost','owned-hinton','owned-ed-santos',
    'owned-typhoon','owned-history','owned-study','owned-mark-spammers','owned-showers',
    'owned-factory','owned-detention','owned-mystery','owned-hoodie'
  ];
  let total = 0;
  ids.forEach(id => {
    try {
      const el = document.getElementById(id);
      if (el) {
        const v = parseInt(el.textContent?.replace(/[^\d-]/g,'') || '', 10);
        if (Number.isFinite(v)) total += Math.max(0, v);
        return;
      }
      // fall back to localStorage lookups for some keys if element not present
      const keyMap = {
        'owned-clicker':'an_s_auto_clickers_v1',
        'owned-multiplier':'an_s_multiplier_v1',
        'owned-auto-boost':'an_s_auto_boosts_v1',
        'owned-hinton':'an_s_hinton_v1',
        'owned-ed-santos':'an_s_ed_santos_v1',
        'owned-typhoon':'an_s_typhoon_v1',
        'owned-history':'an_s_history_v1',
        'owned-study':'an_s_study_v1',
        'owned-mark-spammers':'an_s_mark_spammers_v1',
        'owned-showers':'an_s_showers_v1',
        'owned-factory':'an_s_factory_reset_v1',
        'owned-detention':'an_s_detention_v1',
        'owned-mystery':'an_s_mystery_v1',
        'owned-hoodie':'an_s_hoodie_v1'
      };
      const lk = keyMap[id];
      if (lk) {
        const raw = localStorage.getItem(lk);
        const num = parseInt(raw,10);
        if (Number.isFinite(num)) total += Math.max(0, num);
      }
    } catch(e){}
  });
  return total;
}

// base click power is derived from Study ownership (Study still provides +1 base per purchase),
// then every owned shop item multiplies manual click power by 1.1x (stacking multiplicatively).
let clickPower = 1;
function updateClickPower(){
  // base from study: original design gave Study +1 manual click each ownership
  const base = Math.max(1, 1 + (studyOwned || 0));
  const totalOwned = computeTotalShopOwned();
  // apply 1.01x per owned item
  const multiplier = Math.pow(1.01, totalOwned);
  clickPower = Math.max(1, Math.round(base * multiplier));
}

function writeStudyOwned(n){
  studyOwned = n;
  localStorage.setItem(STUDY_KEY, String(n));
  const ownedEl = document.getElementById('owned-study');
  if (ownedEl) ownedEl.textContent = `Owned: ${n}`;
  updateClickPower();
}

// Apply multipliers to bump (manual clicks and other immediate bumps)
const origBump = bump;
bump = function(delta = 1){
  // combine permanent multiplier and temporary active multiplier
  const combined = delta * (permanentMultiplier || 1) * (activeMultiplier || 1);
  const effective = Math.round(combined);
  origBump(effective);
};

// Multiply gains from timer using activeMultiplier in startGainTimer: (modify existing timer behavior)
if (gainIntervalId) {
  // nothing
} else {
  // ensure the timer uses activeMultiplier when it runs (we'll restart to capture changes)
  stopGainTimer();
  startGainTimer();
}

if (buyMultiplierBtn) {
  updateMultiplierPriceDisplay();
  // show owned from stored value
  writeMultiplierOwned(multiplierOwned);

  buyMultiplierBtn.addEventListener('click', () => {
    if (!spendForPurchase(multiplierPrice)) return;
    // persist owned count
    writeMultiplierOwned(multiplierOwned + 1);

    // increase price by 1.75x
    multiplierPrice = Math.ceil(multiplierPrice * 1.75);
    try { localStorage.setItem(MULTIPLIER_PRICE_KEY, String(multiplierPrice)); } catch(e){}
    updateMultiplierPriceDisplay();

    // apply immediate multiplier effect: multiply activeMultiplier and schedule revert after duration
    activeMultiplier *= MULT_EFFECT;

    // buying Principal for the Day restores CGP by +50
    adjustCGPOnPurchase(false, true);

    // visual: set end time, enable banner and golden tint, and update progress bar periodically
    multEndTime = Date.now() + MULT_DURATION_MS;

    // show banner and golden tint
    if (multBanner) {
      multBanner.setAttribute('aria-hidden', 'false');
    }
    document.documentElement.classList.add('multiplier-active');

    // clear existing interval if any
    if (multTimerInterval) {
      clearInterval(multTimerInterval);
      multTimerInterval = null;
    }

    // update progress every 100ms
    multTimerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, multEndTime - now);
      const pct = Math.round((remaining / MULT_DURATION_MS) * 100);
      if (multBar) {
        multBar.style.width = pct + '%';
        multBar.setAttribute('aria-valuenow', pct);
      }
      if (remaining <= 0) {
        // end effect
        clearInterval(multTimerInterval);
        multTimerInterval = null;
        if (multBar) {
          multBar.style.width = '0%';
          multBar.setAttribute('aria-valuenow', 0);
        }
        if (multBanner) multBanner.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('multiplier-active');

        activeMultiplier = activeMultiplier / MULT_EFFECT;
        // guard to avoid floating residue
        if (Math.abs(activeMultiplier - 1) < 0.0001) activeMultiplier = 1;
      }
    }, 100);

    // fallback safety in case the interval somehow fails: ensure multiplier is reverted after duration
    setTimeout(() => {
      // ensure visuals cleaned up (in case interval ended earlier)
      if (multTimerInterval) {
        clearInterval(multTimerInterval);
        multTimerInterval = null;
      }
      if (multBar) {
        multBar.style.width = '0%';
        multBar.setAttribute('aria-valuenow', 0);
      }
      if (multBanner) multBanner.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('multiplier-active');

      activeMultiplier = activeMultiplier / MULT_EFFECT;
      if (Math.abs(activeMultiplier - 1) < 0.0001) activeMultiplier = 1;
    }, MULT_DURATION_MS + 250);
  
    // tease notification on purchase (email-style joke)
    createNotification('From: principal@ancs.edu | Subject: Principal for the Day — Notice\nYou have been officially promoted for 2 minutes. Double points have been politely coerced.', 5000);
  });

  // keyboard accessibility
  document.getElementById('upgrade-multiplier')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buyMultiplierBtn.click();
    }
  });
}

/* New upgrade: autoclicker-specific boost that doubles autoclicker output per purchase.
   Price is based on number of autoclickers * 1000 (minimum 1000) and increases 100x each buy. */
const AUTO_BOOST_KEY = 'an_s_auto_boosts_v1';
const buyAutoBoostBtn = document.getElementById('buy-auto-boost');
const autoBoostPriceEl = document.getElementById('auto-boost-price');
const ownedAutoBoostEl = document.getElementById('owned-auto-boost');

let autoBoostOwned = (function(){ const v = localStorage.getItem(AUTO_BOOST_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
let autoClickerMultiplier = 1; // affects autoclicker output (stacks *2 per purchase)
const AUTOBOOST_FACTOR_KEY = 'an_s_auto_boost_factor_v1';
let autoBoostPriceFactor = (function(){
  const v = localStorage.getItem(AUTOBOOST_FACTOR_KEY);
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
})();

function writeAutoBoostOwned(n){
  autoBoostOwned = n;
  localStorage.setItem(AUTO_BOOST_KEY, String(n));
  if (ownedAutoBoostEl) ownedAutoBoostEl.textContent = `Owned: ${n}`;
  updateClickPower();
}
function computeAutoBoostPrice(){
  // price = max(ownedAutoclickers,1) * 1000, then scaled by factor (100x per buy). minimum 1000.
  const ownedAutoclickers = Math.max(1, readOwned());
  const base = ownedAutoclickers * 1000;
  return Math.max(1000, Math.ceil(base * autoBoostPriceFactor));
}
function updateAutoBoostPriceDisplay(){
  if (autoBoostPriceEl) autoBoostPriceEl.textContent = `Cost: ${computeAutoBoostPrice()}`;
}

if (buyAutoBoostBtn) {
  // initialize UI
  writeAutoBoostOwned(autoBoostOwned);
  updateAutoBoostPriceDisplay();

  // Helper to lock/unlock the auto boost based on owned autoclickers (must be >=15)
  function updateAutoBoostAvailability() {
    const ownedAutoclickers = readOwned();
    const locked = ownedAutoclickers < 15;
    if (locked) {
      buyAutoBoostBtn.disabled = true;
      buyAutoBoostBtn.classList.add('disabled');
      // show a helpful hint instead of price when locked
      if (autoBoostPriceEl) autoBoostPriceEl.textContent = `Locked — needs 15 auto clickers (${ownedAutoclickers}/15)`;
    } else {
      buyAutoBoostBtn.disabled = false;
      buyAutoBoostBtn.classList.remove('disabled');
      updateAutoBoostPriceDisplay();
    }
  }

  // initial availability check
  updateAutoBoostAvailability();

  buyAutoBoostBtn.addEventListener('click', () => {
    // guard in case button somehow clickable
    if (buyAutoBoostBtn.disabled) return;

    const price = computeAutoBoostPrice();
    if (!spendForPurchase(price)) return;

    // CGP decreases by 5 for buying auto-boost
    adjustCGPOnPurchase(false);

    // buy: increase autoclicker multiplier (Sketchy Proxy stronger)
    autoClickerMultiplier *= 2.5;
    // increment ownership and persist
    writeAutoBoostOwned(autoBoostOwned + 1);

    // if owned count is now even (2,4,6,...), trigger a Mr. Boardman alert
    try {
      if (autoBoostOwned > 0 && (autoBoostOwned % 2) === 0) {
        // show the red alert and also notify the player
        showProxyAlert('Mr. Boardman noticed your proxies', 4000);
        createNotification('Alert: Mr. Boardman noticed multiple proxy purchases.', 5000);
      }
    } catch (err) {
      // ignore if helper not ready
    }

    // increase the price factor by 100x (so next price multiplies by 100)
    autoBoostPriceFactor *= 100;
    try { localStorage.setItem(AUTOBOOST_FACTOR_KEY, String(autoBoostPriceFactor)); } catch(e){}
    updateAutoBoostPriceDisplay();
    updateAutoBoostAvailability();

    // tease notification (email-style joke)
    createNotification('Good luck with that proxy bruchacho', 6000);
  });

  // keyboard accessibility
  document.getElementById('upgrade-auto-boost')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buyAutoBoostBtn.click();
    }
  });

  // ensure availability updates whenever autoclicker count changes
  const origWriteOwnedForAvailability = writeOwned;
  writeOwned = function(n){
    origWriteOwnedForAvailability(n);
    updateAutoBoostAvailability();
  };
}

/* Ensure the gain timer uses autoClickerMultiplier when awarding points.
   Also persist and apply permanent multiplier from Research Grants on load. */
if (gainIntervalId) {
  // nothing
} else {
  stopGainTimer();
  startGainTimer();
}

// update price display reactively when autoclicker count changes (so price reflects current number)
const originalWriteOwned = writeOwned;
writeOwned = function(n){
  originalWriteOwned(n);
  // whenever autoclickers change, recompute auto boost price shown
  updateAutoBoostPriceDisplay();
};

if (clickerBtn && clickerCountEl) {
  writePoints(readPoints());

  // persistent main click counter (tracks clicks toward cutscene threshold)
  const MAIN_CLICK_KEY = 'an_s_main_clicks_v1';
  const MAIN_CLICK_THRESHOLD = 1000;
  const mainCounterEl = document.getElementById('main-click-counter');
  // load stored value
  let mainClicks = (function(){ const v = localStorage.getItem(MAIN_CLICK_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
  function persistMainClicks(){
    try { localStorage.setItem(MAIN_CLICK_KEY, String(mainClicks)); } catch(e){}
    if (mainCounterEl) mainCounterEl.textContent = `${mainClicks} / ${MAIN_CLICK_THRESHOLD}`;
  }
  persistMainClicks();

  // helper to run the hall-pass cutscene
  const hallPassImg = document.getElementById('hall-pass-popup');
  const cutsceneOverlay = document.getElementById('cutscene-overlay');
  function runHallPassCutscene() {
    if (!hallPassImg || !cutsceneOverlay) return;
    // show and prepare visuals
    hallPassImg.style.display = 'block';
    hallPassImg.style.opacity = '0';
    hallPassImg.style.transform = 'scale(0.9)';
    hallPassImg.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease';
    // dark overlay (keeps everything darker except hall-pass)
    cutsceneOverlay.style.display = 'block';
    cutsceneOverlay.setAttribute('aria-hidden', 'false');
    cutsceneOverlay.style.opacity = '0';
    cutsceneOverlay.style.transition = 'opacity 260ms ease';
    // apply green tint to background tint var
    const origTint = getComputedStyle(document.documentElement).getPropertyValue('--tint-color') || '';
    document.documentElement.style.setProperty('--tint-color', 'rgba(40,200,80,0.22)');

    // force reflow then animate
    requestAnimationFrame(() => {
      cutsceneOverlay.style.opacity = '1';
      hallPassImg.style.opacity = '1';
      hallPassImg.style.transform = 'scale(1.12)';
      // slightly darken everything except the hall-pass by setting overlay backdrop
      cutsceneOverlay.style.background = 'rgba(0,0,0,0.48)';
      cutsceneOverlay.style.zIndex = '400';
      hallPassImg.style.position = 'fixed';
      hallPassImg.style.left = '50%';
      hallPassImg.style.top = '50%';
      hallPassImg.style.transform = 'translate(-50%,-50%) scale(1.12)';
      hallPassImg.style.width = '340px';
      hallPassImg.style.height = '340px';
      hallPassImg.style.zIndex = '410';
      hallPassImg.style.borderRadius = '12px';
      hallPassImg.style.boxShadow = '0 28px 80px rgba(0,0,0,0.7)';
    });

    // after 4s fade away and restore (also grant Hall Passes so the cutscene yields the expected reward)
    setTimeout(() => {
      hallPassImg.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease';
      hallPassImg.style.opacity = '0';
      hallPassImg.style.transform = 'translate(-50%,-50%) scale(0.94)';
      cutsceneOverlay.style.opacity = '0';

      // grant the player 1 Hall Pass for completing the cutscene and notify
      try { grantHallPass(1); } catch(e){}
      try { createNotification('Cutscene reward: +1 Hall Pass!', 3600); } catch(e){}

      // restore original tint after fade completes
      setTimeout(() => {
        // hide elements
        hallPassImg.style.display = 'none';
        cutsceneOverlay.style.display = 'none';
        cutsceneOverlay.setAttribute('aria-hidden', 'true');
        // restore tint
        try {
          if (origTint && origTint.trim()) document.documentElement.style.setProperty('--tint-color', origTint.trim());
          else document.documentElement.style.removeProperty('--tint-color');
        } catch (e) {}
      }, 460);
    }, 4000);
  }

  // use clickPower for manual clicks (affected by Study Group)
  clickerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    bump(clickPower);

    // increment persistent main click counter and update UI
    try {
      mainClicks = (mainClicks || 0) + 1;
      // when threshold reached, trigger cutscene and reset counter
      if (mainClicks >= MAIN_CLICK_THRESHOLD) {
        mainClicks = 0;
        persistMainClicks();
        // run cutscene
        runHallPassCutscene();
      } else {
        persistMainClicks();
      }
    } catch (err) {
      // ignore storage errors
    }

    // spawn five super-tiny falling avatars on each main click (tiny sizes ~8-18px)
    try {
      for (let i = 0; i < 5; i++) {
        const tinySize = Math.round(8 + Math.random() * 10); // 8..18px
        // alternate front/behind for variety
        const isFront = Math.random() < 0.6; // slightly favor front for visibility
        spawnAvatar(isFront, tinySize);
      }
    } catch (err) {
      // fail silently if spawnAvatar not available
    }
  });

  clickerBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      bump(clickPower);
    }
  });
}

if (deleteClickersBtn && confirmOverlay && confirmAccept && confirmCancel) {
  deleteClickersBtn.addEventListener('click', () => {
    confirmOverlay.style.display = 'flex';
    confirmOverlay.setAttribute('aria-hidden', 'false');
    confirmCancel.focus && confirmCancel.focus();
  });

  confirmCancel.addEventListener('click', () => {
    confirmOverlay.style.display = 'none';
    confirmOverlay.setAttribute('aria-hidden', 'true');
  });

  confirmAccept.addEventListener('click', () => {
    clearPencilIntervals();
    writeOwned(0);
    localStorage.removeItem(UPGRADE_KEY);
    // reset speed multiplier
    conveyorSpeedMultiplier = 1;
    confirmOverlay.style.display = 'none';
    confirmOverlay.setAttribute('aria-hidden', 'true');
  });

  window.addEventListener('keydown', (e) => {
    if (confirmOverlay.getAttribute('aria-hidden') === 'false') {
      if (e.key === 'Escape') {
        confirmOverlay.style.display = 'none';
        confirmOverlay.setAttribute('aria-hidden', 'true');
      }
    }
  });
}

// Delete Mark Spammers button logic: remove ownership, clear orbit and persisted state
const deleteMarkBtn = document.getElementById('delete-mark-spammers');
const deleteShowersBtn = document.getElementById('delete-showers');
if (deleteMarkBtn) {
  deleteMarkBtn.addEventListener('click', () => {
    try {
      // clear persisted ownership and UI
      writeMarkOwned(0);
      try { localStorage.removeItem(MARK_KEY); } catch(e){}
      // also clear persisted upgrades count and UI
      try { localStorage.removeItem(MARK_UPGRADES_KEY); } catch(e){}
      try { writeMarkUpgradesOwned(0); } catch(e){}

      // remove any active orbit element and its ticker
      try {
        if (typeof _markOrbitTicker !== 'undefined' && _markOrbitTicker) {
          clearInterval(_markOrbitTicker);
        }
      } catch (e){}

      try {
        if (typeof _markOrbitEl !== 'undefined' && _markOrbitEl) {
          _markOrbitEl.remove();
          _markOrbitEl = null;
        }
      } catch (e){}

      // reset any stored click bonus and price backing if desired
      try { writeMarkClickBonus(0); } catch(e){}

      // notify user
      createNotification('Mark Spammers removed.', 3200);
    } catch (err) {
      createNotification('Failed to remove Mark Spammers (see console).', 3200);
      console.warn('delete-mark-spammers error', err);
    }
  });
}

if (deleteShowersBtn) {
  deleteShowersBtn.addEventListener('click', () => {
    try {
      // reset Showers ownership and clicks, clear persisted keys
      writeShowersOwned(0);
      writeShowersClicks(0);
      try { localStorage.removeItem(SHOWERS_KEY); } catch(e){}
      try { localStorage.removeItem(SHOWERS_CLICK_KEY); } catch(e){}

      // hide the showers button and remove any attached handlers/state
      try {
        const btn = document.getElementById('clicker-showers');
        if (btn) {
          btn.style.display = 'none';
          // remove handler flag so it can be recreated cleanly later if re-purchased
          try { delete btn._showersHandlerAttached; } catch(e){}
        }
      } catch (e) {}

      // notify user
      createNotification('Showers Bald Head removed.', 3200);
    } catch (err) {
      createNotification('Failed to remove Showers Bald Head (see console).', 3200);
      console.warn('delete-showers error', err);
    }
  });
}

// Delete Mr. Santos: remove persisted ownership, stop his visual, and update UI
const deleteSantosBtn = document.getElementById('delete-santos');
if (deleteSantosBtn) {
  deleteSantosBtn.addEventListener('click', () => {
    try {
      const ED_KEY = 'an_s_ed_santos_v1';
      // clear persisted ownership so he won't restart after reload
      try { localStorage.removeItem(ED_KEY); } catch (e) {}
      // remove the helper element if present
      try {
        const el = document.getElementById('santos-helper') || document.getElementById('santos-helper') /* fallback */;
        const santosEl = document.getElementById('santos-helper') || document.getElementById('santos-helper') || document.getElementById('santos-helper');
        // The Santos element created uses id 'santos-helper' in ensureSantosElement; older code used 'santos-helper' variable name SANTOS_ID
        // also check for id 'santos-helper' and the element created in the IIFE (id 'santos-helper' may not exist, but the earlier code uses id 'santos-helper')
        const possibleIds = ['santos-helper', 'santos-helper', 'santos-helper', 'santos-helper', 'santos-helper', 'santos-helper'];
        let removedAny = false;
        for (const id of possibleIds) {
          const node = document.getElementById(id);
          if (node) {
            node.remove();
            removedAny = true;
          }
        }
        // also try the explicit id used in the setup: 'santos-helper' (ensure compatibility)
        const explicit = document.getElementById('santos-helper') || document.getElementById('SANTOS_ID') || document.getElementById('santos-helper');
        if (explicit) { explicit.remove(); removedAny = true; }

        // best-effort: also remove the element created with id 'santos-helper' by the IIFE where SANTOS_ID = 'santos-helper'
        const santos = document.getElementById('santos-helper');
        if (santos) { santos.remove(); removedAny = true; }

        // update owned display in shop
        const ownedEl = document.getElementById('owned-ed-santos');
        if (ownedEl) ownedEl.textContent = 'Owned: 0';
        // ensure localStorage key for Santos is cleared
        try { localStorage.removeItem(ED_KEY); } catch (e) {}
        // notify user
        createNotification('Mr. Santos removed. He will stop arriving and his saved ownership cleared.', 3600);
      } catch (e) {
        createNotification('Mr. Santos removed.', 2600);
      }
    } catch (err) {
      createNotification('Failed to remove Mr. Santos (see console).', 3200);
      console.warn('delete-santos error', err);
    }
  });
}

/* --- New shop purchase logic: Study Group & Research Grant --- */
/* Social Confidence: spawns occasional clickable ephemeral pencils that award ~1/10 current points.
   Price is fixed/starts at 20000. When bought, it explains itself for 15s (skippable) and enables periodic spawns. */
const studyPriceEl = document.getElementById('study-price');
const buyStudyBtn = document.getElementById('buy-study');
const ownedStudyEl = document.getElementById('owned-study');

let studyPrice = 20000;
let socialSpawnIntervalId = null;
const SOCIAL_SPAWN_MS = 60_000; // roughly every minute

function updateStudyPrice() {
  if (studyPriceEl) studyPriceEl.textContent = `Cost: ${studyPrice}`;
}

function spawnSocialPencil() {
  const fp = document.createElement('div');
  fp.className = 'floating-pencil';
  // make this answer key big for visibility (inline size overrides CSS)
  const bigSize = 180; // px
  fp.style.width = bigSize + 'px';
  fp.style.height = bigSize + 'px';
  // random position across most of the viewport
  const margin = 24;
  const w = Math.max(120, window.innerWidth);
  const h = Math.max(120, window.innerHeight);
  const x = Math.floor(margin + Math.random() * (w - margin * 2));
  const y = Math.floor(margin + Math.random() * (h - margin * 2));
  fp.style.left = x + 'px';
  fp.style.top = y + 'px';

  const img = document.createElement('img');
  img.src = PENCIL_SRC;
  img.alt = 'Social Confidence pencil';
  fp.appendChild(img);

  // click behavior: award ~1/10 of current points (+/- ~10%)
  fp.addEventListener('click', (e) => {
    e.stopPropagation();
    const current = readPoints();
    const base = Math.max(1, Math.round(current / 10));
    // slight variance -10%..+10%
    const variance = (0.9 + Math.random() * 0.2);
    const award = Math.max(1, Math.round(base * variance));
    bump(award);

    // flash ANSWER KEY for 2s
    const flash = document.getElementById('answer-flash');
    if (flash) {
      flash.style.display = 'block';
      flash.setAttribute('aria-hidden', 'false');
      flash.style.opacity = '1';
      setTimeout(() => {
        if (flash) { flash.style.opacity = '0'; flash.setAttribute('aria-hidden', 'true'); flash.style.display = 'none'; }
      }, 2000);
    }

    // remove the pencil immediately when clicked
    fp.remove();
  });

  // remove after animation finishes (4s)
  fp.addEventListener('animationend', () => {
    fp.remove();
  });

  document.body.appendChild(fp);
}

if (buyStudyBtn) {
  // init display
  updateStudyPrice();
  writeStudyOwned(studyOwned);

  // persistent activation flag so spawns continue forever after purchase
  const STUDY_ACTIVE_KEY = 'an_s_study_active_v1';
  const studyActive = localStorage.getItem(STUDY_ACTIVE_KEY) === '1';

  // If previously activated (or owned at load), ensure the periodic spawn runs.
  if (studyActive || studyOwned > 0) {
    if (!socialSpawnIntervalId) {
      socialSpawnIntervalId = setInterval(() => {
        spawnSocialPencil();
      }, SOCIAL_SPAWN_MS);
    }
    // if studyOwned was >0 but activation flag wasn't set, set it to persist behavior
    if (!studyActive && studyOwned > 0) {
      localStorage.setItem(STUDY_ACTIVE_KEY, '1');
    }
  }

  buyStudyBtn.addEventListener('click', () => {
    // one-time purchase: if already owned don't allow additional buys
    if (studyOwned > 0) {
      createNotification('Social Confidence can only be purchased once.', 3000);
      return;
    }
    if (!spendForPurchase(studyPrice)) return;
    writeStudyOwned(studyOwned + 1);

    // mark as permanently active and persist
    localStorage.setItem(STUDY_ACTIVE_KEY, '1');

    // spawn an immediate pencil and enable periodic spawns
    spawnSocialPencil();
    if (!socialSpawnIntervalId) {
      socialSpawnIntervalId = setInterval(() => {
        spawnSocialPencil();
      }, SOCIAL_SPAWN_MS);
    }

    // show short explanation with skip option
    openInfo('study');
    if (infoBoxMsg) infoBoxMsg.textContent = "Social Confidence spawns helpful pencils that occasionally appear; click them to get an ANSWER KEY bonus (~1/10 current points). This is a one-time purchase and will persist.";
    let skipBtn = document.getElementById('info-skip');
    if (!skipBtn) {
      skipBtn = document.createElement('button');
      skipBtn.id = 'info-skip';
      skipBtn.className = 'buy-btn';
      skipBtn.style.background = 'rgba(255,255,255,0.06)';
      skipBtn.textContent = 'Skip';
      skipBtn.addEventListener('click', closeInfo);
      document.getElementById('info-box').appendChild(skipBtn);
    }
    setTimeout(closeInfo, 15000);

    // tease notification
    createNotification('From: counseling@ancs.edu | Subject: Social Confidence Enrollment\nWelcome! Expect occasional helpful pencils and mild popularity.', 7000);
  });

  document.getElementById('upgrade-study-group')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buyStudyBtn.click();
    }
  });
}

/* Research Grant removed (handled by removing markup). */

/* --- Showers Bald Head shop item & button --- */
const SHOWERS_KEY = 'an_s_showers_v1';
const SHOWERS_CLICK_KEY = 'an_s_showers_clicks_v1';
const buyShowersBtn = document.getElementById('buy-showers');
const showersPriceEl = document.getElementById('showers-price');
const ownedShowersEl = document.getElementById('owned-showers');
const showersCountSpan = document.getElementById('showers-count');

let showersPrice = 100000;
let showersOwned = (function(){ const v = localStorage.getItem(SHOWERS_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
let showersClickCount = (function(){ const v = localStorage.getItem(SHOWERS_CLICK_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();

function writeShowersOwned(n){
  showersOwned = n;
  localStorage.setItem(SHOWERS_KEY, String(n));
  if (ownedShowersEl) ownedShowersEl.textContent = `Owned: ${n}`;
  // recalc manual click power because this is a shop-owned item
  updateClickPower();
}
function updateShowersPriceDisplay(){
  if (showersPriceEl) showersPriceEl.textContent = `Cost: ${showersPrice}`;
}
function writeShowersClicks(n){
  showersClickCount = n;
  localStorage.setItem(SHOWERS_CLICK_KEY, String(n));
  if (showersCountSpan) showersCountSpan.textContent = `${Math.max(0, showersClickCount)}/500`;
}

// create the secondary clicker in DOM when purchased (or restore if previously owned)
function ensureShowersButton() {
  const btn = document.getElementById('clicker-showers');
  if (!btn) return;
  // restore counter display
  writeShowersClicks(showersClickCount);

  // show button if owned
  if (showersOwned > 0) {
    btn.style.display = 'inline-grid';
  }
  // attach click handler (award fixed 50 pts bypassing bump multipliers) and count toward CGP reward
  if (!btn._showersHandlerAttached) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // award a flat +50 points unaffected by manual multipliers/autoclicker multipliers:
      // use origBump to bypass the global bump wrapper
      if (typeof origBump === 'function') {
        origBump(50);
      } else {
        // fallback if origBump not present yet
        bump(50);
      }

      // increment showers click counter and persist
      writeShowersClicks(showersClickCount + 1);

      // when counter reaches 500, award +50 CGP and notify
      if (showersClickCount >= 500) {
        // award 50 CGP
        writeCGP(cgp + 50);

        // brief banner using info overlay to say "CGP Gained!"
        if (infoOverlay && infoBoxMsg) {
          infoBoxMsg.textContent = 'CGP Gained!';
          infoOverlay.style.display = 'flex';
          infoOverlay.setAttribute('aria-hidden', 'false');
          setTimeout(() => {
            infoOverlay.style.display = 'none';
            infoOverlay.setAttribute('aria-hidden', 'true');
          }, 2500);
        } else {
          try { alert('CGP Gained!'); } catch (e) {}
        }

        // reset counter to allow repeated gains
        writeShowersClicks(0);
      }

      // micro-pop visual
      btn.animate([
        { transform: 'translate(-50%,-50%) scale(1)' },
        { transform: 'translate(-50%,-50%) scale(1.06)' },
        { transform: 'translate(-50%,-50%) scale(1)' }
      ], { duration: 140, easing: 'ease-out' });
    });
    btn._showersHandlerAttached = true;
  }
}

// initialize UI
updateShowersPriceDisplay();
writeShowersOwned(showersOwned);
writeShowersClicks(showersClickCount);
ensureShowersButton();

if (buyShowersBtn) {
  buyShowersBtn.addEventListener('click', () => {
    // one-time purchase and require Social Confidence
    if (showersOwned > 0) {
      createNotification('Showers Bald Head is a one-time purchase and already owned.', 3000);
      return;
    }
    if (!studyOwned || studyOwned <= 0) {
      openInfo('study');
      return;
    }
    if (!spendForPurchase(showersPrice)) return;
    writeShowersOwned(showersOwned + 1);

    // show the secondary click button
    const btn = document.getElementById('clicker-showers');
    if (btn) btn.style.display = 'inline-grid';

    // normal CGP adjustment for purchases
    adjustCGPOnPurchase(false);

    updateShowersPriceDisplay();

    createNotification('From: showers@yearbook.ancs | Subject: New Feature: Showers Bald Head\nCongrats — a new click target is live.', 6000);
  });

  // keyboard accessibility
  document.getElementById('upgrade-showers')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buyShowersBtn.click();
    }
  });
}

/* --- Mark Spammers: orbiting spam-bot that auto-clicks Showers button --- */
const MARK_KEY = 'an_s_mark_spammers_v1';
const MARK_UPGRADE_PRICE_KEY = 'an_s_mark_spammers_price_v1';
const MARK_UPGRADES_KEY = 'an_s_mark_spammers_upgrades_v1';
const buyMarkBtn = document.getElementById('buy-mark-spammers');
const markPriceEl = document.getElementById('mark-spammers-price');
const ownedMarkEl = document.getElementById('owned-mark-spammers');
const ownedMarkUpgradesEl = document.getElementById('owned-mark-spammers-upgrades');

let markOwned = (function(){ const v = localStorage.getItem(MARK_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
let markPrice = (function(){ const v = localStorage.getItem(MARK_UPGRADE_PRICE_KEY); const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 100000; })();
// per-click additive bonus applied to each automated 5-click burst (starts at 0, increases by +2.5 per shop upgrade)
const MARK_CLICK_BONUS_KEY = 'an_s_mark_click_bonus_v1';
let markClickBonus = (function(){ const v = parseFloat(localStorage.getItem(MARK_CLICK_BONUS_KEY)); return Number.isFinite(v) ? v : 0; })();

// track how many mark upgrades have been bought (each adds +2.5 to markClickBonus)
let markUpgradesOwned = (function(){ const v = localStorage.getItem(MARK_UPGRADES_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();

// price multiplier when the optional upgrade is bought (1.25x per buy)
const MARK_PRICE_MULT = 1.25;

 // create/update UI
 function writeMarkOwned(n){
   markOwned = n;
   localStorage.setItem(MARK_KEY, String(n));
   if (ownedMarkEl) ownedMarkEl.textContent = `Owned: ${n}`;
   updateClickPower();
 }
 function updateMarkPriceDisplay(){
   if (markPriceEl) markPriceEl.textContent = `Cost: ${Math.ceil(markPrice)}`;
 }
 function writeMarkClickBonus(v){
   markClickBonus = v;
   try { localStorage.setItem(MARK_CLICK_BONUS_KEY, String(markClickBonus)); } catch(e){}
 }
 // create/update upgrades UI
 function writeMarkUpgradesOwned(n){
   markUpgradesOwned = n;
   try { localStorage.setItem(MARK_UPGRADES_KEY, String(markUpgradesOwned)); } catch(e){}
   if (ownedMarkUpgradesEl) ownedMarkUpgradesEl.textContent = `Upgrades: ${markUpgradesOwned}`;
 }

 // ensure UI init
 writeMarkOwned(markOwned);
 writeMarkUpgradesOwned(markUpgradesOwned);
 updateMarkPriceDisplay();

/*
  If Mark Spammers was previously purchased, ensure its orbit is recreated.
  Use a short polling loop to wait for the Showers button to exist and be visible
  (handles cases where DOM/state initialization order varies on reload).
*/
if (markOwned > 0) {
  (function waitForShowersAndCreateOrbit(attempts = 0) {
    try {
      const btn = document.getElementById('clicker-showers');
      // require both stored ownership and the actual button to be present and shown
      if (btn && showersOwned > 0 && getComputedStyle(btn).display !== 'none') {
        // guard against creating twice
        if (!_markOrbitEl) createMarkOrbit();
        return;
      }
    } catch (e) {
      // ignore and retry
    }
    // avoid infinite polling: retry a limited number of times then keep retrying at a slower cadence
    if (attempts < 8) {
      setTimeout(() => waitForShowersAndCreateOrbit(attempts + 1), 250);
    } else {
      // fallback slower check every 750ms for up to ~30s
      const pollId = setInterval(() => {
        try {
          const btn2 = document.getElementById('clicker-showers');
          if (btn2 && showersOwned > 0 && getComputedStyle(btn2).display !== 'none') {
            clearInterval(pollId);
            if (!_markOrbitEl) createMarkOrbit();
          }
        } catch (e) {}
      }, 750);
      // safety: stop polling after 30s
      setTimeout(() => clearInterval(pollId), 30000);
    }
  })();
}

// mark purchase is a one-time purchase and locked until Showers Bald Head is purchased
if (buyMarkBtn) {
  buyMarkBtn.addEventListener('click', () => {
    if (markOwned > 0) {
      createNotification('Mark Spammers can only be purchased once.', 3000);
      return;
    }
    if (showersOwned <= 0) {
      createNotification('Locked: purchase Showers Bald Head first.', 3000);
      return;
    }
    if (!spendForPurchase(markPrice)) return;

    // mark as owned and persist
    writeMarkOwned(1);

    // one-time price multiplier behavior for the "upgrade" (the shop item itself is a one-time purchase)
    // store markPrice in localStorage to persist if needed
    try { localStorage.setItem(MARK_UPGRADE_PRICE_KEY, String(markPrice)); } catch(e){}

    // create the orbiting element around the showers button
    createMarkOrbit();

    createNotification('Mark Spammers activated — orbiting spam-bot is live!', 4500);
  });

  // keyboard accessibility
  document.getElementById('upgrade-mark-spammers')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buyMarkBtn.click();
    }
  });
}

/* Mark Spammers shop upgrade that increases per-click bonus:
   - This is represented as the same shop item (Mark Spammers) but if you later add upgrade purchases they would increase bonus and price.
   - Here we support a single optional additional purchase flow: user may "upgrade" Mark to increase per-click bonus once.
   - For simplicity and to meet the requested behavior: buying the shop upgrade will increase markClickBonus by +2.5 and multiply next price by 1.25.
   - The "upgrade" button will reuse buy-mark-spammers but if markOwned===1 it will instead act as an upgrade if allowed.
*/
function markUpgradeAvailable() {
  // upgrade allowed only if Mark owned and not yet upgraded beyond initial (we allow multiple upgrades but each will cost markPrice and then multiply by 1.25)
  return markOwned >= 1;
}

// Re-purpose the same buy button to allow upgrade after ownership: if owned and user clicks, treat as an upgrade purchase that increases per-click bonus
if (buyMarkBtn) {
  buyMarkBtn.addEventListener('dblclick', () => {
    // double-click acts as an upgrade action (avoid accidental single-click upgrade)
    if (!markUpgradeAvailable()) {
      createNotification('Upgrade locked until Mark is purchased.', 3000);
      return;
    }
    // require spending price
    const price = Math.ceil(markPrice);
    if (!spendForPurchase(price)) return;
    // apply bonus
    writeMarkClickBonus(markClickBonus + 2.5);
    // increment and persist upgrades owned count
    writeMarkUpgradesOwned(markUpgradesOwned + 1);
    // increase price for next upgrade by multiplier
    markPrice *= MARK_PRICE_MULT;
    try { localStorage.setItem(MARK_UPGRADE_PRICE_KEY, String(markPrice)); } catch(e){}
    updateMarkPriceDisplay();
    createNotification('Mark upgraded: +2.5 per burst click applied.', 4000);
  });


}

/* Create the orbiting element and start its pulse + clicking routine.
   The orbit visually revolves around the showers button and pulses every 1s; each pulse triggers 5 clicks on the Showers Bald Head button.
*/
let _markOrbitEl = null;
let _markOrbitTicker = null;

function createMarkOrbit() {
  // don't create twice
  if (_markOrbitEl) return;
  const showersBtn = document.getElementById('clicker-showers');
  if (!showersBtn) return;

  // create container positioned relative to the showers button
  const orbit = document.createElement('div');
  orbit.className = 'mark-orbit';
  orbit.style.position = 'absolute';
  orbit.style.left = '0px';
  orbit.style.top = '0px';
  orbit.style.pointerEvents = 'none';

  const img = document.createElement('img');
  img.src = '/Untitled design (79).png';
  img.alt = 'Mark Spammers';
  orbit.appendChild(img);

  document.body.appendChild(orbit);
  _markOrbitEl = orbit;

  // position update loop: revolve around the showers button
  let angle = 0;
  const radius = Math.max(110, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.14));
  function updatePosition() {
    const rect = showersBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // orbit center around showers button
    const x = Math.round(cx + Math.cos(angle) * radius - (orbit.offsetWidth / 2));
    const y = Math.round(cy + Math.sin(angle) * radius - (orbit.offsetHeight / 2));
    orbit.style.left = x + 'px';
    orbit.style.top = y + 'px';
    // advance angle moderately to make continuous revolve
    angle += 0.04; // rotation speed
    if (angle > Math.PI * 2) angle -= Math.PI * 2;
  }

  // pulse & click routine every 1s
  _markOrbitTicker = setInterval(() => {
    if (!_markOrbitEl) return;
    // pulse animation via CSS keyframe
    img.style.animation = 'mark-pulse 420ms cubic-bezier(.2,.9,.2,1)';
    // remove animation after completed to allow retrigger
    setTimeout(() => { img.style.animation = ''; }, 430);

    // perform 5 clicks on the Showers button programmatically
    try {
      const btn = document.getElementById('clicker-showers');
      if (btn) {
        // each click should fire the showers click handler; to ensure consistent behavior, call click five times with tiny spacing
        for (let i=0;i<5;i++) {
          setTimeout(() => {
            try { btn.click(); } catch (e) {}
            // also award the extra per-click bonus (markClickBonus) each click by using origBump to bypass global multipliers:
            if (typeof origBump === 'function' && markClickBonus) {
              // add integer-appropriate bump (round)
              origBump(Math.round(markClickBonus));
            }
          }, i * 30);
        }
      }
    } catch (e) { /* ignore */ }
  }, 1000);

  // continuous animation frame for smooth circular motion
  function tick() {
    if (!_markOrbitEl) return;
    updatePosition();
    requestAnimationFrame(tick);
  }
  tick();

  // reposition on resize
  window.addEventListener('resize', updatePosition);
}


/* --- Funny shop items logic: Detention, Mystery Meat, Honors Hoodie --- */
// Detention Slip: cheap gag item that ironically lowers your points heavily but increases CGP (you learn a lesson)
const detentionPriceEl = document.getElementById('detention-price');
const buyDetentionBtn = document.getElementById('buy-detention');
const ownedDetentionEl = document.getElementById('owned-detention');
let detentionOwned = 0;
if (detentionPriceEl) detentionPriceEl.textContent = `Cost: 500`;
if (ownedDetentionEl) ownedDetentionEl.textContent = `Owned: ${detentionOwned}`;

if (buyDetentionBtn) {
  // make detention price decay by 50% each time (cheaper every purchase)
  let detentionPrice = 500;
  if (detentionPriceEl) detentionPriceEl.textContent = `Cost: ${detentionPrice}`;

  buyDetentionBtn.addEventListener('click', () => {
    const price = detentionPrice;
    if (!spendForPurchase(price)) return;
    detentionOwned += 1;
    if (ownedDetentionEl) ownedDetentionEl.textContent = `Owned: ${detentionOwned}`;

    // You lose half your current points as "learning penalty", but gain +20 CGP for the moral growth
    const current = readPoints();
    const lost = Math.floor(current * 0.5);
    writePoints(Math.max(0, current - lost));
    adjustCGPOnPurchase(true); // standard purchase reduces CGP by 5
    writeCGP(cgp + 20);

    // reduce price for next purchase by 50% (min 1)
    detentionPrice = Math.max(1, Math.ceil(detentionPrice * 0.5));
    if (detentionPriceEl) detentionPriceEl.textContent = `Cost: ${detentionPrice}`;

    // brief info banner
    openInfo('detention');

    // tease notification
    createNotification('From: discipline@ancs.edu | Subject: Scary Pink Slip — Reflection Required\nYou learned something and the pink slip is now cheaper for others.', 5000);
  });
  document.getElementById('upgrade-detention')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buyDetentionBtn.click(); }
  });
}

// Mystery Meat Lunch: gamble: costs 2500, gives a random reward (could be good or bad), and briefly warps the view (nausea)
const mysteryPriceEl = document.getElementById('mystery-price');
const buyMysteryBtn = document.getElementById('buy-mystery');
const ownedMysteryEl = document.getElementById('owned-mystery');
let mysteryOwned = 0;
if (mysteryPriceEl) mysteryPriceEl.textContent = `Cost: 2500`;
if (ownedMysteryEl) ownedMysteryEl.textContent = `Owned: ${mysteryOwned}`;

function doScreenWobble(duration = 3000) {
  const el = document.getElementById('streetview');
  if (!el) return;
  el.animate([
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(1.02) rotate(0.6deg)' },
    { transform: 'scale(0.98) rotate(-0.5deg)' },
    { transform: 'scale(1) rotate(0deg)' }
  ], { duration, iterations: 1, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

// helper: show a temporary on-screen message using the existing info overlay
function showTempMessage(text, duration = 3000) {
  try {
    const overlay = document.getElementById('info-overlay');
    const msg = document.getElementById('info-msg');
    if (!overlay || !msg) {
      // fallback to alert if DOM not ready
      try { alert(text); } catch (e) {}
      return;
    }
    msg.textContent = text;
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    // auto-close after duration
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }, duration);
  } catch (err) {
    try { alert(text); } catch (e) {}
  }
}

if (buyMysteryBtn) {
  buyMysteryBtn.addEventListener('click', () => {
    // price is always 1/5 of the player's current points at purchase time (min 1)
    const currentPts = readPoints();
    const price = Math.max(1, Math.floor(currentPts / 5));
    if (!spendForPurchase(price)) return;
    mysteryOwned += 1;
    if (ownedMysteryEl) ownedMysteryEl.textContent = `Owned: ${mysteryOwned}`;

    // random outcome: big win, small win, or small loss
    const r = Math.random();
    if (r < 0.12) {
      const win = Math.floor(Math.max(1000, readPoints() * 0.5));
      bump(win);
      showTempMessage(`Jackpot! You won ${win} points!`, 3500);
    } else if (r < 0.6) {
      const win = Math.floor(200 + Math.random() * 800);
      bump(win);
      showTempMessage(`You found something tasty: +${win} points.`, 3000);
    } else {
      const loss = Math.floor(100 + Math.random() * 800);
      const current = readPoints();
      const newVal = Math.max(0, current - loss);
      writePoints(newVal);
      showTempMessage(`Oh no — mystery meat backfired: -${loss} points.`, 3000);
    }

    doScreenWobble(2600);
    adjustCGPOnPurchase(false);

    createNotification('From: cafeteria@ancs.edu | Subject: Sloppy Joe Day Results\nYour lunch adventure was processed.', 5200);
  });
  document.getElementById('upgrade-mystery')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buyMysteryBtn.click(); }
  });
}

// Honors Hoodie: wearable prestige that increases manual click power by +2 per buy
const hoodiePriceEl = document.getElementById('hoodie-price');
const buyHoodieBtn = document.getElementById('buy-hoodie');
const ownedHoodieEl = document.getElementById('owned-hoodie');
let hoodieOwned = 0;
if (hoodiePriceEl) hoodiePriceEl.textContent = `Cost: 8000`;
if (ownedHoodieEl) ownedHoodieEl.textContent = `Owned: ${hoodieOwned}`;

if (buyHoodieBtn) {
  buyHoodieBtn.addEventListener('click', () => {
    const price = 8000;
    if (!spendForPurchase(price)) return;
    hoodieOwned += 1;
    if (ownedHoodieEl) ownedHoodieEl.textContent = `Owned: ${hoodieOwned}`;

    // adjust CGP and refresh click power based on aggregate ownership multiplier
    adjustCGPOnPurchase(false); // reduce CGP by 5
    updateClickPower();
    openInfo('hoodie');

    createNotification('From: activities@ancs.edu | Subject: Unwarranted ISS Activated\nClick power recalculated with shop-owned multiplier.', 5000);
  });
  document.getElementById('upgrade-hoodie')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buyHoodieBtn.click(); }
  });
}

/* --- Notification system: stacked clickable alerts --- */
const notifContainer = (function(){
  let el = document.getElementById('notif-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'notif-container';
    document.body.appendChild(el);
  }
  return el;
})();

function sanitizeText(t){ return String(t).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const SUBJECTS = ['Math','I&S','Language and Literature','Spanish','Design','Science','Health','Visual Arts','Performing Arts'];
const SND_PREFIX = ['Google Classroom','Toddle','Reminder'];
function makeNotifText(override){
  const source = Math.random() < 0.5 ? 'Google Classroom' : 'Toddle';
  // pick a subject but respect arts enrollment: avoid generating notifications from the arts class you did not choose
  let subject = SUBJECTS[Math.floor(Math.random()*SUBJECTS.length)];

  try {
    const saved = getSavedSettings();
    const chosenArts = saved.chosenArts || 'visual';
    // if chosenArts is 'visual', suppress Performing Arts notifications; if 'performing', suppress Visual Arts
    if (chosenArts === 'visual' && subject === 'Performing Arts') {
      // pick again up to a few times to avoid the suppressed subject
      for (let i=0;i<6;i++){
        subject = SUBJECTS[Math.floor(Math.random()*SUBJECTS.length)];
        if (subject !== 'Performing Arts') break;
      }
    } else if (chosenArts === 'performing' && subject === 'Visual Arts') {
      for (let i=0;i<6;i++){
        subject = SUBJECTS[Math.floor(Math.random()*SUBJECTS.length)];
        if (subject !== 'Visual Arts') break;
      }
    }
  } catch (e) {
    // ignore and proceed if settings cannot be read
  }

  const dueChance = Math.random() < 0.45;
  const teaseChance = Math.random() < 0.06;
  const dueStr = dueChance ? ` due soon: ${Math.ceil(1+Math.random()*72)}h left` : ' new update';
  let cgpNote = '';
  if (typeof cgp !== 'undefined') {
    if (cgp >= 50) cgpNote = ' — CGP good';
    else if (cgp >= 0) cgpNote = ' — CGP fair';
    else if (cgp >= -200) cgpNote = ' — CGP low';
    else cgpNote = ' — CGP critical';
  }

  // try to include the teacher's name for the subject if available in settings
  let teacherSuffix = '';
  try {
    const saved = getSavedSettings();
    if (saved && saved.teachers && saved.teachers[subject] && saved.teachers[subject][0]) {
      const t = String(saved.teachers[subject][0]).trim();
      if (t) teacherSuffix = ` — ${t}`;
    }
  } catch (e) {
    // ignore errors and proceed without teacher name
  }

  const base = override || `${source}: ${subject}${dueStr}${cgpNote}${teacherSuffix}`;
  // only append the Sketchy Proxy suffix sometimes (25% chance) when sketchy purchases exist
  let sketchy = '';
  if (typeof autoBoostOwned !== 'undefined' && autoBoostOwned > 0) {
    if (Math.random() < 0.25) sketchy = ' - Sketchy Proxy';
  }
  return sanitizeText(base + sketchy);
}

function createNotification(text){
  // notifications are now persistent until manually dismissed
  const node = document.createElement('div');
  node.className = 'notif';
  node.tabIndex = 0;
  node.innerHTML = `<div class="notif-text">${text}</div><button class="notif-dismiss" aria-label="Dismiss notification">✕</button>`;
  notifContainer.appendChild(node);

  // clicking or pressing removes
  function removeNode(){
    if (!node) return;
    node.classList.add('notif-hide');
    setTimeout(()=> node.remove(), 260);
  }
  node.querySelector('.notif-dismiss')?.addEventListener('click', (e) => { e.stopPropagation(); removeNode(); });
  node.addEventListener('click', (e)=> {
    // dismiss when clicked (but prevent clicks on the dismiss btn double-handling)
    if ((e.target && e.target.classList && e.target.classList.contains('notif-dismiss'))) return;
    removeNode();
  });
  node.addEventListener('keydown', (e)=> { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); removeNode(); }});

  return node;
}

// spawn notifications every few seconds; they stack and must be dismissed
let notifIntervalId = null;
function startNotifGenerator(){
  if (notifIntervalId) return;
  // spawn interval randomized between 4s and 9s
  notifIntervalId = setInterval(() => {
    try {
      const txt = makeNotifText();
      createNotification(txt, 18000 + Math.floor(Math.random()*8000));
    } catch (err) { /* noop */ }
  }, 5500 + Math.floor(Math.random()*3500));
}
function stopNotifGenerator(){
  if (notifIntervalId) { clearInterval(notifIntervalId); notifIntervalId = null; }
}

 // start by default
 startNotifGenerator();

 /**
  * Quiz notifications: every ~5 minutes (randomized) spawn a red notification that opens a full-screen quiz for Math or Language & Literature.
  * - Clicking starts quiz: Math = one multiplication (1-11) with instant input; Lang&Lit = 30s to type 20 words (space-separated words count).
  * - Correct: points *= 1.1 (CGP unchanged). Wrong or ignored/timeout: both points and CGP drop by 75% (multiply by 0.25).
  * - Clear all button allows risking missing quizzes (it removes all notifications).
  */

 // helper: create a red-styled notification specifically for quizzes
 function createQuizNotification(subjectText, subjectKey) {
   const text = `${subjectText}: QUIZ - Answer now!`;
   const node = document.createElement('div');
   node.className = 'notif';
   node.style.border = '2px solid rgba(255,80,80,0.18)';
   node.style.color = '#ffb3b3';
   node.style.background = 'rgba(80,0,0,0.06)';
   node.tabIndex = 0;
   node.dataset.quiz = '1';
   node.dataset.subject = subjectKey;
   node.innerHTML = `<div class="notif-text" style="color:#ffdddd;font-weight:900">${text}</div><button class="notif-dismiss" aria-label="Dismiss notification">✕</button>`;
   notifContainer.appendChild(node);

   // Trigger the Clear All button flash for red/quiz notifications
   flashClearButtonForQuiz();

   // click opens quiz modal
   node.addEventListener('click', (e) => {
     if ((e.target && e.target.classList && e.target.classList.contains('notif-dismiss'))) {
       // dismiss button should remove without triggering quiz (but dismissing a quiz counts as ignoring -> treat as missed)
       e.stopPropagation();
       removeNotif(node, true);
       return;
     }
     openQuiz(node.dataset.subject, node);
   });
   node.querySelector('.notif-dismiss')?.addEventListener('click', (e) => { e.stopPropagation(); removeNotif(node, true); });
   node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openQuiz(node.dataset.subject, node); }});
   return node;
 }

 // helper to flash the Clear All button red and fade back over 3 seconds when a red/quiz notification appears
 let _clearFlashTimeout = null;
 function flashClearButtonForQuiz() {
   try {
     const clearBtn = document.getElementById('clear-notifs');
     if (!clearBtn) return;
     // clear any existing scheduled removal so repeated flashes extend properly
     clearBtn.classList.add('clear-flash');
     if (_clearFlashTimeout) clearTimeout(_clearFlashTimeout);
     _clearFlashTimeout = setTimeout(() => {
       clearBtn.classList.remove('clear-flash');
       _clearFlashTimeout = null;
     }, 3000);
   } catch (e) {
     // silent fail
   }
 }

 // remove notif helper (if missed flag true, apply penalty)
 function removeNotif(node, missed = false) {
   if (!node) return;
   node.classList.add('notif-hide');
   setTimeout(()=> node.remove(), 260);
   if (missed && node.dataset && node.dataset.quiz === '1') {
     // missed quiz: apply penalty immediately
     try {
       const pts = readPoints();
       writePoints(Math.max(0, Math.floor(pts * 0.25))); // keep 25%
       writeCGP(cgp * 0.25); // drop CGP by 75% (multiply by 0.25)
       createNotification('You missed a quiz — penalties applied.', 4000);
     } catch (e) { /* noop */ }
   }
 }

 // full-screen quiz modal (reuses info overlay area for simplicity, but makes larger)
 function openQuiz(subject, triggeringNode) {
   // close info if open
   closeInfo();
   // create modal elements
   const modal = document.createElement('div');
   modal.id = 'quiz-modal';
   modal.style.position = 'fixed';
   modal.style.left = '0';
   modal.style.top = '0';
   modal.style.right = '0';
   modal.style.bottom = '0';
   modal.style.zIndex = 600;
   modal.style.display = 'flex';
   modal.style.alignItems = 'center';
   modal.style.justifyContent = 'center';
   modal.style.background = 'rgba(0,0,0,0.85)';

   const box = document.createElement('div');
   box.style.width = 'min(92%, 900px)';
   box.style.maxHeight = '86vh';
   box.style.overflow = 'auto';
   box.style.background = '#071018';
   box.style.borderRadius = '12px';
   box.style.padding = '18px';
   box.style.color = 'var(--btn-bg)';
   box.style.boxShadow = '0 22px 44px rgba(0,0,0,0.7)';
   box.style.display = 'flex';
   box.style.flexDirection = 'column';
   box.style.gap = '12px';

   const title = document.createElement('div');
   title.style.fontWeight = '900';
   title.style.fontSize = '20px';
   title.textContent = `${subject === 'Math' ? 'Math' : 'Language & Literature'} Quiz`;
   box.appendChild(title);

   const desc = document.createElement('div');
   desc.style.opacity = '0.95';
   desc.style.fontSize = '14px';
   if (subject === 'Math') {
     // generate multiplication
     const a = 1 + Math.floor(Math.random()*11);
     const b = 1 + Math.floor(Math.random()*11);
     const answer = a * b;
     desc.textContent = `Solve: ${a} × ${b}`;
     const input = document.createElement('input');
     input.type = 'number';
     input.style.padding = '10px';
     input.style.borderRadius = '10px';
     input.style.border = '0';
     input.style.background = 'rgba(255,255,255,0.03)';
     input.style.color = 'var(--btn-bg)';
     input.style.fontSize = '18px';
     input.style.width = '100%';
     box.appendChild(desc);
     box.appendChild(input);

     const actions = document.createElement('div');
     actions.style.display = 'flex';
     actions.style.gap = '8px';
     actions.style.justifyContent = 'center';
     const submit = document.createElement('button');
     submit.className = 'buy-btn';
     submit.textContent = 'Submit';
     const cancel = document.createElement('button');
     cancel.className = 'buy-btn danger';
     cancel.textContent = 'Cancel';
     actions.appendChild(submit);
     actions.appendChild(cancel);
     box.appendChild(actions);

     // timer display (optional small)
     const timer = document.createElement('div');
     timer.style.fontSize = '13px';
     timer.style.opacity = '0.9';
     timer.textContent = 'Time remaining: ∞';
     box.appendChild(timer);

     function finish(correct) {
       // remove modal
       modal.remove();
       // dismiss triggering notif without missed penalty
       if (triggeringNode) triggeringNode.remove();
       if (correct) {
         // multiply points by 1.1 (only points)
         try {
           const pts = readPoints();
           const next = Math.round(pts * 1.1);
           writePoints(next);
           createNotification('Correct! Points multiplied by 1.1×', 3500);
         } catch (e) {}
       } else {
         // wrong -> massive penalty: points and CGP drop by 75% (keep 25%)
         try {
           const pts = readPoints();
           writePoints(Math.max(0, Math.floor(pts * 0.25)));
           writeCGP(cgp * 0.25);
           createNotification('Incorrect — heavy penalties applied to points and CGP.', 4200);
         } catch (e) {}
       }
     }

     submit.addEventListener('click', () => {
       const val = parseInt(input.value,10);
       finish(val === answer);
     });
     cancel.addEventListener('click', () => { finish(false); });
     input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit.click(); });
   } else {
     // Language & Literature: 30s to type 20 words (words counted by spaces)
     const info = document.createElement('div');
     info.textContent = 'Write a 20-word mini-essay in 30 seconds. Words are counted by spaces (each space-separated token counts).';
     box.appendChild(info);
     const textarea = document.createElement('textarea');
     textarea.placeholder = 'Type your 20-word essay here...';
     textarea.style.minHeight = '220px';
     textarea.style.padding = '12px';
     textarea.style.borderRadius = '10px';
     textarea.style.border = '0';
     textarea.style.background = 'rgba(255,255,255,0.03)';
     textarea.style.color = 'var(--btn-bg)';
     textarea.style.fontSize = '16px';
     textarea.style.width = '100%';
     box.appendChild(textarea);

     const timer = document.createElement('div');
     timer.style.fontSize = '13px';
     timer.style.opacity = '0.95';
     box.appendChild(timer);

     const actions = document.createElement('div');
     actions.style.display = 'flex';
     actions.style.gap = '8px';
     actions.style.justifyContent = 'center';
     const submit = document.createElement('button');
     submit.className = 'buy-btn';
     submit.textContent = 'Submit';
     const cancel = document.createElement('button');
     cancel.className = 'buy-btn danger';
     cancel.textContent = 'Cancel';
     actions.appendChild(submit);
     actions.appendChild(cancel);
     box.appendChild(actions);

     // countdown 30s
     let remaining = 30;
     timer.textContent = `Time remaining: ${remaining}s`;
     const countdown = setInterval(() => {
       remaining -= 1;
       timer.textContent = `Time remaining: ${remaining}s`;
       if (remaining <= 0) {
         clearInterval(countdown);
         // auto-submit as failure if not meeting word count
         const words = String(textarea.value || '').trim().split(/\s+/).filter(Boolean).length;
         const ok = (words >= 20);
         modal.remove();
         if (triggeringNode) triggeringNode.remove();
         if (ok) {
           // award success
           try {
             const pts = readPoints();
             writePoints(Math.round(pts * 1.1));
             createNotification('Correct essay! Points multiplied by 1.1×', 3500);
           } catch (e) {}
         } else {
           try {
             const pts = readPoints();
             writePoints(Math.max(0, Math.floor(pts * 0.25)));
             writeCGP(cgp * 0.25);
             createNotification('Essay failed or timed out — heavy penalties applied.', 4200);
           } catch (e) {}
         }
       }
     }, 1000);

     submit.addEventListener('click', () => {
       clearInterval(countdown);
       const words = String(textarea.value || '').trim().split(/\s+/).filter(Boolean).length;
       modal.remove();
       if (triggeringNode) triggeringNode.remove();
       if (words >= 20) {
         const pts = readPoints();
         writePoints(Math.round(pts * 1.1));
         createNotification('Correct essay! Points multiplied by 1.1×', 3500);
       } else {
         const pts = readPoints();
         writePoints(Math.max(0, Math.floor(pts * 0.25)));
         writeCGP(cgp * 0.25);
         createNotification('Essay too short — heavy penalties applied.', 4200);
       }
     });
     cancel.addEventListener('click', () => {
       clearInterval(countdown);
       modal.remove();
       if (triggeringNode) triggeringNode.remove();
       // cancel treated as failure
       const pts = readPoints();
       writePoints(Math.max(0, Math.floor(pts * 0.25)));
       writeCGP(cgp * 0.25);
       createNotification('Quiz cancelled — penalties applied.', 4200);
     });
   }

   const closeX = document.createElement('button');
   closeX.className = 'buy-btn danger';
   closeX.textContent = 'Close';
   closeX.style.alignSelf = 'center';
   closeX.addEventListener('click', () => {
     // treat closing as failure
     modal.remove();
     if (triggeringNode) triggeringNode.remove();
     const pts = readPoints();
     writePoints(Math.max(0, Math.floor(pts * 0.25)));
     writeCGP(cgp * 0.25);
     createNotification('Quiz closed — penalties applied.', 4200);
   });
   box.appendChild(closeX);

   modal.appendChild(box);
   document.body.appendChild(modal);
 }

 // schedule quiz notifications roughly every 5 minutes (randomized between 3.5 and 6.5 minutes)
 let quizScheduleTimer = null;
 function scheduleQuizNotifications() {
   if (quizScheduleTimer) return;
   function scheduleOnce() {
     const wait = 210000 + Math.floor(Math.random()*300000); // 210s..510s ~ 3.5..8.5 min slightly random
     quizScheduleTimer = setTimeout(() => {
       // pick subject between Math and Language & Literature
       const subj = Math.random() < 0.5 ? 'Math' : 'Language and Literature';
       createQuizNotification(subj === 'Math' ? 'Math' : 'Language & Literature', subj);
       // if user doesn't click within 18 seconds, treat as missed (instant penalty)
       setTimeout(() => {
         // find outstanding quiz-notifs and apply missed if still present
         const nodes = Array.from(notifContainer.querySelectorAll('.notif'));
         nodes.forEach(n => {
           if (n.dataset && n.dataset.quiz === '1') {
             // apply missed penalty and remove
             removeNotif(n, true);
           }
         });
       }, 18000);
       // schedule again
       quizScheduleTimer = null;
       scheduleOnce();
     }, wait);
   }
   scheduleOnce();
 }
 scheduleQuizNotifications();

 // wire up Clear all button: removes all notifications; this risks missing any active quizzes (apply missed penalties for quizzes)
 const clearBtn = document.getElementById('clear-notifs');
 if (clearBtn) {
   clearBtn.addEventListener('click', () => {
     const nodes = Array.from(notifContainer.querySelectorAll('.notif'));
     nodes.forEach(n => {
       // if it's a quiz notif, treat as missed (apply penalty)
       if (n.dataset && n.dataset.quiz === '1') {
         removeNotif(n, true);
       } else {
         removeNotif(n, false);
       }
     });
   });
 }

 // --- Tutorial button & stepper --- //
 const tutorialBtn = document.getElementById('tutorial-btn');
 const tutorialOverlay = document.getElementById('tutorial-overlay');
 const tutorialBox = document.getElementById('tutorial-box');
 const tutorialStepEl = document.getElementById('tutorial-step');
 const tutorialBodyEl = document.getElementById('tutorial-body');
 const tutorialNext = document.getElementById('tutorial-next');
 const tutorialPrev = document.getElementById('tutorial-prev');
 const tutorialClose = document.getElementById('tutorial-close');

 // Base tutorial steps; will be extended in future updates to include new important features.
 function buildTutorialSteps() {
   const saved = getSavedSettings();
   const steps = [
     { title: 'Notifications', body: 'Notifications appear on the left; click them to read or dismiss. Red notifications are quizzes—treat them carefully.' },
     { title: 'Red Quiz Notifications', body: 'Quizzes (red) open a full-screen question. Math gives a multiplication, Lang & Lit asks a 20-word mini-essay. Correct yields point multiplier; wrong or missed heavily penalizes points and CGP.' },
     { title: 'Settings', body: 'Open Settings (top-right) to set your name and choose teachers; pick only one in arts enrollment. Saved settings appear in notifications.' },
     { title: 'Items & Shop', body: 'Buy upgrades on the right to improve gains: ChatGPT autoclickers, Principal for the Day, Sketchy Proxy, Social Confidence, etc. Read item info (Info buttons) before buying.' },
     { title: 'CGP (Ethics)', body: 'CGP is your ethics/reputation score. Many purchases lower CGP; Principal restores it. Watch CGP in the panel and avoid dropping too far.' },
     { title: 'Tip', body: 'Always check the item Info before buying and remember: red quiz notifications can change your points and CGP dramatically.' }
   ];

   // dynamically mention Showers if purchased/unlocked
   try {
     if (localStorage.getItem(SHOWERS_KEY) && parseInt(localStorage.getItem(SHOWERS_KEY),10) > 0) {
       steps.push({ title: 'Showers Bald Head', body: 'You have the Showers clicker — it gives a flat +50 per click; progress yields CGP rewards.' });
     }
   } catch (e) {}

   return steps;
 }

 let tutorialSteps = buildTutorialSteps();
 let tutorialIndex = 0;
 let tutorialAutoUnlocked = false;
 let tutorialStepReadyAt = 0;

 function openTutorial(startIndex = 0) {
   tutorialSteps = buildTutorialSteps();
   tutorialIndex = startIndex;
   if (!tutorialOverlay) return;
   tutorialOverlay.style.display = 'flex';
   tutorialOverlay.setAttribute('aria-hidden', 'false');
   renderTutorialStep();
   // ensure Next is focusable
   setTimeout(() => tutorialNext && tutorialNext.focus && tutorialNext.focus(), 80);
 }

 function closeTutorial() {
   if (!tutorialOverlay) return;
   tutorialOverlay.style.display = 'none';
   tutorialOverlay.setAttribute('aria-hidden', 'true');
 }

 function renderTutorialStep() {
   const step = tutorialSteps[tutorialIndex];
   tutorialStepEl.textContent = `${tutorialIndex + 1} / ${tutorialSteps.length} — ${step.title}`;
   tutorialBodyEl.textContent = step.body;
   // Prev visible only when >0
   tutorialPrev.style.display = tutorialIndex > 0 ? 'inline-block' : 'none';
   // disable Next for first 2s of each step to ensure brief reading
   tutorialNext.disabled = true;
   tutorialStepReadyAt = Date.now() + 2000;
   setTimeout(() => {
     tutorialNext.disabled = false;
   }, 2000);
 }

 tutorialNext && tutorialNext.addEventListener('click', () => {
   // allow click only if 2s elapsed
   if (Date.now() < tutorialStepReadyAt) return;
   if (tutorialIndex < tutorialSteps.length - 1) {
     tutorialIndex++;
     renderTutorialStep();
   } else {
     // finished
     endTutorial();
   }
 });

 tutorialPrev && tutorialPrev.addEventListener('click', () => {
   if (tutorialIndex > 0) {
     tutorialIndex--;
     renderTutorialStep();
   }
 });

 tutorialClose && tutorialClose.addEventListener('click', () => {
   closeTutorial();
 });

 // open tutorial when button clicked
 if (tutorialBtn) {
   tutorialBtn.addEventListener('click', () => {
     openTutorial(0);
   });
 }

 function endTutorial() {
   closeTutorial();
   // mark tutorial as completed so button becomes smaller/non-pulsing
   try {
     localStorage.setItem('an_s_tutorial_completed_v1', '1');
   } catch (e) {}
   if (tutorialBtn) tutorialBtn.classList.add('completed');
   createNotification('Tutorial completed — remember to check item Info!', 4500);
 }

 // on load, if tutorial previously completed, make button small; otherwise keep pulsing
 try {
   const done = localStorage.getItem('an_s_tutorial_completed_v1') === '1';
   if (done && tutorialBtn) {
     tutorialBtn.classList.add('completed');
   }
 } catch (e) {}

 /**
  * Sketchy Proxy (auto-boost) temporary block mechanics:
  * - Occasionally Mr. Boardman blocks proxies.
  * - When blocked, Sketchy Proxy purchases are disabled for 2 minutes.
  * - The shop card receives a 'proxy-blocked' class and the price area shows a countdown.
  * - A red alert appears on screen when blocked.
  */

 // runtime state for proxy blocking
 let proxyBlocked = false;
 let proxyBlockedUntil = 0; // timestamp ms when block lifts
 let proxyBlockTicker = null;

 // small transient red alert overlay (created once)
 const proxyAlert = (function createProxyAlert(){
   const el = document.createElement('div');
   el.id = 'proxy-alert';
   el.style.position = 'fixed';
   el.style.left = '50%';
   el.style.top = '14px';
   el.style.transform = 'translateX(-50%)';
   el.style.zIndex = 360;
   el.style.background = 'transparent';
   el.style.padding = '6px 12px';
   el.style.pointerEvents = 'none';
   el.style.color = '#ff6b6b';
   el.style.fontWeight = '900';
   el.style.fontSize = '16px';
   el.style.opacity = '0';
   el.style.transition = 'opacity 180ms ease';
   document.body.appendChild(el);
   return el;
 })();

 function showProxyAlert(msg, ms = 2600) {
   if (!proxyAlert) return;
   proxyAlert.textContent = msg;
   proxyAlert.style.opacity = '1';
   setTimeout(() => {
     if (proxyAlert) proxyAlert.style.opacity = '0';
   }, ms);
 }

 // helper to format remaining time in mm:ss
 function formatRemaining(ms) {
   const s = Math.max(0, Math.ceil(ms / 1000));
   const mm = Math.floor(s / 60);
   const ss = s % 60;
   return `${mm}:${ss.toString().padStart(2,'0')}`;
 }

 // update availability UI for Sketchy Proxy including blocked state
 function updateAutoBoostAvailability() {
   const ownedAutoclickers = readOwned();
   const locked = ownedAutoclickers < 15;
   const card = document.getElementById('upgrade-auto-boost');
   const priceEl = autoBoostPriceEl;
   if (proxyBlocked) {
     // compute remaining and show countdown
     const remaining = Math.max(0, proxyBlockedUntil - Date.now());
     if (priceEl) {
       priceEl.textContent = `Blocked — available in ${formatRemaining(remaining)}`;
       // update the dedicated proxy-timer element (created in markup)
       const timerEl = document.getElementById('proxy-timer');
       if (timerEl) {
         timerEl.style.display = 'block';
         timerEl.textContent = `Sketchy Proxies disabled by Mr. Boardman — ${formatRemaining(remaining)}`;
       }
     }
     // mark visuals & disable button
     buyAutoBoostBtn.disabled = true;
     buyAutoBoostBtn.classList.add('proxy-blocked');
     card && card.classList.add('proxy-blocked');
   } else if (locked) {
     buyAutoBoostBtn.disabled = true;
     buyAutoBoostBtn.classList.remove('proxy-blocked');
     card && card.classList.remove('proxy-blocked');
     if (priceEl) priceEl.textContent = `Locked — needs 15 auto clickers (${ownedAutoclickers}/15)`;
     // hide the dedicated timer if present
     const timerEl = document.getElementById('proxy-timer');
     if (timerEl) timerEl.style.display = 'none';
   } else {
     buyAutoBoostBtn.disabled = false;
     buyAutoBoostBtn.classList.remove('proxy-blocked');
     card && card.classList.remove('proxy-blocked');
     updateAutoBoostPriceDisplay();
     // ensure timer hidden when not blocked
     const timerEl = document.getElementById('proxy-timer');
     if (timerEl) timerEl.style.display = 'none';
   }
 }

 // triggers a block for durationMs (default 2 minutes)
 function triggerProxyBlock(durationMs = 120000) {
   // if already blocked, extend to max(current, now+duration)
   const now = Date.now();
   proxyBlocked = true;
   proxyBlockedUntil = Math.max(proxyBlockedUntil, now + durationMs);
   updateAutoBoostAvailability();

   // show red alert text
   showProxyAlert('Mr. Boardman blocked your proxy', 3000);

   // ensure ticker is running to update countdown and lift block
   if (proxyBlockTicker) clearInterval(proxyBlockTicker);
   proxyBlockTicker = setInterval(() => {
     const remain = proxyBlockedUntil - Date.now();
     // update the inline timer element each tick as well (keeps shop UI responsive)
     const timerEl = document.getElementById('proxy-timer');
     if (timerEl && proxyBlocked) {
       timerEl.textContent = `Sketchy Proxies disabled by Mr. Boardman — ${formatRemaining(Math.max(0, remain))}`;
     }
     if (remain <= 0) {
       proxyBlocked = false;
       proxyBlockedUntil = 0;
       clearInterval(proxyBlockTicker);
       proxyBlockTicker = null;
       updateAutoBoostAvailability();
       // small notification that proxies are available
       createNotification('Sketchy Proxies are active again.', 4000);
     } else {
       // refresh UI text
       updateAutoBoostAvailability();
     }
   }, 1000);
 }

 // occasionally (randomized interval) Mr. Boardman blocks proxies
 (function scheduleOccasionalBlocks(){
   // pick random interval between 18s and 40s to attempt a block
   function maybeSchedule() {
     const wait = 18000 + Math.floor(Math.random()*22000);
     setTimeout(() => {
       // 12% chance when timer fires
       if (Math.random() < 0.12) {
         triggerProxyBlock(120000); // 2 minutes
         // also produce a notification entry
         createNotification('Alert: Mr. Boardman blocked your proxy — Sketchy Proxies disabled for 2 minutes.', 5500);
       }
       maybeSchedule();
     }, wait);
   }
   maybeSchedule();
 })();

 // ensure availability reflects blocked state when ownership changes
 const origWriteAutoBoostOwned = writeAutoBoostOwned;
 writeAutoBoostOwned = function(n){
   origWriteAutoBoostOwned(n);
   updateAutoBoostAvailability();
 };

 // initial check in case something persisted
 updateAutoBoostAvailability();

/* --- Info dialog logic for shop items --- */
const infoOverlay = document.getElementById('info-overlay');
const infoBoxMsg = document.getElementById('info-msg');
const infoClose = document.getElementById('info-close');

/* --- Factory Reset shop item: disables non-quiz notifications and prevents Mr. Boardman from blocking proxies for 10 minutes; grants a persistent 2.5× multiplier --- */
const FACTORY_KEY = 'an_s_factory_reset_v1';
const FACTORY_ACTIVE_KEY = 'an_s_factory_reset_until_v1';
const buyFactoryBtn = document.getElementById('buy-factory');
const factoryPriceEl = document.getElementById('factory-price');
const ownedFactoryEl = document.getElementById('owned-factory');

let factoryOwned = (function(){ const v = localStorage.getItem(FACTORY_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
let factoryUntil = (function(){ const v = parseInt(localStorage.getItem(FACTORY_ACTIVE_KEY)||'0',10); return Number.isFinite(v)?v:0; })();
let factoryTicker = null;

function writeFactoryOwned(n){
  factoryOwned = n;
  try { localStorage.setItem(FACTORY_KEY, String(n)); } catch(e){}
  if (ownedFactoryEl) ownedFactoryEl.textContent = `Owned: ${n}`;
  updateClickPower();
}
function updateFactoryPriceDisplay(){
  if (factoryPriceEl) factoryPriceEl.textContent = `Cost: 100000`;
}
function enableFactoryMode(durationMs = 10*60*1000) {
  // mark expiry
  const now = Date.now();
  factoryUntil = Math.max(factoryUntil, now + durationMs);
  try { localStorage.setItem(FACTORY_ACTIVE_KEY, String(factoryUntil)); } catch(e){}
  // Stop generating regular notifications but preserve quiz notifications.
  stopNotifGenerator();
  // remove any existing non-quiz notifications
  try {
    const nodes = Array.from(notifContainer.querySelectorAll('.notif'));
    nodes.forEach(n => {
      if (!(n.dataset && n.dataset.quiz === '1')) {
        n.remove();
      }
    });
  } catch(e){}
  // disable proxy blocking for duration
  proxyBlocked = false;
  // prevent triggerProxyBlock from scheduling blocks while factory mode active by setting proxyBlockedUntil to factoryUntil
  proxyBlockedUntil = factoryUntil;
  // ensure buyAutoBoostBtn stays enabled (update UI)
  updateAutoBoostAvailability();

  // apply persistent multiplier (2.5x)
  try {
    permanentMultiplier = (permanentMultiplier || 1) * 2.5;
    localStorage.setItem(PERM_KEY, String(permanentMultiplier));
  } catch(e){}

  // start ticker to re-enable behavior when time expires
  if (factoryTicker) clearInterval(factoryTicker);
  factoryTicker = setInterval(() => {
    const remain = factoryUntil - Date.now();
    if (remain <= 0) {
      clearInterval(factoryTicker);
      factoryTicker = null;
      try {
        localStorage.removeItem(FACTORY_ACTIVE_KEY);
      } catch(e){}
      // re-enable regular notifications and allow Mr. Boardman blocks again
      startNotifGenerator();
      proxyBlocked = false;
      proxyBlockedUntil = 0;
      updateAutoBoostAvailability();
      createNotification('Factory Reset expired — normal notifications and proxy blocks restored.', 4200);
    }
  }, 1000);
}

if (buyFactoryBtn) {
  updateFactoryPriceDisplay();
  writeFactoryOwned(factoryOwned);
  // if previously active, restore ticker and disabled state
  if (factoryUntil > Date.now()) {
    // ensure notifications remain stopped while active
    stopNotifGenerator();
    proxyBlocked = false;
    proxyBlockedUntil = factoryUntil;
    updateAutoBoostAvailability();
    // ensure multiplier persisted already applied on previous purchase (permanentMultiplier read from storage)
    // start a ticker to re-enable when expired
    if (!factoryTicker) {
      factoryTicker = setInterval(() => {
        const remain = factoryUntil - Date.now();
        if (remain <= 0) {
          clearInterval(factoryTicker);
          factoryTicker = null;
          try { localStorage.removeItem(FACTORY_ACTIVE_KEY); } catch(e){}
          startNotifGenerator();
          proxyBlocked = false;
          proxyBlockedUntil = 0;
          updateAutoBoostAvailability();
          createNotification('Factory Reset expired — normal notifications and proxy blocks restored.', 4200);
        }
      }, 1000);
    }
  }

  buyFactoryBtn.addEventListener('click', () => {
    // Factory Reset is a one-time shop purchase; additional copies may only be obtained via the Golden Wheel
    if (factoryOwned > 0) {
      createNotification('Factory Reset is a one-time shop purchase; additional copies can only be obtained via Wheel Spins.', 4200);
      return;
    }
    // one-time purchase: each shop purchase applies a ×2.5 persistent multiplier and activates factory mode for 10 minutes
    const price = 100000;
    if (!spendForPurchase(price)) return;
    writeFactoryOwned(factoryOwned + 1);
    // apply immediate factory mode for 10 minutes
    enableFactoryMode(10*60*1000);
    // tease notification
    createNotification('System: Factory Reset initiated — most notifications silenced and proxies gated for 10 minutes.', 5200);
  });

  document.getElementById('upgrade-factory')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      buyFactoryBtn.click();
    }
  });
}

const INFO_TEXT = {
  chatgpt: "ChatGPT helps you fill out your assignments faster and add points to your grades.",
  principal: "You get principal for the day and rig the system to double your grades outcomes for two minutes.",
  sketchy: "You source out a Sketchy Proxy to achieve higher levels of AI usage and cheating, improving your ChatGPT points.",
  study: "Social Confidence spawns occasional helpful pencils; click them to receive an ANSWER KEY bonus (~1/10 of your current points). Note: buying items lowers your CGP (a reputation/ethics score) and CGP also drifts down over time; avoid excessive purchases if you want to keep CGP high or use Principal for the Day to restore CGP.",
  showers: "Showers Bald Head unlocks a secondary click button (Showers Bald Head) that grants a flat +50 points per click and includes a 0/500 progress counter — once you click it 500 times you gain +50 CGP. Requires Social Confidence to purchase.",
  detention: "Scary Pink Slip is a gag item: it costs points, makes you 'learn your lesson' by removing part of your score, but grants +20 CGP as moral growth — use it if you want a CGP bump at a cost.",
  mystery: "Sloppy Joe Day is a gamble: pay the price for a random outcome (jackpot, modest win, or loss) and a brief screen wobble; it's high risk/high fun for spontaneous gains or regrets.",
  hoodie: "Unwarranted ISS is a prestige gag that increases your manual click power (+2 per purchase) while lowering CGP slightly on purchase.",
  factory: "Factory Reset: Temporarily silence regular notifications (quizzes still appear) and block Mr. Boardman's proxy-blocking for 10 minutes; each purchase increases the item's future price by 2.5×.",
  ed_santos: "Mr. Santos will slowly help you get hall passes and shop credits, he's the only one keeping the school together either way.",
  mark: "Mark Spammers creates an orbiting spam-bot that auto-clicks the Showers Bald Head button periodically; upgrades increase its per-click bonus.",
  hinton: "Mr. Hinton the GOAT orbits the main clicker and periodically triggers a warm cutscene that grants hall passes, ChatGPT autoclickers, and shop credits on a repeating timer.",
  typhoon: "Mr Typhoon summons falling Richardson avatars every 30s; click a Richardson to get +5 ChatGPT autoclickers (one-time purchase that keeps spawning forever).",
  history: "History Class: Mr. Rick Caldwell will periodically fly in from the top and may strike either the main clicker or the Showers button (if present); on hit the screen is covered briefly with an orange overlay. One-time purchase."
};

function openInfo(key){
  const txt = INFO_TEXT[key] || "No information available.";
  if (!infoOverlay) return;
  infoBoxMsg.textContent = txt;
  infoOverlay.style.display = 'flex';
  infoOverlay.setAttribute('aria-hidden', 'false');
  // ensure skip button removed (if present) so openInfo shows only current content; skip may be added by Social Confidence flow
  const existingSkip = document.getElementById('info-skip');
  if (existingSkip) existingSkip.remove();
  infoClose && infoClose.focus && infoClose.focus();
}

function closeInfo(){
  if (!infoOverlay) return;
  infoOverlay.style.display = 'none';
  infoOverlay.setAttribute('aria-hidden', 'true');
}

// delegate clicks for all .info-btn
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.info-btn');
  if (btn) {
    const key = btn.getAttribute('data-info');
    openInfo(key);
  }
});

infoClose && infoClose.addEventListener('click', closeInfo);

/* --- CGP score system --- */
const CGP_KEY = 'an_s_cgp_v1';
const cgpEl = document.getElementById('cgp-score');
// default to 200 if no CGP stored yet; persist that initial value
let cgp = (function(){
  const v = localStorage.getItem(CGP_KEY);
  const n = parseFloat(v);
  if (Number.isFinite(n)) return n;
  try {
    localStorage.setItem(CGP_KEY, String(200));
  } catch(e){}
  return 200;
})();

// track last warned 100-point threshold (e.g. 0, -1, -2...)
let lastWarnThreshold = Math.floor(cgp / 100);

/* dynamic tint update based on CGP:
   maps cgp in [-500,500] to a color between red (low) and blue (high) and sets --tint-color */
function updateTintFromCGP(value) {
  const v = Number.isFinite(value) ? value : 0;
  const clamped = Math.max(-500, Math.min(500, v));
  // normalized 0..1 (0 => -500 -> red, 1 => +500 -> blue)
  const t = (clamped + 500) / 1000;

  // red color and blue color endpoints
  const r1 = { r: 255, g: 80, b: 60 };   // strong red
  const r2 = { r: 30, g: 120, b: 255 };  // strong blue

  const r = Math.round(r1.r + (r2.r - r1.r) * t);
  const g = Math.round(r1.g + (r2.g - r1.g) * t);
  const b = Math.round(r1.b + (r2.b - r1.b) * t);
  const alpha = 0.20; // keep tint opacity consistent with design

  // set CSS variable for use by the stylesheet
  try {
    document.documentElement.style.setProperty('--tint-color', `rgba(${r},${g},${b},${alpha})`);
  } catch (e) {
    // ignore in environments that don't allow style changes
  }
}

function writeCGP(n){
  cgp = n;
  localStorage.setItem(CGP_KEY, String(cgp));
  // update both the panel CGP and the compact top CGP
  if (cgpEl) cgpEl.textContent = `CGP: ${Math.round(cgp*10)/10}`;
  const topCgp = document.getElementById('big-cgp');
  if (topCgp) topCgp.textContent = `CGP: ${Math.round(cgp*10)/10}`;

  // update dynamic tint immediately whenever CGP changes
  updateTintFromCGP(cgp);

  // warn once each time CGP crosses another -100 boundary (e.g. -100, -200...)
  const currentThreshold = Math.floor(cgp / 100);
  if (currentThreshold < lastWarnThreshold) {
    // show a brief warning in the info overlay (auto-close)
    if (infoOverlay && infoBoxMsg) {
      infoBoxMsg.textContent = `Warning: your CGP dropped below ${currentThreshold * 100}.`;
      infoOverlay.style.display = 'flex';
      infoOverlay.setAttribute('aria-hidden', 'false');
      // auto-close after 4s
      setTimeout(() => {
        infoOverlay.style.display = 'none';
        infoOverlay.setAttribute('aria-hidden', 'true');
      }, 4000);
    } else {
      // fallback to alert
      try { alert(`Warning: your CGP dropped below ${currentThreshold * 100}.`); } catch (e) {}
    }
    lastWarnThreshold = currentThreshold;
  }

  // when CGP reaches -1000 or below, penalize but do not clear everything:
  if (cgp <= -1000) {
    // reduce points by 75% (keep 25%)
    try {
      const pts = readPoints();
      const remaining = Math.max(0, Math.floor(pts * 0.25));
      writePoints(remaining);
    } catch (err) {
      // ignore if readPoints/writePoints not available
    }

    // halve ChatGPT/autoclicker count (round down)
    try {
      const owned = readOwned();
      const newOwned = Math.floor(owned / 2);
      // persist and update UI via writeOwned
      writeOwned(newOwned);

      // clear visible conveyor items and adjust conveyor speed multiplier derived from newOwned
      clearPencilIntervals();
      conveyorSpeedMultiplier = Math.pow(1.25, Math.max(0, newOwned - 1));
      // layoutPencils is scoped inside the autoclicker setup; removing items is sufficient here,
      // newly bought or a resize will re-create visuals.
    } catch (err) {
      // ignore if functions not available
    }

    // nudge CGP upward slightly after the penalty so the same trigger doesn't immediately retrigger
    writeCGP(-999);
    return;
  }
}
writeCGP(cgp);

// decrease CGP by 20 every minute
setInterval(() => {
  writeCGP(cgp - 20);
}, 60_000);

// helper to adjust CGP on purchases; buying ChatGPT does not reduce CGP; buying Principal (multiplier) increases by +50
function adjustCGPOnPurchase(skipDecrease = false, principalBoost = false) {
  if (principalBoost) {
    writeCGP(cgp + 50);
    return;
  }
  if (!skipDecrease) {
    writeCGP(cgp - 5);
  }
}

// hook into purchases: wrap writePoints or call adjust inside each buy handler where appropriate
// We will call adjustCGPOnPurchase in places below (buyClickerBtn, buyMultiplierBtn, buyAutoBoostBtn, buyStudyBtn handlers).
// close info dialog with Escape key; also ':' spawns a Social Confidence answer-key pencil
window.addEventListener('keydown', (e) => {
  // if info overlay open, let Escape close it
  if (infoOverlay && infoOverlay.getAttribute('aria-hidden') === 'false') {
    if (e.key === 'Escape') {
      closeInfo();
      return;
    }
  }

   // spawn social pencil with ']' key (avoid while typing in inputs)
  if (e.key === ']' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
    // if spawn function exists, call it
    try {
      spawnSocialPencil();
    } catch (err) {
      // noop
    }
  }
});

/* --- Hinton Rodrick helper: one-time hall-pass purchase that orbits main clicker, triggers heart cutscene, grants rewards, and repeats forever --- */
(function setupHintonHelper(){
  const HINTON_KEY = 'an_s_hinton_v1';
  const HINTON_ID = 'hinton-orbit';
  const buyBtn = document.getElementById('buy-hinton');
  const ownedEl = document.getElementById('owned-hinton');

  let hintonOwned = (function(){ const v = localStorage.getItem(HINTON_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
  if (ownedEl) ownedEl.textContent = `Owned: ${hintonOwned}`;

  // create orbit element (circular cropped photo)
  function ensureHintonElement(){
    let el = document.getElementById(HINTON_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = HINTON_ID;
    el.style.position = 'fixed';
    el.style.width = '96px';
    el.style.height = '96px';
    el.style.borderRadius = '50%';
    el.style.overflow = 'hidden';
    el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.65)';
    el.style.zIndex = '380';
    el.style.pointerEvents = 'none';
    const img = document.createElement('img');
    img.src = '/HintonRodrick.jpg';
    img.alt = 'Hinton Rodrick';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    el.appendChild(img);
    document.body.appendChild(el);
    return el;
  }

  // big heart overlay
  function showHeartCutscene(){
    // create heart overlay
    const heart = document.createElement('div');
    heart.id = 'hinton-heart';
    heart.style.position = 'fixed';
    heart.style.left = '50%';
    heart.style.top = '50%';
    heart.style.transform = 'translate(-50%,-50%) scale(0.6)';
    heart.style.width = '80vmin';
    heart.style.height = '80vmin';
    heart.style.borderRadius = '20%';
    heart.style.zIndex = '500';
    heart.style.display = 'flex';
    heart.style.alignItems = 'center';
    heart.style.justifyContent = 'center';
    heart.style.pointerEvents = 'none';
    heart.style.background = 'radial-gradient(circle at 30% 30%, rgba(255,100,120,0.95), rgba(255,40,80,0.85))';
    heart.style.opacity = '0';
    heart.style.transition = 'opacity 420ms ease, transform 420ms cubic-bezier(.2,.9,.2,1)';

    // Hinton image next to heart
    const pic = document.createElement('img');
    pic.src = '/HintonRodrick.jpg';
    pic.alt = 'Hinton';
    pic.style.width = '24vmin';
    pic.style.height = '24vmin';
    pic.style.objectFit = 'cover';
    pic.style.borderRadius = '14px';
    pic.style.marginLeft = '2vmin';
    pic.style.opacity = '0';
    pic.style.transition = 'opacity 420ms ease';

    // container to center both
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.gap = '2vmin';
    container.style.flexDirection = 'row';
    container.appendChild(document.createElement('div')); // heart placeholder center
    container.appendChild(pic);
    heart.appendChild(container);
    document.body.appendChild(heart);

    // pulse animation
    setTimeout(() => {
      heart.style.opacity = '1';
      heart.style.transform = 'translate(-50%,-50%) scale(1)';
      pic.style.opacity = '1';
      // pulsing via CSS animation
      heart.style.animation = 'hinton-heart-pulse 1200ms ease-in-out infinite';
      // add keyframes once
      if (!document.getElementById('hinton-heart-style')) {
        const style = document.createElement('style');
        style.id = 'hinton-heart-style';
        style.textContent = `
          @keyframes hinton-heart-pulse {
            0% { transform: translate(-50%,-50%) scale(0.98); opacity: 0.88 }
            50% { transform: translate(-50%,-50%) scale(1.06); opacity: 1 }
            100% { transform: translate(-50%,-50%) scale(0.98); opacity: 0.88 }
          }
        `;
        document.head.appendChild(style);
      }
    }, 50);

    // fade out after 2s of visible pulsing and remove (stop pulsing first so fade is smooth)
    setTimeout(() => {
      // stop pulsing animation to allow a clean fade
      heart.style.animation = '';
      // ensure transitions are present for opacity/transform
      heart.style.transition = 'opacity 800ms ease, transform 800ms ease';
      pic.style.transition = 'opacity 800ms ease, transform 800ms ease';
      // fade both heart and picture
      heart.style.opacity = '0';
      pic.style.opacity = '0';
      // remove after transition completes
      setTimeout(() => { heart.remove(); }, 900);
    }, 2400);
  }

  // orbiting animation: rotate around clicker center, speed ramps over durationMs to targetRPM
  function startHintonOrbitLoop(){
    const el = ensureHintonElement();
    const clicker = document.getElementById('clicker');
    if (!clicker) return;
    let loopRunning = true;

    // ramp parameters
    const rampMs = 240000; // 4 minutes
    const startTime = Date.now();
    const startRPM = 0.005; // extremely slow start (revolutions per minute)
    const targetRPM = 750; // user requested extreme end
    // We'll ease the RPM increase (use ease-out cubic)
    function ease(t){ return 1 - Math.pow(1 - t, 3); }

    let last = Date.now();

    function tick(){
      if (!loopRunning) return;
      const now = Date.now();
      const elapsed = Math.max(0, now - startTime);
      const t = Math.min(1, elapsed / rampMs);
      const rpm = startRPM + (targetRPM - startRPM) * ease(t);
      // convert rpm to radians per ms: rpm/60 rev/sec -> rev/ms = rpm/(60*1000) ; angle increase per ms = rev/ms * 2π
      const revPerMs = rpm / 60000;
      const anglePerMs = revPerMs * Math.PI * 2;
      const dt = now - last;
      last = now;
      // accumulate angle on element
      el._hintonAngle = (el._hintonAngle || 0) + anglePerMs * dt;
      // compute position relative to clicker
      const rect = clicker.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // radius: keep it slightly outside clicker
      const radius = Math.max(120, Math.min(window.innerWidth, window.innerHeight) * 0.18);
      const x = Math.round(cx + Math.cos(el._hintonAngle) * radius - (el.offsetWidth / 2));
      const y = Math.round(cy + Math.sin(el._hintonAngle) * radius - (el.offsetHeight / 2));
      el.style.left = x + 'px';
      el.style.top = y + 'px';

      // when ramp completes (t === 1) trigger cutscene sequence and then continue loop (repeat forever)
      if (t >= 1) {
        // short pause to ensure dramatic effect before heart
        setTimeout(() => {
          // show heart cutscene
          showHeartCutscene();
          // grant rewards
          try { grantHallPass(2); } catch(e){}
          try {
            const currentOwned = readOwned();
            writeOwned(currentOwned + 2); // 2 free ChatGPT autoclickers
          } catch(e){}
          try {
            shopCredits = (typeof shopCredits === 'number' ? shopCredits : 0) + 0.1;
            persistShopCredits();
          } catch(e){}
          createNotification('Hinton event: +2 Hall Passes, +2 ChatGPT autoclickers, +0.1 shop credits!', 4800);
          // reset ramp to start again for repeating behavior: reset startTime so it will ramp again over 4 minutes
          // keep the element in place briefly, then restart ramp by resetting startTime and last to now
          el._hintonAngle = el._hintonAngle || 0;
          // small fade to emphasize the pulse
          el.style.transition = 'opacity 420ms ease';
          el.style.opacity = '0.0001';
          setTimeout(() => {
            el.style.opacity = '1';
            // reset ramp baseline
            last = Date.now();
            // restart ramp: set startTime to now so easing restarts
            arguments.callee && (startHintonOrbitLoop._restartAt = Date.now()); // noop placeholder
            // implement by setting startTime to now: easiest is to set a stored variable on element
            el._hintonRampStart = Date.now();
            // swap internal start time by creating a new tick loop with new start
            loopRunning = false;
            // start a new loop instance after small cooldown so variables re-init
            setTimeout(startHintonOrbitLoop, 800);
          }, 420);
        }, 300);
        return; // stop current loop; new one will be created
      }

      requestAnimationFrame(tick);
    }

    // initialize ramp start tracking on element so restart uses current time
    el._hintonRampStart = Date.now();
    last = Date.now();
    requestAnimationFrame(tick);
  }

  // We implement a wrapped start that uses element's ramp start if present (so restarts use new baseline)
  function startHintonOrbitLoopWrapper(){
    const el = ensureHintonElement();
    // if element already has a running flag, avoid double starts
    if (el._hintonRunning) return;
    el._hintonRunning = true;
    (function loop(){
      const elInner = el;
      // create a single-run ramp that when finishes triggers cutscene then schedules another ramp
      let startTs = Date.now();
      let lastTs = Date.now();
      const rampMs = 240000;
      const startRPM = 0.005;
      const targetRPM = 750;
      function ease(t){ return 1 - Math.pow(1 - t, 3); }
      function step(){
        const now = Date.now();
        const elapsed = now - startTs;
        const t = Math.min(1, elapsed / rampMs);
        const rpm = startRPM + (targetRPM - startRPM) * ease(t);
        const revPerMs = rpm / 60000;
        const anglePerMs = revPerMs * Math.PI * 2;
        const dt = now - lastTs;
        lastTs = now;
        elInner._hintonAngle = (elInner._hintonAngle || 0) + anglePerMs * dt;
        const clicker = document.getElementById('clicker');
        if (clicker) {
          const rect = clicker.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const radius = Math.max(120, Math.min(window.innerWidth, window.innerHeight) * 0.18);
          const x = Math.round(cx + Math.cos(elInner._hintonAngle) * radius - (elInner.offsetWidth / 2));
          const y = Math.round(cy + Math.sin(elInner._hintonAngle) * radius - (elInner.offsetHeight / 2));
          elInner.style.left = x + 'px';
          elInner.style.top = y + 'px';
        }
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          // completed ramp: show cutscene, grant rewards, then restart again
          showHeartCutscene();
          try { grantHallPass(2); } catch(e){}
          try {
            const currentOwned = readOwned();
            writeOwned(currentOwned + 2);
          } catch(e){}
          try {
            shopCredits = (typeof shopCredits === 'number' ? shopCredits : 0) + 0.1;
            persistShopCredits();
          } catch(e){}
          createNotification('Hinton event: +2 Hall Passes, +2 ChatGPT autoclickers, +0.1 shop credits!', 4800);
          // brief pause then restart ramp by resetting times
          setTimeout(() => {
            startTs = Date.now();
            lastTs = Date.now();
            requestAnimationFrame(step);
          }, 1000);
        }
      }
      requestAnimationFrame(step);
    })();
  }

  // Purchase handler
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      if (hintonOwned > 0) {
        createNotification('Mr. Hinton the GOAT is already purchased and active.', 3000);
        return;
      }
      if (!spendHallPasses(50)) return;
      hintonOwned = 1;
      try { localStorage.setItem(HINTON_KEY, String(hintonOwned)); } catch(e){}
      if (ownedEl) ownedEl.textContent = `Owned: ${hintonOwned}`;
      createNotification('You purchased Mr. Hinton the GOAT — a slow orbit begins...', 4500);
      ensureHintonElement();
      // start the orbit loop
      startHintonOrbitLoopWrapper();
    });
  }

  // If previously owned, start on load
  if (hintonOwned > 0) {
    setTimeout(() => {
      ensureHintonElement();
      startHintonOrbitLoopWrapper();
    }, 300);
  }

  // expose for deletion/debug
  window.startHintonOrbitLoop = startHintonOrbitLoopWrapper;
})();

/* --- Ed Santos helper: purchaseable helper that drifts up repeatedly over 5 minutes and grants resources each arrival --- */
(function setupSantosHelper(){
  const SANTOS_ID = 'santos-helper';
  const ED_KEY = 'an_s_ed_santos_v1';
  const ownedEl = document.getElementById('owned-ed-santos');
  // read persisted ownership (0 or 1+)
  let edOwned = (function(){ const v = localStorage.getItem(ED_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
  if (ownedEl) ownedEl.textContent = `Owned: ${edOwned}`;

  // buy button handler: spend 10 hall passes and persist ownership, then spawn helper
  const buyBtn = document.getElementById('buy-ed-santos');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      if (edOwned > 0) {
        createNotification('Mr. Santos is already helping you.', 3000);
        return;
      }
      // require 10 hall passes
      if (!spendHallPasses(10)) return;
      edOwned = (edOwned || 0) + 1;
      try { localStorage.setItem(ED_KEY, String(edOwned)); } catch(e){}
      if (ownedEl) ownedEl.textContent = `Owned: ${edOwned}`;
      createNotification('You purchased Mr. Santos! He will slowly arrive and help gather Hall Passes and shop credits.', 4500);
      // spawn the helper now (and start its infinite loop)
      startSantosLoop();
    });
  }

  // create the visual helper element (but do not auto-remove; reuse for each trip)
  function ensureSantosElement(){
    let el = document.getElementById(SANTOS_ID);
    if (el) return el;

    el = document.createElement('div');
    el.id = SANTOS_ID;
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.bottom = '-200px'; // start offscreen
    el.style.transform = 'translateX(-50%)';
    el.style.width = '120px';
    el.style.height = '120px';
    el.style.borderRadius = '14px';
    el.style.overflow = 'hidden';
    el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.65)';
    el.style.zIndex = '380';
    el.style.backgroundImage = "url('/ed_santos.jpg')";
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center center';
    el.style.opacity = '1';
    el.style.transition = 'transform 400ms ease, opacity 400ms ease, bottom 400ms ease';
    document.body.appendChild(el);
    return el;
  }

  // animate one trip: move from offscreen bottom to clicker center over durationMs, detect contact, grant, then reset.
  async function runOneTrip(durationMs = 10000) {
    const el = ensureSantosElement();
    const clickerEl = document.getElementById('clicker');
    // start state
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) scale(1)';
    el.style.bottom = '-200px';
    // animate using requestAnimationFrame loop
    const startTime = Date.now();
    const startBottom = -200;
    // compute target bottom each frame to account for resizing/moving UI
    return new Promise(resolve => {
      function step() {
        const now = Date.now();
        const t = Math.min(1, (now - startTime) / durationMs);
        // ease-in-out cubic
        const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        let targetBottom = Math.max(24, (window.innerHeight/2) - (120/2)); // fallback
        if (clickerEl) {
          const r = clickerEl.getBoundingClientRect();
          targetBottom = Math.max(12, window.innerHeight - (r.top + r.height/2) - (120/2));
        }
        const current = startBottom + (targetBottom - startBottom) * ease;
        el.style.bottom = `${current}px`;

        // check overlap: when element center is within 64px of clicker center, trigger arrival
        if (clickerEl) {
          const santosRect = el.getBoundingClientRect();
          const santosCenterX = santosRect.left + santosRect.width/2;
          const santosCenterY = santosRect.top + santosRect.height/2;
          const clickRect = clickerEl.getBoundingClientRect();
          const clickCenterX = clickRect.left + clickRect.width/2;
          const clickCenterY = clickRect.top + clickRect.height/2;
          const dx = santosCenterX - clickCenterX;
          const dy = santosCenterY - clickCenterY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist <= 64) {
            // arrival: grant rewards and play brief effect
            try { grantHallPass(1); } catch(e){}
            try {
              shopCredits = (typeof shopCredits === 'number' ? shopCredits : 0) + 0.1;
              persistShopCredits();
            } catch(e){}
            document.documentElement.style.setProperty('--tint-color', 'rgba(40,200,80,0.22)');
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) scale(1.06)';
            createNotification('Mr. Santos arrived — +1 Hall Pass and +0.1 shop credit!', 4200);
            // small delay to show arrival animation then resolve so the loop can reset
            setTimeout(() => {
              // restore tint from CGP after brief fade
              try { updateTintFromCGP(cgp); } catch(e){}
              resolve();
            }, 1400);
            return;
          }
        }

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          // finished path without contact (edge cases) — still resolve after small pause
          setTimeout(resolve, 600);
        }
      }
      requestAnimationFrame(step);
    });
  }

  // Main loop: if owned, continually perform trips with small pause between arrivals.
  let santosLoopRunning = false;
  async function startSantosLoop() {
    if (santosLoopRunning) return;
    if (edOwned <= 0) return;
    santosLoopRunning = true;
    ensureSantosElement();
    // small initial stagger
    await new Promise(r => setTimeout(r, 350));
    while (edOwned > 0) {
      try {
        await runOneTrip(300000); // 5 minutes per trip
        // brief pause between trips so the element resets offscreen visually
        await new Promise(r => setTimeout(r, 800));
        // reset element to offscreen and fade back in for next trip
        const el = document.getElementById(SANTOS_ID);
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'translateX(-50%) scale(1)';
          el.style.bottom = '-200px';
        }
        // tiny cooldown before next trip
        await new Promise(r => setTimeout(r, 600));
      } catch (e) {
        // if any error occurs, break loop to avoid infinite failure spam
        console.warn('Santos loop error', e);
        break;
      }
    }
    santosLoopRunning = false;
  }

  // If the player already owns Mr. Santos, start the loop on load
  if (edOwned > 0) {
    setTimeout(startSantosLoop, 250);
  }

  // expose start function so purchase handler can start it
  window.startSantosLoop = startSantosLoop;
})();

/* --- Mr Typhoon helper: Richardson_Tyree falling avatars that award autoclickers when clicked --- */
(function setupTyphoonHelper(){
  const TYPHOON_KEY = 'an_s_typhoon_v1';
  const TYPHOON_ID_PREFIX = 'typhoon-avatar-';
  const buyBtn = document.getElementById('buy-typhoon');
  const ownedEl = document.getElementById('owned-typhoon');

  let typhoonOwned = (function(){ const v = localStorage.getItem(TYPHOON_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
  if (ownedEl) ownedEl.textContent = `Owned: ${typhoonOwned}`;

  // create a falling Richardson avatar element with slightly slower fall and click handler
  function spawnTyphoonAvatar() {
    const id = TYPHOON_ID_PREFIX + Math.random().toString(36).slice(2,9);
    const el = document.createElement('div');
    el.id = id;
    el.className = 'falling-avatar front'; // keep it visible in front by default
    el.style.width = '56px';
    el.style.height = '56px';
    el.style.borderRadius = '50%';
    el.style.overflow = 'hidden';
    el.style.pointerEvents = 'auto';
    el.style.zIndex = 482;
    el.style.opacity = '0.9';
    const img = document.createElement('img');
    img.src = '/Richardson_Tyree.jpg';
    img.alt = 'Mr Typhoon';
    el.appendChild(img);

    // horizontal spawn area: avoid right panel
    const rightPanelWidth = Math.max(0, (document.getElementById('upgrades')?.clientWidth) || 0);
    const maxX = Math.max(0, window.innerWidth - rightPanelWidth - 40);
    const x = Math.floor(12 + Math.random() * Math.max(0, maxX - 24));
    el.style.left = x + 'px';

    // slower fall: duration 12..20s
    const duration = 12 + Math.random() * 8;
    el.style.animation = `fall-down ${duration}s linear forwards`;
    // small delay randomness
    el.style.animationDelay = (Math.random()*1.5) + 's';

    // click handler: award 5 autoclickers (persist & update UI)
    function handleClick(e){
      e.stopPropagation();
      // grant 5 autoclickers: update stored ownership and UI
      try {
        const current = readOwned();
        writeOwned(current + 5);
        createNotification('+5 ChatGPT autoclickers granted by Mr Typhoon!', 4200);
        // after granting, update conveyor layout
        if (typeof layoutPencils === 'function') {
          try {
            // re-layout using current owned count
            // call layoutPencils if available in scope (exists within buyClickerBtn closure)
            layoutPencils && layoutPencils(readOwned());
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Typhoon grant error', err);
      }
      // remove avatar visually
      el.remove();
    }
    el.addEventListener('click', handleClick);
    // cleanup on animation end
    el.addEventListener('animationend', () => el.remove());
    document.body.appendChild(el);
    // safety removal after duration + buffer
    setTimeout(()=> { if (document.body.contains(el)) el.remove(); }, (duration + 2) * 1000);
  }

  // periodic spawner runs every 30s when owned
  let typhoonInterval = null;
  function startTyphoonLoop(){
    if (typhoonInterval) return;
    typhoonInterval = setInterval(() => {
      // spawn 1 avatar per cycle (could be scaled later)
      spawnTyphoonAvatar();
    }, 30000);
    // spawn one immediately for instant feedback
    setTimeout(spawnTyphoonAvatar, 200);
  }
  function stopTyphoonLoop(){
    if (typhoonInterval) { clearInterval(typhoonInterval); typhoonInterval = null; }
  }

  // buy handler
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      if (typhoonOwned > 0) {
        createNotification('Mr Typhoon is already activated.', 3000);
        return;
      }
      if (!spendHallPasses(12)) return;
      typhoonOwned = 1;
      try { localStorage.setItem(TYPHOON_KEY, String(typhoonOwned)); } catch(e){}
      if (ownedEl) ownedEl.textContent = `Owned: ${typhoonOwned}`;
      createNotification('You purchased Mr Typhoon — Richardson avatars will fall every 30s!', 4200);
      startTyphoonLoop();
    });
  }

  // start on load if previously bought
  if (typhoonOwned > 0) {
    setTimeout(startTyphoonLoop, 300);
  }

  // expose for debug
  window.startTyphoonLoop = startTyphoonLoop;
})();

/* --- History Class helper: Rick Caldwell swooping strikes --- */
(function setupHistoryHelper(){
  const HISTORY_KEY = 'an_s_history_v1';
  const buyBtn = document.getElementById('buy-history');
  const ownedEl = document.getElementById('owned-history');
  let historyOwned = (function(){ const v = localStorage.getItem(HISTORY_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
  if (ownedEl) ownedEl.textContent = `Owned: ${historyOwned}`;

  // create full-screen orange overlay on hit
  function showOrangeOverlay(/* durationMs no longer used; fade timing fixed */) {
    let ov = document.getElementById('history-orange-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'history-orange-overlay';
      ov.style.position = 'fixed';
      ov.style.left = '0';
      ov.style.top = '0';
      ov.style.right = '0';
      ov.style.bottom = '0';
      ov.style.background = 'rgba(255,140,0,0.95)';
      ov.style.zIndex = '9999';
      ov.style.opacity = '0';
      ov.style.pointerEvents = 'none';
      // ensure immediate show uses no fade, we'll set fade when starting the hide
      ov.style.transition = 'opacity 0ms linear';
      document.body.appendChild(ov);
    }
    // show immediately (no fade-in)
    ov.style.transition = 'opacity 0ms linear';
    ov.style.opacity = '1';

    // start fade after 200ms, and have the fade last 1600ms
    const FADE_DELAY = 200;
    const FADE_DURATION = 1600;
    setTimeout(() => {
      // set transition to the desired fade duration and begin fade
      ov.style.transition = `opacity ${FADE_DURATION}ms ease`;
      ov.style.opacity = '0';
      // remove element after fade completes (give small buffer)
      setTimeout(() => { try { ov.remove(); } catch(e){} }, FADE_DURATION + 80);
    }, FADE_DELAY);
  }

  // spawn one Rick that flies in from top and targets either showers or main clicker
  function spawnRick() {
    const el = document.createElement('div');
    el.className = 'falling-avatar front';
    el.style.width = '88px';
    el.style.height = '88px';
    el.style.borderRadius = '50%';
    el.style.overflow = 'hidden';
    el.style.pointerEvents = 'none';
    el.style.zIndex = 990;
    const img = document.createElement('img');
    img.src = '/RickCaldwell.jpg';
    img.alt = 'Rick Caldwell';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    el.appendChild(img);

    // start off-screen (above)
    el.style.left = Math.max(12, (window.innerWidth * 0.2 + Math.random() * (window.innerWidth*0.6))) + 'px';
    el.style.top = '-140px';
    el.style.opacity = '1';
    document.body.appendChild(el);

    // determine possible targets
    const showersBtn = document.getElementById('clicker-showers');
    const clickerBtn = document.getElementById('clicker');
    const targets = [];
    if (showersBtn && getComputedStyle(showersBtn).display !== 'none') targets.push(showersBtn);
    if (clickerBtn) targets.push(clickerBtn);
    if (targets.length === 0) {
      // no valid target: fly across and disappear quickly
      el.style.transition = 'top 600ms cubic-bezier(.2,.9,.2,1), left 600ms linear, transform 600ms linear';
      el.style.top = (window.innerHeight * 0.6) + 'px';
      el.style.left = (parseInt(el.style.left,10) + 40) + 'px';
      // rotate while flying
      let rot = 0;
      const rotTick = setInterval(()=>{ rot += 0.8; el.style.transform = `rotate(${rot}deg)`; }, 40);
      setTimeout(()=>{ clearInterval(rotTick); el.remove(); }, 900);
      return;
    }

    // pick target randomly; if only one available, pick that
    let chosen;
    if (targets.length === 1) chosen = targets[0];
    else chosen = (Math.random() < 0.5) ? targets[0] : targets[1];

    // compute target center
    const rect = chosen.getBoundingClientRect();
    const targetX = rect.left + rect.width/2 - 44; // center minus half width of Rick
    const targetY = rect.top + rect.height/2 - 44;

    // flight: a bit slower for more dramatic swoop
    const flightMs = 800 + Math.random()*200; // ~800-1000ms
    // allow rotation midair: faster rotation while flying
    el.style.transition = `left ${flightMs}ms cubic-bezier(.2,.9,.2,1), top ${flightMs}ms cubic-bezier(.2,.9,.2,1)`;
    // start a rotation interval (faster spin)
    let rot = 0;
    const rotInterval = setInterval(() => {
      rot += 8; // faster rotation per tick
      el.style.transform = `rotate(${rot}deg)`;
    }, 40);

    // trigger the flight (use requestAnimationFrame to ensure start values applied)
    requestAnimationFrame(() => {
      el.style.left = `${Math.max(8, targetX)}px`;
      el.style.top = `${Math.max(8, targetY)}px`;
    });

    // after flight ends, consider it a hit
    setTimeout(() => {
      clearInterval(rotInterval);
      // hit effect: show orange overlay
      showOrangeOverlay(1400);

      // Instead of incrementing counters or awarding CGP, multiply the player's points by 1.1× on any hit.
      try {
        const pts = readPoints();
        const newPts = Math.max(0, Math.round(pts * 1.1));
        writePoints(newPts);
        createNotification('History hit: points ×1.1', 3200);
      } catch (err) {
        console.warn('History hit: failed to apply points multiplier', err);
      }

      // small impact animation then remove
      el.style.transition = 'opacity 260ms ease, transform 260ms ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.9) rotate(' + (rot + 20) + 'deg)';
      setTimeout(()=>{ try{ el.remove(); }catch(e){} }, 320);
    }, flightMs + 10);
  }

  // purchase/start handlers
  function startHistoryLoop(){
    // spawn immediately once then every 20s
    spawnRick();
    const id = setInterval(() => {
      spawnRick();
    }, 20000);
    // persist interval ID so we could clear if needed (attach to window)
    window._historyRickInterval = id;
  }

  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      // ensure one-time and spend 70 hall passes
      if (historyOwned > 0) {
        createNotification('Rick Bombshell already purchased.', 3000);
        return;
      }
      if (!spendHallPasses(70)) return;
      historyOwned = 1;
      try { localStorage.setItem(HISTORY_KEY, String(historyOwned)); } catch(e){}
      if (ownedEl) ownedEl.textContent = `Owned: ${historyOwned}`;
      createNotification('Rick Bombshell purchased — expect visits from Rick Caldwell every 20s.', 4200);
      // start loop
      startHistoryLoop();
    });
  }

  // on load if previously bought
  if (historyOwned > 0) {
    setTimeout(() => {
      startHistoryLoop();
    }, 300);
  }
})();

/* --- Falling avatars (circular djKz03JO_400x400.jpg) ---
   - Active avatars scale with points: one avatar per 100 points, capped at 50.
   - Avatars continuously respawn to maintain the active count.
*/
(function setupFallingAvatars(){
  const AVATAR_SRC = '/djKz03JO_400x400.jpg';
  const MAX_AVATARS = 50;
  const POINTS_PER_AVATAR = 100; // one avatar per 100 points
  const container = document.body;

  // track active avatars
  const activeAvatars = new Set();

  function computeTargetCount(){
    const pts = readPoints();
    return Math.min(MAX_AVATARS, Math.floor(pts / POINTS_PER_AVATAR));
  }

  // spawnAvatar now supports an optional custom size to allow varying sizes; default max size matches previous visuals
  function spawnAvatar(isFront, customSize) {
    const el = document.createElement('div');
    el.className = 'falling-avatar ' + (isFront ? 'front' : 'behind');
    const img = document.createElement('img');
    img.src = AVATAR_SRC;
    img.alt = 'avatar';
    el.appendChild(img);

    // choose size: allow varying sizes up to the previous max of 56px
    // if customSize provided, use that (px); otherwise random between 24 and 56
    const maxDefault = 56;
    const minDefault = 24;
    const size = typeof customSize === 'number' ? customSize : Math.round(minDefault + Math.random() * (maxDefault - minDefault));
    el.style.width = size + 'px';
    el.style.height = size + 'px';

    // set a consistent semi-transparency (about 65%) and slight size-based opacity variance
    const baseOpacity = 0.65;
    const variance = (Math.random() * 0.15) - 0.075; // -0.075..+0.075
    el.style.opacity = Math.max(0.35, Math.min(0.95, baseOpacity + variance));

    // random horizontal start position across viewport width (avoid overlapping the right panel)
    const rightPanelWidth = Math.max(0, (document.getElementById('upgrades')?.clientWidth) || 0);
    const maxX = Math.max(0, window.innerWidth - rightPanelWidth - 40);
    const x = Math.floor(12 + Math.random() * Math.max(0, maxX - 24));
    el.style.left = x + 'px';

    // random drift and rotation for variety
    const drift = (Math.random() * 160 - 80).toFixed(1) + 'px';
    const rot = (Math.random() * 720 - 360).toFixed(1) + 'deg';
    el.style.setProperty('--drift', drift);
    el.style.setProperty('--rot', rot);

    // random duration (longer feels more natural)
    const duration = 6 + Math.random() * 8; // 6s..14s
    el.style.animation = `fall-down ${duration}s linear forwards`;
    // slight random delay so they don't all fall at once
    const delay = Math.random() * 2;
    el.style.animationDelay = `${delay}s`;

    // remove when animation finishes
    const cleanup = () => {
      activeAvatars.delete(el);
      el.remove();
    };
    el.addEventListener('animationend', cleanup);
    el.addEventListener('transitionend', cleanup);

    container.appendChild(el);
    activeAvatars.add(el);

    // safety: ensure removal after max life (duration + delay + buffer)
    setTimeout(() => {
      if (container.contains(el)) {
        activeAvatars.delete(el);
        el.remove();
      }
    }, (duration + delay + 1) * 1000);
  }

  // maintain avatar population to match target
  function maintainAvatars() {
    try {
      const target = computeTargetCount();
      // determine how many should be behind vs front
      const behindTarget = Math.floor(target / 2);
      const frontTarget = target - behindTarget;

      // count current behind/front
      let currentBehind = 0;
      let currentFront = 0;
      activeAvatars.forEach(node => {
        if (node.classList && node.classList.contains('front')) currentFront++;
        else currentBehind++;
      });

      // spawn behind as needed
      const toSpawnBehind = Math.max(0, behindTarget - currentBehind);
      for (let i = 0; i < toSpawnBehind; i++) {
        spawnAvatar(false);
      }
      // spawn front as needed
      const toSpawnFront = Math.max(0, frontTarget - currentFront);
      for (let i = 0; i < toSpawnFront; i++) {
        spawnAvatar(true);
      }

      // if too many total, trim oldest nodes preferring to remove excess from front first
      while (activeAvatars.size > target) {
        // find a front node first
        let removed = false;
        for (const node of activeAvatars) {
          if (node.classList && node.classList.contains('front')) {
            activeAvatars.delete(node);
            node.remove();
            removed = true;
            break;
          }
        }
        if (!removed) {
          // remove any node
          const it = activeAvatars.values().next();
          if (it.done) break;
          const node = it.value;
          activeAvatars.delete(node);
          node.remove();
        }
      }
    } catch (e) {
      // silent
    }
  }

  // run periodically to adapt to points changes and handle viewport resize
  const interval = setInterval(maintainAvatars, 1200);

  window.addEventListener('resize', () => {
    // reposition a few if needed next tick
    setTimeout(maintainAvatars, 250);
  });

  // also react to point changes by wrapping writePoints to trigger maintenance
  const origWritePoints = writePoints;
  writePoints = function(n){
    origWritePoints(n);
    // schedule maintain shortly after points update
    setTimeout(maintainAvatars, 120);
  };

  // initial check on load
  setTimeout(maintainAvatars, 300);
})();

/* --- Golden Hall Pass wheel: rare floating golden hall pass that opens a randomized shop wheel spin --- */
(function setupGoldenWheel(){
  const WHEEL_KEY = 'an_s_wheel_spins_v1';
  const WHEEL_LAST_GRANT = 'an_s_wheel_last_grant_v1';
  // spins the player currently has
  let wheelSpins = (function(){ const v = localStorage.getItem(WHEEL_KEY); const n = parseInt(v,10); return Number.isFinite(n)?n:3; })();
  function persistSpins(){ try { localStorage.setItem(WHEEL_KEY, String(wheelSpins)); } catch(e){} updateWheelUI(); }
  // grant one spin every 10 minutes (600000ms)
  function scheduleWheelGrant() {
    try {
      const last = parseInt(localStorage.getItem(WHEEL_LAST_GRANT) || '0',10) || 0;
      const now = Date.now();
      const tenMin = 10*60*1000;
      if (now - last >= tenMin) {
        wheelSpins = Math.max(0,wheelSpins) + 1;
        persistSpins();
        localStorage.setItem(WHEEL_LAST_GRANT, String(now));
        createNotification('You received 1 Wheel Spin!', 3200);
      }
    } catch(e){}
  }
  // run periodic check every minute to top up if needed
  setInterval(() => {
    scheduleWheelGrant();
  }, 60_000);

  // UI: bottom-left spin button with count
  const spinBtn = document.createElement('button');
  spinBtn.id = 'wheel-spin-btn';
  spinBtn.className = 'buy-btn';
  spinBtn.style.position = 'fixed';
  spinBtn.style.left = '18px';
  spinBtn.style.bottom = 'calc(var(--safe-gap) + 18px)';
  spinBtn.style.zIndex = '600';
  spinBtn.style.display = 'flex';
  spinBtn.style.flexDirection = 'column';
  spinBtn.style.alignItems = 'center';
  spinBtn.style.justifyContent = 'center';
  spinBtn.style.width = '84px';
  spinBtn.style.height = '84px';
  spinBtn.style.borderRadius = '12px';
  spinBtn.innerHTML = `<div style="font-weight:900">Wheel</div><div id="wheel-spin-count" style="font-weight:900;margin-top:6px;">${wheelSpins}</div>`;
  document.body.appendChild(spinBtn);

  function updateWheelUI(){
    const el = document.getElementById('wheel-spin-count');
    if (el) el.textContent = String(wheelSpins);
    spinBtn.disabled = wheelSpins <= 0;
    spinBtn.style.opacity = wheelSpins<=0 ? '0.6' : '1';
  }
  updateWheelUI();

  // Golden hall pass spawn: rare, random across 3..8 minutes; visually similar to floating-pencil but gold hall pass
  function spawnGoldenHallPass(){
    // create a full-screen golden tint overlay that animates in/out
    const overlay = document.createElement('div');
    overlay.className = 'golden-hallpass-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '760';
    overlay.style.pointerEvents = 'none';
    // start transparent and with no transform; we'll animate to visible + scale + rotate then fade out
    overlay.style.background = 'rgba(255,230,120,0)';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(0.98) rotate(0deg)';
    overlay.style.transition = 'opacity 1000ms ease, transform 1500ms cubic-bezier(.2,.9,.2,1)';
    document.body.appendChild(overlay);

    // trigger fade-in and growth/rotation (fade-in 1s; scale+rotate over 1.5s)
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.background = 'rgba(255,230,120,0.88)'; // visible golden tint
      overlay.style.transform = 'scale(1.08) rotate(14deg)';
    });

    // schedule fade-out after the grow/rotate finishes (1.5s) so total visible time blends: fade-out for 1s starting at 1.5s
    setTimeout(() => {
      overlay.style.transition = 'opacity 1000ms ease, transform 1000ms cubic-bezier(.2,.9,.2,1)';
      overlay.style.opacity = '0';
      // slightly increase scale during fade-out for subtle movement
      overlay.style.transform = 'scale(1.12) rotate(18deg)';
      // remove overlay after fade completes
      setTimeout(() => { try { overlay.remove(); } catch(e){} }, 1000);
    }, 1500);

    // create the clickable golden hall pass element itself (kept visually similar to before)
    const fp = document.createElement('div');
    fp.className = 'floating-hallpass';
    fp.style.position = 'fixed';
    fp.style.zIndex = 770;
    fp.style.pointerEvents = 'auto';
    fp.style.width = '84px';
    fp.style.height = '84px';
    fp.style.borderRadius = '12px';
    fp.style.left = (24 + Math.random() * (Math.max(120, window.innerWidth - 220))) + 'px';
    fp.style.top = (24 + Math.random() * (Math.max(120, window.innerHeight - 240))) + 'px';
    fp.style.background = 'linear-gradient(180deg,#ffd86b,#ffb84d)';
    fp.style.display = 'flex';
    fp.style.alignItems = 'center';
    fp.style.justifyContent = 'center';
    fp.style.boxShadow = '0 18px 40px rgba(255,180,60,0.18)';
    fp.style.opacity = '0';
    fp.style.transition = 'opacity 420ms ease, transform 420ms cubic-bezier(.2,.9,.2,1)';
    // use the Hall Pass image with a golden tint overlay via CSS filter to differentiate it
    const img = document.createElement('img');
    img.src = '/354-3547953_school-hall-pass-id-letter-h-pass-stranger.png';
    img.alt = 'Golden Hall Pass';
    img.style.width = '72%';
    img.style.height = '72%';
    img.style.objectFit = 'contain';
    img.style.filter = 'sepia(0.35) saturate(1.6) hue-rotate(10deg) brightness(1.05) drop-shadow(0 8px 20px rgba(0,0,0,0.35))';
    img.style.pointerEvents = 'none';
    fp.appendChild(img);

    // subtle gold gradient background to make it pop
    fp.style.background = 'linear-gradient(180deg, rgba(255,230,140,0.95), rgba(255,200,80,0.92))';
    fp.style.border = '1px solid rgba(255,190,60,0.14)';
    fp.style.boxShadow = '0 18px 40px rgba(255,170,40,0.12)';

    document.body.appendChild(fp);
    // fade in then linger
    requestAnimationFrame(()=> { fp.style.opacity = '1'; fp.style.transform = 'scale(1.02)'; });

    // click opens wheel modal
    fp.addEventListener('click', (e) => {
      e.stopPropagation();
      try { fp.remove(); } catch(e){}
      try { overlay.remove(); } catch(e){}
      openWheelModal();
    });

    // auto-remove after 8s if not clicked (fade)
    setTimeout(()=> {
      try { fp.style.opacity = '0'; fp.style.transform = 'scale(0.96)'; setTimeout(()=>fp.remove(),420); } catch(e){}
    }, 8000);
  }

  // expose spawn helper so external code (like secret codes) can trigger the golden hall pass
  try { window.spawnGoldenHallPass = spawnGoldenHallPass; } catch (e) {}


  // schedule spawns rarely: between 180s..480s
  (function scheduleSpawn(){
    const wait = 180000 + Math.floor(Math.random()*300000); // 3..8 minutes
    setTimeout(() => {
      // small chance to spawn to keep rarity
      if (Math.random() < 0.35) spawnGoldenHallPass();
      scheduleSpawn();
    }, wait);
  })();

  /* Wheel items: list of shop item keys and weights (rarer items have lower weight).
     Keys must map to handler logic that grants the prize when spun. */
  const WHEEL_ITEMS = [
    // make 1000 points and ChatGPT the most common outcomes, 10000 less common,
    // 1 Hall Pass rare, and 1 Shop Credit very rare (similar rarity to one-time hall-pass items)
    { key: 'pts1k', label: '1,000 points', weight: 240 },
    { key: 'chatgpt', label: 'ChatGPT autoclicker', weight: 240 },
    { key: 'pts10k', label: '10,000 points', weight: 80 },
    { key: 'showers', label: 'Showers Bald Head', weight: 40 },
    { key: 'factory', label: 'Factory Reset', weight: 20 },
    { key: 'study', label: 'Social Confidence', weight: 120 },
    { key: 'mark', label: 'Mark Spammers', weight: 8 }, // one-time, rare
    { key: 'typhoon', label: 'Mr Typhoon', weight: 7 }, // one-time, rare
    { key: 'hinton', label: 'Mr Hinton the GOAT', weight: 6 }, // one-time, rare
    { key: 'ed_santos', label: 'Mr. Santos', weight: 60 },
    { key: 'hallpass', label: '1 Hall Pass', weight: 18 }, // rare
    { key: 'shopcredit', label: '1 Shop Credit', weight: 6 } // very hard to get
  ];

  // compute weighted list with exclusions: for one-time items remove if already owned (except allowed extras Mark/Typhoon/Hinton but with very low chance if already owned)
  function buildWheelPool() {
    const pool = [];
    WHEEL_ITEMS.forEach(item => {
      let include = true;
      // detect ownership for one-time items
      if (item.key === 'mark') {
        const owned = markOwned || 0;
        if (owned >= 1) {
          // allow extremely rare chance (1/10 weight reduction)
          if (Math.random() > 0.06) include = false;
        }
      } else if (item.key === 'typhoon') {
        const owned = (function(){ const v = localStorage.getItem('an_s_typhoon_v1'); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
        if (owned >= 1) {
          if (Math.random() > 0.06) include = false;
        }
      } else if (item.key === 'hinton') {
        const owned = (function(){ const v = localStorage.getItem('an_s_hinton_v1'); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
        if (owned >= 1) {
          if (Math.random() > 0.06) include = false;
        }
      } else {
        // other one-time style items: if owned, exclude
        if (item.key === 'showers') {
          if (showersOwned > 0) include = false;
        }
        if (item.key === 'study') {
          if (studyOwned > 0) include = false;
        }
        if (item.key === 'factory') {
          if (factoryOwned > 0) include = false;
        }
      }
      if (!include) return;
      // push weight times for simple weighted random
      for (let i=0;i<Math.max(1, Math.floor(item.weight));i++) pool.push(item);
    });
    // fallback: if pool empty, include a safe prize
    if (pool.length === 0) pool.push({ key:'detention', label:'Scary Pink Slip' });
    return pool;
  }

  // wheel modal creation & spin logic
  let wheelModal = null;
  function openWheelModal(){
    if (!wheelModal) {
      wheelModal = document.createElement('div');
      wheelModal.id = 'wheel-modal';
      wheelModal.style.position = 'fixed';
      wheelModal.style.left = '0';
      wheelModal.style.top = '0';
      wheelModal.style.right = '0';
      wheelModal.style.bottom = '0';
      wheelModal.style.zIndex = '10000';
      wheelModal.style.display = 'flex';
      wheelModal.style.alignItems = 'center';
      wheelModal.style.justifyContent = 'center';
      wheelModal.style.background = 'rgba(0,0,0,0.85)';

      const box = document.createElement('div');
      box.style.width = 'min(92%,720px)';
      box.style.maxWidth = '720px';
      box.style.background = '#071018';
      box.style.borderRadius = '12px';
      box.style.padding = '18px';
      box.style.color = 'var(--btn-bg)';
      box.style.boxShadow = '0 28px 64px rgba(0,0,0,0.8)';
      box.style.display = 'flex';
      box.style.flexDirection = 'column';
      box.style.alignItems = 'center';
      box.style.gap = '12px';

      const title = document.createElement('div');
      title.style.fontWeight = '900';
      title.style.fontSize = '18px';
      title.textContent = 'Golden Wheel';
      box.appendChild(title);

      const wheelWrap = document.createElement('div');
      wheelWrap.style.position = 'relative';
      wheelWrap.style.width = '420px';
      wheelWrap.style.height = '420px';
      wheelWrap.style.borderRadius = '50%';
      wheelWrap.style.overflow = 'hidden';
      wheelWrap.style.background = 'conic-gradient(#ffd86b, #ffb84d, #ffd86b)';
      wheelWrap.style.display = 'flex';
      wheelWrap.style.alignItems = 'center';
      wheelWrap.style.justifyContent = 'center';
      wheelWrap.style.boxShadow = '0 24px 60px rgba(0,0,0,0.6)';
      // inner disc to show current selection
      const wheelDisc = document.createElement('div');
      wheelDisc.id = 'wheel-disc';
      wheelDisc.style.width = '84%';
      wheelDisc.style.height = '84%';
      wheelDisc.style.borderRadius = '50%';
      wheelDisc.style.background = '#0b0b0b';
      wheelDisc.style.display = 'flex';
      wheelDisc.style.alignItems = 'center';
      wheelDisc.style.justifyContent = 'center';
      wheelDisc.style.flexDirection = 'column';
      wheelDisc.style.gap = '6px';
      wheelDisc.innerHTML = `<div id="wheel-result-label" style="font-weight:800;font-size:16px;color:var(--btn-bg)">Ready</div><div id="wheel-instructions" style="opacity:0.9;font-size:13px">Click Spin to try your luck</div>`;
      wheelWrap.appendChild(wheelDisc);
      box.appendChild(wheelWrap);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '10px';
      actions.style.marginTop = '6px';
      actions.style.alignItems = 'center';
      const spinAction = document.createElement('button');
      spinAction.className = 'buy-btn';
      spinAction.id = 'wheel-action-spin';
      spinAction.textContent = 'Spin';
      const close = document.createElement('button');
      close.className = 'buy-btn danger';
      close.textContent = 'Close';
      actions.appendChild(spinAction);
      actions.appendChild(close);
      box.appendChild(actions);

      wheelModal.appendChild(box);
      document.body.appendChild(wheelModal);

      // helper: visual pulse + fade of shop icons when spin starts
      function pulseShopVisuals(pool) {
        try {
          // collect shop image elements by known upgrade ids
          const shopIds = [
            'upgrade-clicker','upgrade-multiplier','upgrade-auto-boost','upgrade-hinton','upgrade-ed-santos',
            'upgrade-typhoon','upgrade-history','upgrade-study-group','upgrade-mark-spammers','upgrade-showers',
            'upgrade-factory','upgrade-detention','upgrade-mystery','upgrade-hoodie'
          ];
          const icons = [];
          shopIds.forEach(id=>{
            const node = document.getElementById(id);
            if (node) {
              // try to find the img within the card
              const img = node.querySelector('img');
              if (img) icons.push(img);
            }
          });
          // fallback: if pool provided with keys, attempt to also map by key->selector (robust attempt)
          if (icons.length === 0 && Array.isArray(pool)) {
            pool.forEach(item => {
              const idMap = {
                chatgpt: 'upgrade-clicker',
                principal: 'upgrade-multiplier',
                sketchy: 'upgrade-auto-boost',
                study: 'upgrade-study-group',
                hinton: 'upgrade-hinton',
                ed_santos: 'upgrade-ed-santos',
                typhoon: 'upgrade-typhoon',
                history: 'upgrade-history',
                mark: 'upgrade-mark-spammers',
                showers: 'upgrade-showers',
                factory: 'upgrade-factory',
                detention: 'upgrade-detention',
                mystery: 'upgrade-mystery',
                hoodie: 'upgrade-hoodie'
              };
              const id = idMap[item.key];
              if (id) {
                const node = document.getElementById(id);
                if (node) {
                  const img = node.querySelector('img');
                  if (img && !icons.includes(img)) icons.push(img);
                }
              }
            });
          }
          // create transient clones that pulse and fade on the screen
          icons.forEach((orig, idx) => {
            try {
              const rect = orig.getBoundingClientRect();
              const clone = orig.cloneNode(true);
              clone.style.position = 'fixed';
              clone.style.left = (rect.left + rect.width/2 - 40) + 'px';
              clone.style.top = (rect.top + rect.height/2 - 40) + 'px';
              clone.style.width = '80px';
              clone.style.height = '80px';
              clone.style.zIndex = 12050 + idx;
              clone.style.borderRadius = '12px';
              clone.style.pointerEvents = 'none';
              clone.classList.add('wheel-pulse');
              document.body.appendChild(clone);
              // stagger timing so visuals cascade
              setTimeout(()=> {
                clone.style.opacity = '0';
                clone.style.transform = 'scale(2.2) translateY(-80px)';
                // remove after animation
                setTimeout(()=> { try{ clone.remove(); } catch(e){} }, 900);
              }, 80 + idx * 140);
            } catch(e){}
          });
        } catch(e){}
      }

      // spin handler
      spinAction.addEventListener('click', () => {
        if (wheelSpins <= 0) {
          createNotification('No Wheel Spins left.', 2600);
          return;
        }
        wheelSpins = Math.max(0,wheelSpins-1);
        persistSpins();
        spinAction.disabled = true;
        spinAction.textContent = 'Spinning...';
        // build pool and pick weighted
        const pool = buildWheelPool();
        // show pulse/fade visuals for shop icons keyed to the current pool
        try { pulseShopVisuals(pool); } catch(e){}
        // simulate rotation: pick random index after animated rotation
        const spins = 24 + Math.floor(Math.random()*24); // 24..48 steps for dramatic spin
        const chosenIndex = Math.floor(Math.random() * pool.length);
        const chosen = pool[chosenIndex];
        const disc = document.getElementById('wheel-disc');
        // animate a CSS rotation on the outer wheelWrap
        const deg = 360 * (spins) + Math.random()*360;
        wheelWrap.style.transition = 'transform 3200ms cubic-bezier(.17,.84,.44,1)';
        wheelWrap.style.transform = `rotate(${deg}deg)`;
        // after animation complete, announce chosen item (use timeout ~3200ms)
        setTimeout(() => {
          spinAction.disabled = false;
          spinAction.textContent = 'Spin';
          wheelWrap.style.transition = '';
          wheelWrap.style.transform = '';
          const label = document.getElementById('wheel-result-label');
          if (label) label.textContent = (chosen && chosen.label) ? chosen.label : 'Prize';
          // grant the prize
          grantWheelPrize(chosen && chosen.key ? chosen.key : null);
        }, 3300);
      });

      close.addEventListener('click', closeWheelModal);
    }
    wheelModal.style.display = 'flex';
    // focus spin button for keyboard users
    setTimeout(()=>{ document.getElementById('wheel-action-spin')?.focus(); }, 80);
  }

  function closeWheelModal(){
    if (!wheelModal) return;
    wheelModal.style.display = 'none';
  }

  // prize granting mapping - keep effects consistent with existing shop behaviors where possible
  function grantWheelPrize(key){
    try {
      if (!key) {
        createNotification('Wheel prize unclear — nothing awarded.', 2600);
        return;
      }
      switch(key) {
        case 'chatgpt':
          // grant a single ChatGPT autoclicker (increment owned)
          writeOwned(readOwned() + 1);
          createNotification('Wheel prize: +1 ChatGPT autoclicker!', 4200);
          break;
        case 'pts1k':
          // common: award 1,000 points
          bump(1000);
          createNotification('Wheel prize: +1,000 points!', 3600);
          break;
        case 'pts10k':
          // less common: award 10,000 points
          bump(10000);
          createNotification('Wheel prize: +10,000 points!', 4200);
          break;
        case 'sketchy':
          // grant an autoBoost effect (increase autoClickerMultiplier modestly)
          autoClickerMultiplier *= 2.5;
          writeAutoBoostOwned(autoBoostOwned + 1);
          createNotification('Wheel prize: Sketchy Proxy boost acquired!', 4200);
          break;
        case 'study':
          if (studyOwned <= 0) {
            writeStudyOwned(studyOwned + 1);
            localStorage.setItem('an_s_study_active_v1','1');
            spawnSocialPencil();
            createNotification('Wheel prize: Social Confidence unlocked!', 4200);
            // ensure periodic spawns
            if (!socialSpawnIntervalId) socialSpawnIntervalId = setInterval(spawnSocialPencil, SOCIAL_SPAWN_MS);
          } else {
            // if already owned, wheel can sometimes grant a second one; convert to points but also update UI if needed
            createNotification('You already own Social Confidence — converted to +500 points.', 3200);
            bump(500);
            // ensure owned display is accurate
            const ownedEl = document.getElementById('owned-study');
            if (ownedEl) ownedEl.textContent = `Owned: ${studyOwned}`;
          }
          break;
        case 'showers':
          if (showersOwned <= 0) {
            writeShowersOwned(showersOwned + 1);
            const btn = document.getElementById('clicker-showers'); if (btn) btn.style.display = 'inline-grid';
            ensureShowersButton();
            createNotification('Wheel prize: Showers Bald Head unlocked!', 4200);
          } else {
            // already owned — convert to points but ensure UI still reflects ownership
            createNotification('Showers already owned — converted to +1000 points.', 3200);
            bump(1000);
            const ownedEl = document.getElementById('owned-showers');
            if (ownedEl) ownedEl.textContent = `Owned: ${showersOwned}`;
            const btn = document.getElementById('clicker-showers'); if (btn) btn.style.display = showersOwned > 0 ? 'inline-grid' : 'none';
          }
          break;
        case 'factory':
          // Factory Reset is a one-time purchase: increment owned display and enable mode
          writeFactoryOwned(factoryOwned + 1);
          enableFactoryMode(10*60*1000);
          createNotification('Wheel prize: Factory Reset activated for 10 minutes!', 4200);
          // ensure owned display updated
          const ownedFactoryElLocal = document.getElementById('owned-factory');
          if (ownedFactoryElLocal) ownedFactoryElLocal.textContent = `Owned: ${factoryOwned}`;
          break;
        case 'hallpass':
          // rare: award 1 Hall Pass
          grantHallPass(1);
          createNotification('Wheel prize: +1 Hall Pass!', 4200);
          break;
        case 'shopcredit':
          // very rare: award 1 shop credit and persist immediately
          grantShopCredit({ignoreCooldown:true});
          createNotification('Wheel prize: +1 Shop Credit!', 4200);
          break;
        case 'mark':
          if (markOwned > 0) {
            // extremely rare second Mark allowed: allow second ownership via wheel by incrementing stored owned and UI
            // The game design allows duplicates only via wheel — reflect that in UI and persist.
            writeMarkOwned(markOwned + 1);
            createNotification('Rare! You gained an additional Mark Spammers via the Wheel — check your upgrades.', 4200);
            // ensure orbit is present (create if missing)
            createMarkOrbit && createMarkOrbit();
            // update UI count element
            const ownedMarkElLocal = document.getElementById('owned-mark-spammers');
            if (ownedMarkElLocal) ownedMarkElLocal.textContent = `Owned: ${markOwned}`;
          } else {
            writeMarkOwned(1);
            createMarkOrbit();
            createNotification('Wheel prize: Mark Spammers unlocked!', 4200);
          }
          break;
        case 'typhoon':
          {
            const ownedTy = (function(){ const v = localStorage.getItem('an_s_typhoon_v1'); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
            if (ownedTy > 0) {
              // allow second Typhoon only via wheel (very rare) — convert to autoclickers if duplicate
              createNotification('Mr Typhoon already owned — converted to +5 autoclickers.', 4200);
              writeOwned(readOwned()+5);
              // ensure owned display shows accurate count
              const ownedTyEl = document.getElementById('owned-typhoon');
              if (ownedTyEl) ownedTyEl.textContent = `Owned: ${ownedTy}`;
            } else {
              try { localStorage.setItem('an_s_typhoon_v1','1'); } catch(e){}
              createNotification('Wheel prize: Mr Typhoon unlocked!', 4200);
              // update owned display
              const ownedTyEl2 = document.getElementById('owned-typhoon');
              if (ownedTyEl2) ownedTyEl2.textContent = `Owned: 1`;
              // start typhoon loop if script available
              window.startTyphoonLoop && window.startTyphoonLoop();
            }
          }
          break;
        case 'hinton':
          {
            const h = (function(){ const v = localStorage.getItem('an_s_hinton_v1'); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
            if (h > 0) {
              // if already owned, convert to hall passes (behavior unchanged) but also ensure shop UI still reflects ownership
              createNotification('Mr Hinton already owned — converted to +2 Hall Passes.', 4200);
              grantHallPass(2);
              const ownedHintonEl = document.getElementById('owned-hinton');
              if (ownedHintonEl) ownedHintonEl.textContent = `Owned: ${h}`;
            } else {
              try { localStorage.setItem('an_s_hinton_v1','1'); } catch(e){}
              // update owned display immediately
              const ownedHintonEl2 = document.getElementById('owned-hinton');
              if (ownedHintonEl2) ownedHintonEl2.textContent = `Owned: 1`;
              // start Hinton orbit
              window.startHintonOrbitLoop && window.startHintonOrbitLoop();
              createNotification('Wheel prize: Mr Hinton the GOAT unlocked!', 4200);
            }
          }
          break;
        case 'ed_santos':
          {
            const ed = (function(){ const v = localStorage.getItem('an_s_ed_santos_v1'); const n = parseInt(v,10); return Number.isFinite(n)?n:0; })();
            if (ed > 0) {
              createNotification('Mr Santos already helps you — converted to +1 Hall Pass.', 3200);
              grantHallPass(1);
              const ownedEdEl = document.getElementById('owned-ed-santos');
              if (ownedEdEl) ownedEdEl.textContent = `Owned: ${ed}`;
            } else {
              try { localStorage.setItem('an_s_ed_santos_v1','1'); } catch(e){}
              // update owned display immediately
              const ownedEdEl2 = document.getElementById('owned-ed-santos');
              if (ownedEdEl2) ownedEdEl2.textContent = `Owned: 1`;
              window.startSantosLoop && window.startSantosLoop();
              createNotification('Wheel prize: Mr. Santos unlocked!', 4200);
            }
          }
          break;
        default:
          createNotification('Wheel prize processed.', 2600);
      }
    } catch (err) {
      console.warn('grantWheelPrize error', err);
      createNotification('Error processing wheel prize.', 2400);
    }
  }

  // spin button handler to open modal (also keyboard accessible)
  spinBtn.addEventListener('click', () => {
    if (wheelSpins <= 0) { createNotification('No Wheel Spins available.', 2400); return; }
    openWheelModal();
  });

  // expose quick getter for spins (if debug needed)
  window.getWheelSpins = () => wheelSpins;
})();

// --- Random Formative: trigger when points reach specific digit counts (5,7,9 or any odd >5) ---
(function(){
  let formativeActive = false;
  let lastTriggeredDigits = 0;

  // helper to open the Random Formative modal
  function openRandomFormative(questionText, answer, durationSec = 25) {
    if (formativeActive) return;
    formativeActive = true;

    const modal = document.createElement('div');
    modal.id = 'random-formative-modal';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.zIndex = '12000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.85)';
    modal.style.pointerEvents = 'auto';

    const box = document.createElement('div');
    box.style.width = 'min(92%,420px)';
    box.style.background = '#071018';
    box.style.borderRadius = '12px';
    box.style.padding = '16px';
    box.style.color = 'var(--btn-bg)';
    box.style.boxShadow = '0 18px 40px rgba(0,0,0,0.7)';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '10px';
    box.style.alignItems = 'center';

    const title = document.createElement('div');
    title.style.fontWeight = '900';
    title.style.fontSize = '18px';
    title.textContent = 'Random Formative';
    box.appendChild(title);

    const prompt = document.createElement('div');
    prompt.style.opacity = '0.95';
    prompt.style.fontSize = '16px';
    prompt.style.fontWeight = '700';
    prompt.textContent = questionText;
    box.appendChild(prompt);

    const input = document.createElement('input');
    input.type = 'number';
    input.style.padding = '10px';
    input.style.borderRadius = '10px';
    input.style.border = '0';
    input.style.background = 'rgba(255,255,255,0.03)';
    input.style.color = 'var(--btn-bg)';
    input.style.fontSize = '16px';
    input.style.width = '100%';
    input.placeholder = 'Your answer';
    box.appendChild(input);

    const timer = document.createElement('div');
    timer.style.fontSize = '13px';
    timer.style.opacity = '0.9';
    box.appendChild(timer);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.justifyContent = 'center';
    const submit = document.createElement('button');
    submit.className = 'buy-btn';
    submit.textContent = 'Submit';
    const cancel = document.createElement('button');
    cancel.className = 'buy-btn danger';
    cancel.textContent = 'Cancel';
    actions.appendChild(submit);
    actions.appendChild(cancel);
    box.appendChild(actions);

    modal.appendChild(box);
    document.body.appendChild(modal);
    input.focus();

    // countdown
    let remaining = durationSec;
    timer.textContent = `Time remaining: ${remaining}s`;
    const countdown = setInterval(() => {
      remaining -= 1;
      timer.textContent = `Time remaining: ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(countdown);
        close(false, true); // timed out => treated as no correct answer
      }
    }, 1000);

    function cleanup() {
      try { modal.remove(); } catch(e){}
      formativeActive = false;
    }

    function close(correct, timedOut=false) {
      clearInterval(countdown);
      cleanup();
      if (correct) {
        // small reward for correct answer
        try { bump(500); } catch(e){}
        createNotification('Correct! +500 points awarded.', 3200);
      } else {
        // wrong or timed-out: lose 50% of current points
        try {
          const pts = readPoints();
          writePoints(Math.max(0, Math.floor(pts * 0.5)));
          if (timedOut) {
            createNotification('Time is up for the Random Formative — you lost 50% of your points.', 3200);
          } else {
            createNotification('Incorrect — you lost 50% of your points.', 3200);
          }
        } catch (e) {
          if (timedOut) createNotification('Time is up for the Random Formative.', 3200);
          else createNotification('Incorrect answer.', 3200);
        }
      }
    }

    submit.addEventListener('click', () => {
      const val = parseInt(input.value, 10);
      if (!Number.isFinite(val)) {
        createNotification('Enter a numeric answer.', 2000);
        return;
      }
      if (val === answer) {
        close(true);
      } else {
        close(false);
      }
    });

    cancel.addEventListener('click', () => {
      close(false);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit.click();
      if (e.key === 'Escape') cancel.click();
    });
  }

  // watch points updates by wrapping writePoints (if available)
  try {
    const originalWritePointsWatch = writePoints;
    if (typeof originalWritePointsWatch === 'function') {
      writePoints = function(n) {
        // call original first
        originalWritePointsWatch(n);

        // compute digits
        const absN = Math.abs(Number.isFinite(n) ? n : 0);
        const digits = String(Math.max(0, Math.floor(absN))).length;

        // condition: 5,7,9 or any odd number >5
        const isTrigger = (digits === 5) || (digits === 7) || (digits === 9) || (digits > 5 && (digits % 2 === 1));

        if (isTrigger && digits !== lastTriggeredDigits) {
          // record that we've observed this digit-length so we won't repeatedly retrigger
          lastTriggeredDigits = digits;

          // If this is an odd digit above 5, only proceed half the time
          const oddAboveFive = (digits > 5 && (digits % 2 === 1));
          if (oddAboveFive) {
            if (Math.random() >= 0.5) {
              // skipped this time (50% chance), do not open formative
              return;
            }
            // otherwise fall through to open
          }

          // generate L random 1..1000 and form question L x L
          const L = 1 + Math.floor(Math.random() * 1000);
          const question = `${L} × ${L}`;
          const answer = L * L;
          try {
            openRandomFormative(question, answer, 25);
          } catch (e) {
            console.warn('Failed to open Random Formative', e);
          }
        } else if (!isTrigger) {
          // reset lastTriggeredDigits when digits no longer at trigger so future triggers allowed
          lastTriggeredDigits = 0;
        }
      };
    }
  } catch (e) {
    console.warn('Random Formative wrapper failed', e);
  }
})();