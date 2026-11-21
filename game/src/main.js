// Shadow Ledger — game controller: states, loop, input, HUD, win/lose, self-test.
// Three heists (Archive, Gallery, Vault), security cameras, a coin-toss gadget,
// gold loot, a score, and strikes instead of instant loss. Rendering lives in render.js.
import { parseLevel, LEVELS } from './level.js';
import { Guard, SUSPICION_MAX } from './guards.js';
import { SecurityCamera, CAMERA_ALARM_MAX } from './cameras.js';
import { CoinToss, COINS_PER_LEVEL } from './gadgets.js';
import { Player } from './player.js';
import { SoundEngine } from './audio.js';
import { stageShot } from './shots.js';
import {
  drawFloor, drawLamps, drawCratesAndBushes, drawLedgersAndExit,
  drawGoldCoins, drawGuard, drawCameras, drawCoinToss,
  drawPlayer, drawParticles, drawVignette,
} from './render.js';
import { clamp, distance } from './rng.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sound = new SoundEngine();

const hudLevel = document.getElementById('hud-level');
const hudPages = document.getElementById('hud-pages');
const hudScore = document.getElementById('hud-score');
const hudStrikes = document.getElementById('hud-strikes');
const hudCoins = document.getElementById('hud-coins');
const hudAlert = document.getElementById('hud-alert');
const hudMeter = document.getElementById('hud-meter-fill');
const hudTime = document.getElementById('hud-time');
const hudObjective = document.getElementById('hud-objective');
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');

const panels = {
  start: document.getElementById('panel-start'),
  win: document.getElementById('panel-win'),
  lose: document.getElementById('panel-lose'),
  pause: document.getElementById('panel-pause'),
  levelclear: document.getElementById('panel-levelclear'),
};

function showPanel(name) {
  overlay.classList.toggle('hidden', name === null);
  for (const [key, el] of Object.entries(panels)) el.classList.toggle('hidden', key !== name);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function rankFor(time, strikes) {
  if (strikes === 0 && time < 300) return 'Rank: GHOST — never seen, never heard.';
  if (strikes === 0) return 'Rank: SHADOW — unseen from start to finish.';
  if (strikes <= 2) return 'Rank: PROWLER — caught, but you slipped away.';
  return 'Rank: LOUD SHADOW — the archive knows your name now.';
}

export function createGame() {
  const game = {
    levelIndex: 0,
    level: parseLevel(0),
    player: null,
    guards: [],
    cameras: [],
    coin: new CoinToss(),
    particles: [],
    state: 'menu', // menu | playing | paused | levelclear | won | lost
    frozen: false, // staged screenshot scenes do not simulate
    time: 0,
    pagesFound: 0,
    alerts: 0,
    strikes: 0,
    strikesAtLevelStart: 0,
    score: 0,
    coins: COINS_PER_LEVEL,
    wasChase: false,
    toastTimer: 0,
    keys: { up: false, down: false, left: false, right: false, sneak: false },

    // Load one heist's entities; run-level totals (score, strikes) are kept.
    loadLevel(index) {
      this.levelIndex = index;
      this.level = parseLevel(index);
      this.player = new Player(this.level.spawn);
      this.guards = this.level.guardDefs.map((def) => new Guard(def));
      this.cameras = this.level.cameraDefs.map((def) => new SecurityCamera(def));
      this.coin = new CoinToss();
      this.coins = COINS_PER_LEVEL;
      this.particles.length = 0;
      this.pagesFound = 0;
      this.strikesAtLevelStart = this.strikes;
      this.frozen = false;
    },

    reset() {
      this.time = 0;
      this.score = 0;
      this.strikes = 0;
      this.alerts = 0;
      this.wasChase = false;
      this.toastTimer = 0;
      this.loadLevel(0);
      this.state = 'playing';
    },

    // The exit with every page: next heist, or the win on the last one.
    advanceLevel() {
      if (this.strikes === this.strikesAtLevelStart) {
        this.score += 500; // ghost bonus: no strike on this heist
      }
      if (this.levelIndex >= LEVELS.length - 1) {
        this.state = 'won';
        sound.win();
        return;
      }
      this.loadLevel(this.levelIndex + 1);
      this.state = 'playing';
      showPanel(null);
    },

    showToast(text, seconds) {
      this.toastTimer = seconds;
      toast.textContent = text;
      toast.classList.remove('hidden');
    },

    throwCoinAt(tx, ty) {
      if (this.state !== 'playing' || this.frozen) return false;
      if (this.coins <= 0 || this.coin.active) return false;
      this.coins -= 1;
      this.coin.throwCoin(this.player.x, this.player.y, clamp(tx, 20, 1260), clamp(ty, 20, 780));
      return true;
    },

    // Caught by a chasing guard: a strike, a respawn, and one more chance.
    registerCatch() {
      this.strikes += 1;
      if (this.strikes >= 3) {
        this.state = 'lost';
        sound.lose();
        return;
      }
      this.showToast('CAUGHT — strike ' + this.strikes + ' of 3. Back to the door.', 2.5);
      sound.alertSting();
      const spawn = this.level.spawn;
      this.player = new Player(spawn);
      this.guards = this.level.guardDefs.map((def) => new Guard(def));
      this.cameras = this.level.cameraDefs.map((def) => new SecurityCamera(def));
      this.coin = new CoinToss();
    },

    update(dt) {
      if (this.state !== 'playing' || this.frozen) return;
      this.time += dt;
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0) toast.classList.add('hidden');
      }
      const onPlayerStep = (x, y, sneaking) => {
        const pan = clamp((x - this.player.x) / 500, -1, 1);
        sound.footstep(pan, sneaking ? 0.05 : 0.12, true);
      };
      const onGuardStep = (x, y) => {
        const d = distance(x, y, this.player.x, this.player.y);
        if (d > 520) return;
        const pan = clamp((x - this.player.x) / 500, -1, 1);
        sound.footstep(pan, 0.16 * (1 - d / 520), false);
      };
      this.player.update(dt, this.keys, onPlayerStep);

      // Running loud draws nearby patrolling guards toward the noise.
      if (this.player.noiseRadius > 0) {
        for (const g of this.guards) {
          if (g.state !== 'patrol') continue;
          if (distance(g.x, g.y, this.player.x, this.player.y) < this.player.noiseRadius) {
            g.state = 'wary';
            g.investigateX = this.player.x;
            g.investigateY = this.player.y;
            g.suspicion = Math.max(g.suspicion, 35);
          }
        }
      }
      for (const g of this.guards) {
        g.update(dt, this.player, onGuardStep);
        if (g.labelTimer > 0) g.labelTimer -= dt;
      }

      // Security cameras: a trip calls the nearest guard to your position.
      for (const cam of this.cameras) {
        if (cam.update(dt, this.player)) {
          sound.alertSting();
          this.alerts += 1;
          this.showToast('CAMERA SPOTTED YOU — a guard is coming.', 2.5);
          let best = null;
          let bestDist = Infinity;
          for (const g of this.guards) {
            const d = distance(g.x, g.y, this.player.x, this.player.y);
            if (d < bestDist) { best = g; bestDist = d; }
          }
          if (best) {
            best.state = 'wary';
            best.investigateX = this.player.x;
            best.investigateY = this.player.y;
            best.suspicion = Math.max(best.suspicion, 60);
            best.labelText = 'SPOTTED!';
            best.labelTimer = 1.5;
          }
        }
      }

      // The thrown coin: on landing it clinks and pulls a guard over.
      if (this.coin.update(dt) === 'landed') {
        sound.clink();
        const guard = this.coin.nearestPatrollingGuard(this.guards);
        if (guard) {
          guard.state = 'wary';
          guard.investigateX = this.coin.targetX;
          guard.investigateY = this.coin.targetY;
          guard.suspicion = Math.max(guard.suspicion, 35);
          guard.labelText = 'WHAT WAS THAT?';
          guard.labelTimer = 2.0;
          this.coin.distracted = true;
        }
      }

      const anyChase = this.guards.some((g) => g.state === 'chase');
      if (anyChase && !this.wasChase) {
        this.alerts += 1;
        sound.alertSting();
      }
      this.wasChase = anyChase;

      // Ledger pickups (+$100) and gold coins (+$25).
      for (const l of this.level.ledgers) {
        if (l.taken) continue;
        if (distance(this.player.x, this.player.y, l.x, l.y) < 28) {
          l.taken = true;
          this.pagesFound += 1;
          this.score += 100;
          sound.pickup();
          this.burst(l.x, l.y, '#ffd76a');
        }
      }
      for (const coin of this.level.gold) {
        if (coin.taken) continue;
        if (distance(this.player.x, this.player.y, coin.x, coin.y) < 26) {
          coin.taken = true;
          this.score += 25;
          sound.pickup();
          this.burst(coin.x, coin.y, '#ffcf4d');
        }
      }

      // Exit: only open once every page is stolen.
      if (this.pagesFound === 3) {
        if (distance(this.player.x, this.player.y, this.level.exit.x, this.level.exit.y) < 30) {
          if (this.levelIndex >= LEVELS.length - 1) {
            if (this.strikes === 0) this.score += 500;
            this.state = 'won';
            sound.win();
          } else {
            // Ghost bonus is added once, in advanceLevel().
            this.state = 'levelclear';
          }
          return;
        }
      }

      // Caught by a chasing guard: a strike, not the end of the run.
      for (const g of this.guards) {
        if (g.touches(this.player)) {
          this.registerCatch();
          break;
        }
      }

      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
    },

    burst(x, y, color) {
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 40 + Math.random() * 90;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0.7, maxLife: 0.7, size: 2 + Math.random() * 2.5, color,
        });
      }
    },

    render() {
      drawFloor(ctx, this.level.palette);
      drawLamps(ctx, this.level, this.time);
      drawCratesAndBushes(ctx, this.level, this.time);
      drawLedgersAndExit(ctx, this.level, this.time);
      drawGoldCoins(ctx, this.level, this.time);
      drawCameras(ctx, this.cameras);
      for (const g of this.guards) drawGuard(ctx, g, this.time);
      drawCoinToss(ctx, this.coin, this.time);
      drawPlayer(ctx, this.player, this.time);
      drawParticles(ctx, this.particles);
      drawVignette(ctx);
    },
  };
  game.loadLevel(0);
  game.state = 'menu';
  return game;
}

const game = createGame();

function syncHud() {
  hudLevel.textContent = 'HEIST ' + (game.levelIndex + 1) + '/3 — ' + game.level.name;
  hudPages.textContent = '📄 ' + game.pagesFound + ' / 3';
  hudScore.textContent = '$' + game.score;
  hudStrikes.textContent = '✖ ' + game.strikes + '/3';
  hudCoins.textContent = '🪙 ' + game.coins;
  const maxSuspicion = Math.max(0, ...game.guards.map((g) => g.suspicion));
  const maxCam = Math.max(0, ...game.cameras.map((c) => c.alarm));
  const worst = game.guards.some((g) => g.state === 'chase')
    ? 'chase'
    : game.guards.some((g) => g.state === 'wary') || maxCam > 60 ? 'wary' : 'calm';
  hudAlert.textContent = worst === 'chase' ? '● ALERTED' : worst === 'wary' ? '● SUSPICIOUS' : '● CALM';
  hudAlert.className = worst === 'chase' ? 'alert-hunt' : worst === 'wary' ? 'alert-wary' : 'alert-calm';
  hudMeter.style.width = clamp(Math.max(maxSuspicion, maxCam) / SUSPICION_MAX, 0, 1) * 100 + '%';
  hudMeter.style.background = worst === 'chase' ? '#ff5040' : worst === 'wary' ? '#ffbe3c' : '#ffd76a';
  hudTime.textContent = formatTime(game.time);
  hudObjective.textContent = game.pagesFound === 3
    ? 'All pages stolen — reach the green EXIT!'
    : 'Steal 3 ledger pages, then reach the exit unseen.';
  if (game.state === 'levelclear') {
    document.getElementById('levelclear-stats').textContent =
      game.level.name + ' cleared — score $' + game.score +
      (game.strikes === game.strikesAtLevelStart ? ' (ghost bonus +$500)' : '') + '.';
    document.getElementById('levelclear-next').textContent =
      '▶ Next heist: ' + LEVELS[game.levelIndex + 1].name;
    showPanel('levelclear');
  } else if (game.state === 'won') {
    document.getElementById('win-stats').textContent =
      'All 3 heists done in ' + formatTime(game.time) + ' — score $' + game.score +
      ' with ' + game.strikes + (game.strikes === 1 ? ' strike' : ' strikes') + ' and ' +
      game.alerts + (game.alerts === 1 ? ' alarm' : ' alarms') + ' raised.';
    document.getElementById('win-rank').textContent = rankFor(game.time, game.strikes);
    showPanel('win');
  } else if (game.state === 'lost') {
    document.getElementById('lose-stats').textContent =
      'Caught 3 times on ' + game.level.name + ' — score $' + game.score +
      ' with ' + game.pagesFound + ' / 3 pages stolen.';
    showPanel('lose');
  }
}

// ---- Input: keyboard + mouse ---------------------------------------------
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

window.addEventListener('keydown', (e) => {
  const mapped = KEYMAP[e.code];
  if (mapped) {
    game.keys[mapped] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    return;
  }
  if (e.code === 'KeyP') togglePause();
  else if (e.code === 'KeyR') restart();
  else if (e.code === 'KeyM') toggleMute();
  else if (e.code === 'KeyC') {
    // Toss a coin ahead of you to pull a guard away.
    game.throwCoinAt(
      game.player.x + Math.cos(game.player.angle) * 170,
      game.player.y + Math.sin(game.player.angle) * 170,
    );
  } else if ((e.code === 'Enter' || e.code === 'Space') && game.state === 'menu') startGame();
});

window.addEventListener('keyup', (e) => {
  const mapped = KEYMAP[e.code];
  if (mapped) game.keys[mapped] = false;
});

canvas.addEventListener('click', (e) => {
  if (game.state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  game.player.walkTarget = {
    x: ((e.clientX - rect.left) / rect.width) * 1280,
    y: ((e.clientY - rect.top) / rect.height) * 800,
  };
  sound.ensure();
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (game.state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  game.throwCoinAt(
    ((e.clientX - rect.left) / rect.width) * 1280,
    ((e.clientY - rect.top) / rect.height) * 800,
  );
  sound.ensure();
});

function startGame() {
  sound.ensure();
  game.reset();
  showPanel(null);
}

function restart() {
  sound.ensure();
  game.reset();
  showPanel(null);
}

function togglePause() {
  if (game.state === 'playing') {
    game.state = 'paused';
    showPanel('pause');
  } else if (game.state === 'paused') {
    game.state = 'playing';
    showPanel(null);
  }
}

function toggleMute() {
  sound.ensure();
  sound.setMuted(!sound.muted);
  document.getElementById('btn-mute').textContent = sound.muted ? '🔇 Muted' : '🔊 Sound';
}

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-again-win').addEventListener('click', restart);
document.getElementById('btn-again-lose').addEventListener('click', restart);
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-mute').addEventListener('click', toggleMute);
document.getElementById('btn-next-level').addEventListener('click', () => {
  sound.ensure();
  game.advanceLevel();
});

// Report page errors into the DOM so headless checks can see them.
window.addEventListener('error', (e) => {
  const el = document.getElementById('errors');
  el.textContent += 'ERROR: ' + e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || '') + '\n';
});
window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('errors');
  el.textContent += 'REJECTION: ' + e.reason + '\n';
});

// ---- Self-test (?selftest=1): scripted checks, results into #selftest -----
function runSelfTest() {
  const results = [];
  const check = (name, fn) => {
    try { results.push({ name, pass: !!fn() }); }
    catch (err) { results.push({ name, pass: false, error: String(err) }); }
  };
  check('all 3 levels parse with 3 pages, an exit and a spawn', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const lv = parseLevel(i);
      if (lv.ledgers.length !== 3 || !lv.exit || !lv.spawn) return false;
    }
    parseLevel(0);
    return true;
  });
  check('player walks right when the key is held', () => {
    const g = createGame();
    g.reset();
    const x0 = g.player.x;
    g.keys.right = true;
    for (let i = 0; i < 60; i++) g.update(1 / 60);
    return g.player.x > x0 + 50;
  });
  check('a guard advances along its patrol', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[0];
    const x0 = guard.x;
    const y0 = guard.y;
    for (let i = 0; i < 120; i++) g.update(1 / 60);
    return Math.hypot(guard.x - x0, guard.y - y0) > 20;
  });
  check('suspicion rises when the player stands in a cone', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[4]; // Pawn, patrols open row 6
    guard.x = 10 * 40 + 20; guard.y = 6 * 40 + 20; guard.angle = 0;
    g.player.x = 13 * 40 + 20; g.player.y = 6 * 40 + 20;
    const s0 = guard.suspicion;
    for (let i = 0; i < 60; i++) g.update(1 / 60);
    return guard.suspicion > s0 + 10;
  });
  check('a bush hides the player from a distant guard', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[4];
    guard.x = 10 * 40 + 20; guard.y = 6 * 40 + 20; guard.angle = 0;
    g.player.x = 15 * 40 + 20; g.player.y = 3 * 40 + 20; // bush tile
    g.player.hiddenInBush = true;
    const seen = guard.canSee(g.player);
    return seen.seen === false;
  });
  check('reaching the exit with all pages clears the level', () => {
    const g = createGame();
    g.reset();
    g.level.ledgers.forEach((l) => { l.taken = true; });
    g.pagesFound = 3;
    g.player.x = g.level.exit.x;
    g.player.y = g.level.exit.y;
    g.update(1 / 60);
    return g.state === 'levelclear';
  });
  check('advancing starts the next heist', () => {
    const g = createGame();
    g.reset();
    g.state = 'levelclear';
    g.advanceLevel();
    return g.levelIndex === 1 && g.state === 'playing' && g.guards.length === 6;
  });
  check('reaching the exit on the last heist wins', () => {
    const g = createGame();
    g.reset();
    g.loadLevel(2);
    g.state = 'playing';
    g.level.ledgers.forEach((l) => { l.taken = true; });
    g.pagesFound = 3;
    g.player.x = g.level.exit.x;
    g.player.y = g.level.exit.y;
    g.update(1 / 60);
    return g.state === 'won';
  });
  check('a chasing guard touching the player costs a strike and respawns', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[0];
    guard.state = 'chase';
    guard.suspicion = 100;
    guard.x = g.player.x + 10;
    guard.y = g.player.y;
    g.update(1 / 60);
    return g.state === 'playing' && g.strikes === 1 &&
      Math.hypot(g.player.x - g.level.spawn.x, g.player.y - g.level.spawn.y) < 1;
  });
  check('3 strikes lose the run', () => {
    const g = createGame();
    g.reset();
    g.strikes = 2;
    const guard = g.guards[0];
    guard.state = 'chase';
    guard.suspicion = 100;
    guard.x = g.player.x + 10;
    guard.y = g.player.y;
    g.update(1 / 60);
    return g.state === 'lost' && g.strikes === 3;
  });
  check('a thrown coin makes a guard investigate the landing spot', () => {
    const g = createGame();
    g.reset();
    const guard = g.guards[4]; // Pawn
    guard.x = 10 * 40 + 20; guard.y = 6 * 40 + 20; guard.state = 'patrol';
    g.player.x = 13 * 40 + 20; g.player.y = 6 * 40 + 20;
    g.throwCoinAt(11 * 40 + 20, 6 * 40 + 20);
    for (let i = 0; i < 60; i++) g.update(1 / 60);
    return guard.state === 'wary' &&
      Math.hypot(guard.investigateX - (11 * 40 + 20), guard.investigateY - (6 * 40 + 20)) < 1;
  });
  check('a camera alarm builds when the player stands in its cone', () => {
    const g = createGame();
    g.reset();
    g.loadLevel(1);
    g.state = 'playing';
    const cam = g.cameras[0];
    cam.time = 0;
    g.player.x = 12 * 40 + 20; g.player.y = 2 * 40 + 20; // east of the camera
    for (let i = 0; i < 60; i++) g.update(1 / 60);
    return cam.alarm > 20;
  });
  const passed = results.filter((r) => r.pass).length;
  const el = document.getElementById('selftest');
  el.textContent = JSON.stringify({ passed, total: results.length, results });
  document.title = 'SELFTEST ' + (passed === results.length ? 'PASS' : 'FAIL') + ' ' + passed + '/' + results.length;
}

// ---- Boot ------------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  showPanel(null);
  if (stageShot(game, shot)) {
    game.render();
    syncHud();
  }
} else {
  showPanel('start');
  game.render();
}
if (params.get('selftest') === '1') runSelfTest();

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const prevState = game.state;
  game.update(dt);
  game.render();
  if (game.state !== prevState || game.state === 'playing') syncHud();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
